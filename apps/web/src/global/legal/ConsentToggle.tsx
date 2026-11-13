import { CheckBox } from "@meu-edital/ui";
import clsx from "clsx";
import { useId } from "react";

/** Uma categoria de cookies com caixa de marcação. */
export function ConsentToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <label
      className={clsx(
        "flex min-h-11 items-start gap-3 rounded p-1",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
        disabled ? "opacity-70" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        aria-labelledby={`${id}-l`}
        aria-describedby={`${id}-d`}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="mt-0.5">
        <CheckBox checked={checked} />
      </span>
      <span className="grid gap-0.5">
        <span id={`${id}-l`} className="font-bold">
          {label}
          {disabled && <span className="font-normal text-ink-muted"> (sempre ativos)</span>}
        </span>
        <span id={`${id}-d`} className="text-sm text-ink-muted">
          {description}
        </span>
      </span>
    </label>
  );
}
