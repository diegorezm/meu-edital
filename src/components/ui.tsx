import React from "react";
import { Link, usePathname } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/data/store";

export const palette = {
  bg: "#101918",
  panel: "#172321",
  line: "#30403c",
  text: "#f1f5ee",
  muted: "#a7b5ae",
  accent: "#b9e86d",
  dark: "#17221a",
  danger: "#f5a599",
};
const links = [
  ["/", "Visão geral"],
  ["/concursos", "Concursos"],
  ["/plano", "Semana"],
  ["/revisoes", "Revisões"],
  ["/ciclo", "Ciclo"],
  ["/ia", "Importar com IA"],
] as const;
export function Page({
  title,
  eyebrow,
  children,
  action,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
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
            <Text style={s.logo}>
              meu<Text style={{ color: palette.accent }}>edital</Text>
              <Text style={s.logoDot}>.</Text>
            </Text>
            <Text style={s.tagline}>Seu estudo, em ordem.</Text>
            <View style={s.nav}>
              {links.map(([href, label]) => (
                <Link key={href} href={href} asChild>
                  <Pressable
                    style={StyleSheet.flatten([
                      s.navItem,
                      path === href ? s.navActive : undefined,
                    ])}
                  >
                    <Text style={[s.navText, path === href && s.navTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
            <View style={s.sidebarBottom}>
              <Text style={s.miniLabel}>CONCURSO ATIVO</Text>
              <Text style={s.sidebarExam}>
                {exam?.name || "Nenhum concurso"}
              </Text>
            </View>
          </View>
        )}
        <View style={s.main}>
          <ScrollView
            contentContainerStyle={[
              s.scroll,
              mobile && { paddingHorizontal: 20, paddingTop: 20 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {mobile && (
              <View style={s.mobileTop}>
                <Text style={s.logo}>
                  meu<Text style={{ color: palette.accent }}>edital</Text>
                  <Text style={s.logoDot}>.</Text>
                </Text>
                <Text style={s.mobileExam}>{exam?.name}</Text>
              </View>
            )}
            {eyebrow && <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>}
            <View style={s.header}>
              <Text style={[s.title, mobile && { fontSize: 29 }]}>{title}</Text>
              {action}
            </View>
            {error && <Text style={s.error}>{error}</Text>}
            {!data ? (
              <Text style={s.muted}>Carregando seus estudos...</Text>
            ) : (
              children
            )}
          </ScrollView>
          {mobile && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.bottomNav}
              contentContainerStyle={s.bottomNavInner}
            >
              {links.map(([href, label]) => (
                <Link key={href} href={href} asChild>
                  <Pressable
                    style={StyleSheet.flatten([
                      s.mobileNavItem,
                      path === href ? s.mobileNavActive : undefined,
                    ])}
                  >
                    <Text
                      style={[
                        s.mobileNavText,
                        path === href && s.mobileNavTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.buttonSecondary,
        danger && s.buttonDanger,
        (pressed || disabled) && { opacity: 0.65 },
      ]}
    >
      <Text style={[s.buttonText, secondary && s.buttonSecondaryText]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "numeric" | "default";
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#73827b"
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          s.input,
          multiline && { minHeight: 110, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function SelectRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.chips}>
        {options.map((o) => (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[s.chip, value === o.value && s.chipActive]}
          >
            <Text style={[s.chipText, value === o.value && s.chipTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
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
export function Empty({ text }: { text: string }) {
  return <Text style={s.empty}>{text}</Text>;
}
export function InlineLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href as never} style={s.inlineLink}>
      {label} →
    </Link>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  frame: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
  },
  mobileFrame: { flexDirection: "column" },
  sidebar: {
    width: 245,
    padding: 28,
    borderRightWidth: 1,
    borderRightColor: palette.line,
  },
  logo: {
    color: palette.text,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  logoDot: { color: palette.accent },
  tagline: { color: palette.muted, marginTop: 4, fontSize: 12 },
  nav: { marginTop: 62, gap: 6 },
  navItem: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  navActive: { backgroundColor: "#263a31" },
  navText: { color: palette.muted, fontSize: 14, fontWeight: "600" },
  navTextActive: { color: palette.accent },
  sidebarBottom: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderColor: palette.line,
    paddingTop: 20,
  },
  miniLabel: {
    color: palette.muted,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  sidebarExam: { color: palette.text, fontWeight: "700", marginTop: 8 },
  main: { flex: 1 },
  scroll: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 42,
    paddingBottom: 100,
  },
  mobileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 36,
  },
  mobileExam: { color: palette.muted, fontSize: 12 },
  eyebrow: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  title: {
    color: palette.text,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.4,
  },
  section: { marginBottom: 34 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { color: palette.text, fontSize: 17, fontWeight: "700" },
  muted: { color: palette.muted, fontSize: 13 },
  error: { color: palette.danger, marginBottom: 18 },
  empty: { color: palette.muted, paddingVertical: 18 },
  button: {
    backgroundColor: palette.accent,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 17,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  buttonText: { color: palette.dark, fontSize: 13, fontWeight: "800" },
  buttonSecondary: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
  },
  buttonSecondaryText: { color: palette.text },
  buttonDanger: { backgroundColor: palette.danger },
  field: { marginBottom: 16 },
  label: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panel,
    color: palette.text,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    minWidth: 180,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  chipActive: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipText: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: palette.dark },
  inlineLink: { color: palette.accent, fontWeight: "700", fontSize: 13 },
  bottomNav: {
    maxHeight: 63,
    borderTopWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.bg,
  },
  bottomNavInner: { alignItems: "center", paddingHorizontal: 10, gap: 3 },
  mobileNavItem: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mobileNavActive: { backgroundColor: "#263a31" },
  mobileNavText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  mobileNavTextActive: { color: palette.accent },
});
