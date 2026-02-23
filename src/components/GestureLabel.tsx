import type { GestureData } from "@/hooks/useHandGesture";

interface Props {
  gesture: GestureData;
}

export function GestureLabel({ gesture }: Props) {
  return (
    <div className="animate-gesture-pop glass-strong rounded-lg px-4 py-3 glow-border">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{gesture.gesture.split(" ")[0]}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {gesture.gesture.split(" ").slice(1).join(" ")}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${gesture.confidence * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {(gesture.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {gesture.handedness}
        </span>
      </div>
    </div>
  );
}
