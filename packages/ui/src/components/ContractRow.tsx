import clsx from "clsx";
import { CheckBox } from "./CheckBox";
import { Tag } from "./Tag";

/** Contrato do dia: caixa (não é controle), descrição, progresso e recompensa. */
export function ContractRow({
  title,
  done,
  progress,
  rewardXp,
}: {
  title: string;
  done: boolean;
  progress?: string;
  rewardXp: number;
}) {
  return (
    <div className="grid grid-cols-[20px_1fr_auto] items-center gap-2 border-b-[1.5px] border-dashed border-rule py-1.5 text-sm font-bold last:border-b-0">
      <CheckBox checked={done} />
      <span className={clsx(done && "text-ink-muted line-through")}>
        {title}
        {progress && !done && <span className="ml-1 text-xs font-medium text-ink-muted">({progress})</span>}
        <span className="sr-only">{done ? " (cumprido)" : " (pendente)"}</span>
      </span>
      <Tag icon="coin">+{rewardXp}</Tag>
    </div>
  );
}
