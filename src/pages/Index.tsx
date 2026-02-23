import { useState, useRef } from "react";
import { useHandGesture } from "@/hooks/useHandGesture";
import { WebcamView } from "@/components/WebcamView";
import { ControlBar } from "@/components/ControlBar";
import { StatsPanel } from "@/components/StatsPanel";
import { GestureLabel } from "@/components/GestureLabel";
import { JarvisOverlay } from "@/components/JarvisOverlay";

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

  const [jarvisMode, setJarvisMode] = useState(false);
  const webcamContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass-strong sticky top-0 z-50">
        <div className="container max-w-6xl flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-lg">🤚</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">
                Gesture<span className="text-primary">AI</span>
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Real-time Hand Recognition
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Jarvis toggle */}
            <button
              onClick={() => setJarvisMode((v) => !v)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all
                ${jarvisMode
                  ? "border-primary bg-primary/10 text-primary glow-border"
                  : "border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
                }
              `}
            >
              <span className="text-sm">🤖</span>
              J.A.R.V.I.S.
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                MediaPipe
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Webcam + Controls */}
          <div className="space-y-4">
            <div ref={webcamContainerRef} className="relative">
              <WebcamView
                ref={videoRef}
                canvasRef={canvasRef}
                isRunning={isRunning}
                isLoading={isLoading}
              />
              <JarvisOverlay
                gestures={currentGestures}
                containerRef={webcamContainerRef}
                enabled={jarvisMode && isRunning}
              />
            </div>

            <ControlBar
              isRunning={isRunning}
              isLoading={isLoading}
              onStart={start}
              onStop={stop}
            />

            {error && (
              <div className="glass rounded-xl p-4 border-destructive/50 border animate-fade-in">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Gesture labels */}
            <div className="flex flex-wrap gap-2">
              {currentGestures.map((g, i) => (
                <GestureLabel key={`${g.gesture}-${i}`} gesture={g} />
              ))}
              {isRunning && currentGestures.length === 0 && (
                <div className="glass rounded-lg px-4 py-3 w-full text-center">
                  <p className="text-sm text-muted-foreground">
                    Show your hand to the camera 👋
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="space-y-4">
            <StatsPanel
              stats={stats}
              isRunning={isRunning}
              onReset={resetStats}
            />

            {/* Jarvis mode info */}
            {jarvisMode && (
              <div className="glass rounded-xl p-5 space-y-3 animate-scale-in glow-border">
                <h3 className="text-sm font-semibold text-primary tracking-wide uppercase flex items-center gap-2">
                  <span>🤖</span> J.A.R.V.I.S. Mode
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-warning mt-0.5">✊</span>
                    Pinch or fist near a widget to grab it
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">🖐️</span>
                    Open palm to release the widget
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-glow-secondary mt-0.5">☝️</span>
                    Point to move the cursor around
                  </li>
                </ul>
              </div>
            )}

            {/* Supported gestures */}
            <div className="glass rounded-xl p-5 space-y-3 animate-fade-in">
              <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                Supported Gestures
              </h3>
              <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {[
                  "🖐️ Open Palm", "✊ Fist", "☝️ Point Up", "✌️ Peace",
                  "👍 Thumbs Up", "👎 Thumbs Down", "🤟 I Love You", "👌 OK Sign",
                  "🤏 Pinch", "🤘 Rock On", "🤙 Call Me", "👉 Finger Gun",
                  "🕷️ Spider-Man", "3️⃣ Three", "4️⃣ Four", "🫡 Scout Salute",
                  "🤞 Crossed Fingers", "🖕 Middle Finger", "💍 Ring Finger",
                  "👆 Pointing", "🦀 Claw", "🫰 Snap", "💰 Money",
                  "✍️ Pen Grip", "🔷 L Shape", "🤙 Pinky Promise",
                ].map((g) => (
                  <div
                    key={g}
                    className="text-[11px] bg-muted/50 rounded-md px-2.5 py-1.5 text-secondary-foreground font-mono"
                  >
                    {g}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Guide */}
            <div className="glass rounded-xl p-5 space-y-3 animate-fade-in">
              <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                Quick Guide
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">1.</span>
                  Allow camera access when prompted
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">2.</span>
                  Click Start Detection to begin
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">3.</span>
                  Enable J.A.R.V.I.S. mode for drag interaction
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">4.</span>
                  Pinch near widgets to grab and move them
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground font-mono">
            Powered by MediaPipe Gesture Recognizer · Runs entirely in-browser
          </p>
          <a
            href="https://github.com/kinivi/hand-gesture-recognition-mediapipe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-mono"
          >
            Based on kinivi/hand-gesture-recognition-mediapipe
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
