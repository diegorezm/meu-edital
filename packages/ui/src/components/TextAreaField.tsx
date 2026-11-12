import clsx from "clsx";
import { type TextareaHTMLAttributes, useId } from "react";

/** Campo de texto longo (anotação). */
export function TextAreaField({
  label,
  className,
  ...textarea
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className={clsx("min-w-0", className)}>
      <label htmlFor={id} className="mb-0.5 block text-sm font-extrabold">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className="w-full rounded-[5px] border-2 border-ink bg-paper-raised px-2.5 py-1.5 text-ink"
        {...textarea}
      />
    </div>
  );
}
