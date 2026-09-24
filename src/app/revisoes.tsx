import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheet,
  BottomSheetHandle,
  Button,
  Field,
  Page,
  palette,
} from "@/components/ui";
import { useStore } from "@/data/store";
import { Review, today } from "@/domain/types";

const formatDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });

export default function ReviewsScreen() {
  const { data, update } = useStore();
  const [offsets, setOffsets] = useState("");
  const [error, setError] = useState("");
  const settingsSheet = useRef<BottomSheetHandle>(null);
  const upcomingSheet = useRef<BottomSheetHandle>(null);
  const reviews =
    data?.reviews
      .filter((item) => item.examId === data.activeExamId && !item.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)) || [];
  const due = reviews.filter((item) => item.dueDate <= today());
  const later = reviews.filter((item) => item.dueDate > today());
  const topic = (id: string) =>
    data?.topics.find((item) => item.id === id)?.name || "Assunto";
  const complete = (id: string) =>
    update((current) => ({
      ...current,
      reviews: current.reviews.map((item) =>
        item.id === id ? { ...item, completed: true } : item,
      ),
    }));
  const saveOffsets = async () => {
    const values = offsets.split(",").map((value) => Number(value.trim()));
    if (
      !values.length ||
      values.some((value) => !Number.isInteger(value) || value < 1) ||
      values.some((value, index) => index > 0 && value <= values[index - 1])
    ) {
      setError("Use dias inteiros, positivos e em ordem crescente.");
      return;
    }
    await update((current) => ({ ...current, reviewOffsets: values }));
    setOffsets("");
    setError("");
    settingsSheet.current?.close();
  };
  const reviewCard = (item: Review, future = false) => (
    <View key={item.id} style={[s.reviewCard, future && s.futureCard]}>
      <View style={s.dateBadge}>
        <Text style={s.dateBadgeText}>{formatDate(item.dueDate)}</Text>
      </View>
      <View style={s.reviewBody}>
        <Text style={s.reviewTitle} numberOfLines={2}>
          {topic(item.topicId)}
        </Text>
        <Text style={s.reviewMeta}>{item.stage}ª revisão</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Concluir revisão de ${topic(item.topicId)}`}
        onPress={() => complete(item.id)}
        style={s.completeButton}
      >
        <Text style={s.completeText}>✓</Text>
      </Pressable>
    </View>
  );

  return (
    <Page eyebrow="MEMÓRIA" title="Revisões">
      <View style={s.content}>
        <View style={s.hero}>
          <Text style={s.heroEyebrow}>NO SEU RITMO</Text>
          <Text style={s.heroNumber}>{due.length}</Text>
          <Text style={s.heroTitle}>
            {due.length === 1
              ? "revisão espera por você"
              : "revisões esperam por você"}
          </Text>
          <Text style={s.heroHint}>
            Um pouco hoje ajuda a lembrar amanhã. ✦
          </Text>
        </View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Para hoje</Text>
          <Text style={s.sectionCount}>{due.length} pendentes</Text>
        </View>
        {due.length ? (
          due.map((item) => reviewCard(item))
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>☁</Text>
            <Text style={s.emptyTitle}>Tudo em dia por aqui</Text>
            <Text style={s.emptyHint}>
              Aproveite esse respiro ou continue seu plano.
            </Text>
          </View>
        )}

        <Text style={s.moreTitle}>Para organizar depois</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => upcomingSheet.current?.open()}
          style={s.menuRow}
        >
          <View>
            <Text style={s.menuTitle}>Próximas revisões</Text>
            <Text style={s.menuSubtitle}>
              {later.length} {later.length === 1 ? "agendada" : "agendadas"}
            </Text>
          </View>
          <Text style={s.menuArrow}>›</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setOffsets(data?.reviewOffsets.join(", ") || "");
            setError("");
            settingsSheet.current?.open();
          }}
          style={s.menuRow}
        >
          <View>
            <Text style={s.menuTitle}>Intervalos de revisão</Text>
            <Text style={s.menuSubtitle}>
              {data?.reviewOffsets.join(", ") || "—"} dias
            </Text>
          </View>
          <Text style={s.menuArrow}>›</Text>
        </Pressable>
      </View>

      <BottomSheet ref={upcomingSheet} title="Próximas revisões">
        <Text style={s.sheetIntro}>Aqui está o que vem nos próximos dias.</Text>
        {later.length ? (
          later.map((item) => reviewCard(item, true))
        ) : (
          <Text style={s.sheetEmpty}>
            Nenhuma revisão agendada por enquanto.
          </Text>
        )}
      </BottomSheet>
      <BottomSheet ref={settingsSheet} title="Intervalos de revisão">
        <Text style={s.sheetIntro}>
          Esses intervalos valem para os assuntos estudados daqui para frente.
        </Text>
        <Field
          label="Dias separados por vírgula"
          value={offsets}
          onChangeText={setOffsets}
          placeholder="1, 7, 30"
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button title="Salvar intervalos" onPress={saveOffsets} />
      </BottomSheet>
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center" },
  hero: {
    backgroundColor: "#DDEBD5",
    borderRadius: 25,
    padding: 23,
    marginBottom: 28,
  },
  heroEyebrow: {
    color: "#526958",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroNumber: {
    color: palette.text,
    fontSize: 54,
    fontWeight: "800",
    lineHeight: 62,
    marginTop: 11,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  heroHint: { color: "#526958", fontSize: 12, marginTop: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  sectionCount: { color: palette.muted, fontSize: 11 },
  reviewCard: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 18,
    minHeight: 78,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 9,
  },
  futureCard: { backgroundColor: "#F7F7F2" },
  dateBadge: {
    backgroundColor: "#F5E8DB",
    borderRadius: 12,
    minWidth: 55,
    paddingHorizontal: 7,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateBadgeText: { color: "#7C604F", fontSize: 10, fontWeight: "800" },
  reviewBody: { flex: 1, minWidth: 0 },
  reviewTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  reviewMeta: { color: palette.muted, fontSize: 11, marginTop: 5 },
  completeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#A3BBA8",
    alignItems: "center",
    justifyContent: "center",
  },
  completeText: { color: "#5A866A", fontSize: 19, fontWeight: "700" },
  emptyCard: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 19,
    padding: 25,
    alignItems: "center",
  },
  emptyIcon: { color: "#8DA4BB", fontSize: 28, marginBottom: 9 },
  emptyTitle: { color: palette.text, fontSize: 15, fontWeight: "800" },
  emptyHint: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  moreTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 26,
    marginBottom: 11,
  },
  menuRow: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 17,
    paddingHorizontal: 17,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  menuTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  menuSubtitle: { color: palette.muted, fontSize: 11, marginTop: 4 },
  menuArrow: { color: palette.text, fontSize: 26 },
  sheetIntro: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  sheetEmpty: {
    color: palette.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 25,
  },
  error: { color: palette.danger, fontSize: 12, marginBottom: 12 },
});
