import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Field, palette } from "@global/components/ui";
import { useAuth } from "@global/store/auth";

export default function LoginScreen() {
  const { sendCode, verifyCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
  const requestCode = () =>
    run(async () => {
      if (!/^\S+@\S+\.\S+$/.test(email.trim()))
        throw new Error("Digite um e-mail válido.");
      await sendCode(email);
      setStep("code");
    });
  const confirmCode = () =>
    run(async () => {
      if (!/^\d{6,10}$/.test(code.trim()))
        throw new Error("Digite o código numérico recebido por e-mail.");
      await verifyCode(email, code);
    });

  return (
    <SafeAreaView style={s.root}>
      <View style={s.card}>
        <View style={s.brandRow}>
          <View style={s.brandMark}>
            <Text style={s.brandMarkText}>m.</Text>
          </View>
          <Text style={s.logo}>
            meu edital<Text style={s.logoDot}>.</Text>
          </Text>
        </View>
        <Text style={s.title}>
          {step === "email" ? "Entre para continuar." : "Confira seu e-mail."}
        </Text>
        <Text style={s.intro}>
          {step === "email"
            ? "Seus estudos ficam salvos na sua conta e aparecem no celular e no navegador."
            : `Enviamos um código para ${email.trim()}. Ele vale por alguns minutos.`}
        </Text>
        {step === "email" ? (
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@exemplo.com"
          />
        ) : (
          <Field
            label="Código"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            placeholder="123456"
          />
        )}
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={s.actions}>
          {step === "email" ? (
            <Button
              title={busy ? "Enviando..." : "Enviar código  →"}
              onPress={requestCode}
              disabled={busy || !email.trim()}
            />
          ) : (
            <>
              <Button
                title={busy ? "Entrando..." : "Entrar  →"}
                onPress={confirmCode}
                disabled={busy || !code.trim()}
              />
              <Button
                title="Usar outro e-mail"
                secondary
                onPress={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              />
            </>
          )}
        </View>
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
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: palette.panel,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 26,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: palette.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: palette.dark,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  logo: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  logoDot: { color: "#8B75DB" },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginTop: 28,
  },
  intro: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 22,
  },
  error: { color: palette.danger, fontSize: 12, marginBottom: 12 },
  actions: { gap: 10 },
});
