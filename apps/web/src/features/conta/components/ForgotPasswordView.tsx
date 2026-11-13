import { Button, Field, Notice, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";
import type { useForgotPassword } from "../hooks/useForgotPassword";
import { AuthLayout } from "@global/components/AuthLayout";
import { FormShell } from "./FormShell";
import { Turnstile } from "./Turnstile";

export function ForgotPasswordView({ form }: { form: ReturnType<typeof useForgotPassword> }) {
  return (
    <AuthLayout title="Recuperar senha" mascot="mascote.rosa.dormindo">
      {!form.emailEnabled ? (
        <div className="flex flex-col gap-4">
          <Notice>
            Recuperar a senha por e-mail chega em breve. Por enquanto, guarde bem a sua.
          </Notice>
          <Link to="/entrar" className={`${textLinkClass} text-center text-sm`}>
            Voltar para entrar
          </Link>
        </div>
      ) : form.sent ? (
        <div className="flex flex-col gap-4">
          <Notice>
            Se houver uma conta com esse e-mail, o link para trocar a senha já está a caminho.
          </Notice>
          <Link to="/entrar" className={`${textLinkClass} text-center text-sm`}>
            Voltar para entrar
          </Link>
        </div>
      ) : (
        <FormShell onSubmit={form.submit} error={form.error}>
          <p>Diga seu e-mail e mandamos um link para criar uma senha nova.</p>
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
            Enviar link
          </Button>
          <Link to="/entrar" className={`${textLinkClass} text-center text-sm`}>
            Lembrei a senha
          </Link>
        </FormShell>
      )}
    </AuthLayout>
  );
}
