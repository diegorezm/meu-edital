import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@global/components/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "@global/components/Brand";
import { Button, Field, palette, useLayout } from "@global/components/ui";
import { useAuth } from "@global/store/auth";

export type AuthMode = "signIn" | "signUp";

const MIN_PASSWORD = 6;

const copy = {
  signUp: {
    title: "Crie sua conta grátis.",
    intro: "Use sua conta Google ou crie com e-mail e senha.",
    action: "Criar conta  →",
    busy: "Criando...",
    passwordHint: "Pelo menos 6 caracteres",
    trust: "Grátis e sem cartão. Seu ciclo fica pronto em poucos minutos.",
    switchText: "Já tem conta?",
    switchAction: "Entrar",
  },
  signIn: {
    title: "Bom te ver de volta.",
    intro: "Entre com o Google ou com seu e-mail e senha.",
    action: "Entrar  →",
    busy: "Entrando...",
    passwordHint: "Sua senha",
    trust: "A mesma conta funciona no celular e no navegador.",
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
  const { signIn, signUp, signInWithGoogle, oauthError } = useAuth();
  const { mobile } = useLayout();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(oauthError || "");
  const text = copy[mode];

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  };
  const submit = () =>
    run(async () => {
      if (!isEmail(email)) throw new Error("Digite um e-mail válido.");
      if (mode === "signUp" && password.length < MIN_PASSWORD)
        throw new Error("A senha precisa ter pelo menos 6 caracteres.");
      if (!password) throw new Error("Digite sua senha.");
      await (mode === "signUp" ? signUp : signIn)(email, password);
    });
  // Na web a página sai para o Google; no celular volta aqui já com a sessão.
  const google = () => run(signInWithGoogle);
  const switchMode = (next: AuthMode) => {
    setError("");
    onModeChange(next);
  };

  const form = (
    <View style={[s.card, mobile ? s.cardMobile : s.cardDesktop]}>
      {onBack && (
        <Pressable accessibilityRole="button" onPress={onBack} style={s.back}>
          <Text style={s.backText}>← Voltar ao site</Text>
        </Pressable>
      )}
      {mobile && (
        <View style={s.mobileBrand}>
          <Brand large />
        </View>
      )}
      <Text style={s.title}>{text.title}</Text>
      <Text style={s.intro}>{text.intro}</Text>
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
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        autoComplete="email"
        autoFocus={!mobile}
      />
      <Field
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder={text.passwordHint}
        autoComplete={mode === "signUp" ? "new-password" : "current-password"}
        secure
        onSubmitEditing={submit}
      />
      {error ? (
        <View style={s.errorBox}>
          <Text style={s.error}>{error}</Text>
        </View>
      ) : null}
      <View style={s.actions}>
        <Button
          title={busy ? text.busy : text.action}
          onPress={submit}
          disabled={busy || !email.trim() || !password}
          full
        />
      </View>
      <Text style={s.trust}>{text.trust}</Text>
      <View style={s.switchRow}>
        <Text style={s.switchText}>{text.switchText} </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => switchMode(mode === "signIn" ? "signUp" : "signIn")}
        >
          <Text style={s.switchAction}>{text.switchAction}</Text>
        </Pressable>
      </View>
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
  actions: { gap: 10 },
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
