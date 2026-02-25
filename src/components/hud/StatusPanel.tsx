import { useState, useEffect } from "react";

interface StatusEntry {
  system: string;
  status: "ONLINE" | "STANDBY" | "WARNING";
  load: number;
}

interface Props {
  expanded: boolean;
}

export function StatusPanel({ expanded }: Props) {
  const [entries, setEntries] = useState<StatusEntry[]>([
    { system: "NEURAL NET", status: "ONLINE", load: 72 },
    { system: "GESTURE ENGINE", status: "ONLINE", load: 85 },
    { system: "COMM ARRAY", status: "ONLINE", load: 34 },
    { system: "SENSOR GRID", status: "ONLINE", load: 91 },
    { system: "DEFENSE SYS", status: "STANDBY", load: 5 },
    { system: "ARC REACTOR", status: "ONLINE", load: 98 },
    { system: "FLIGHT CTRL", status: "STANDBY", load: 0 },
    { system: "WEAPONS SYS", status: "WARNING", load: 12 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) =>
        prev.map((e) => ({
          ...e,
          load: Math.max(0, Math.min(100, e.load + (Math.random() - 0.5) * 10)),
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (s: string) => {
    if (s === "ONLINE") return "150 70% 50%";
    if (s === "STANDBY") return "40 90% 55%";
    return "0 70% 55%";
  };

  if (!expanded) {
    return (
      <div className="space-y-1 w-full">
        {entries.slice(0, 4).map((e) => (
          <div key={e.system} className="flex items-center gap-2 text-[8px]">
            <div className="w-1.5 h-1.5 rounded-full" style={{
              backgroundColor: `hsl(${statusColor(e.status)})`,
              boxShadow: `0 0 4px hsl(${statusColor(e.status)} / 0.5)`,
            }} />
            <span className="text-primary/50 flex-1">{e.system}</span>
            <span style={{ color: `hsl(${statusColor(e.status)})` }}>{e.status}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {entries.map((e) => (
        <div key={e.system} className="flex items-center gap-2 text-[9px]">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
            backgroundColor: `hsl(${statusColor(e.status)})`,
            boxShadow: `0 0 4px hsl(${statusColor(e.status)} / 0.5)`,
          }}>
            {e.status === "ONLINE" && (
              <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: `hsl(${statusColor(e.status)} / 0.3)` }} />
            )}
          </div>
          <span className="text-primary/50 w-20 tracking-wider">{e.system}</span>
          <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(175 80% 50% / 0.05)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${e.load}%`,
              backgroundColor: `hsl(${statusColor(e.status)})`,
            }} />
          </div>
          <span className="w-8 text-right" style={{ color: `hsl(${statusColor(e.status)})` }}>{Math.round(e.load)}%</span>
          <span className="w-14 text-right text-primary/30">{e.status}</span>
        </div>
      ))}
      <div className="text-[8px] text-primary/30 text-center mt-2 tracking-wider">
        {entries.filter((e) => e.status === "ONLINE").length}/{entries.length} SYSTEMS ACTIVE
      </div>
    </div>
  );
}
