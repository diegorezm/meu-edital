import { Button, Field, Sheet } from "@meu-edital/ui";
import type { useAccount } from "../hooks/useAccount";
import { FormShell } from "./FormShell";

/** Conta: dados, estado do sync, sair e excluir (exigência da LGPD e das lojas). */
export function AccountView({ form }: { form: ReturnType<typeof useAccount> }) {
  if (!form.user) return null;
  return (
    <Sheet title="Sua conta" className="mx-auto max-w-md">
      <FormShell onSubmit={form.deleteAccount} error={form.error}>
        <p>
          <strong>{form.user.name}</strong>
        </p>
        <p className="text-sm text-ink-muted">
          {form.user.email} · {form.syncStatus}
        </p>
        <Button variant="gold" disabled={form.pending} onClick={form.signOut}>
          Sair
        </Button>
        {form.confirmingDelete ? (
          <>
            <p className="font-bold">
              Excluir a conta apaga todos os seus dados, sem volta. Confirme com sua senha.
            </p>
            <Field
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => form.setPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="quiet"
                className="flex-1"
                onClick={() => form.setConfirmingDelete(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={form.pending}>
                Excluir
              </Button>
            </div>
          </>
        ) : (
          <Button variant="quiet" onClick={() => form.setConfirmingDelete(true)}>
            Excluir conta
          </Button>
        )}
      </FormShell>
    </Sheet>
  );
}
