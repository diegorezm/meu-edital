import { useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  addCycleItem,
  advanceCycle,
  buildCycle,
  cycleState,
  moveCycleItem,
  removeCycleItem,
  replaceCycle,
  suggestNextTopic,
  updateCycleItem,
} from "@meu-edital/domain";
import {
  BottomSheet,
  BottomSheetHandle,
  Button,
  Page,
  palette,
} from "@global/components/ui";
import { SearchablePicker } from "@global/components/shared/SearchablePicker";
import { studyDurations } from "@global/constants/studyOptions";
import { useStore } from "@global/store/store";
import { formatDuration } from "@global/utils/formatDuration";

const colors = ["#DAEACD", "#F8DDD0", "#DAE3F7", "#E9DDF2", "#D7E9EA"];
const blockSizes = [30, 45, 60, 90];

export default function CycleScreen() {
  const { data, update } = useStore();
  const examId = data?.activeExamId || "";
  const exam = data?.exams.find((item) => item.id === examId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [blockSize, setBlockSize] = useState(60);
  const itemSheet = useRef<BottomSheetHandle>(null);
  const addSheet = useRef<BottomSheetHandle>(null);
  const buildSheet = useRef<BottomSheetHandle>(null);

  const state = data && examId ? cycleState(data, examId) : null;
  const items = state?.items || [];
  const next = state?.next;
  const selected = items.find((item) => item.id === selectedId);
  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  const subjects = useMemo(
    () => data?.subjects.filter((item) => item.examId === examId) || [],
    [data?.subjects, examId],
  );
  const subjectName = (id: string) =>
    data?.subjects.find((item) => item.id === id)?.name || "Matéria";
  const colorOf = (id: string) =>
    colors[Math.max(0, subjects.findIndex((item) => item.id === id)) % colors.length];
  const suggestion = data && next ? suggestNextTopic(data, next.subjectId) : undefined;
  const weeklyMinutes = Math.round((exam?.hoursPerWeek || 0) * 60);

  const start = (id: string) =>
    router.push({ pathname: "/estudar", params: { cycleId: id } });
  const generate = async () => {
    await update((current) =>
      replaceCycle(current, examId, buildCycle(current, examId, { blockMinutes: blockSize })),
    );
    buildSheet.current?.close();
  };
  const addBlock = async () => {
    if (!subjectId) return;
    await update((current) => addCycleItem(current, examId, subjectId, minutes));
    addSheet.current?.close(() => setSubjectId(""));
  };

  return (
    <Page eyebrow="ESTUDO CÍCLICO" title="Seu ciclo">
      <View style={s.content}>
        <Text style={s.intro}>
          Siga a sequência no seu ritmo. Faltou um dia? Continue de onde parou:
          o ciclo não depende do calendário.
        </Text>
        {next && state ? (
          <View style={s.nextCard}>
            <Text style={s.nextEyebrow}>
              PRÓXIMO BLOCO · {state.position + 1} DE {items.length} · VOLTA{" "}
              {state.laps + 1}
            </Text>
            <Text style={s.nextTitle} numberOfLines={2}>
              {subjectName(next.subjectId)}
            </Text>
            <Text style={s.nextSubject} numberOfLines={2}>
              {suggestion
                ? `Sugestão: ${suggestion.name}`
                : "Cadastre assuntos desta matéria em Editais."}
            </Text>
            <View style={s.nextTags}>
              <Text style={s.nextTag}>{formatDuration(next.minutes)}</Text>
              <Text style={s.nextTag}>
                {state.laps} {state.laps === 1 ? "volta completa" : "voltas completas"}
              </Text>
            </View>
            <View style={s.nextActions}>
              <Button title="Começar estudo  →" onPress={() => start(next.id)} />
              <Pressable
                accessibilityRole="button"
                onPress={() => update((current) => advanceCycle(current, examId, next.id))}
                style={s.skip}
              >
                <Text style={s.skipText}>Pular bloco</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>◌</Text>
            <Text style={s.emptyTitle}>Seu ciclo começa aqui</Text>
            <Text style={s.emptyHint}>
              {subjects.length
                ? "Gere o ciclo a partir dos pesos das matérias ou monte bloco a bloco."
                : "Cadastre as matérias do edital para montar o ciclo."}
            </Text>
            <Button
              title={subjects.length ? "Gerar pelos pesos  ✦" : "Abrir editais  →"}
              onPress={() =>
                subjects.length ? buildSheet.current?.open() : router.push("/concursos")
              }
            />
          </View>
        )}

        <View style={s.sectionHeader}>
          <View style={s.sectionText}>
            <Text style={s.sectionTitle}>Sequência</Text>
            <Text style={s.sectionSubtitle}>
              {items.length} {items.length === 1 ? "bloco" : "blocos"} ·{" "}
              {formatDuration(state?.lapMinutes || 0)} por volta
              {weeklyMinutes ? ` · meta semanal ${formatDuration(weeklyMinutes)}` : ""}
            </Text>
          </View>
          {subjects.length > 0 && (
            <View style={s.headerActions}>
              {items.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => buildSheet.current?.open()}
                  style={s.addButton}
                >
                  <Text style={s.addText}>Regerar</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setSubjectId("");
                  setMinutes(60);
                  addSheet.current?.open();
                }}
                style={s.addButton}
              >
                <Text style={s.addText}>+ Bloco</Text>
              </Pressable>
            </View>
          )}
        </View>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Opções do bloco ${index + 1}: ${subjectName(item.subjectId)}`}
            onPress={() => {
              setSelectedId(item.id);
              itemSheet.current?.open();
            }}
            style={[
              s.itemCard,
              { backgroundColor: colorOf(item.subjectId) },
              index === state?.position && s.itemCurrent,
            ]}
          >
            <View style={s.itemNumber}>
              <Text style={s.itemNumberText}>{String(index + 1).padStart(2, "0")}</Text>
            </View>
            <View style={s.itemBody}>
              <Text style={s.itemTitle} numberOfLines={2}>
                {subjectName(item.subjectId)}
              </Text>
              <Text style={s.itemMeta} numberOfLines={1}>
                {formatDuration(item.minutes)}
                {index === state?.position ? " · próximo" : ""}
              </Text>
            </View>
            <Text style={s.itemArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <BottomSheet ref={buildSheet} title="Gerar ciclo pelos pesos">
        <Text style={s.sheetIntro}>
          Cada volta soma a sua meta de {formatDuration(weeklyMinutes)} por semana,
          dividida pelo peso de cada matéria, pelo desempenho nas questões e pelas
          revisões pendentes.
          {items.length ? " O ciclo atual será substituído." : ""}
        </Text>
        <Text style={s.formLabel}>TAMANHO DOS BLOCOS</Text>
        <View style={s.choiceRow}>
          {blockSizes.map((value) => (
            <Choice
              key={value}
              label={formatDuration(value)}
              active={blockSize === value}
              onPress={() => setBlockSize(value)}
            />
          ))}
        </View>
        <View style={s.formAction}>
          <Button title="Gerar ciclo" onPress={generate} />
        </View>
      </BottomSheet>

      <BottomSheet ref={addSheet} contentKey={subjectId ? "minutes" : "subject"} title="Novo bloco">
        {subjectId ? (
          <View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSubjectId("")}
              style={s.backButton}
            >
              <Text style={s.backText}>← Trocar matéria</Text>
            </Pressable>
            <Text style={s.selectedTitle}>{subjectName(subjectId)}</Text>
            <Text style={[s.formLabel, s.optionsLabel]}>DURAÇÃO</Text>
            <View style={s.choiceRow}>
              {studyDurations.map((value) => (
                <Choice
                  key={value}
                  label={formatDuration(value)}
                  active={minutes === value}
                  onPress={() => setMinutes(value)}
                />
              ))}
            </View>
            <View style={s.formAction}>
              <Button title="Adicionar ao fim do ciclo" onPress={addBlock} />
            </View>
          </View>
        ) : (
          <SearchablePicker
            items={subjects}
            label="Buscar matéria"
            emptyText="Ainda não há matérias neste concurso."
            onSelect={(item) => setSubjectId(item.id)}
          />
        )}
      </BottomSheet>

      <BottomSheet ref={itemSheet} title="Bloco do ciclo">
        {selected && (
          <View>
            <Text style={s.selectedTitle}>{subjectName(selected.subjectId)}</Text>
            <Text style={s.selectedMeta}>
              Bloco {selectedIndex + 1} de {items.length}
            </Text>
            <Text style={[s.formLabel, s.optionsLabel]}>DURAÇÃO</Text>
            <View style={s.choiceRow}>
              {studyDurations.map((value) => (
                <Choice
                  key={value}
                  label={formatDuration(value)}
                  active={selected.minutes === value}
                  onPress={() =>
                    update((current) =>
                      updateCycleItem(current, selected.id, { minutes: value }),
                    )
                  }
                />
              ))}
            </View>
            <View style={s.itemActions}>
              <Button
                title="Começar estudo  →"
                onPress={() => itemSheet.current?.close(() => start(selected.id))}
              />
              <View style={s.orderActions}>
                <Button
                  title="Mover para cima"
                  secondary
                  disabled={selectedIndex <= 0}
                  onPress={() =>
                    update((current) => moveCycleItem(current, examId, selected.id, -1))
                  }
                />
                <Button
                  title="Mover para baixo"
                  secondary
                  disabled={selectedIndex >= items.length - 1}
                  onPress={() =>
                    update((current) => moveCycleItem(current, examId, selected.id, 1))
                  }
                />
              </View>
              <Button
                title="Excluir bloco"
                danger
                onPress={() => {
                  update((current) => removeCycleItem(current, examId, selected.id));
                  itemSheet.current?.close();
                }}
              />
            </View>
          </View>
        )}
      </BottomSheet>
    </Page>
  );
}

function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.choice, active && s.choiceActive]}
    >
      <Text style={[s.choiceText, active && s.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center" },
  intro: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 21,
  },
  nextCard: {
    backgroundColor: "#DDE7FB",
    borderRadius: 25,
    padding: 23,
    marginBottom: 27,
  },
  nextEyebrow: {
    color: "#53647A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  nextTitle: {
    color: palette.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 31,
    letterSpacing: -0.5,
    marginTop: 20,
  },
  nextSubject: { color: "#53647A", fontSize: 13, marginTop: 6 },
  nextTags: { flexDirection: "row", gap: 7, marginTop: 18, marginBottom: 22 },
  nextTag: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  nextActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  skip: { paddingVertical: 10, paddingHorizontal: 4 },
  skipText: { color: "#53647A", fontSize: 12, fontWeight: "800" },
  emptyCard: {
    backgroundColor: "#DDE7FB",
    borderRadius: 24,
    padding: 24,
    marginBottom: 27,
  },
  emptyIcon: { color: "#6A79A1", fontSize: 30 },
  emptyTitle: {
    color: palette.text,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyHint: { color: "#53647A", fontSize: 12, marginTop: 6, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sectionText: { flex: 1, minWidth: 0 },
  sectionTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
  headerActions: { flexDirection: "row", gap: 7 },
  addButton: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panel,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  addText: { color: palette.text, fontSize: 12, fontWeight: "800" },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    minHeight: 76,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemCurrent: { borderColor: palette.dark },
  itemNumber: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  itemNumberText: { color: palette.text, fontSize: 17, fontWeight: "800" },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  itemMeta: { color: "#59636A", fontSize: 11, marginTop: 5 },
  itemArrow: { color: palette.text, fontSize: 26, marginLeft: 8 },
  sheetIntro: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 22,
  },
  formLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  optionsLabel: { marginTop: 20 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 20,
    backgroundColor: "#F7F7F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceActive: { backgroundColor: palette.dark, borderColor: palette.dark },
  choiceText: { color: palette.text, fontSize: 12, fontWeight: "700" },
  choiceTextActive: { color: "#FFFFFF" },
  formAction: { marginTop: 25 },
  backButton: { alignSelf: "flex-start", paddingVertical: 7, marginBottom: 12 },
  backText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  selectedTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 5,
  },
  selectedMeta: { color: palette.muted, fontSize: 12 },
  itemActions: { gap: 14, marginTop: 24 },
  orderActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
