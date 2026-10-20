import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@global/components/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "@global/components/Brand";
import { Button, Field, palette, useLayout } from "@global/components/ui";
import { AccountNotFoundError, useAuth } from "@global/store/auth";

export type AuthMode = "signIn" | "signUp";

const RESEND_SECONDS = 30;

const copy = {
  signUp: {
    title: "Crie sua conta grátis.",
    intro: "Use sua conta Google ou só o e-mail. Sem senha para criar.",
    action: "Criar conta  →",
    trust: "Grátis e sem cartão. Seu ciclo fica pronto em poucos minutos.",
    switchText: "Já tem conta?",
    switchAction: "Entrar",
  },
  signIn: {
    title: "Bom te ver de volta.",
    intro: "Entre com o Google ou receba um código no e-mail.",
    action: "Enviar código  →",
    trust: "Sem senha para lembrar. O código chega em segundos.",
    switchText: "Ainda não tem conta?",
    switchAction: "Criar conta grátis",
  },
};

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());

export function AuthScreen({
  mode,
  onModeChange,
  onBack,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  /** Volta para o site. Sem ele (celular, ou site não configurado) o link some. */
  onBack?: () => void;
}) {
  const { sendCode, verifyCode, signInWithGoogle, oauthError } = useAuth();
  const { mobile } = useLayout();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(oauthError || "");
  const [notFound, setNotFound] = useState(false);
  const [wait, setWait] = useState(0);
  const text = copy[mode];

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotFound(false);
    try {
      await action();
    } catch (cause) {
      if (cause instanceof AccountNotFoundError) setNotFound(true);
      setError(cause instanceof Error ? cause.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  };
  const request = (as: AuthMode) =>
    run(async () => {
      if (!isEmail(email)) throw new Error("Digite um e-mail válido.");
      await sendCode(email, as);
      if (as !== mode) onModeChange(as);
      setStep("code");
      setCode("");
      setWait(RESEND_SECONDS);
    });
  const confirm = () =>
    run(async () => {
      if (!/^\d{6,10}$/.test(code.trim()))
        throw new Error("Digite o código de números que chegou no e-mail.");
      await verifyCode(email, code);
    });
  // Na web a página sai para o Google; no celular volta aqui já com a sessão.
  const google = () => run(signInWithGoogle);
  const switchMode = (next: AuthMode) => {
    setError("");
    setNotFound(false);
    onModeChange(next);
  };

  const form = (
    <View style={[s.card, mobile ? s.cardMobile : s.cardDesktop]}>
      {(step === "code" || onBack) && (
        <Pressable
          accessibilityRole="button"
          onPress={step === "code" ? () => setStep("email") : onBack}
          style={s.back}
        >
          <Text style={s.backText}>
            ← {step === "code" ? "Trocar e-mail" : "Voltar ao site"}
          </Text>
        </Pressable>
      )}
      {mobile && (
        <View style={s.mobileBrand}>
          <Brand large />
        </View>
      )}
      <Text style={s.title}>
        {step === "email" ? text.title : "Confira seu e-mail."}
      </Text>
      <Text style={s.intro}>
        {step === "email" ? (
          text.intro
        ) : (
          <>
            Enviamos um código para <Text style={s.strong}>{email.trim()}</Text>
            . Olhe também a caixa de spam.
          </>
        )}
      </Text>
      {step === "email" && (
        <>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={google}
            style={({ pressed }) => [s.google, (pressed || busy) && s.pressed]}
          >
            <Image
              source={require("../../../../assets/images/google-g.svg")}
              style={s.googleIcon}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={s.googleText}>Continuar com Google</Text>
          </Pressable>
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>ou com e-mail</Text>
            <View style={s.dividerLine} />
          </View>
        </>
      )}
      {step === "email" ? (
        <Field
          key="email"
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@exemplo.com"
          keyboardType="email-address"
          autoComplete="email"
          autoFocus={!mobile}
          onSubmitEditing={() => request(mode)}
        />
      ) : (
        <Field
          key="code"
          label="Código"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
          keyboardType="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          autoFocus
          onSubmitEditing={confirm}
        />
      )}
      {error ? (
        <View style={s.errorBox}>
          <Text style={s.error}>{error}</Text>
          {notFound && (
            <Pressable
              accessibilityRole="button"
              onPress={() => request("signUp")}
            >
              <Text style={s.errorAction}>Criar conta com esse e-mail →</Text>
            </Pressable>
          )}
        </View>
      ) : null}
      <View style={s.actions}>
        {step === "email" ? (
          <Button
            title={busy ? "Enviando..." : text.action}
            onPress={() => request(mode)}
            disabled={busy || !email.trim()}
            full
          />
        ) : (
          <>
            <Button
              title={busy ? "Entrando..." : "Entrar  →"}
              onPress={confirm}
              disabled={busy || code.trim().length < 6}
              full
            />
            <Pressable
              accessibilityRole="button"
              disabled={busy || wait > 0}
              onPress={() => request(mode)}
              style={s.resend}
            >
              <Text style={[s.resendText, wait > 0 && s.resendWait]}>
                {wait > 0 ? `Reenviar código em ${wait}s` : "Reenviar código"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
      {step === "email" && (
        <>
          <Text style={s.trust}>{text.trust}</Text>
          <View style={s.switchRow}>
            <Text style={s.switchText}>{text.switchText} </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                switchMode(mode === "signIn" ? "signUp" : "signIn")
              }
            >
              <Text style={s.switchAction}>{text.switchAction}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );

  if (mobile) return <SafeAreaView style={s.root}>{form}</SafeAreaView>;
  return (
    <SafeAreaView style={[s.root, s.rootDesktop]}>
      <View style={s.split}>
        <View style={s.aside}>
          <Brand large />
          <View>
            <Text style={s.asideTitle}>
              {mode === "signUp"
                ? "Em 3 passos você tem o próximo bloco para estudar."
                : "Seu ciclo continua de onde você parou."}
            </Text>
            {[
              "Ciclo montado pelos pesos do edital",
              "Revisões de 1, 7 e 30 dias no automático",
              "Meta da semana × estudado, por matéria",
            ].map((item) => (
              <Text key={item} style={s.asideItem}>
                <Text style={s.asideCheck}>✓ </Text>
                {item}
              </Text>
            ))}
          </View>
          <Text style={s.asideFoot}>
            Funciona offline e sincroniza entre aparelhos.
          </Text>
        </View>
        {form}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  rootDesktop: { padding: 32 },
  split: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 940,
    minHeight: 540,
    backgroundColor: palette.panel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: "hidden",
  },
  aside: {
    flex: 1,
    backgroundColor: palette.lavender,
    padding: 36,
    justifyContent: "space-between",
    gap: 30,
  },
  asideTitle: {
    color: palette.dark,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginBottom: 22,
  },
  asideItem: {
    color: "#4A5468",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  asideCheck: { color: palette.dark, fontWeight: "900" },
  asideFoot: { color: "#4A5468", fontSize: 12 },
  card: {
    padding: 36,
    justifyContent: "center",
    backgroundColor: palette.panel,
  },
  cardDesktop: { flex: 1 },
  cardMobile: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 24,
  },
  back: { alignSelf: "flex-start", paddingVertical: 4, marginBottom: 8 },
  backText: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  mobileBrand: { marginTop: 12 },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginTop: 18,
  },
  intro: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 22,
  },
  strong: { color: palette.text, fontWeight: "700" },
  google: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 46,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panel,
  },
  googleIcon: { width: 18, height: 18 },
  googleText: { color: palette.text, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.65 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.line },
  dividerText: { color: palette.muted, fontSize: 12 },
  errorBox: { marginBottom: 14, gap: 6 },
  error: { color: palette.danger, fontSize: 13 },
  errorAction: { color: "#22304A", fontSize: 13, fontWeight: "800" },
  actions: { gap: 10 },
  resend: { alignSelf: "center", paddingVertical: 8 },
  resendText: { color: "#22304A", fontSize: 13, fontWeight: "700" },
  resendWait: { color: palette.muted },
  trust: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  switchText: { color: palette.muted, fontSize: 13 },
  switchAction: { color: "#22304A", fontSize: 13, fontWeight: "800" },
});
