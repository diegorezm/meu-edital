import { Button } from "@meu-edital/ui";

/** Entrar com Google. Fica desligado até as credenciais existirem. */
export function GoogleButton({
  enabled,
  pending,
  onClick,
}: {
  enabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Button variant="quiet" disabled={!enabled || pending} onClick={onClick}>
        Entrar com Google
      </Button>
      {!enabled && (
        <p className="text-center text-sm text-ink-muted">Login com Google chega em breve.</p>
      )}
    </div>
  );
}
