import { useEffect, useRef, useState } from "react";

const PRESETS = [15, 25, 45];

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Timer() {
  const [enabled, setEnabled] = useState(false);
  const [preset, setPreset] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  useEffect(() => {
    if (!running) return;
    const endAt = Date.now() + remainingRef.current * 1000;
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        setRunning(false);
        setFinished(true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  function toggle() {
    setEnabled((on) => {
      setRunning(false);
      setFinished(false);
      if (!on) setRemaining(preset * 60);
      return !on;
    });
  }

  function choose(minutes: number) {
    setPreset(minutes);
    setRemaining(minutes * 60);
    setFinished(false);
  }

  return (
    <div className="timer">
      <div className="timer-row">
        <button type="button" className="ghost" aria-pressed={enabled} onClick={toggle}>
          {enabled ? "Timer on" : "Timer off"}
        </button>
        {enabled ? (
          <>
            <div className="presets" role="group" aria-label="Countdown length">
              {PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={minutes === preset ? "chip chip-on" : "chip"}
                  aria-pressed={minutes === preset}
                  disabled={running}
                  onClick={() => choose(minutes)}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <p className="clock" aria-live="polite">
              {formatClock(remaining)}
            </p>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                if (remaining <= 0) {
                  setRemaining(preset * 60);
                  setFinished(false);
                  setRunning(true);
                  return;
                }
                setFinished(false);
                setRunning((value) => !value);
              }}
            >
              {running ? "Pause" : "Start"}
            </button>
          </>
        ) : null}
      </div>
      {enabled && finished ? (
        <p className="time-up">Time is up. The editor stays open.</p>
      ) : null}
    </div>
  );
}
