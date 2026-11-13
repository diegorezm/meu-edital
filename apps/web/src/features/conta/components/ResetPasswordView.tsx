import { Button, Field, Notice, textLinkClass } from "@meu-edital/ui";
import { Link } from "@tanstack/react-router";
import type { useResetPassword } from "../hooks/useResetPassword";
import { AuthLayout } from "@global/components/AuthLayout";
import { FormShell } from "./FormShell";

export function ResetPasswordView({ form }: { form: ReturnType<typeof useResetPassword> }) {
  return (
    <AuthLayout title="Nova senha">
      {form.invalidLink ? (
        <div className="flex flex-col gap-4">
          <Notice tone="error">Esse link expirou ou já foi usado. Peça um novo.</Notice>
          <Link to="/recuperar-senha" className={`${textLinkClass} text-center text-sm`}>
            Pedir outro link
          </Link>
        </div>
      ) : (
        <FormShell onSubmit={form.submit} error={form.error}>
          <Field
            label="Senha nova"
            type="password"
            autoComplete="new-password"
            hint="Pelo menos 8 caracteres."
            value={form.password}
            onChange={(e) => form.setPassword(e.target.value)}
          />
          <Field
            label="Repita a senha"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => form.setConfirm(e.target.value)}
          />
          <Button type="submit" disabled={form.pending}>
            Salvar senha
          </Button>
        </FormShell>
      )}
    </AuthLayout>
  );
}
