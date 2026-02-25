import { useState, useRef, useEffect } from "react";
import { useHandGesture } from "@/hooks/useHandGesture";
import { JarvisOverlay } from "@/components/JarvisOverlay";
import { IronManHUD } from "@/components/IronManHUD";

const Index = () => {
  const {
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
  } = useHandGesture();

  const containerRef = useRef<HTMLDivElement>(null);
  const [jarvisMode, setJarvisMode] = useState(true);

  // Auto-start on mount
  useEffect(() => {
    start();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      {/* Fullscreen webcam */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10"
      />

      {/* Iron Man helmet HUD */}
      <IronManHUD
        gestures={currentGestures}
        stats={stats}
        isRunning={isRunning}
        isLoading={isLoading}
        error={error}
        onStart={start}
        onStop={stop}
        onResetStats={resetStats}
        jarvisMode={jarvisMode}
        onToggleJarvis={() => setJarvisMode((v) => !v)}
      />

      {/* Jarvis drag overlay */}
      <JarvisOverlay
        gestures={currentGestures}
        containerRef={containerRef}
        enabled={jarvisMode && isRunning}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="font-mono text-sm text-primary tracking-widest uppercase glow-text">
              Initializing J.A.R.V.I.S.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
