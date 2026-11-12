import { Icon } from "./Icon";

/** Caixa de marcação do contrato. Não é controle: o estudo é que marca. */
export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <i className="grid size-[18px] flex-none place-items-center rounded-sm border-2 border-ink bg-paper-raised" aria-hidden>
      {checked && <Icon name="check" className="size-3 stroke-[3] text-green-strong" />}
    </i>
  );
}
