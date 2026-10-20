import React, { useRef, useState } from "react";
import { Link, router, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "@global/constants/colors";
import { useAuth } from "@global/store/auth";
import { useStore } from "@global/store/store";
import { normalizeText } from "@global/utils/normalizeText";
import { Brand } from "./Brand";
import { Icon, type IconName } from "./Icon";
import { Text, TextInput } from "./Text";
import { BottomSheet, BottomSheetHandle, Button, useLayout } from "./ui";

type NavLink = { href: "/" | `/${string}`; label: string; icon: IconName };

/** Navegação do desktop: todas as páginas à vista, agrupadas. */
const desktopGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "Estudo",
    links: [
      { href: "/", label: "Início", icon: "home" },
      { href: "/ciclo", label: "Ciclo", icon: "cycle" },
      { href: "/estudar", label: "Estudar", icon: "timer" },
      { href: "/semana", label: "Semana", icon: "calendar" },
      { href: "/revisoes", label: "Revisões", icon: "reviews" },
    ],
  },
  {
    title: "Organizar",
    links: [
      { href: "/concursos", label: "Editais", icon: "books" },
      { href: "/ia", label: "IA externa", icon: "sparkle" },
    ],
  },
];

/** Navegação do celular: quatro atalhos na barra e o resto em "Mais". */
const mobileLinks: NavLink[] = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/ciclo", label: "Ciclo", icon: "cycle" },
  { href: "/estudar", label: "Estudar", icon: "timer" },
  { href: "/semana", label: "Semana", icon: "calendar" },
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
              <View style={s.mobileExamArrow}>
                <Icon name="caretDown" size={14} />
              </View>
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
                <Icon
                  name="more"
                  size={22}
                  color={moreActive ? palette.bg : palette.ink}
                />
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
                <View style={s.examPickerArrow}>
                  <Icon name="caretDown" size={14} color={palette.muted} />
                </View>
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
              <Icon
                name={active ? "check" : "caretRight"}
                size={18}
                color={active ? palette.ink : palette.muted}
              />
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
                <View style={s.moreOptionIcon}>
                  <Icon name={link.icon} size={20} />
                </View>
                <Text style={s.moreOptionLabel}>{link.label}</Text>
                <Icon name="caretRight" size={18} color={palette.muted} />
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
        <Icon
          name={link.icon}
          size={18}
          color={active ? palette.bg : palette.ink}
        />
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
        <Icon
          name={link.icon}
          size={22}
          color={active ? palette.bg : palette.ink}
        />
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
        accessibilityLabel="Sair da conta"
        onPress={signOut}
        style={s.accountSignOut}
      >
        <Icon name="signOut" size={18} color={palette.muted} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  contentArea: { flex: 1, minHeight: 0 },

  desktopFrame: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 208,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: palette.bg,
    borderRightWidth: 1,
    borderRightColor: palette.ink,
  },
  nav: { marginTop: 28, gap: 20 },
  navGroup: { gap: 3 },
  navGroupTitle: {
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 1.6,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  navHover: { backgroundColor: palette.field },
  navActive: { backgroundColor: palette.ink },
  navText: { color: palette.ink, fontSize: 13 },
  navTextActive: { color: palette.bg, fontWeight: "700" },
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
    borderBottomColor: palette.ink,
    backgroundColor: palette.bg,
  },
  examPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 380,
    flexShrink: 1,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  examPickerHover: { borderColor: palette.ink, backgroundColor: palette.field },
  examInitial: {
    width: 30,
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  examInitialText: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  examPickerText: { flexShrink: 1, minWidth: 0 },
  examPickerName: { color: palette.ink, fontSize: 13, fontWeight: "700" },
  examPickerRole: { color: palette.muted, fontSize: 11, marginTop: 1 },
  examPickerArrow: { marginLeft: 4 },

  syncChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.line,
  },
  syncChipSheet: { alignSelf: "flex-start" },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  sync_ok: { backgroundColor: "#4E7A5A" },
  sync_busy: { backgroundColor: "#C9973E" },
  sync_error: { backgroundColor: palette.danger },
  sync_local: { backgroundColor: palette.muted },
  syncText: {
    color: palette.ink,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

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
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarText: { color: palette.ink, fontSize: 12, fontWeight: "700" },
  accountEmail: { color: palette.ink, fontSize: 11, flex: 1 },
  accountSignOut: { padding: 6 },

  mobileFrame: { flex: 1 },
  mobileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  mobileExamSelector: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 75,
    maxWidth: 160,
    minHeight: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.ink,
    paddingLeft: 10,
    paddingRight: 8,
  },
  mobileExamName: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  mobileExamArrow: { marginLeft: 6 },
  bottomNavWrap: {
    borderTopWidth: 1,
    borderTopColor: palette.ink,
    backgroundColor: palette.bg,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "space-around",
  },
  mobileNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 4,
  },
  mobileNavActive: { backgroundColor: palette.ink },
  mobileNavText: {
    color: palette.ink,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 3,
  },
  mobileNavTextActive: { color: palette.bg },

  examSheetIntro: { color: palette.muted, fontSize: 13, marginBottom: 16 },
  examSearch: {
    backgroundColor: palette.field,
    borderColor: palette.ink,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    color: palette.ink,
    marginBottom: 14,
  },
  examOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 4,
    minHeight: 62,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  examOptionActive: { borderColor: palette.ink, borderWidth: 2 },
  examOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  examOptionIconActive: { backgroundColor: palette.ink },
  examOptionInitial: { color: palette.ink, fontSize: 16, fontWeight: "700" },
  examOptionText: { flex: 1, minWidth: 0 },
  examOptionName: { color: palette.ink, fontSize: 13, fontWeight: "700" },
  examOptionRole: { color: palette.muted, fontSize: 11, marginTop: 3 },
  examEmpty: {
    color: palette.muted,
    fontSize: 13,
    textAlign: "center",
    padding: 22,
  },
  examMore: { alignItems: "center", padding: 12 },
  examMoreText: {
    color: palette.ink,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  examManage: { marginTop: 14, marginBottom: 4 },
  moreGroup: { marginBottom: 16 },
  moreGroupTitle: {
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 9,
  },
  moreOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    paddingHorizontal: 13,
    marginBottom: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panel,
  },
  moreOptionActive: { borderColor: palette.ink },
  moreOptionIcon: { width: 32 },
  moreOptionLabel: { color: palette.ink, fontSize: 14, flex: 1 },
});
