import { Button, Field, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";
import type { useSignUp } from "../hooks/useSignUp";
import { AuthLayout } from "@global/components/AuthLayout";
import { FormShell } from "./FormShell";
import { GoogleButton } from "./GoogleButton";
import { Turnstile } from "./Turnstile";

export function SignUpView({ form }: { form: ReturnType<typeof useSignUp> }) {
  return (
    <AuthLayout title="Criar conta" mascot="mascote.rosa.comemorando">
      <FormShell onSubmit={form.submit} error={form.error}>
        <Field
          label="Como quer ser chamado?"
          autoComplete="nickname"
          required
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
        />
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => form.setEmail(e.target.value)}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres."
          required
          value={form.password}
          onChange={(e) => form.setPassword(e.target.value)}
        />
        {form.turnstileSiteKey && (
          <Turnstile siteKey={form.turnstileSiteKey} onToken={form.setCaptchaToken} />
        )}
        <Button type="submit" disabled={form.pending}>
          Criar conta
        </Button>
        <GoogleButton
          enabled={form.googleEnabled}
          pending={form.pending}
          onClick={form.signUpWithGoogle}
        />
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
