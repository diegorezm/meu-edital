import { Button, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";
import type { useResendVerification } from "../hooks/useResendVerification";
import { AuthLayout } from "./AuthLayout";
import { FormShell } from "./FormShell";

export function CheckEmailView({ form }: { form: ReturnType<typeof useResendVerification> }) {
  return (
    <AuthLayout title="Confira seu e-mail" mascot="mascote.rosa.estudando">
      <FormShell onSubmit={form.resend} error={form.error} notice={form.notice}>
        <p>
          Mandamos um link de confirmação
          {form.email && (
            <>
              {" para "}
              <strong>{form.email}</strong>
            </>
          )}
          . Abra o link para começar a jornada.
        </p>
        {form.email && (
          <Button type="submit" variant="quiet" disabled={form.pending}>
            Reenviar link
          </Button>
        )}
        <Link to="/entrar" className={`${textLinkClass} text-center text-sm`}>
          Voltar para entrar
        </Link>
      </FormShell>
    </AuthLayout>
  );
}
