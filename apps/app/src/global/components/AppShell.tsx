import React, { useRef, useState } from "react";
import { Link, router, usePathname } from "expo-router";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "@global/constants/colors";
import { useAuth } from "@global/store/auth";
import { useStore } from "@global/store/store";
import { normalizeText } from "@global/utils/normalizeText";
import { Brand } from "./Brand";
import { BottomSheet, BottomSheetHandle, Button, useLayout } from "./ui";

type NavLink = { href: "/" | `/${string}`; label: string; icon: string };

/** Navegação do desktop: todas as páginas à vista, agrupadas. */
const desktopGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "Estudo",
    links: [
      { href: "/", label: "Início", icon: "⌂" },
      { href: "/ciclo", label: "Ciclo", icon: "◌" },
      { href: "/estudar", label: "Estudar", icon: "▷" },
      { href: "/semana", label: "Semana", icon: "▦" },
      { href: "/revisoes", label: "Revisões", icon: "↻" },
    ],
  },
  {
    title: "Organizar",
    links: [
      { href: "/concursos", label: "Editais", icon: "▤" },
      { href: "/ia", label: "IA externa", icon: "✦" },
    ],
  },
];

/** Navegação do celular: quatro atalhos na barra e o resto em "Mais". */
const mobileLinks: NavLink[] = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/ciclo", label: "Ciclo", icon: "◌" },
  { href: "/estudar", label: "Estudar", icon: "▷" },
  { href: "/semana", label: "Semana", icon: "▦" },
];
const mobileMore = [
  { title: "Acompanhar", links: [desktopGroups[0].links[4]] },
  desktopGroups[1],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { mobile } = useLayout();
  const { data, update } = useStore();
  const exam = data?.exams.find((e) => e.id === data.activeExamId);
  const examSheet = useRef<BottomSheetHandle>(null);
  const moreSheet = useRef<BottomSheetHandle>(null);
  const [examQuery, setExamQuery] = useState("");
  const [visibleExams, setVisibleExams] = useState(20);
  const filteredExams = (data?.exams || [])
    .filter((item) =>
      normalizeText(item.name).includes(normalizeText(examQuery.trim())),
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
  const moreActive = mobileMore.some((group) =>
    group.links.some((link) => link.href === path),
  );

  return (
    <SafeAreaView style={s.root}>
      {mobile ? (
        <View style={s.mobileFrame}>
          <View style={s.mobileTop}>
            <Brand />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Trocar concurso. Atual: ${exam?.name || "nenhum"}`}
              onPress={openExamSelector}
              style={s.mobileExamSelector}
            >
              <Text style={s.mobileExamName} numberOfLines={1}>
                {exam?.name || "Concurso"}
              </Text>
              <Chevron color={palette.text} style={s.mobileExamArrow} />
            </Pressable>
          </View>
          <View style={s.contentArea}>{children}</View>
          <View style={s.bottomNavWrap}>
            <View style={s.bottomNav}>
              {mobileLinks.map((link) => (
                <MobileNavItem
                  key={link.href}
                  link={link}
                  active={path === link.href}
                />
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mais opções"
                accessibilityState={{ selected: moreActive }}
                onPress={() => moreSheet.current?.open()}
                style={[s.mobileNavItem, moreActive && s.mobileNavActive]}
              >
                <Text
                  style={[s.mobileNavIcon, moreActive && s.mobileNavIconActive]}
                >
                  ⋯
                </Text>
                <Text
                  style={[s.mobileNavText, moreActive && s.mobileNavTextActive]}
                >
                  Mais
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={s.desktopFrame}>
          <View style={s.sidebar}>
            <Brand />
            <View style={s.nav}>
              {desktopGroups.map((group) => (
                <View key={group.title} style={s.navGroup}>
                  <Text style={s.navGroupTitle}>
                    {group.title.toUpperCase()}
                  </Text>
                  {group.links.map((link) => (
                    <DesktopNavItem
                      key={link.href}
                      link={link}
                      active={path === link.href}
                    />
                  ))}
                </View>
              ))}
            </View>
            <View style={s.sidebarFooter}>
              <Account />
            </View>
          </View>
          <View style={s.main}>
            <View style={s.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Trocar concurso. Atual: ${exam?.name || "nenhum"}`}
                onPress={openExamSelector}
                style={({ hovered }: { hovered?: boolean }) => [
                  s.examPicker,
                  hovered && s.examPickerHover,
                ]}
              >
                <View style={s.examInitial}>
                  <Text style={s.examInitialText}>
                    {(exam?.name || "?").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={s.examPickerText}>
                  <Text style={s.examPickerName} numberOfLines={1}>
                    {exam?.name || "Escolher concurso"}
                  </Text>
                  {exam?.role ? (
                    <Text style={s.examPickerRole} numberOfLines={1}>
                      {exam.role}
                    </Text>
                  ) : null}
                </View>
                <Chevron color={palette.muted} style={s.examPickerArrow} />
              </Pressable>
              <SyncChip />
            </View>
            <View style={s.contentArea}>{children}</View>
          </View>
        </View>
      )}

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

      <BottomSheet ref={moreSheet} title="Mais opções">
        {mobileMore.map((group) => (
          <View key={group.title} style={s.moreGroup}>
            <Text style={s.moreGroupTitle}>{group.title.toUpperCase()}</Text>
            {group.links.map((link) => (
              <Pressable
                key={link.href}
                accessibilityRole="link"
                accessibilityState={{ selected: path === link.href }}
                onPress={() =>
                  moreSheet.current?.close(() =>
                    router.push(link.href as never),
                  )
                }
                style={[s.moreOption, path === link.href && s.moreOptionActive]}
              >
                <Text style={s.moreOptionIcon}>{link.icon}</Text>
                <Text style={s.moreOptionLabel}>{link.label}</Text>
                <Text style={s.moreOptionArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <SyncChip inSheet />
        <Account />
      </BottomSheet>
    </SafeAreaView>
  );
}

/**
 * Seta para baixo desenhada com bordas: o caractere "⌄" fica abaixo do centro
 * em várias fontes e desalinha do texto ao lado.
 */
function Chevron({
  color,
  style,
}: {
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.chevronBox, style]}>
      <View style={[s.chevron, { borderColor: color }]} />
    </View>
  );
}

/** Link com asChild não aceita estilo em função; o hover fica em estado local. */
function DesktopNavItem({ link, active }: { link: NavLink; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={link.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={StyleSheet.flatten([
          s.navItem,
          hovered && s.navHover,
          active && s.navActive,
        ])}
      >
        <Text style={[s.navIcon, active && s.navTextActive]}>{link.icon}</Text>
        <Text style={[s.navText, active && s.navTextActive]}>{link.label}</Text>
      </Pressable>
    </Link>
  );
}

function MobileNavItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link href={link.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={link.label}
        accessibilityState={{ selected: active }}
        style={StyleSheet.flatten([
          s.mobileNavItem,
          active && s.mobileNavActive,
        ])}
      >
        <Text style={[s.mobileNavIcon, active && s.mobileNavIconActive]}>
          {link.icon}
        </Text>
        <Text style={[s.mobileNavText, active && s.mobileNavTextActive]}>
          {link.label}
        </Text>
      </Pressable>
    </Link>
  );
}

/** Estado da sincronização; no modo local, avisa que os dados ficam no aparelho. */
function SyncChip({ inSheet = false }: { inSheet?: boolean }) {
  const { enabled, session } = useAuth();
  const { sync, syncNow } = useStore();
  const remote = enabled && Boolean(session);
  const tone = !remote
    ? "local"
    : sync.error
      ? "error"
      : sync.syncing || sync.pending
        ? "busy"
        : "ok";
  const label = !remote
    ? "Modo local"
    : sync.syncing
      ? "Sincronizando..."
      : sync.error
        ? "Sem sincronizar"
        : sync.pending
          ? `${sync.pending} pendente${sync.pending === 1 ? "" : "s"}`
          : "Sincronizado";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={remote ? `${label}. Sincronizar agora` : label}
      accessibilityHint={sync.error || undefined}
      disabled={!remote}
      onPress={syncNow}
      style={[s.syncChip, inSheet && s.syncChipSheet]}
    >
      <View style={[s.syncDot, s[`sync_${tone}`]]} />
      <Text style={s.syncText} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Account() {
  const { enabled, session, signOut } = useAuth();
  if (!enabled || !session) return null;
  return (
    <View style={s.account}>
      <View style={s.accountAvatar}>
        <Text style={s.accountAvatarText}>
          {(session.user.email || "?").slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <Text style={s.accountEmail} numberOfLines={1}>
        {session.user.email}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={s.accountSignOut}
      >
        <Text style={s.accountSignOutText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  contentArea: { flex: 1, minHeight: 0 },


  desktopFrame: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 224,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: palette.panel,
    borderRightWidth: 1,
    borderRightColor: palette.line,
  },
  nav: { marginTop: 26, gap: 18 },
  navGroup: { gap: 2 },
  navGroupTitle: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  navHover: { backgroundColor: "#F4F4F0" },
  navActive: { backgroundColor: "#EDE9FF" },
  navIcon: {
    color: palette.muted,
    fontSize: 15,
    width: 18,
    textAlign: "center",
  },
  navText: { color: "#4E575D", fontSize: 13, fontWeight: "600" },
  navTextActive: { color: palette.dark, fontWeight: "800" },
  sidebarFooter: { marginTop: "auto" },

  main: { flex: 1, minWidth: 0 },
  topBar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.bg,
  },
  examPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 380,
    flexShrink: 1,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 12,
  },
  examPickerHover: { backgroundColor: "#EEEEE8" },
  examInitial: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#DDE7FB",
    alignItems: "center",
    justifyContent: "center",
  },
  examInitialText: { color: palette.text, fontSize: 13, fontWeight: "800" },
  examPickerText: { flexShrink: 1, minWidth: 0 },
  examPickerName: { color: palette.text, fontSize: 14, fontWeight: "800" },
  examPickerRole: { color: palette.muted, fontSize: 11, marginTop: 1 },
  examPickerArrow: { marginLeft: 4 },
  chevronBox: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // Girado, o quadrado pesa para baixo; subir um pouco centraliza a seta.
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 1.8,
    borderBottomWidth: 1.8,
    marginTop: -3,
    transform: [{ rotate: "45deg" }],
  },

  syncChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panel,
  },
  syncChipSheet: { alignSelf: "flex-start" },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  sync_ok: { backgroundColor: "#6FAE86" },
  sync_busy: { backgroundColor: "#E2B25B" },
  sync_error: { backgroundColor: palette.danger },
  sync_local: { backgroundColor: palette.muted },
  syncText: { color: palette.text, fontSize: 11, fontWeight: "700" },

  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 12,
    marginTop: 12,
  },
  accountAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarText: { color: palette.dark, fontSize: 12, fontWeight: "800" },
  accountEmail: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  accountSignOut: { paddingVertical: 6, paddingHorizontal: 4 },
  accountSignOutText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },

  mobileFrame: { flex: 1 },
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
  mobileExamArrow: { marginLeft: 8 },
  bottomNavWrap: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
    backgroundColor: palette.bg,
  },
  bottomNav: {
    flexDirection: "row",
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
    flex: 1,
    minWidth: 0,
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
  moreGroup: { marginBottom: 16 },
  moreGroupTitle: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 9,
  },
  moreOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 14,
    marginBottom: 7,
    borderRadius: 15,
    backgroundColor: "#F7F7F2",
  },
  moreOptionActive: { backgroundColor: "#EDE9FF" },
  moreOptionIcon: { color: palette.text, fontSize: 21, width: 33 },
  moreOptionLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  moreOptionArrow: { color: palette.muted, fontSize: 23 },
});
