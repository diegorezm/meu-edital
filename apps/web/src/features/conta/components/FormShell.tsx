import { Notice } from "@meu-edital/ui";
import type { FormEvent, ReactNode } from "react";

/** Formulário com os avisos de erro e sucesso no topo. */
export function FormShell({
  onSubmit,
  error,
  notice,
  children,
}: {
  onSubmit: () => void;
  error?: string;
  notice?: string;
  children: ReactNode;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}
      {children}
    </form>
  );
}
