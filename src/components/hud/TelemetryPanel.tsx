import { useState, useEffect } from "react";

interface TelemetryData {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  history: number[];
  color: string;
}

const INITIAL_TELEMETRY: TelemetryData[] = [
  { label: "BANDWIDTH", value: 245, unit: "Mbps", min: 0, max: 500, history: [], color: "175 80% 50%" },
  { label: "LATENCY", value: 12, unit: "ms", min: 0, max: 200, history: [], color: "260 70% 60%" },
  { label: "PACKETS/S", value: 14200, unit: "p/s", min: 0, max: 30000, history: [], color: "150 70% 45%" },
  { label: "THROUGHPUT", value: 89, unit: "%", min: 0, max: 100, history: [], color: "40 90% 55%" },
  { label: "CONNECTIONS", value: 7, unit: "", min: 0, max: 20, history: [], color: "175 80% 50%" },
  { label: "SIGNAL STR", value: -42, unit: "dBm", min: -100, max: 0, history: [], color: "0 70% 55%" },
];

interface Props {
  expanded: boolean;
}

export function TelemetryPanel({ expanded }: Props) {
  const [telemetry, setTelemetry] = useState<TelemetryData[]>(INITIAL_TELEMETRY);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) =>
        prev.map((t) => {
          const delta = (Math.random() - 0.5) * (t.max - t.min) * 0.08;
          const newVal = Math.max(t.min, Math.min(t.max, t.value + delta));
          const newHistory = [...t.history, newVal].slice(-30);
          return { ...t, value: Math.round(newVal * 10) / 10, history: newHistory };
        })
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!expanded) {
    return (
      <div className="space-y-1.5 w-full">
        {telemetry.slice(0, 4).map((t) => (
          <div key={t.label} className="space-y-0.5">
            <div className="flex justify-between text-[8px]">
              <span className="text-primary/40 tracking-wider">{t.label}</span>
              <span style={{ color: `hsl(${t.color})` }}>{t.value}{t.unit}</span>
            </div>
            <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `hsl(${t.color} / 0.1)` }}>
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${((t.value - t.min) / (t.max - t.min)) * 100}%`,
                backgroundColor: `hsl(${t.color})`,
                boxShadow: `0 0 4px hsl(${t.color} / 0.4)`,
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Expanded: full telemetry with mini sparklines
  return (
    <div className="w-full space-y-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {telemetry.map((t) => (
          <div key={t.label} className="space-y-1">
            <div className="flex justify-between text-[8px]">
              <span className="text-primary/40 tracking-wider">{t.label}</span>
              <span className="font-semibold" style={{ color: `hsl(${t.color})` }}>{t.value}{t.unit}</span>
            </div>
            {/* Sparkline */}
            {t.history.length > 2 && (
              <svg viewBox={`0 0 ${t.history.length} 20`} className="w-full h-4" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke={`hsl(${t.color} / 0.6)`}
                  strokeWidth="1"
                  points={t.history.map((v, i) => `${i},${20 - ((v - t.min) / (t.max - t.min)) * 20}`).join(" ")}
                />
                <linearGradient id={`grad-${t.label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`hsl(${t.color} / 0.15)`} />
                  <stop offset="100%" stopColor={`hsl(${t.color} / 0)`} />
                </linearGradient>
                <polygon
                  fill={`url(#grad-${t.label})`}
                  points={`0,20 ${t.history.map((v, i) => `${i},${20 - ((v - t.min) / (t.max - t.min)) * 20}`).join(" ")} ${t.history.length - 1},20`}
                />
              </svg>
            )}
            <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `hsl(${t.color} / 0.1)` }}>
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${((t.value - t.min) / (t.max - t.min)) * 100}%`,
                backgroundColor: `hsl(${t.color})`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
