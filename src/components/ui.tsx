import React from "react";
import { Link, usePathname } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/data/store";

export const palette = {
  bg: "#F7F7F2",
  panel: "#FFFFFF",
  line: "#E7E9E4",
  text: "#202731",
  muted: "#747D83",
  accent: "#88A9F1",
  dark: "#202731",
  danger: "#B96A66",
  blue: "#A9C3FC",
  lavender: "#DCD3FF",
  peach: "#FFD3A0",
  mint: "#C8EBD7",
};

const links = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/plano", label: "Semana", icon: "▦" },
  { href: "/estudar", label: "Estudar", icon: "▷" },
  { href: "/revisoes", label: "Revisões", icon: "↻" },
  { href: "/concursos", label: "Editais", icon: "▤" },
  { href: "/ciclo", label: "Ciclo", icon: "◌" },
  { href: "/ia", label: "IA", icon: "✦" },
] as const;

export function Page({ title, eyebrow, children, action }: {
  title: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  const path = usePathname();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { data, error } = useStore();
  const exam = data?.exams.find((e) => e.id === data.activeExamId);
  return (
    <SafeAreaView style={s.root}>
      <View style={[s.frame, mobile && s.mobileFrame]}>
        {!mobile && (
          <View style={s.sidebar}>
            <View style={s.brandRow}>
              <View style={s.brandMark}><Text style={s.brandMarkText}>m.</Text></View>
              <Text style={s.logo}>meu edital<Text style={s.logoDot}>.</Text></Text>
            </View>
            <Text style={s.tagline}>Seu estudo no seu tempo ☁</Text>
            <View style={s.nav}>
              {links.map(({ href, label, icon }) => (
                <Link key={href} href={href} asChild>
                  <Pressable style={[s.navItem, path === href && s.navActive]}>
                    <Text style={[s.navIcon, path === href && s.navTextActive]}>{icon}</Text>
                    <Text style={[s.navText, path === href && s.navTextActive]}>{label}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
            <View style={s.sidebarBottom}>
              <Text style={s.miniLabel}>SEU OBJETIVO</Text>
              <Text style={s.sidebarExam}>{exam?.name || "Seu próximo edital"}</Text>
              <Text style={s.sidebarHint}>Um pouquinho a cada dia ✨</Text>
            </View>
          </View>
        )}
        <View style={s.main}>
          <ScrollView style={s.contentScroll} contentContainerStyle={[s.scroll, mobile && s.mobileScroll]} keyboardShouldPersistTaps="handled">
            {mobile && (
              <View style={s.mobileTop}>
                <View style={s.brandRow}>
                  <View style={s.brandMark}><Text style={s.brandMarkText}>m.</Text></View>
                  <Text style={s.logo}>meu edital<Text style={s.logoDot}>.</Text></Text>
                </View>
                <Link href="/concursos" asChild>
                  <Pressable accessibilityLabel="Ver concursos" style={s.profileButton}>
                    <Text style={s.profileText}>{exam?.name?.slice(0, 1) || "M"}</Text>
                  </Pressable>
                </Link>
              </View>
            )}
            {eyebrow && <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>}
            <View style={s.header}>
              <Text style={[s.title, mobile && s.mobileTitle]}>{title}</Text>
              {action}
            </View>
            {error && <Text style={s.error}>{error}</Text>}
            {!data ? <Text style={s.muted}>Preparando seu espaço de estudos...</Text> : children}
          </ScrollView>
          {mobile && (
            <View style={s.bottomNavWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bottomNav}>
                {links.map(({ href, label, icon }) => (
                  <Link key={href} href={href} asChild>
                    <Pressable accessibilityLabel={label} style={[s.mobileNavItem, path === href && s.mobileNavActive]}>
                      <Text style={[s.mobileNavIcon, path === href && s.mobileNavIconActive]}>{icon}</Text>
                      <Text style={[s.mobileNavText, path === href && s.mobileNavTextActive]}>{label}</Text>
                    </Pressable>
                  </Link>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

export function Button({ title, onPress, secondary = false, danger = false, disabled = false }: {
  title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.button, secondary && s.buttonSecondary, danger && s.buttonDanger, (pressed || disabled) && s.pressed]}>
      <Text style={[s.buttonText, secondary && s.buttonSecondaryText]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string;
  multiline?: boolean; keyboardType?: "numeric" | "default";
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={palette.muted} multiline={multiline} keyboardType={keyboardType}
        style={[s.input, multiline && s.multiline]} />
    </View>
  );
}

export function SelectRow<T extends string | number>({ label, options, value, onChange }: {
  label: string; options: { label: string; value: T }[]; value: T; onChange: (value: T) => void;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.chips}>
        {options.map((o) => (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[s.chip, value === o.value && s.chipActive]}>
            <Text style={[s.chipText, value === o.value && s.chipTextActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
        {aside && <Text style={s.muted}>{aside}</Text>}
      </View>
      {children}
    </View>
  );
}
export function Empty({ text }: { text: string }) { return <Text style={s.empty}>{text}</Text>; }
export function InlineLink({ href, label }: { href: string; label: string }) {
  return <Link href={href as never} style={s.inlineLink}>{label} →</Link>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  frame: { flex: 1, flexDirection: "row", width: "100%", maxWidth: 1500, alignSelf: "center" },
  mobileFrame: { flexDirection: "column" },
  sidebar: { width: 252, padding: 26, backgroundColor: "#FFFFFF", borderRightWidth: 1, borderRightColor: palette.line },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 36, height: 36, borderRadius: 13, backgroundColor: palette.lavender, alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: palette.dark, fontSize: 18, fontWeight: "900", letterSpacing: -1.5 },
  logo: { color: palette.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.9 },
  logoDot: { color: "#8B75DB" },
  tagline: { color: palette.muted, marginTop: 10, fontSize: 12 },
  nav: { marginTop: 54, gap: 7 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 15 },
  navActive: { backgroundColor: "#EDE9FF" },
  navIcon: { color: palette.muted, fontSize: 21, width: 23, textAlign: "center" },
  navText: { color: palette.muted, fontSize: 14, fontWeight: "600" },
  navTextActive: { color: palette.dark },
  sidebarBottom: { marginTop: "auto", backgroundColor: "#E7F1FF", borderRadius: 20, padding: 17 },
  miniLabel: { color: "#657BAD", fontSize: 10, letterSpacing: 1.3, fontWeight: "800" },
  sidebarExam: { color: palette.text, fontWeight: "800", marginTop: 8, fontSize: 15 },
  sidebarHint: { color: palette.muted, marginTop: 5, fontSize: 11 },
  main: { flex: 1, minWidth: 0 },
  contentScroll: { flex: 1 },
  scroll: { width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: 34, paddingTop: 42, paddingBottom: 80 },
  mobileScroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  mobileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 34 },
  profileButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.peach, alignItems: "center", justifyContent: "center" },
  profileText: { color: palette.dark, fontSize: 15, fontWeight: "800" },
  eyebrow: { color: "#8573CE", fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 9 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 13, marginBottom: 24 },
  title: { color: palette.text, fontSize: 36, lineHeight: 42, fontWeight: "800", letterSpacing: -1.5 },
  mobileTitle: { fontSize: 30, lineHeight: 36, maxWidth: 330 },
  section: { backgroundColor: palette.panel, borderRadius: 24, padding: 21, marginBottom: 18, borderWidth: 1, borderColor: "#EFF0ED" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 15 },
  sectionTitle: { color: palette.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.4, flexShrink: 1 },
  muted: { color: palette.muted, fontSize: 12 },
  error: { color: palette.danger, marginBottom: 18 },
  empty: { color: palette.muted, paddingVertical: 13, lineHeight: 20 },
  button: { backgroundColor: palette.dark, borderRadius: 15, paddingVertical: 12, paddingHorizontal: 18, alignItems: "center", alignSelf: "flex-start", minHeight: 43, justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  buttonSecondary: { backgroundColor: "#F4F5F3", borderWidth: 1, borderColor: palette.line },
  buttonSecondaryText: { color: palette.text },
  buttonDanger: { backgroundColor: palette.danger },
  pressed: { opacity: 0.65 },
  field: { marginBottom: 18 },
  label: { color: palette.text, fontSize: 12, fontWeight: "700", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: palette.line, backgroundColor: "#F9FAF8", color: palette.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, minWidth: 180 },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: palette.line, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 13, backgroundColor: "#F9FAF8" },
  chipActive: { backgroundColor: palette.lavender, borderColor: palette.lavender },
  chipText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: palette.dark },
  inlineLink: { color: "#6D5BB8", fontWeight: "800", fontSize: 13 },
  bottomNavWrap: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 5, backgroundColor: palette.bg },
  bottomNav: { backgroundColor: palette.dark, borderRadius: 24, alignItems: "center", paddingHorizontal: 7, paddingVertical: 6, gap: 1, flexGrow: 1, justifyContent: "space-around" },
  mobileNavItem: { minWidth: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, paddingVertical: 4, borderRadius: 17 },
  mobileNavActive: { backgroundColor: "#FFFFFF" },
  mobileNavIcon: { color: "#FFFFFF", fontSize: 19, lineHeight: 22 },
  mobileNavIconActive: { color: palette.dark },
  mobileNavText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700", marginTop: 2 },
  mobileNavTextActive: { color: palette.dark },
});
