import { Button, Field, Notice, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";
import type { useWaitlist } from "../hooks/useWaitlist";
import { AuthLayout } from "@global/components/AuthLayout";
import { FormShell } from "./FormShell";
import { Turnstile } from "./Turnstile";

export function WaitlistView({ form }: { form: ReturnType<typeof useWaitlist> }) {
  return (
    <AuthLayout title="Lista de espera" mascot="mascote.rosa.comemorando">
      <FormShell onSubmit={form.submit} error={form.error}>
        {form.done ? (
          <Notice>Pronto! Avisamos você por e-mail quando as vagas abrirem.</Notice>
        ) : (
          <>
            <p className="text-sm">
              As vagas para novas contas ainda não abriram. Deixe seu e-mail e avisamos quando abrirem.
            </p>
            <Field
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => form.setEmail(e.target.value)}
            />
            {form.turnstileSiteKey && (
              <Turnstile siteKey={form.turnstileSiteKey} onToken={form.setCaptchaToken} />
            )}
            <Button type="submit" disabled={form.pending}>
              Quero ser avisado
            </Button>
            <p className="text-center text-xs text-ink-muted">Só para avisar da abertura. Nada de spam.</p>
          </>
        )}
        <p className="text-center text-sm">
          Já tem conta?{" "}
          <Link to="/entrar" className={textLinkClass}>
            Entrar
          </Link>
        </p>
      </FormShell>
    </AuthLayout>
  );
}
