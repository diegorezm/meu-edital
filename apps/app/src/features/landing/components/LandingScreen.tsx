import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "@global/components/Brand";
import { palette, useLayout } from "@global/components/ui";
import { faq, features, pains, steps } from "../constants/content";
import { ProductPreview } from "./ProductPreview";

type Props = { onSignUp: () => void; onSignIn: () => void };

export function LandingScreen({ onSignUp, onSignIn }: Props) {
  const { mobile, wide } = useLayout();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SafeAreaView style={s.root}>
      <View style={[s.topBar, mobile && s.topBarMobile]}>
        <Brand large={!mobile} />
        <View style={s.topActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={({ pressed }) => [s.topLink, pressed && s.pressed]}
          >
            <Text style={s.topLinkText}>Entrar</Text>
          </Pressable>
          {!mobile && (
            <Cta title="Criar conta grátis" onPress={onSignUp} small />
          )}
        </View>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Hero: dor → promessa → ação, com o produto à vista. */}
        <View style={[s.wrap, s.hero, !mobile && s.heroDesktop]}>
          <View style={[s.heroCopy, !mobile && s.heroCopyDesktop]}>
            <Text style={s.eyebrow}>PARA QUEM ESTUDA PARA CONCURSO</Text>
            <Text style={[s.h1, mobile && s.h1Mobile, wide && s.h1Wide]}>
              Seu edital tem 12 matérias. Hoje você estuda qual?
            </Text>
            <Text style={[s.lead, mobile && s.leadMobile]}>
              O Meu Edital monta um ciclo de estudos pelos pesos do edital e
              mostra o próximo bloco. Faltou um dia? Você continua de onde
              parou.
            </Text>
            <View style={[s.ctaRow, mobile && s.ctaRowMobile]}>
              <Cta
                title="Montar meu ciclo grátis  →"
                onPress={onSignUp}
                full={mobile}
              />
              {!mobile && (
                <Cta title="Já tenho conta" onPress={onSignIn} secondary />
              )}
            </View>
            <Trust />
          </View>
          <View style={[s.heroVisual, !mobile && s.heroVisualDesktop]}>
            <ProductPreview />
          </View>
        </View>

        <View style={[s.wrap, s.block]}>
          <Text style={[s.h2, mobile && s.h2Mobile]}>
            Por que o cronograma não aguenta o mês
          </Text>
          <View style={[s.grid, mobile && s.gridMobile]}>
            {pains.map((item) => (
              <View key={item.title} style={[s.card, !mobile && s.cardThird]}>
                <Text style={s.painMark}>×</Text>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.wrap, s.block]}>
          <Text style={s.eyebrow}>COMO FUNCIONA</Text>
          <Text style={[s.h2, mobile && s.h2Mobile]}>
            Do edital ao primeiro bloco em 3 passos
          </Text>
          <View style={[s.grid, mobile && s.gridMobile]}>
            {steps.map((item, index) => (
              <View key={item.title} style={[s.step, !mobile && s.cardThird]}>
                <Text style={s.stepNumber}>{index + 1}</Text>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.wrap, s.block]}>
          <Text style={[s.h2, mobile && s.h2Mobile]}>
            Você estuda. O app faz as contas.
          </Text>
          <View style={[s.grid, mobile && s.gridMobile]}>
            {features.map((item) => (
              <View
                key={item.title}
                style={[
                  s.feature,
                  { backgroundColor: palette[item.tone] },
                  !mobile && s.cardThird,
                ]}
              >
                <Text style={s.featureTitle}>{item.title}</Text>
                <Text style={s.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>
          <View style={s.inlineCta}>
            <Cta title="Quero meu ciclo  →" onPress={onSignUp} full={mobile} />
          </View>
        </View>

        <View style={[s.wrap, s.block, !mobile && s.faqDesktop]}>
          <View style={!mobile && s.faqIntro}>
            <Text style={[s.h2, mobile && s.h2Mobile]}>Perguntas rápidas</Text>
            {!mobile && (
              <Text style={s.cardText}>
                Não achou sua dúvida? Crie a conta e veja por dentro. Leva menos
                tempo que ler um artigo da lei seca.
              </Text>
            )}
          </View>
          <View style={s.faqList}>
            {faq.map((item, index) => (
              <Pressable
                key={item.q}
                accessibilityRole="button"
                accessibilityState={{ expanded: open === index }}
                onPress={() => setOpen(open === index ? null : index)}
                style={s.faqItem}
              >
                <View style={s.faqHead}>
                  <Text style={s.faqQ}>{item.q}</Text>
                  <Text style={s.faqToggle}>{open === index ? "−" : "+"}</Text>
                </View>
                {open === index && <Text style={s.faqA}>{item.a}</Text>}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[s.wrap, s.block]}>
          <View style={[s.final, mobile && s.finalMobile]}>
            <Text style={[s.finalTitle, mobile && s.h2Mobile]}>
              Seu próximo bloco de estudo está a 3 passos.
            </Text>
            <Text style={s.finalText}>
              Pare de refazer cronograma. Comece a estudar o que pesa.
            </Text>
            <View style={s.inlineCta}>
              <Cta
                title="Montar meu ciclo grátis  →"
                onPress={onSignUp}
                light
                full={mobile}
              />
            </View>
            <Text style={s.finalTrust}>Grátis · sem senha · sem cartão</Text>
          </View>
        </View>

        <View style={[s.wrap, s.footer]}>
          <Brand />
          <Text style={s.footerText}>
            Software livre (GPL-3.0). Seus dados são só seus.
          </Text>
        </View>
      </ScrollView>
      {mobile && (
        <View style={s.stickyBar}>
          <Cta title="Montar meu ciclo grátis  →" onPress={onSignUp} full />
        </View>
      )}
    </SafeAreaView>
  );
}

/** Frases que tiram o risco do clique, logo abaixo do botão. */
function Trust() {
  return (
    <View style={s.trust}>
      {[
        "Grátis, sem cartão",
        "Entra com código, sem senha",
        "Celular e navegador",
      ].map((item) => (
        <Text key={item} style={s.trustItem}>
          <Text style={s.trustCheck}>✓ </Text>
          {item}
        </Text>
      ))}
    </View>
  );
}

function Cta({
  title,
  onPress,
  secondary = false,
  light = false,
  small = false,
  full = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  light?: boolean;
  small?: boolean;
  full?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        s.cta,
        small && s.ctaSmall,
        full && s.ctaFull,
        secondary && s.ctaSecondary,
        light && s.ctaLight,
        hovered && s.ctaHover,
        pressed && s.pressed,
      ]}
    >
      <Text
        style={[
          s.ctaText,
          small && s.ctaTextSmall,
          (secondary || light) && s.ctaTextDark,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  scroll: { paddingBottom: 40 },
  wrap: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  topBar: {
    width: "100%",
    maxWidth: 1160,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topBarMobile: { paddingVertical: 10 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  topLink: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  topLinkText: { color: palette.text, fontSize: 14, fontWeight: "700" },

  hero: { paddingTop: 22, paddingBottom: 36, gap: 34 },
  heroDesktop: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 70,
    gap: 48,
  },
  heroCopy: {},
  heroCopyDesktop: { flex: 1.1 },
  heroVisual: {},
  heroVisualDesktop: { flex: 1 },
  eyebrow: {
    color: "#8573CE",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  h1: {
    color: palette.text,
    fontSize: 48,
    lineHeight: 54,
    fontWeight: "800",
    letterSpacing: -2.2,
  },
  h1Wide: { fontSize: 58, lineHeight: 64 },
  h1Mobile: { fontSize: 36, lineHeight: 41, letterSpacing: -1.6 },
  lead: {
    color: palette.muted,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 18,
    maxWidth: 520,
  },
  leadMobile: { fontSize: 16, lineHeight: 24 },
  ctaRow: { flexDirection: "row", gap: 10, marginTop: 28, flexWrap: "wrap" },
  ctaRowMobile: { marginTop: 22, flexDirection: "column" },
  trust: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 16 },
  trustItem: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  trustCheck: { color: "#4E9A72", fontWeight: "900" },

  cta: {
    backgroundColor: palette.dark,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  ctaSmall: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 13 },
  ctaFull: { alignSelf: "stretch" },
  ctaSecondary: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
  },
  ctaLight: { backgroundColor: palette.lavender },
  ctaHover: { transform: [{ translateY: -1 }], opacity: 0.92 },
  ctaText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  ctaTextSmall: { fontSize: 13 },
  ctaTextDark: { color: palette.dark },
  pressed: { opacity: 0.7 },

  block: { paddingVertical: 34 },
  h2: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginBottom: 22,
    maxWidth: 640,
  },
  h2Mobile: { fontSize: 26, lineHeight: 31, letterSpacing: -1 },
  grid: { flexDirection: "row", gap: 14 },
  gridMobile: { flexDirection: "column", gap: 10 },
  cardThird: { flex: 1 },
  card: {
    backgroundColor: palette.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EFF0ED",
    padding: 20,
  },
  painMark: {
    color: palette.danger,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  cardText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  step: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: palette.dark,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "800",
    marginBottom: 14,
    overflow: "hidden",
  },
  feature: { borderRadius: 22, padding: 22 },
  featureTitle: {
    color: palette.dark,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  featureText: {
    color: "#3A424C",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  inlineCta: { marginTop: 24 },

  faqDesktop: { flexDirection: "row", gap: 48 },
  faqIntro: { flex: 0.8 },
  faqList: { flex: 1.2, gap: 8 },
  faqItem: {
    backgroundColor: palette.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EFF0ED",
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  faqHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  faqQ: { color: palette.text, fontSize: 15, fontWeight: "700", flex: 1 },
  faqToggle: { color: palette.muted, fontSize: 20, fontWeight: "600" },
  faqA: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },

  final: {
    backgroundColor: palette.dark,
    borderRadius: 30,
    padding: 44,
    alignItems: "center",
  },
  finalMobile: { padding: 26, alignItems: "stretch" },
  finalTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1.3,
    textAlign: "center",
    maxWidth: 620,
  },
  finalText: {
    color: "#AEB4BB",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    textAlign: "center",
  },
  finalTrust: {
    color: "#AEB4BB",
    fontSize: 12,
    marginTop: 14,
    textAlign: "center",
  },
  footer: {
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  footerText: { color: palette.muted, fontSize: 12 },
  stickyBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: palette.bg,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
});
