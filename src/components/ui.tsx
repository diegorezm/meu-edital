import React, { useEffect, useRef, useState } from "react";
import { Href, Link, router, usePathname } from "expo-router";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { data, update } = useStore();
  const exam = data?.exams.find((e) => e.id === data.activeExamId);
  const examSheet = useRef<BottomSheetHandle>(null);
  const [examQuery, setExamQuery] = useState("");
  const [visibleExams, setVisibleExams] = useState(20);
  const filteredExams = (data?.exams || [])
    .filter((item) =>
      item.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(
          examQuery
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        ),
    )
    .sort((a, b) =>
      a.id === data?.activeExamId
        ? -1
        : b.id === data?.activeExamId
          ? 1
          : a.name.localeCompare(b.name, "pt-BR"),
    );
  const openExamSelector = () => {
    setExamQuery("");
    setVisibleExams(20);
    examSheet.current?.open();
  };
  const selectExam = (id: string) => {
    if (id === data?.activeExamId) {
      examSheet.current?.close();
      return;
    }
    examSheet.current?.close(() => {
      update((current) => ({ ...current, activeExamId: id })).then(() => {
        if (path === "/estudar") router.replace("/");
      });
    });
  };
  return (
    <SafeAreaView style={s.root}>
      <View style={[s.frame, mobile && s.mobileFrame]}>
        {!mobile && (
          <View style={s.sidebar}>
            <View style={s.brandRow}>
              <View style={s.brandMark}>
                <Text style={s.brandMarkText}>m.</Text>
              </View>
              <Text style={s.logo}>
                meu edital<Text style={s.logoDot}>.</Text>
              </Text>
            </View>
            <Text style={s.tagline}>Seu estudo no seu tempo ☁</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Trocar concurso. Atual: ${exam?.name || "nenhum"}`}
              onPress={openExamSelector}
              style={s.desktopExamSelector}
            >
              <View style={s.examSelectorText}>
                <Text style={s.examSelectorCaption}>CONCURSO ATIVO</Text>
                <Text style={s.examSelectorName} numberOfLines={1}>
                  {exam?.name || "Escolher concurso"}
                </Text>
              </View>
              <Text style={s.examSelectorArrow}>⌄</Text>
            </Pressable>
            <View style={s.nav}>
              {links.map(({ href, label, icon }) => (
                <Link key={href} href={href} asChild>
                  <Pressable
                    style={StyleSheet.flatten([
                      s.navItem,
                      path === href && s.navActive,
                    ])}
                  >
                    <Text style={[s.navIcon, path === href && s.navTextActive]}>
                      {icon}
                    </Text>
                    <Text style={[s.navText, path === href && s.navTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        )}
        <View style={s.main}>
          {mobile && (
            <View style={s.mobileTop}>
              <View style={s.brandRow}>
                <View style={s.brandMark}>
                  <Text style={s.brandMarkText}>m.</Text>
                </View>
                <Text style={s.logo}>
                  meu edital<Text style={s.logoDot}>.</Text>
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Trocar concurso. Atual: ${exam?.name || "nenhum"}`}
                onPress={openExamSelector}
                style={s.mobileExamSelector}
              >
                <Text style={s.mobileExamName} numberOfLines={1}>
                  {exam?.name || "Concurso"}
                </Text>
                <Text style={s.mobileExamArrow}>⌄</Text>
              </Pressable>
            </View>
          )}
          <View style={s.contentArea}>{children}</View>
          {mobile && (
            <View style={s.bottomNavWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.bottomNav}
              >
                {links.map(({ href, label, icon }) => (
                  <Link key={href} href={href} asChild>
                    <Pressable
                      accessibilityLabel={label}
                      style={StyleSheet.flatten([
                        s.mobileNavItem,
                        path === href && s.mobileNavActive,
                      ])}
                    >
                      <Text
                        style={[
                          s.mobileNavIcon,
                          path === href && s.mobileNavIconActive,
                        ]}
                      >
                        {icon}
                      </Text>
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
            </View>
          )}
        </View>
      </View>
      <BottomSheet ref={examSheet} title="Trocar concurso">
        <Text style={s.examSheetIntro}>
          Escolha o edital em que você quer focar agora.
        </Text>
        {(data?.exams.length || 0) > 6 && (
          <TextInput
            value={examQuery}
            onChangeText={(value) => {
              setExamQuery(value);
              setVisibleExams(20);
            }}
            placeholder="Buscar concurso"
            placeholderTextColor={palette.muted}
            accessibilityLabel="Buscar concurso"
            style={s.examSearch}
          />
        )}
        {filteredExams.slice(0, visibleExams).map((item) => {
          const active = item.id === data?.activeExamId;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => selectExam(item.id)}
              style={[s.examOption, active && s.examOptionActive]}
            >
              <View
                style={[s.examOptionIcon, active && s.examOptionIconActive]}
              >
                <Text style={s.examOptionInitial}>
                  {item.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={s.examOptionText}>
                <Text style={s.examOptionName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={s.examOptionRole} numberOfLines={1}>
                  {item.role}
                </Text>
              </View>
              <Text style={s.examOptionCheck}>{active ? "✓" : "›"}</Text>
            </Pressable>
          );
        })}
        {!filteredExams.length && (
          <Text style={s.examEmpty}>
            {data?.exams.length
              ? "Nenhum concurso encontrado."
              : "Você ainda não cadastrou um concurso."}
          </Text>
        )}
        {filteredExams.length > visibleExams && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisibleExams((count) => count + 20)}
            style={s.examMore}
          >
            <Text style={s.examMoreText}>Mostrar mais concursos</Text>
          </Pressable>
        )}
        <View style={s.examManage}>
          <Button
            title="Gerenciar editais  →"
            secondary
            onPress={() =>
              examSheet.current?.close(() => router.push("/concursos"))
            }
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

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
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { data, error } = useStore();
  return (
    <ScrollView
      style={s.contentScroll}
      contentContainerStyle={[s.scroll, mobile && s.mobileScroll]}
      keyboardShouldPersistTaps="handled"
    >
      {eyebrow && <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>}
      <View style={s.header}>
        <Text style={[s.title, mobile && s.mobileTitle]}>{title}</Text>
        {action}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      {!data ? (
        <Text style={s.muted}>Preparando seu espaço de estudos...</Text>
      ) : (
        children
      )}
    </ScrollView>
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
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.buttonSecondary,
        danger && s.buttonDanger,
        (pressed || disabled) && s.pressed,
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
        placeholderTextColor={palette.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[s.input, multiline && s.multiline]}
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
export type BottomSheetHandle = {
  open: () => void;
  close: (afterClose?: () => void) => void;
};

export const BottomSheet = React.forwardRef<
  BottomSheetHandle,
  { title: string; children: React.ReactNode; contentKey?: string }
>(function BottomSheet({ title, children, contentKey }, ref) {
  const [visible, setVisible] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [slideY] = useState(() => new Animated.Value(height));
  const closing = useRef(false);
  useEffect(() => {
    if (!visible) return;
    Animated.timing(slideY, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
    return () => slideY.stopAnimation();
  }, [visible, slideY]);
  const open = () => {
    slideY.setValue(height);
    setVisible(true);
  };
  const close = (afterClose?: () => void) => {
    if (closing.current || !visible) return;
    closing.current = true;
    Animated.timing(slideY, {
      toValue: height,
      duration: 210,
      useNativeDriver: true,
    }).start(({ finished }) => {
      closing.current = false;
      if (finished) {
        setVisible(false);
        afterClose?.();
      }
    });
  };
  React.useImperativeHandle(ref, () => ({ open, close }));
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => close()}
    >
      <View style={s.drawerOverlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar painel"
          onPress={() => close()}
          style={s.drawerBackdrop}
        />
        <Animated.View
          style={[
            s.drawerPanel,
            {
              maxHeight: height * 0.82,
              paddingBottom: Math.max(insets.bottom, 18),
              transform: [{ translateY: slideY }],
            },
          ]}
        >
          <View style={s.drawerHandle} />
          <View style={s.drawerHeading}>
            <Text style={s.drawerTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar painel"
              onPress={() => close()}
              style={s.drawerClose}
            >
              <Text style={s.drawerCloseText}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            key={contentKey}
            style={s.drawerScroll}
            contentContainerStyle={s.drawerContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
});

export function BottomDrawer({
  title,
  summary,
  action,
  children,
}: {
  title: string;
  summary?: string;
  action?: { label: string; href: Href };
  children: React.ReactNode;
}) {
  const sheet = useRef<BottomSheetHandle>(null);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${title}`}
        onPress={() => sheet.current?.open()}
        style={({ pressed }) => [s.drawerTrigger, pressed && s.pressed]}
      >
        <View style={s.drawerTriggerLabel}>
          <Text style={s.drawerTriggerTitle}>{title}</Text>
          {summary && <Text style={s.drawerTriggerSummary}>{summary}</Text>}
        </View>
        <Text style={s.drawerTriggerArrow}>›</Text>
      </Pressable>
      <BottomSheet ref={sheet} title={title}>
        {children}
        {action && (
          <View style={s.drawerAction}>
            <Button
              title={action.label}
              onPress={() =>
                sheet.current?.close(() => router.push(action.href))
              }
            />
          </View>
        )}
      </BottomSheet>
    </>
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
    width: 252,
    padding: 26,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: palette.line,
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
  tagline: { color: palette.muted, marginTop: 10, fontSize: 12 },
  desktopExamSelector: {
    marginTop: 28,
    backgroundColor: "#E7F1FF",
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },
  examSelectorText: { flex: 1, minWidth: 0 },
  examSelectorCaption: {
    color: "#657BAD",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  examSelectorName: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },
  examSelectorArrow: { color: palette.text, fontSize: 22, marginLeft: 8 },
  nav: { marginTop: 32, gap: 7 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  navActive: { backgroundColor: "#EDE9FF" },
  navIcon: {
    color: palette.muted,
    fontSize: 21,
    width: 23,
    textAlign: "center",
  },
  navText: { color: palette.muted, fontSize: 14, fontWeight: "600" },
  navTextActive: { color: palette.dark },
  main: { flex: 1, minWidth: 0 },
  contentArea: { flex: 1, minHeight: 0 },
  contentScroll: { flex: 1 },
  scroll: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 34,
    paddingTop: 42,
    paddingBottom: 80,
  },
  mobileScroll: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 32 },
  mobileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 17,
  },
  mobileExamSelector: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 75,
    maxWidth: 155,
    minHeight: 37,
    borderRadius: 19,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
    paddingLeft: 12,
    paddingRight: 9,
  },
  mobileExamName: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "800",
    flexShrink: 1,
  },
  mobileExamArrow: { color: palette.text, fontSize: 17, marginLeft: 6 },
  examSheetIntro: { color: palette.muted, fontSize: 13, marginBottom: 18 },
  examSearch: {
    backgroundColor: "#F7F7F2",
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 11,
    fontSize: 14,
    color: palette.text,
    marginBottom: 14,
  },
  examOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F2",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 17,
    minHeight: 67,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  examOptionActive: { backgroundColor: "#EDE9FF", borderColor: "#CBBDF5" },
  examOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#DDE7FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  examOptionIconActive: { backgroundColor: "#D6CAFC" },
  examOptionInitial: { color: palette.text, fontSize: 14, fontWeight: "800" },
  examOptionText: { flex: 1, minWidth: 0 },
  examOptionName: { color: palette.text, fontSize: 13, fontWeight: "800" },
  examOptionRole: { color: palette.muted, fontSize: 11, marginTop: 3 },
  examOptionCheck: { color: palette.text, fontSize: 21, marginLeft: 9 },
  examEmpty: {
    color: palette.muted,
    fontSize: 13,
    textAlign: "center",
    padding: 22,
  },
  examMore: { alignItems: "center", padding: 12 },
  examMoreText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  examManage: { marginTop: 14, marginBottom: 4 },
  eyebrow: {
    color: "#8573CE",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 9,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 13,
    marginBottom: 24,
  },
  title: {
    color: palette.text,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  mobileTitle: { fontSize: 30, lineHeight: 36, maxWidth: 330 },
  section: {
    backgroundColor: palette.panel,
    borderRadius: 24,
    padding: 21,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EFF0ED",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  drawerTrigger: {
    backgroundColor: palette.panel,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 10,
    minHeight: 68,
    paddingHorizontal: 19,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  drawerTriggerLabel: { flex: 1, minWidth: 0 },
  drawerTriggerTitle: { color: palette.text, fontSize: 15, fontWeight: "800" },
  drawerTriggerSummary: { color: palette.muted, fontSize: 12, marginTop: 4 },
  drawerTriggerArrow: { color: palette.muted, fontSize: 25, lineHeight: 25 },
  drawerOverlay: { flex: 1, justifyContent: "flex-end" },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(25, 30, 42, 0.42)",
  },
  drawerPanel: {
    width: "100%",
    maxWidth: 660,
    alignSelf: "center",
    backgroundColor: palette.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 9,
    paddingHorizontal: 22,
  },
  drawerHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.line,
    alignSelf: "center",
    marginBottom: 14,
  },
  drawerHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  drawerTitle: { color: palette.text, fontSize: 21, fontWeight: "800" },
  drawerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F2F0",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerCloseText: { color: palette.text, fontSize: 24, lineHeight: 27 },
  drawerScroll: { flexShrink: 1 },
  drawerContent: { paddingBottom: 4 },
  drawerAction: { marginTop: 20 },
  muted: { color: palette.muted, fontSize: 12 },
  error: { color: palette.danger, marginBottom: 18 },
  empty: { color: palette.muted, paddingVertical: 13, lineHeight: 20 },
  button: {
    backgroundColor: palette.dark,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    alignSelf: "flex-start",
    minHeight: 43,
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  buttonSecondary: {
    backgroundColor: "#F4F5F3",
    borderWidth: 1,
    borderColor: palette.line,
  },
  buttonSecondaryText: { color: palette.text },
  buttonDanger: { backgroundColor: palette.danger },
  pressed: { opacity: 0.65 },
  field: { marginBottom: 18 },
  label: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#F9FAF8",
    color: palette.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    minWidth: 180,
  },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: "#F9FAF8",
  },
  chipActive: {
    backgroundColor: palette.lavender,
    borderColor: palette.lavender,
  },
  chipText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: palette.dark },
  inlineLink: { color: "#6D5BB8", fontWeight: "800", fontSize: 13 },
  bottomNavWrap: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
    backgroundColor: palette.bg,
  },
  bottomNav: {
    backgroundColor: palette.dark,
    borderRadius: 24,
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 6,
    gap: 1,
    flexGrow: 1,
    justifyContent: "space-around",
  },
  mobileNavItem: {
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 17,
  },
  mobileNavActive: { backgroundColor: "#FFFFFF" },
  mobileNavIcon: { color: "#FFFFFF", fontSize: 19, lineHeight: 22 },
  mobileNavIconActive: { color: palette.dark },
  mobileNavText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
  mobileNavTextActive: { color: palette.dark },
});
