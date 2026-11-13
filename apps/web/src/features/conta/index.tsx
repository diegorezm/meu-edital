import { AccountView } from "./components/AccountView";
import { CheckEmailView } from "./components/CheckEmailView";
import { ForgotPasswordView } from "./components/ForgotPasswordView";
import { ResetPasswordView } from "./components/ResetPasswordView";
import { SignInView } from "./components/SignInView";
import { SignUpView } from "./components/SignUpView";
import { WaitlistView } from "./components/WaitlistView";
import { useAccount } from "./hooks/useAccount";
import { useNotifications } from "./hooks/useNotifications";
import { useForgotPassword } from "./hooks/useForgotPassword";
import { useResendVerification } from "./hooks/useResendVerification";
import { useResetPassword } from "./hooks/useResetPassword";
import { useSignIn } from "./hooks/useSignIn";
import { useAuthConfig } from "./hooks/useAuthConfig";
import { useSignUp } from "./hooks/useSignUp";
import { useWaitlist } from "./hooks/useWaitlist";

const notices: Record<string, string> = {
  "senha-trocada": "Senha trocada. Entre com a senha nova.",
  "conta-excluida": "Conta excluída. Seus dados foram apagados.",
};

export function SignInPage({ aviso, volta }: { aviso?: string; volta?: string }) {
  return (
    <SignInView
      form={useSignIn(volta)}
      notice={volta ? "Entre para conectar sua IA ao Oráculo." : aviso ? notices[aviso] : undefined}
    />
  );
}

/** Com o cadastro fechado, a tela de criar conta vira a lista de espera. */
export function SignUpPage() {
  const { loaded, signupOpen } = useAuthConfig();
  if (!loaded) return null;
  return signupOpen ? <SignUpForm /> : <WaitlistForm />;
}

function SignUpForm() {
  return <SignUpView form={useSignUp()} />;
}

function WaitlistForm() {
  return <WaitlistView form={useWaitlist()} />;
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
  return <AccountView form={useAccount()} notifications={useNotifications()} />;
}

