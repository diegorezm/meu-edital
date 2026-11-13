import { Button, Field, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";
import type { useSignIn } from "../hooks/useSignIn";
import { AuthLayout } from "@global/components/AuthLayout";
import { FormShell } from "./FormShell";
import { GoogleButton } from "./GoogleButton";

export function SignInView({ form, notice }: { form: ReturnType<typeof useSignIn>; notice?: string }) {
  return (
    <AuthLayout title="Entrar">
      <FormShell onSubmit={form.submit} error={form.error} notice={form.notice || notice}>
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
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => form.setPassword(e.target.value)}
        />
        <Button type="submit" disabled={form.pending}>
          Entrar
        </Button>
        <GoogleButton
          enabled={form.googleEnabled}
          pending={form.pending}
          onClick={form.signInWithGoogle}
        />
        <div className="flex flex-col gap-1 text-center text-sm">
          <Link to="/recuperar-senha" className={textLinkClass}>
            Esqueci minha senha
          </Link>
          <p>
            Primeira vez por aqui?{" "}
            <Link to="/criar-conta" className={textLinkClass}>
              {form.signupOpen ? "Criar conta" : "Entrar na lista de espera"}
            </Link>
          </p>
        </div>
      </FormShell>
    </AuthLayout>
  );
}
