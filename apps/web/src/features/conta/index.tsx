import { AccountView } from "./components/AccountView";
import { CheckEmailView } from "./components/CheckEmailView";
import { ForgotPasswordView } from "./components/ForgotPasswordView";
import { ResetPasswordView } from "./components/ResetPasswordView";
import { SignInView } from "./components/SignInView";
import { SignUpView } from "./components/SignUpView";
import { useAccount } from "./hooks/useAccount";
import { useForgotPassword } from "./hooks/useForgotPassword";
import { useResendVerification } from "./hooks/useResendVerification";
import { useResetPassword } from "./hooks/useResetPassword";
import { useSignIn } from "./hooks/useSignIn";
import { useSignUp } from "./hooks/useSignUp";

const notices: Record<string, string> = {
  "senha-trocada": "Senha trocada. Entre com a senha nova.",
  "conta-excluida": "Conta excluída. Seus dados foram apagados.",
};

export function SignInPage({ aviso }: { aviso?: string }) {
  return <SignInView form={useSignIn()} notice={aviso ? notices[aviso] : undefined} />;
}

export function SignUpPage() {
  return <SignUpView form={useSignUp()} />;
}

export function CheckEmailPage({ email }: { email?: string }) {
  return <CheckEmailView form={useResendVerification(email)} />;
}

export function ForgotPasswordPage() {
  return <ForgotPasswordView form={useForgotPassword()} />;
}

export function ResetPasswordPage({ token, error }: { token?: string; error?: string }) {
  return <ResetPasswordView form={useResetPassword(token, error)} />;
}

export function AccountPage() {
  return <AccountView form={useAccount()} />;
}

