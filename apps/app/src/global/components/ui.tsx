import React, { useEffect, useRef, useState } from "react";
import { Href, Link, router } from "expo-router";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "@global/constants/colors";
import { fonts } from "@global/constants/fonts";
import { useStore } from "@global/store/store";
import { Icon } from "./Icon";
import { Text, TextInput } from "./Text";

export { palette } from "@global/constants/colors";

/** Pontos de quebra: celular abaixo de 760px; colunas largas a partir de 1100px. */
export function useLayout() {
  const { width } = useWindowDimensions();
  return { mobile: width < 760, wide: width >= 1100 };
}

export function Page({
  title,
  eyebrow,
  children,
  action,
}: {
  /** Texto ou trechos com `Highlight`. */
  title: React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { mobile } = useLayout();
  const { data, error } = useStore();
  return (
    <ScrollView
      style={s.contentScroll}
      contentContainerStyle={[s.scroll, mobile && s.mobileScroll]}
      keyboardShouldPersistTaps="handled"
    >
      {eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
      <View style={s.header}>
        <Text style={[s.title, mobile && s.mobileTitle]}>{title}</Text>
        {action}
      </View>
      <Rule style={s.headerRule} />
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
  inverted = false,
  danger = false,
  disabled = false,
  full = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  /** Papel sobre tinta, para usar dentro de um cartão escuro. */
  inverted?: boolean;
  danger?: boolean;
  disabled?: boolean;
  /** Ocupa toda a largura disponível. */
  full?: boolean;
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
        inverted && s.buttonInverted,
        full && s.buttonFull,
        (pressed || disabled) && s.pressed,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          (secondary || inverted) && s.buttonSecondaryText,
        ]}
      >
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
  autoComplete,
  autoFocus,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "numeric" | "default" | "email-address";
  autoComplete?: "email" | "one-time-code" | "off";
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
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
        autoComplete={autoComplete}
        autoCapitalize={keyboardType === "email-address" ? "none" : undefined}
        autoCorrect={keyboardType === "email-address" ? false : undefined}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        submitBehavior={onSubmitEditing ? "blurAndSubmit" : undefined}
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
        {aside && <Text style={s.sectionAside}>{aside}</Text>}
      </View>
      <Rule style={s.sectionRule} />
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
  const { mobile } = useLayout();
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);
  useEffect(() => {
    if (!visible) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: mobile ? 260 : 160,
      useNativeDriver: true,
    }).start();
    return () => progress.stopAnimation();
  }, [visible, progress, mobile]);
  const open = () => {
    progress.setValue(0);
    setVisible(true);
  };
  const close = (afterClose?: () => void) => {
    if (closing.current || !visible) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: mobile ? 210 : 120,
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
      <View style={[s.drawerOverlay, !mobile && s.dialogOverlay]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar painel"
          onPress={() => close()}
          style={s.drawerBackdrop}
        >
          <Animated.View style={[s.backdropFill, { opacity: progress }]} />
        </Pressable>
        <Animated.View
          style={[
            s.drawerPanel,
            mobile
              ? {
                  maxHeight: height * 0.82,
                  paddingBottom: Math.max(insets.bottom, 18),
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [height, 0],
                      }),
                    },
                  ],
                }
              : [
                  s.dialogPanel,
                  {
                    maxHeight: height * 0.86,
                    opacity: progress,
                    transform: [
                      {
                        translateY: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  },
                ],
          ]}
        >
          {mobile && <View style={s.drawerHandle} />}
          <View style={s.drawerHeading}>
            <Text style={s.drawerTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar painel"
              onPress={() => close()}
              style={s.drawerClose}
            >
              <Icon name="close" size={18} />
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
        <Icon name="caretRight" size={18} color={palette.muted} />
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

/** Divisor tracejado, como o pontilhado de um formulário. */
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[s.rule, style]} />;
}

/** Marca-texto: usar só no dado mais importante da tela. */
export function Highlight({ children }: { children: React.ReactNode }) {
  return <Text style={s.highlight}>{children}</Text>;
}

/** Carimbo em vermelho de correção, para o que já foi feito. */
export function Stamp({ label }: { label: string }) {
  return (
    <View style={s.stamp}>
      <Text style={s.stampText}>{label}</Text>
    </View>
  );
}

/** Anotação à mão, como a correção do professor. Usar pouco. */
export function HandNote({ children }: { children: React.ReactNode }) {
  return <Text style={s.hand}>{children}</Text>;
}

/** Rótulo em caixa alta espaçada, no tom de lápis. */
export function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[s.label, s.labelPlain, style]}>{children}</Text>;
}

/**
 * Cartão-resposta do ciclo: uma bolinha por bloco, preenchida quando o bloco
 * já foi estudado nesta volta e com contorno forte no bloco atual.
 */
export function AnswerSheet({
  total,
  position,
  size = 18,
}: {
  total: number;
  position: number;
  size?: number;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`Bloco ${position + 1} de ${total} do ciclo`}
      style={s.sheet}
    >
      {Array.from({ length: total }, (_, index) => {
        const done = index < position;
        const current = index === position;
        return (
          <View
            key={index}
            style={[
              s.bubble,
              { width: size, height: size, borderRadius: size / 2 },
              done && s.bubbleDone,
              current && s.bubbleCurrent,
            ]}
          >
            {done ? (
              <Icon
                name="check"
                size={size * 0.6}
                color={palette.bg}
                weight="bold"
              />
            ) : (
              <Text
                style={[
                  s.bubbleText,
                  { fontSize: Math.max(8, Math.round(size * 0.45)) },
                  current && s.bubbleTextCurrent,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  contentScroll: { flex: 1 },
  scroll: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 34,
    paddingTop: 36,
    paddingBottom: 80,
  },
  mobileScroll: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 },
  eyebrow: {
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 13,
  },
  headerRule: { marginTop: 16, marginBottom: 22 },
  title: {
    color: palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
  },
  mobileTitle: { fontSize: 28, lineHeight: 33, maxWidth: 340 },
  section: {
    backgroundColor: palette.panel,
    borderRadius: 4,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.ink,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  sectionAside: {
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionRule: { marginTop: 12, marginBottom: 14 },
  rule: {
    height: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.rule,
  },
  drawerTrigger: {
    backgroundColor: palette.panel,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.ink,
    marginBottom: 10,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  drawerTriggerLabel: { flex: 1, minWidth: 0 },
  drawerTriggerTitle: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  drawerTriggerSummary: { color: palette.muted, fontSize: 12, marginTop: 4 },
  drawerOverlay: { flex: 1, justifyContent: "flex-end" },
  dialogOverlay: { justifyContent: "center", padding: 24 },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backdropFill: { flex: 1, backgroundColor: "rgba(34, 48, 74, 0.38)" },
  drawerPanel: {
    width: "100%",
    maxWidth: 660,
    alignSelf: "center",
    backgroundColor: palette.bg,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: palette.ink,
    paddingTop: 9,
    paddingHorizontal: 20,
  },
  dialogPanel: {
    maxWidth: 560,
    borderRadius: 6,
    borderBottomWidth: 1,
    paddingTop: 18,
    paddingBottom: 20,
  },
  drawerHandle: {
    width: 38,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.rule,
    alignSelf: "center",
    marginBottom: 14,
  },
  drawerHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  drawerTitle: { color: palette.ink, fontSize: 22, fontWeight: "700" },
  drawerClose: {
    width: 34,
    height: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerScroll: { flexShrink: 1 },
  drawerContent: { paddingBottom: 4 },
  drawerAction: { marginTop: 20 },
  muted: { color: palette.muted, fontSize: 12 },
  error: { color: palette.danger, marginBottom: 18 },
  empty: { color: palette.muted, paddingVertical: 12, lineHeight: 21 },
  button: {
    backgroundColor: palette.ink,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.ink,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: "center",
    alignSelf: "flex-start",
    minHeight: 42,
    justifyContent: "center",
  },
  buttonText: {
    color: palette.bg,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  buttonSecondary: { backgroundColor: "transparent" },
  buttonSecondaryText: { color: palette.ink },
  buttonInverted: { backgroundColor: palette.bg, borderColor: palette.bg },
  buttonDanger: { backgroundColor: palette.danger, borderColor: palette.danger },
  buttonFull: { alignSelf: "stretch" },
  pressed: { opacity: 0.6 },
  field: { marginBottom: 18 },
  label: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  labelPlain: { color: palette.muted, fontWeight: "400", marginBottom: 0 },
  input: {
    borderWidth: 1,
    borderColor: palette.ink,
    backgroundColor: palette.field,
    color: palette.ink,
    borderRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    minWidth: 180,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
    fontFamily: fonts.typewriter,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: palette.ink,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: palette.field,
  },
  chipActive: { backgroundColor: palette.ink },
  chipText: { color: palette.ink, fontSize: 12 },
  chipTextActive: { color: palette.bg },
  inlineLink: {
    color: palette.ink,
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.6,
    textDecorationLine: "underline",
  },
  highlight: { backgroundColor: palette.highlight, color: palette.ink },
  stamp: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: palette.danger,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ rotate: "-7deg" }],
  },
  stampText: {
    color: palette.danger,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  hand: { fontFamily: fonts.hand, color: palette.danger, fontSize: 19 },
  sheet: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  bubble: {
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleDone: { backgroundColor: palette.ink },
  bubbleCurrent: { borderWidth: 2 },
  bubbleText: { color: palette.muted },
  bubbleTextCurrent: { color: palette.ink, fontWeight: "700" },
});
