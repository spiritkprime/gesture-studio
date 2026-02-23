import type { GestureStats } from "@/hooks/useHandGesture";

interface Props {
  stats: GestureStats;
  isRunning: boolean;
  onReset: () => void;
}

export function StatsPanel({ stats, isRunning, onReset }: Props) {
  return (
    <div className="glass rounded-xl p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          Stats
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="FPS"
          value={isRunning ? stats.fps.toString() : "—"}
          color={stats.fps > 24 ? "text-success" : stats.fps > 15 ? "text-warning" : "text-destructive"}
        />
        <StatCard
          label="Hands"
          value={isRunning ? stats.handsDetected.toString() : "—"}
        />
        <StatCard
          label="Gestures"
          value={stats.totalGestures.toString()}
        />
      </div>

      {Object.keys(stats.gestureCounts).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Gesture History
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {Object.entries(stats.gestureCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-secondary-foreground">{name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <p className={`stat-value ${color || "text-primary"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1 tracking-wider">
        {label}
      </p>
    </div>
  );
}
