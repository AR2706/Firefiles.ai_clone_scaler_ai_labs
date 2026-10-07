import { useCallback, useEffect, useState } from "react";

const TICK_MS = 100;

/**
 * A playback clock for the meeting player.
 *
 * The sample meetings have no audio file, so this hook simulates playback:
 * while playing, it advances the current time on a timer. The rest of the
 * page only sees `currentMs`, `seek` and `toggle`, so swapping in a real
 * <audio> element later would not change any other component.
 */
export function usePlayback(durationMs: number) {
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - last) * speed;
      last = now;
      setCurrentMs((current) => Math.min(durationMs, current + elapsed));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playing, speed, durationMs]);

  // Stop when the end is reached.
  useEffect(() => {
    if (playing && currentMs >= durationMs) setPlaying(false);
  }, [playing, currentMs, durationMs]);

  const seek = useCallback(
    (ms: number) => setCurrentMs(Math.max(0, Math.min(durationMs, ms))),
    [durationMs],
  );

  const toggle = useCallback(() => {
    // Pressing play at the end starts again from the beginning.
    if (!playing && currentMs >= durationMs) setCurrentMs(0);
    setPlaying((value) => !value);
  }, [playing, currentMs, durationMs]);

  return { currentMs, playing, speed, setSpeed, seek, toggle };
}

export type Playback = ReturnType<typeof usePlayback>;
