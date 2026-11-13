import { Button, buttonClass, Field, Notice, Sheet } from "@meu-edital/ui";
import { apiUrl } from "@global/http";
import type { useAccount } from "../hooks/useAccount";
import type { useNotifications } from "../hooks/useNotifications";
import { FormShell } from "./FormShell";

/** Conta: dados, estado do sync, sair, exportar e excluir (LGPD e lojas). */
export function AccountView({
  form,
  notifications,
}: {
  form: ReturnType<typeof useAccount>;
  notifications: ReturnType<typeof useNotifications>;
}) {
  if (!form.user) return null;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-[26px]">
      <Sheet title="Sua conta">
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
      {notifications.available && (
        <Sheet title="Avisos" tone="gold" ribbonSize="sm" className="pt-[26px]">
          <p className="mb-3 text-sm">
            Um aviso quando o tempo do bloco acabar e um lembrete por dia se houver revisão vencida. Nada além disso.
          </p>
          {notifications.error && (
            <div className="mb-3">
              <Notice tone="error">{notifications.error}</Notice>
            </div>
          )}
          {notifications.enabled ? (
            <Button variant="quiet" disabled={notifications.pending} onClick={() => void notifications.turnOff()}>
              Desligar avisos
            </Button>
          ) : (
            <Button disabled={notifications.pending || notifications.enabled === null} onClick={() => void notifications.turnOn()}>
              Ligar avisos
            </Button>
          )}
        </Sheet>
      )}
      <Sheet title="Seus dados" tone="gold" ribbonSize="sm" className="pt-[26px]">
        <p className="mb-3 text-sm">Leve seu estudo para onde quiser: tudo em JSON ou as sessões numa planilha.</p>
        <div className="flex flex-wrap gap-2">
          <a href={apiUrl("/api/export?formato=json")} download className={buttonClass("quiet")}>
            Baixar tudo (JSON)
          </a>
          <a href={apiUrl("/api/export?formato=csv")} download className={buttonClass("quiet")}>
            Baixar sessões (CSV)
          </a>
        </div>
      </Sheet>
      <p className="text-center text-sm text-ink-muted">
        O código do Meu Edital é aberto (FSL-1.1).{" "}
        <a href="https://github.com/diegorezm/meu-edital" className="font-bold text-teal-strong underline">
          Ver o código
        </a>
      </p>
    </div>
  );
}
