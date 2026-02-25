import { useState, useEffect, useRef } from "react";

interface Device {
  id: string;
  name: string;
  type: string;
  distance: number;
  angle: number;
  signal: number;
  mac: string;
}

const DEVICE_TYPES = ["📱 Phone", "💻 Laptop", "🎧 Audio", "📺 Display", "⌚ Wearable", "🖨️ Printer", "🎮 Console", "📡 Router"];
const NAMES = ["STARK-PAD", "PEPPER-MB", "FRIDAY-SPK", "LAB-DISP", "MARK-WATCH", "TOWER-PRT", "HULK-PS5", "AVNGR-NET", "JARVIS-HUB", "SHIELD-TAB"];

function randomMAC() {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(":");
}

function generateDevices(): Device[] {
  const count = 4 + Math.floor(Math.random() * 5);
  return Array.from({ length: count }, (_, i) => ({
    id: `dev-${i}`,
    name: NAMES[i % NAMES.length],
    type: DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)],
    distance: Math.round((1 + Math.random() * 25) * 10) / 10,
    angle: Math.random() * 360,
    signal: -30 - Math.floor(Math.random() * 60),
    mac: randomMAC(),
  }));
}

interface Props {
  expanded: boolean;
}

export function RadarPanel({ expanded }: Props) {
  const [devices, setDevices] = useState<Device[]>(generateDevices);
  const [scanAngle, setScanAngle] = useState(0);
  const [scanning, setScanning] = useState(true);
  const rafRef = useRef(0);

  // Animate sweep
  useEffect(() => {
    if (!scanning) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setScanAngle((a) => (a + dt * 0.08) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scanning]);

  // Re-scan periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          signal: Math.max(-90, Math.min(-20, d.signal + (Math.random() - 0.5) * 10)),
          distance: Math.max(0.5, d.distance + (Math.random() - 0.5) * 2),
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!expanded) {
    // Compact mode: just the radar circle
    return (
      <div className="w-full aspect-square relative">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Rings */}
          {[30, 60, 90].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="hsl(175 80% 50% / 0.12)" strokeWidth="0.5" />
          ))}
          <line x1="100" y1="10" x2="100" y2="190" stroke="hsl(175 80% 50% / 0.08)" strokeWidth="0.5" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="hsl(175 80% 50% / 0.08)" strokeWidth="0.5" />

          {/* Sweep */}
          <line
            x1="100" y1="100"
            x2={100 + 90 * Math.cos((scanAngle * Math.PI) / 180)}
            y2={100 + 90 * Math.sin((scanAngle * Math.PI) / 180)}
            stroke="hsl(175 80% 50% / 0.6)" strokeWidth="1"
          />
          <path
            d={`M100,100 L${100 + 90 * Math.cos(((scanAngle - 30) * Math.PI) / 180)},${100 + 90 * Math.sin(((scanAngle - 30) * Math.PI) / 180)} A90,90 0 0,1 ${100 + 90 * Math.cos((scanAngle * Math.PI) / 180)},${100 + 90 * Math.sin((scanAngle * Math.PI) / 180)} Z`}
            fill="hsl(175 80% 50% / 0.06)"
          />

          {/* Device dots */}
          {devices.map((d) => {
            const r = (d.distance / 30) * 90;
            const x = 100 + r * Math.cos((d.angle * Math.PI) / 180);
            const y = 100 + r * Math.sin((d.angle * Math.PI) / 180);
            return (
              <g key={d.id}>
                <circle cx={x} cy={y} r="3" fill="hsl(175 80% 50% / 0.8)">
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r="6" fill="none" stroke="hsl(175 80% 50% / 0.2)" strokeWidth="0.5" />
              </g>
            );
          })}

          {/* Center */}
          <circle cx="100" cy="100" r="4" fill="hsl(40 90% 55% / 0.8)" />
          <circle cx="100" cy="100" r="7" fill="none" stroke="hsl(40 90% 55% / 0.3)" strokeWidth="0.5" />
        </svg>
        <div className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-mono text-primary/40">
          {devices.length} DEVICES · SCANNING
        </div>
      </div>
    );
  }

  // Expanded mode: radar + device list
  return (
    <div className="flex gap-3 w-full">
      {/* Radar visual */}
      <div className="w-40 h-40 flex-shrink-0 relative">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {[30, 60, 90].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="hsl(175 80% 50% / 0.12)" strokeWidth="0.5" />
          ))}
          <line x1="100" y1="10" x2="100" y2="190" stroke="hsl(175 80% 50% / 0.08)" strokeWidth="0.5" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="hsl(175 80% 50% / 0.08)" strokeWidth="0.5" />
          <line
            x1="100" y1="100"
            x2={100 + 90 * Math.cos((scanAngle * Math.PI) / 180)}
            y2={100 + 90 * Math.sin((scanAngle * Math.PI) / 180)}
            stroke="hsl(175 80% 50% / 0.6)" strokeWidth="1"
          />
          <path
            d={`M100,100 L${100 + 90 * Math.cos(((scanAngle - 30) * Math.PI) / 180)},${100 + 90 * Math.sin(((scanAngle - 30) * Math.PI) / 180)} A90,90 0 0,1 ${100 + 90 * Math.cos((scanAngle * Math.PI) / 180)},${100 + 90 * Math.sin((scanAngle * Math.PI) / 180)} Z`}
            fill="hsl(175 80% 50% / 0.06)"
          />
          {devices.map((d) => {
            const r = (d.distance / 30) * 90;
            const x = 100 + r * Math.cos((d.angle * Math.PI) / 180);
            const y = 100 + r * Math.sin((d.angle * Math.PI) / 180);
            return (
              <g key={d.id}>
                <circle cx={x} cy={y} r="3" fill="hsl(175 80% 50% / 0.8)">
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="4" fill="hsl(40 90% 55% / 0.8)" />
        </svg>
      </div>

      {/* Device list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto max-h-40">
        <div className="text-[8px] text-primary/40 tracking-widest uppercase">
          {devices.length} devices detected
        </div>
        {devices.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-[9px] py-0.5 border-b border-primary/5">
            <div>
              <span className="text-primary/70">{d.type.split(" ")[0]}</span>{" "}
              <span className="text-primary/50">{d.name}</span>
            </div>
            <div className="text-right text-primary/30">
              <span>{d.distance.toFixed(1)}m</span>{" "}
              <span className="ml-1">{d.signal}dBm</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
