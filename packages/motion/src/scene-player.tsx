"use client";

/**
 * Play/pause and one dot per step of a looping scene (the percent.sa Services animation). The active
 * dot fills with `progress`. Large motion that keeps playing under reduced motion must have this control.
 */
export function ScenePlayer({
  label,
  steps,
  active,
  progress,
  playing,
  onToggle,
  onJump,
  labels,
  className,
}: {
  label: string;
  steps: string[];
  active: number;
  /** 0..1 of the active step. */
  progress: number;
  playing: boolean;
  onToggle: () => void;
  onJump: (step: number) => void;
  labels: { play: string; pause: string; show: (step: string) => string };
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={className ? `p-scene ${className}` : "p-scene"}>
      <button type="button" className="p-scene-pp" aria-label={playing ? labels.pause : labels.play} onClick={onToggle}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          {playing ? (
            <>
              <rect x="1.5" y="1" width="3" height="10" rx="1" />
              <rect x="7.5" y="1" width="3" height="10" rx="1" />
            </>
          ) : (
            <path d="M3 1.2v9.6c0 .5.5.8.9.5l7-4.8a.6.6 0 0 0 0-1L3.9.7C3.5.4 3 .7 3 1.2Z" />
          )}
        </svg>
      </button>
      <div className="p-scene-dots">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            className="p-scene-dot"
            data-on={i === active || undefined}
            aria-current={i === active ? "step" : undefined}
            aria-label={labels.show(s)}
            onClick={() => onJump(i)}
          >
            <span>
              <i style={{ width: i === active ? `${progress * 100}%` : 0 }} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
