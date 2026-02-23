interface Props {
  isRunning: boolean;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ControlBar({ isRunning, isLoading, onStart, onStop }: Props) {
  return (
    <div className="flex items-center gap-3">
      {!isRunning ? (
        <button
          onClick={onStart}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isLoading ? "Loading..." : "Start Detection"}
        </button>
      ) : (
        <button
          onClick={onStop}
          className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground font-semibold py-3 px-6 rounded-xl hover:brightness-110 transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          Stop Detection
        </button>
      )}
    </div>
  );
}
