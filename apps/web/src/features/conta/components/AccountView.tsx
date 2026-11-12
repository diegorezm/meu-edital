import { Button, Field } from "@meu-edital/ui";
import type { useAccount } from "../hooks/useAccount";
import { AuthLayout } from "./AuthLayout";
import { FormShell } from "./FormShell";

/**
 * Tela provisória da fase 1: mostra a conta, sair e excluir. O Início de
 * verdade chega com o design system (fase 4) e o núcleo (fase 5).
 */
export function AccountView({ form }: { form: ReturnType<typeof useAccount> }) {
  if (!form.user) return null;
  return (
    <AuthLayout title="Sua conta">
      <FormShell onSubmit={form.deleteAccount} error={form.error}>
        <p>
          Olá, <strong>{form.user.name}</strong>! A sede da guilda ainda está em obra, mas sua
          conta já existe.
        </p>
        <p className="text-sm text-ink-muted">{form.user.email}</p>
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
    </AuthLayout>
  );
}
