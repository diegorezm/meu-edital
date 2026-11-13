import { useChanged } from "../hooks/motion";
import { Icon } from "./Icon";

/** Caixa de marcação do contrato. Não é controle: o estudo é que marca. */
export function CheckBox({ checked }: { checked: boolean }) {
  const animate = useChanged(checked);
  return (
    <i className="grid size-[18px] flex-none place-items-center rounded-sm border-2 border-ink bg-paper-raised" aria-hidden>
      {checked && <Icon name="check" className={animate ? "size-3 stroke-[3] text-green-strong animate-tick" : "size-3 stroke-[3] text-green-strong"} />}
    </i>
  );
}
