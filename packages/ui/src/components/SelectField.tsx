import clsx from "clsx";
import { type SelectHTMLAttributes, useId } from "react";

/** Seleção nativa com a cara do campo de formulário. */
export function SelectField({
  label,
  options,
  className,
  ...select
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className={clsx("min-w-0", className)}>
      <label htmlFor={id} className="mb-0.5 block text-sm font-extrabold">
        {label}
      </label>
      <select
        id={id}
        className="min-h-11 w-full rounded-[5px] border-2 border-ink bg-paper-raised px-2 py-1.5 text-ink"
        {...select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
