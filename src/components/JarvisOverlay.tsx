import { useState, useCallback, useEffect, useRef } from "react";
import type { GestureData } from "@/hooks/useHandGesture";

interface DraggableWidget {
  id: string;
  x: number;
  y: number;
  label: string;
  icon: string;
  color: string;
}

const INITIAL_WIDGETS: DraggableWidget[] = [
  { id: "w1", x: 15, y: 15, label: "SYSTEM", icon: "⚡", color: "hsl(175, 80%, 50%)" },
  { id: "w2", x: 70, y: 15, label: "STATUS", icon: "📡", color: "hsl(260, 70%, 60%)" },
  { id: "w3", x: 15, y: 70, label: "RADAR", icon: "🛰️", color: "hsl(40, 90%, 55%)" },
  { id: "w4", x: 70, y: 70, label: "DATA", icon: "📊", color: "hsl(150, 70%, 45%)" },
];

const GRAB_GESTURES = ["✊ Fist", "🤏 Pinch", "👌 OK Sign", "💰 Money", "✍️ Pen Grip", "🫰 Snap"];
const RELEASE_GESTURES = ["🖐️ Open Palm"];

interface Props {
  gestures: GestureData[];
  containerRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
}

export function JarvisOverlay({ gestures, containerRef, enabled }: Props) {
  const [widgets, setWidgets] = useState<DraggableWidget[]>(INITIAL_WIDGETS);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [grabbedWidget, setGrabbedWidget] = useState<string | null>(null);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; t: number }>>([]);
  const prevGrabbing = useRef(false);

  // Convert hand landmark to screen percentage (mirrored)
  const getHandPosition = useCallback((gesture: GestureData) => {
    if (!gesture.landmarks || gesture.landmarks.length < 9) return null;
    // Use index finger tip (landmark 8)
    const tip = gesture.landmarks[8];
    return { x: (1 - tip.x) * 100, y: tip.y * 100 };
  }, []);

  useEffect(() => {
    if (!enabled || gestures.length === 0) {
      setCursorPos(null);
      if (isGrabbing) {
        setIsGrabbing(false);
        setGrabbedWidget(null);
      }
      return;
    }

    const primary = gestures[0];
    const pos = getHandPosition(primary);
    if (!pos) return;

    setCursorPos(pos);

    // Add trail point
    setTrail((prev) => {
      const now = Date.now();
      const updated = [...prev, { x: pos.x, y: pos.y, t: now }];
      return updated.filter((p) => now - p.t < 400).slice(-12);
    });

    // Check grab/release
    const gestureName = primary.gesture;
    const grabbing = GRAB_GESTURES.some((g) => gestureName.includes(g.split(" ").slice(1).join(" ")));
    const releasing = RELEASE_GESTURES.some((g) => gestureName.includes(g.split(" ").slice(1).join(" ")));

    if (grabbing && !prevGrabbing.current) {
      setIsGrabbing(true);
      // Find nearest widget
      const nearest = widgets.reduce<{ id: string; dist: number } | null>((best, w) => {
        const d = Math.sqrt((w.x - pos.x) ** 2 + (w.y - pos.y) ** 2);
        if (d < 18 && (!best || d < best.dist)) return { id: w.id, dist: d };
        return best;
      }, null);
      if (nearest) setGrabbedWidget(nearest.id);
    } else if (releasing) {
      setIsGrabbing(false);
      setGrabbedWidget(null);
    }
    prevGrabbing.current = grabbing;

    // Move grabbed widget
    if (grabbedWidget && grabbing) {
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === grabbedWidget
            ? { ...w, x: Math.max(5, Math.min(85, pos.x)), y: Math.max(5, Math.min(85, pos.y)) }
            : w
        )
      );
    }
  }, [gestures, enabled, getHandPosition, grabbedWidget, isGrabbing, widgets]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(hsl(175 80% 50% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(175 80% 50% / 0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Corner brackets */}
      {[
        "top-3 left-3",
        "top-3 right-3 rotate-90",
        "bottom-3 right-3 rotate-180",
        "bottom-3 left-3 -rotate-90",
      ].map((pos, i) => (
        <div key={i} className={`absolute ${pos}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 8V2h6" stroke="hsl(175, 80%, 50%)" strokeWidth="1.5" strokeOpacity="0.5" />
          </svg>
        </div>
      ))}

      {/* HUD text */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] text-primary/60 tracking-[0.3em] uppercase">
        J.A.R.V.I.S. Interface
      </div>

      {/* Widgets */}
      {widgets.map((w) => (
        <div
          key={w.id}
          className="absolute transition-all"
          style={{
            left: `${w.x}%`,
            top: `${w.y}%`,
            transform: "translate(-50%, -50%)",
            transitionDuration: grabbedWidget === w.id ? "0ms" : "150ms",
          }}
        >
          <div
            className={`
              relative px-3 py-2 rounded-lg border backdrop-blur-md
              font-mono text-[10px] tracking-widest uppercase select-none
              transition-all duration-200
              ${grabbedWidget === w.id ? "scale-110" : ""}
            `}
            style={{
              borderColor: `${w.color}`,
              backgroundColor: `${w.color.replace(")", " / 0.1)")}`,
              boxShadow: grabbedWidget === w.id
                ? `0 0 25px -5px ${w.color}, inset 0 0 15px -5px ${w.color.replace(")", " / 0.2)")}`
                : `0 0 10px -5px ${w.color.replace(")", " / 0.3)")}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{w.icon}</span>
              <span style={{ color: w.color }}>{w.label}</span>
            </div>
            {/* Scanning line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px animate-shimmer opacity-50"
              style={{
                backgroundImage: `linear-gradient(90deg, transparent, ${w.color}, transparent)`,
              }}
            />
          </div>
        </div>
      ))}

      {/* Cursor trail */}
      {trail.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${4 + i * 0.5}px`,
            height: `${4 + i * 0.5}px`,
            transform: "translate(-50%, -50%)",
            backgroundColor: isGrabbing
              ? `hsl(40 90% 55% / ${0.1 + (i / trail.length) * 0.4})`
              : `hsl(175 80% 50% / ${0.1 + (i / trail.length) * 0.3})`,
          }}
        />
      ))}

      {/* Main cursor */}
      {cursorPos && (
        <div
          className="absolute transition-all duration-75"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Outer ring */}
          <div
            className={`absolute -inset-4 rounded-full border-2 transition-all duration-200 ${
              isGrabbing ? "border-warning scale-75 opacity-90" : "border-primary/50 scale-100 opacity-60"
            }`}
          />
          {/* Inner ring */}
          <div
            className={`absolute -inset-2 rounded-full border transition-all duration-200 ${
              isGrabbing ? "border-warning/80" : "border-primary/40"
            }`}
          />
          {/* Center dot */}
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              isGrabbing ? "bg-warning shadow-[0_0_12px_hsl(40,90%,55%)]" : "bg-primary shadow-[0_0_12px_hsl(175,80%,50%)]"
            }`}
          />
          {/* Crosshair lines */}
          {!isGrabbing && (
            <>
              <div className="absolute top-1/2 -left-5 w-3 h-px bg-primary/40 -translate-y-1/2" />
              <div className="absolute top-1/2 left-[calc(100%+8px)] w-3 h-px bg-primary/40 -translate-y-1/2" />
              <div className="absolute left-1/2 -top-5 h-3 w-px bg-primary/40 -translate-x-1/2" />
              <div className="absolute left-1/2 top-[calc(100%+8px)] h-3 w-px bg-primary/40 -translate-x-1/2" />
            </>
          )}
          {/* Grab indicator */}
          {isGrabbing && grabbedWidget && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="font-mono text-[9px] text-warning/80 tracking-wider uppercase">
                Locked
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 font-mono text-[9px] tracking-wider uppercase">
        <span className={isGrabbing ? "text-warning" : "text-primary/50"}>
          {isGrabbing ? "● Grabbing" : "○ Tracking"}
        </span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-muted-foreground/50">
          Pinch to grab · Open palm to release
        </span>
      </div>
    </div>
  );
}
