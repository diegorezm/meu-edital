import { useEffect, useRef, useState } from "react";

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Verdadeiro só quando `value` mudou depois da primeira renderização (anima mudanças, não a carga). */
export function useChanged<T>(value: T): boolean {
  const first = useRef(value);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (value !== first.current) setChanged(true);
  }, [value]);
  return changed;
}

/** Número que conta do valor anterior até o novo em ~600 ms. Na carga, aparece direto. */
export function useCountUp(target: number, duration = 600): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    from.current = target;
    if (start === target || reducedMotion()) {
      setShown(target);
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(start + (target - start) * eased));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return shown;
}
