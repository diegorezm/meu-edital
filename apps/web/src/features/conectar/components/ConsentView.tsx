import { Button, ListRow, Notice, Tag } from "@meu-edital/ui";
import { AuthLayout } from "@global/components/AuthLayout";
import type { useConsent } from "../hooks/useConsent";

export function ConsentView({ consent }: { consent: ReturnType<typeof useConsent> }) {
  if (!consent.valid)
    return (
      <AuthLayout title="Conectar uma IA" mascot="mascote.rosa.dormindo">
        <Notice tone="error">Esse pedido não é válido. Volte para a sua IA e tente conectar de novo.</Notice>
      </AuthLayout>
    );
  return (
    <AuthLayout title={`Conectar ${consent.client}?`}>
      <div className="flex flex-col gap-3">
        {consent.error && <Notice tone="error">{consent.error}</Notice>}
        <p>
          <b>{consent.client}</b> quer acessar seu estudo no Meu Edital.
          {consent.destination && (
            <>
              {" "}Depois, ele volta para <b>{consent.destination}</b>.
            </>
          )}
        </p>
        <div>
          {consent.canRead && (
            <ListRow>
              <span className="flex gap-2">
                <Tag>ler</Tag>
                <span className="text-sm">Ver seu concurso, matérias, jornada, semanas e revisões. Nada de e-mail ou dados da conta.</span>
              </span>
            </ListRow>
          )}
          {consent.canPropose && (
            <ListRow>
              <span className="flex gap-2">
                <Tag>propor</Tag>
                <span className="text-sm">Sugerir mudanças de peso, meta e jornada. Elas caem na caixa do Oráculo e só valem se você aplicar.</span>
              </span>
            </ListRow>
          )}
        </div>
        <p className="text-xs text-ink-muted">Ele nunca registra estudo nem apaga nada. Dá para desconectar a qualquer hora no Oráculo.</p>
        <div className="flex gap-2">
          <Button variant="quiet" className="flex-1" disabled={consent.pending} onClick={() => void consent.deny()}>
            Recusar
          </Button>
          <Button className="flex-1" disabled={consent.pending} onClick={() => void consent.allow()}>
            Permitir
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
