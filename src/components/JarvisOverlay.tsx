import { useState, useCallback, useEffect, useRef } from "react";
import type { GestureData } from "@/hooks/useHandGesture";
import { RadarPanel } from "@/components/hud/RadarPanel";
import { TelemetryPanel } from "@/components/hud/TelemetryPanel";
import { SystemPanel } from "@/components/hud/SystemPanel";
import { StatusPanel } from "@/components/hud/StatusPanel";

interface DraggableWidget {
  id: string;
  x: number;
  y: number;
  label: string;
  icon: string;
  color: string;
}

const INITIAL_WIDGETS: DraggableWidget[] = [
  { id: "system", x: 15, y: 15, label: "SYSTEM", icon: "⚡", color: "hsl(175, 80%, 50%)" },
  { id: "status", x: 70, y: 15, label: "STATUS", icon: "📡", color: "hsl(260, 70%, 60%)" },
  { id: "radar", x: 15, y: 70, label: "RADAR", icon: "🛰️", color: "hsl(40, 90%, 55%)" },
  { id: "data", x: 70, y: 70, label: "DATA", icon: "📊", color: "hsl(150, 70%, 45%)" },
];

const GRAB_GESTURES = ["Fist", "Pinch", "OK Sign", "Money", "Pen Grip", "Snap"];
const RELEASE_GESTURES = ["Open Palm"];
const POINT_GESTURES = ["Point Up", "Pointing"];

interface Props {
  gestures: GestureData[];
  containerRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
}

type WidgetState = "closed" | "open" | "expanded";

export function JarvisOverlay({ gestures, containerRef, enabled }: Props) {
  const [widgets, setWidgets] = useState<DraggableWidget[]>(INITIAL_WIDGETS);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [grabbedWidget, setGrabbedWidget] = useState<string | null>(null);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; t: number }>>([]);
  const prevGrabbing = useRef(false);

  // Widget panel states
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>({
    system: "closed",
    status: "closed",
    radar: "closed",
    data: "closed",
  });

  // Dwell tracking for gesture-based selection
  const dwellRef = useRef<{
    widgetId: string | null;
    gestureType: "point" | "palm" | null;
    startTime: number;
    progress: number;
  }>({ widgetId: null, gestureType: null, startTime: 0, progress: 0 });

  const [dwellProgress, setDwellProgress] = useState<{ widgetId: string; progress: number; type: "point" | "palm" } | null>(null);

  const getHandPosition = useCallback((gesture: GestureData) => {
    if (!gesture.landmarks || gesture.landmarks.length < 9) return null;
    const tip = gesture.landmarks[8];
    return { x: (1 - tip.x) * 100, y: tip.y * 100 };
  }, []);

  const findNearestWidget = useCallback((pos: { x: number; y: number }, threshold = 14) => {
    return widgets.reduce<{ id: string; dist: number } | null>((best, w) => {
      const d = Math.sqrt((w.x - pos.x) ** 2 + (w.y - pos.y) ** 2);
      if (d < threshold && (!best || d < best.dist)) return { id: w.id, dist: d };
      return best;
    }, null);
  }, [widgets]);

  const isGestureType = useCallback((gestureName: string, list: string[]) => {
    return list.some((g) => gestureName.includes(g));
  }, []);

  useEffect(() => {
    if (!enabled || gestures.length === 0) {
      setCursorPos(null);
      if (isGrabbing) {
        setIsGrabbing(false);
        setGrabbedWidget(null);
      }
      dwellRef.current = { widgetId: null, gestureType: null, startTime: 0, progress: 0 };
      setDwellProgress(null);
      return;
    }

    const primary = gestures[0];
    const pos = getHandPosition(primary);
    if (!pos) return;

    setCursorPos(pos);

    // Trail
    setTrail((prev) => {
      const now = Date.now();
      return [...prev, { x: pos.x, y: pos.y, t: now }].filter((p) => now - p.t < 400).slice(-12);
    });

    const gestureName = primary.gesture;
    const grabbing = isGestureType(gestureName, GRAB_GESTURES);
    const releasing = isGestureType(gestureName, RELEASE_GESTURES);
    const pointing = isGestureType(gestureName, POINT_GESTURES);

    // --- Grab/drag logic ---
    if (grabbing && !prevGrabbing.current) {
      setIsGrabbing(true);
      const nearest = findNearestWidget(pos, 18);
      if (nearest) setGrabbedWidget(nearest.id);
    } else if (releasing && !pointing) {
      setIsGrabbing(false);
      setGrabbedWidget(null);
    }
    prevGrabbing.current = grabbing;

    if (grabbedWidget && grabbing) {
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === grabbedWidget
            ? { ...w, x: Math.max(5, Math.min(85, pos.x)), y: Math.max(5, Math.min(85, pos.y)) }
            : w
        )
      );
    }

    // --- Dwell logic: Point (1 finger) 3s = open, Open Palm 2s = expand ---
    const nearest = findNearestWidget(pos, 14);
    const now = Date.now();
    const currentDwellType: "point" | "palm" | null = pointing ? "point" : releasing ? "palm" : null;

    if (nearest && currentDwellType && !grabbing) {
      const dwell = dwellRef.current;
      if (dwell.widgetId === nearest.id && dwell.gestureType === currentDwellType) {
        // Same widget, same gesture — update progress
        const requiredMs = currentDwellType === "point" ? 3000 : 2000;
        const elapsed = now - dwell.startTime;
        const progress = Math.min(1, elapsed / requiredMs);
        dwellRef.current.progress = progress;
        setDwellProgress({ widgetId: nearest.id, progress, type: currentDwellType });

        if (progress >= 1) {
          // Trigger action
          if (currentDwellType === "point") {
            setWidgetStates((prev) => ({
              ...prev,
              [nearest.id]: prev[nearest.id] === "closed" ? "open" : "closed",
            }));
          } else {
            setWidgetStates((prev) => ({
              ...prev,
              [nearest.id]: prev[nearest.id] === "expanded" ? "open" : "expanded",
            }));
          }
          // Reset dwell
          dwellRef.current = { widgetId: null, gestureType: null, startTime: 0, progress: 0 };
          setDwellProgress(null);
        }
      } else {
        // New dwell target
        dwellRef.current = { widgetId: nearest.id, gestureType: currentDwellType, startTime: now, progress: 0 };
        setDwellProgress({ widgetId: nearest.id, progress: 0, type: currentDwellType });
      }
    } else {
      if (dwellRef.current.widgetId) {
        dwellRef.current = { widgetId: null, gestureType: null, startTime: 0, progress: 0 };
        setDwellProgress(null);
      }
    }
  }, [gestures, enabled, getHandPosition, grabbedWidget, isGrabbing, findNearestWidget, isGestureType]);

  if (!enabled) return null;

  const renderPanel = (widgetId: string, state: WidgetState) => {
    if (state === "closed") return null;
    const expanded = state === "expanded";
    switch (widgetId) {
      case "radar": return <RadarPanel expanded={expanded} />;
      case "data": return <TelemetryPanel expanded={expanded} />;
      case "system": return <SystemPanel expanded={expanded} />;
      case "status": return <StatusPanel expanded={expanded} />;
      default: return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "linear-gradient(hsl(175 80% 50% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(175 80% 50% / 0.15) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Widgets */}
      {widgets.map((w) => {
        const state = widgetStates[w.id];
        const isOpen = state !== "closed";
        const isExpanded = state === "expanded";
        const dwell = dwellProgress?.widgetId === w.id ? dwellProgress : null;

        return (
          <div
            key={w.id}
            className="absolute transition-all"
            style={{
              left: `${w.x}%`,
              top: `${w.y}%`,
              transform: "translate(-50%, -50%)",
              transitionDuration: grabbedWidget === w.id ? "0ms" : "150ms",
              zIndex: isOpen ? 25 : 20,
            }}
          >
            <div
              className={`
                relative rounded-lg border backdrop-blur-md
                font-mono text-[10px] tracking-widest uppercase select-none
                transition-all duration-300
                ${grabbedWidget === w.id ? "scale-110" : ""}
              `}
              style={{
                borderColor: w.color,
                backgroundColor: w.color.replace(")", " / 0.08)"),
                boxShadow: isOpen
                  ? `0 0 30px -5px ${w.color}, inset 0 0 20px -5px ${w.color.replace(")", " / 0.15)")}`
                  : grabbedWidget === w.id
                    ? `0 0 25px -5px ${w.color}`
                    : `0 0 10px -5px ${w.color.replace(")", " / 0.3)")}`,
                width: isExpanded ? "320px" : isOpen ? "180px" : "auto",
                minWidth: isOpen ? "160px" : undefined,
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm">{w.icon}</span>
                <span style={{ color: w.color }}>{w.label}</span>
                {isOpen && (
                  <span className="ml-auto text-[8px]" style={{ color: w.color.replace(")", " / 0.5)") }}>
                    {isExpanded ? "EXPANDED" : "ACTIVE"}
                  </span>
                )}
              </div>

              {/* Panel content */}
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: w.color.replace(")", " / 0.15)") }}>
                  {renderPanel(w.id, state)}
                </div>
              )}

              {/* Dwell progress ring */}
              {dwell && dwell.progress > 0 && dwell.progress < 1 && (
                <div className="absolute -top-2 -right-2 w-6 h-6">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <circle cx="12" cy="12" r="10" fill="hsl(220 20% 7% / 0.8)" stroke={w.color.replace(")", " / 0.2)")} strokeWidth="1" />
                    <circle
                      cx="12" cy="12" r="8"
                      fill="none"
                      stroke={dwell.type === "point" ? "hsl(175 80% 50%)" : "hsl(40 90% 55%)"}
                      strokeWidth="2"
                      strokeDasharray={`${dwell.progress * 50.27} 50.27`}
                      strokeLinecap="round"
                      transform="rotate(-90 12 12)"
                    />
                    <text x="12" y="13" textAnchor="middle" fontSize="6" fill={dwell.type === "point" ? "hsl(175 80% 50%)" : "hsl(40 90% 55%)"}>
                      {dwell.type === "point" ? "☝️" : "🖐️"}
                    </text>
                  </svg>
                </div>
              )}

              {/* Scanning line */}
              <div className="absolute bottom-0 left-0 right-0 h-px animate-shimmer opacity-50" style={{
                backgroundImage: `linear-gradient(90deg, transparent, ${w.color}, transparent)`,
              }} />
            </div>
          </div>
        );
      })}

      {/* Cursor trail */}
      {trail.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${4 + i * 0.5}px`, height: `${4 + i * 0.5}px`,
            transform: "translate(-50%, -50%)",
            backgroundColor: isGrabbing
              ? `hsl(40 90% 55% / ${0.1 + (i / trail.length) * 0.4})`
              : `hsl(175 80% 50% / ${0.1 + (i / trail.length) * 0.3})`,
          }}
        />
      ))}

      {/* Main cursor */}
      {cursorPos && (
        <div className="absolute transition-all duration-75" style={{
          left: `${cursorPos.x}%`, top: `${cursorPos.y}%`, transform: "translate(-50%, -50%)",
        }}>
          <div className={`absolute -inset-4 rounded-full border-2 transition-all duration-200 ${
            isGrabbing ? "border-warning scale-75 opacity-90" : "border-primary/50 scale-100 opacity-60"
          }`} />
          <div className={`absolute -inset-2 rounded-full border transition-all duration-200 ${
            isGrabbing ? "border-warning/80" : "border-primary/40"
          }`} />
          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            isGrabbing ? "bg-warning shadow-[0_0_12px_hsl(40,90%,55%)]" : "bg-primary shadow-[0_0_12px_hsl(175,80%,50%)]"
          }`} />
          {!isGrabbing && (
            <>
              <div className="absolute top-1/2 -left-5 w-3 h-px bg-primary/40 -translate-y-1/2" />
              <div className="absolute top-1/2 left-[calc(100%+8px)] w-3 h-px bg-primary/40 -translate-y-1/2" />
              <div className="absolute left-1/2 -top-5 h-3 w-px bg-primary/40 -translate-x-1/2" />
              <div className="absolute left-1/2 top-[calc(100%+8px)] h-3 w-px bg-primary/40 -translate-x-1/2" />
            </>
          )}
          {isGrabbing && grabbedWidget && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="font-mono text-[9px] text-warning/80 tracking-wider uppercase">Locked</span>
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
          ☝️ Point 3s = Open · 🖐️ Palm 2s = Expand · ✊ Fist = Drag
        </span>
      </div>
    </div>
  );
}
