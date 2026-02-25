import { useState, useEffect } from "react";
import type { GestureData } from "@/hooks/useHandGesture";
import type { GestureStats } from "@/hooks/useHandGesture";

interface Props {
  gestures: GestureData[];
  stats: GestureStats;
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onResetStats: () => void;
  jarvisMode: boolean;
  onToggleJarvis: () => void;
}

export function IronManHUD({
  gestures,
  stats,
  isRunning,
  isLoading,
  error,
  onStart,
  onStop,
  onResetStats,
  jarvisMode,
  onToggleJarvis,
}: Props) {
  const [time, setTime] = useState(new Date());
  const [powerLevel] = useState(98);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="absolute inset-0 z-30 pointer-events-none font-mono">
      {/* Helmet frame - top arc */}
      <div className="absolute top-0 left-0 right-0 h-24">
        <svg className="w-full h-full" viewBox="0 0 1920 96" preserveAspectRatio="none" fill="none">
          <path d="M0 0 L960 0 L960 0 L1920 0 L1920 20 Q960 96 0 20 Z" fill="hsl(175 80% 50% / 0.03)" />
          <path d="M0 20 Q960 96 1920 20" stroke="hsl(175 80% 50% / 0.2)" strokeWidth="1" />
        </svg>
      </div>

      {/* Helmet frame - bottom arc */}
      <div className="absolute bottom-0 left-0 right-0 h-24">
        <svg className="w-full h-full" viewBox="0 0 1920 96" preserveAspectRatio="none" fill="none">
          <path d="M0 96 L960 96 L1920 96 L1920 76 Q960 0 0 76 Z" fill="hsl(175 80% 50% / 0.03)" />
          <path d="M0 76 Q960 0 1920 76" stroke="hsl(175 80% 50% / 0.2)" strokeWidth="1" />
        </svg>
      </div>

      {/* Helmet side vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, hsl(175 80% 50% / 0.02) 70%, hsl(220 20% 7% / 0.6) 100%)",
      }} />

      {/* Corner HUD brackets */}
      {/* Top-left */}
      <svg className="absolute top-4 left-4 w-16 h-16" viewBox="0 0 64 64" fill="none">
        <path d="M2 20V4a2 2 0 012-2h16" stroke="hsl(175 80% 50% / 0.6)" strokeWidth="1.5" />
        <circle cx="4" cy="4" r="2" fill="hsl(175 80% 50% / 0.4)" />
      </svg>
      {/* Top-right */}
      <svg className="absolute top-4 right-4 w-16 h-16" viewBox="0 0 64 64" fill="none">
        <path d="M62 20V4a2 2 0 00-2-2H44" stroke="hsl(175 80% 50% / 0.6)" strokeWidth="1.5" />
        <circle cx="60" cy="4" r="2" fill="hsl(175 80% 50% / 0.4)" />
      </svg>
      {/* Bottom-left */}
      <svg className="absolute bottom-4 left-4 w-16 h-16" viewBox="0 0 64 64" fill="none">
        <path d="M2 44v16a2 2 0 002 2h16" stroke="hsl(175 80% 50% / 0.6)" strokeWidth="1.5" />
        <circle cx="4" cy="60" r="2" fill="hsl(175 80% 50% / 0.4)" />
      </svg>
      {/* Bottom-right */}
      <svg className="absolute bottom-4 right-4 w-16 h-16" viewBox="0 0 64 64" fill="none">
        <path d="M62 44v16a2 2 0 01-2 2H44" stroke="hsl(175 80% 50% / 0.6)" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="2" fill="hsl(175 80% 50% / 0.4)" />
      </svg>

      {/* Top center - JARVIS title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[10px] tracking-[0.5em] text-primary/60 uppercase">
          J.A.R.V.I.S. Tactical Interface
        </div>
        <div className="text-[9px] tracking-[0.3em] text-primary/30 mt-1">
          {dateStr} · {timeStr}
        </div>
      </div>

      {/* Left panel - System status */}
      <div className="absolute top-28 left-6 space-y-3 w-48">
        {/* FPS */}
        <HudRow label="FRAME RATE" value={`${stats.fps} FPS`} color="primary" />
        <HudRow label="HANDS" value={`${stats.handsDetected} DETECTED`} color="primary" />
        <HudRow label="GESTURES" value={`${stats.totalGestures}`} color="primary" />
        <HudRow label="POWER" value={`${powerLevel}%`} color="warning" />

        {/* Power bar */}
        <div className="space-y-1">
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: "hsl(175 80% 50% / 0.1)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${powerLevel}%`,
                backgroundColor: "hsl(var(--primary))",
                boxShadow: "0 0 8px hsl(175 80% 50% / 0.5)",
              }}
            />
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-400 shadow-[0_0_8px_hsl(150,70%,50%)]" : "bg-red-400 shadow-[0_0_8px_hsl(0,70%,50%)]"}`} />
          <span className="text-[9px] tracking-wider" style={{ color: isRunning ? "hsl(150 70% 50%)" : "hsl(0 70% 60%)" }}>
            {isRunning ? "SYSTEMS ONLINE" : "SYSTEMS OFFLINE"}
          </span>
        </div>
      </div>

      {/* Right panel - Gesture readout */}
      <div className="absolute top-28 right-6 w-52 space-y-2">
        <div className="text-[9px] tracking-[0.3em] text-primary/50 uppercase border-b border-primary/10 pb-1">
          Gesture Analysis
        </div>
        {gestures.length > 0 ? (
          gestures.map((g, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary glow-text">{g.gesture}</span>
                <span className="text-[9px] text-primary/40">{g.handedness}</span>
              </div>
              <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "hsl(175 80% 50% / 0.1)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${g.confidence * 100}%`,
                    backgroundColor: "hsl(var(--primary))",
                    boxShadow: "0 0 6px hsl(175 80% 50% / 0.4)",
                  }}
                />
              </div>
              <div className="text-[8px] text-primary/30 text-right">{(g.confidence * 100).toFixed(1)}% CONFIDENCE</div>
            </div>
          ))
        ) : isRunning ? (
          <div className="text-[9px] text-primary/30 animate-pulse">SCANNING FOR INPUT...</div>
        ) : null}
      </div>

      {/* Bottom left - Gesture history (top 5) */}
      <div className="absolute bottom-28 left-6 w-48 space-y-1">
        <div className="text-[9px] tracking-[0.3em] text-primary/40 uppercase border-b border-primary/10 pb-1">
          Detection Log
        </div>
        {Object.entries(stats.gestureCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([gesture, count]) => (
            <div key={gesture} className="flex items-center justify-between text-[9px]">
              <span className="text-primary/60 truncate max-w-[120px]">{gesture}</span>
              <span className="text-primary/30">{count}×</span>
            </div>
          ))}
      </div>

      {/* Bottom right - Controls */}
      <div className="absolute bottom-28 right-6 space-y-2 pointer-events-auto">
        <HudButton onClick={isRunning ? onStop : onStart} active={isRunning}>
          {isRunning ? "⏹ DISENGAGE" : "▶ ENGAGE"}
        </HudButton>
        <HudButton onClick={onToggleJarvis} active={jarvisMode}>
          {jarvisMode ? "🤖 JARVIS: ON" : "🤖 JARVIS: OFF"}
        </HudButton>
        <HudButton onClick={onResetStats} active={false}>
          ↻ RESET LOG
        </HudButton>
      </div>

      {/* Bottom center - Status */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
        {error ? (
          <div className="text-[9px] tracking-wider text-destructive">{error}</div>
        ) : (
          <div className="text-[9px] tracking-[0.3em] text-primary/30 uppercase">
            {isRunning ? "Gesture Recognition Active · Show hand to interact" : "Press ENGAGE to activate"}
          </div>
        )}
      </div>

      {/* Scanning lines effect */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(175 80% 50%) 2px, hsl(175 80% 50%) 3px)",
          backgroundSize: "100% 4px",
        }} />
      </div>

      {/* Circular arc decorations */}
      <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vmin] h-[90vmin] opacity-[0.06]" viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="195" stroke="hsl(175 80% 50%)" strokeWidth="0.5" strokeDasharray="4 8" />
        <circle cx="200" cy="200" r="170" stroke="hsl(175 80% 50%)" strokeWidth="0.3" strokeDasharray="2 12" />
        <circle cx="200" cy="200" r="145" stroke="hsl(260 70% 60%)" strokeWidth="0.3" strokeDasharray="1 16" />
      </svg>
    </div>
  );
}

function HudRow({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "hsl(175 80% 50%)",
    warning: "hsl(40 90% 55%)",
  };
  return (
    <div className="flex items-center justify-between text-[9px]">
      <span className="tracking-wider text-primary/40 uppercase">{label}</span>
      <span className="tracking-wider" style={{ color: colorMap[color] || colorMap.primary }}>
        {value}
      </span>
    </div>
  );
}

function HudButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`
        block w-full text-left text-[10px] tracking-widest uppercase px-3 py-1.5 rounded
        border transition-all font-mono
        ${active
          ? "border-primary/40 bg-primary/10 text-primary glow-border"
          : "border-primary/15 bg-primary/5 text-primary/50 hover:border-primary/30 hover:text-primary/70"
        }
      `}
    >
      {children}
    </button>
  );
}
