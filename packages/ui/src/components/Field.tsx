import clsx from "clsx";
import { type InputHTMLAttributes, useId } from "react";

/** Campo de formulário: rótulo acima, erro em vinho abaixo. */
export function Field({
  label,
  error,
  hint,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  const describedBy = error ? `${id}-erro` : hint ? `${id}-dica` : undefined;
  return (
    <div className={clsx("min-w-0", className)}>
      <label htmlFor={id} className="mb-0.5 block text-sm font-extrabold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={clsx(
          "min-h-11 w-full rounded-[5px] border-2 bg-paper-raised px-2.5 py-1.5 text-ink",
          error ? "border-rose-strong" : "border-ink",
        )}
        {...input}
      />
      {error ? (
        <p id={`${id}-erro`} className="mt-0.5 text-sm font-bold text-rose-strong">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="mt-0.5 text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
