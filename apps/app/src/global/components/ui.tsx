import React, { useEffect, useRef, useState } from "react";
import { Href, Link, router } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@global/store/store";
import { palette } from "@global/constants/colors";

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
  title: string;
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
  full = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
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
        full && s.buttonFull,
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
  dialogOverlay: { justifyContent: "center", padding: 24 },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backdropFill: { flex: 1, backgroundColor: "rgba(25, 30, 42, 0.42)" },
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
  dialogPanel: {
    maxWidth: 560,
    borderRadius: 22,
    paddingTop: 20,
    paddingBottom: 20,
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
  buttonFull: { alignSelf: "stretch" },
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
});
