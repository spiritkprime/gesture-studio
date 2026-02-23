import { forwardRef } from "react";

interface Props {
  isRunning: boolean;
  isLoading: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const WebcamView = forwardRef<HTMLVideoElement, Props>(
  ({ isRunning, isLoading, canvasRef }, videoRef) => {
    return (
      <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-xl overflow-hidden border border-border/50">
        {/* Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />

        {/* Landmark overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />

        {/* Idle state */}
        {!isRunning && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Click <span className="text-primary font-medium">Start Detection</span> to begin
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground font-mono">
              Loading model...
            </p>
          </div>
        )}

        {/* Live indicator */}
        {isRunning && (
          <div className="absolute top-3 left-3 flex items-center gap-2 glass rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-destructive pulse" />
            <span className="text-xs font-mono text-foreground">LIVE</span>
          </div>
        )}
      </div>
    );
  }
);

WebcamView.displayName = "WebcamView";
