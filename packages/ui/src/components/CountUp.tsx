import { useCountUp } from "../hooks/motion";

/** Número que conta até o valor novo quando ele muda. */
export function CountUp({ value, format = String }: { value: number; format?: (n: number) => string }) {
  return <>{format(useCountUp(value))}</>;
}
