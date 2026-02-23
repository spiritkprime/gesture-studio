import { useRef, useState, useCallback, useEffect } from "react";
import {
  GestureRecognizer,
  FilesetResolver,
  type GestureRecognizerResult,
} from "@mediapipe/tasks-vision";

export interface GestureData {
  gesture: string;
  confidence: number;
  handedness: string;
  landmarks: Array<{ x: number; y: number; z: number }>;
}

export interface GestureStats {
  fps: number;
  handsDetected: number;
  totalGestures: number;
  gestureCounts: Record<string, number>;
}

export function useHandGesture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsFramesRef = useRef<number[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGestures, setCurrentGestures] = useState<GestureData[]>([]);
  const [stats, setStats] = useState<GestureStats>({
    fps: 0,
    handsDetected: 0,
    totalGestures: 0,
    gestureCounts: {},
  });
  const [error, setError] = useState<string | null>(null);

  const gestureCountsRef = useRef<Record<string, number>>({});
  const totalGesturesRef = useRef(0);

  const initRecognizer = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      recognizerRef.current = recognizer;
      setIsLoading(false);
      return recognizer;
    } catch (err) {
      setError("Failed to load gesture recognition model. Please try again.");
      setIsLoading(false);
      return null;
    }
  }, []);

  const drawLandmarks = useCallback(
    (results: GestureRecognizerResult) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!results.landmarks) return;

      for (const hand of results.landmarks) {
        // Draw connections
        const connections = [
          [0,1],[1,2],[2,3],[3,4],
          [0,5],[5,6],[6,7],[7,8],
          [0,9],[9,10],[10,11],[11,12],
          [0,13],[13,14],[14,15],[15,16],
          [0,17],[17,18],[18,19],[19,20],
          [5,9],[9,13],[13,17],
        ];

        ctx.strokeStyle = "hsl(175, 80%, 50%)";
        ctx.lineWidth = 2;
        for (const [i, j] of connections) {
          const a = hand[i];
          const b = hand[j];
          ctx.beginPath();
          ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
          ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
          ctx.stroke();
        }

        // Draw landmarks
        for (let i = 0; i < hand.length; i++) {
          const lm = hand[i];
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          const isTip = [4, 8, 12, 16, 20].includes(i);

          ctx.beginPath();
          ctx.arc(x, y, isTip ? 6 : 3, 0, 2 * Math.PI);
          ctx.fillStyle = isTip ? "hsl(175, 80%, 60%)" : "hsl(260, 70%, 60%)";
          ctx.fill();

          if (isTip) {
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.strokeStyle = "hsl(175, 80%, 50%, 0.3)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    },
    []
  );

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;
    if (!video || !recognizer || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();

    // FPS calculation
    fpsFramesRef.current.push(now);
    fpsFramesRef.current = fpsFramesRef.current.filter((t) => now - t < 1000);
    const fps = fpsFramesRef.current.length;

    if (now !== lastTimeRef.current) {
      const results = recognizer.recognizeForVideo(video, now);
      lastTimeRef.current = now;

      drawLandmarks(results);

      const gestures: GestureData[] = [];
      if (results.gestures && results.gestures.length > 0) {
        for (let i = 0; i < results.gestures.length; i++) {
          const gesture = results.gestures[i][0];
          const handedness = results.handedness?.[i]?.[0];
          const landmarks = results.landmarks?.[i] || [];

          if (gesture.categoryName !== "None") {
            const name = formatGestureName(gesture.categoryName);
            gestureCountsRef.current[name] =
              (gestureCountsRef.current[name] || 0) + 1;
            totalGesturesRef.current++;

            gestures.push({
              gesture: name,
              confidence: gesture.score,
              handedness: handedness?.categoryName || "Unknown",
              landmarks: landmarks.map((l) => ({ x: l.x, y: l.y, z: l.z })),
            });
          }
        }
      }

      setCurrentGestures(gestures);
      setStats({
        fps,
        handsDetected: results.landmarks?.length || 0,
        totalGestures: totalGesturesRef.current,
        gestureCounts: { ...gestureCountsRef.current },
      });
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [drawLandmarks]);

  const start = useCallback(async () => {
    try {
      setError(null);
      let recognizer = recognizerRef.current;
      if (!recognizer) {
        recognizer = await initRecognizer();
        if (!recognizer) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsRunning(true);
      animFrameRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [initRecognizer, processFrame]);

  const stop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
    setCurrentGestures([]);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const resetStats = useCallback(() => {
    gestureCountsRef.current = {};
    totalGesturesRef.current = 0;
    setStats({ fps: 0, handsDetected: 0, totalGestures: 0, gestureCounts: {} });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      recognizerRef.current?.close();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isRunning,
    isLoading,
    currentGestures,
    stats,
    error,
    start,
    stop,
    resetStats,
  };
}

function formatGestureName(name: string): string {
  const map: Record<string, string> = {
    Closed_Fist: "✊ Fist",
    Open_Palm: "🖐️ Open Palm",
    Pointing_Up: "☝️ Point Up",
    Thumb_Down: "👎 Thumbs Down",
    Thumb_Up: "👍 Thumbs Up",
    Victory: "✌️ Peace",
    ILoveYou: "🤟 I Love You",
  };
  return map[name] || name;
}
