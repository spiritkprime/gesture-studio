import { useState, useEffect } from "react";

interface SystemMetric {
  label: string;
  value: number;
  unit: string;
  icon: string;
  color: string;
}

interface Props {
  expanded: boolean;
}

export function SystemPanel({ expanded }: Props) {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    { label: "CPU", value: 34, unit: "%", icon: "⚙️", color: "175 80% 50%" },
    { label: "GPU", value: 67, unit: "%", icon: "🎮", color: "260 70% 60%" },
    { label: "RAM", value: 5.2, unit: "GB", icon: "💾", color: "40 90% 55%" },
    { label: "TEMP", value: 52, unit: "°C", icon: "🌡️", color: "0 70% 55%" },
    { label: "DISK I/O", value: 120, unit: "MB/s", icon: "💿", color: "150 70% 45%" },
    { label: "NETWORK", value: 78, unit: "Mbps", icon: "📡", color: "175 80% 50%" },
  ]);

  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((u) => u + 1);
      setMetrics((prev) =>
        prev.map((m) => {
          let delta = (Math.random() - 0.5) * 8;
          if (m.label === "RAM") delta = (Math.random() - 0.5) * 0.5;
          if (m.label === "TEMP") delta = (Math.random() - 0.5) * 3;
          if (m.label === "DISK I/O") delta = (Math.random() - 0.5) * 30;
          if (m.label === "NETWORK") delta = (Math.random() - 0.5) * 15;
          const newVal = Math.max(0, Math.round((m.value + delta) * 10) / 10);
          return { ...m, value: newVal };
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const getBarPercent = (m: SystemMetric) => {
    if (m.unit === "%") return Math.min(m.value, 100);
    if (m.label === "RAM") return (m.value / 16) * 100;
    if (m.label === "TEMP") return (m.value / 100) * 100;
    if (m.label === "DISK I/O") return (m.value / 500) * 100;
    if (m.label === "NETWORK") return (m.value / 200) * 100;
    return 50;
  };

  if (!expanded) {
    return (
      <div className="space-y-1.5 w-full">
        {metrics.slice(0, 4).map((m) => (
          <div key={m.label} className="flex items-center gap-2 text-[9px]">
            <span className="w-3 text-center">{m.icon}</span>
            <span className="text-primary/40 w-10 tracking-wider">{m.label}</span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `hsl(${m.color} / 0.1)` }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${getBarPercent(m)}%`,
                backgroundColor: `hsl(${m.color})`,
                boxShadow: `0 0 4px hsl(${m.color} / 0.3)`,
              }} />
            </div>
            <span className="w-14 text-right" style={{ color: `hsl(${m.color})` }}>{m.value}{m.unit}</span>
          </div>
        ))}
        <div className="text-[8px] text-primary/30 text-right mt-1">UPTIME {formatUptime(uptime)}</div>
      </div>
    );
  }

  // Expanded
  return (
    <div className="w-full space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg p-2 text-center" style={{
            backgroundColor: `hsl(${m.color} / 0.05)`,
            border: `1px solid hsl(${m.color} / 0.15)`,
          }}>
            <div className="text-sm">{m.icon}</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: `hsl(${m.color})` }}>
              {m.value}{m.unit}
            </div>
            <div className="text-[7px] text-primary/30 tracking-wider mt-0.5">{m.label}</div>
            <div className="h-0.5 w-full rounded-full mt-1 overflow-hidden" style={{ backgroundColor: `hsl(${m.color} / 0.1)` }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${getBarPercent(m)}%`,
                backgroundColor: `hsl(${m.color})`,
              }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[8px] text-primary/30 mt-1">
        <span>UPTIME {formatUptime(uptime)}</span>
        <span>ALL SYSTEMS NOMINAL</span>
      </div>
    </div>
  );
}
