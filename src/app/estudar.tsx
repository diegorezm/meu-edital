import { useEffect, useMemo, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BottomSheet,
  BottomSheetHandle,
  Button,
  Field,
  Page,
  palette,
} from "@/components/ui";
import { useStore } from "@/data/store";
import { recordSession, validateSession } from "@/domain/logic";
import { StudyType } from "@/domain/types";

const studyTypes: StudyType[] = ["Teoria", "Questões", "Revisão"];
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const formatTime = (seconds: number) =>
  [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

export default function StudyScreen() {
  const { planId, cycleId } = useLocalSearchParams<{
    planId?: string;
    cycleId?: string;
  }>();
  return (
    <StudySession
      key={`${planId || ""}:${cycleId || ""}`}
      planId={planId}
      cycleId={cycleId}
    />
  );
}

function StudySession({
  planId,
  cycleId,
}: {
  planId?: string;
  cycleId?: string;
}) {
  const { data, update } = useStore();
  const plan = data?.planned.find((item) => item.id === planId);
  const cycleItem = data?.cycle.find((item) => item.id === cycleId);
  const target = plan || cycleItem;
  const examId = data?.activeExamId || "";
  const [selectedSubjectId, setSubjectId] = useState("");
  const [selectedTopicId, setTopicId] = useState("");
  const [selectedType, setType] = useState<StudyType | null>(null);
  const [enteredMinutes, setMinutes] = useState("");
  const [minutesEdited, setMinutesEdited] = useState(false);
  const [questions, setQuestions] = useState("");
  const [correct, setCorrect] = useState("");
  const [note, setNote] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<"subject" | "topic" | null>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const [pickerProgress] = useState(() => new Animated.Value(1));
  const changingPicker = useRef(false);
  const settingsSheet = useRef<BottomSheetHandle>(null);
  const finishSheet = useRef<BottomSheetHandle>(null);

  const subjectId = selectedSubjectId || target?.subjectId || "";
  const topicId =
    selectedTopicId || (subjectId === target?.subjectId ? target.topicId : "");
  const type = selectedType || target?.type || "Teoria";
  const plannedMinutes = target?.minutes || 0;
  const suggestedMinutes = seconds
    ? Math.max(1, Math.round(seconds / 60))
    : plannedMinutes;
  const subjectName =
    data?.subjects.find((item) => item.id === subjectId)?.name ||
    "Escolher matéria";
  const topicName =
    data?.topics.find((item) => item.id === topicId)?.name ||
    "Escolher assunto";
  const subjects = useMemo(
    () => data?.subjects.filter((item) => item.examId === examId) || [],
    [data?.subjects, examId],
  );
  const topics = useMemo(
    () => data?.topics.filter((item) => item.subjectId === subjectId) || [],
    [data?.topics, subjectId],
  );
  const pickerItems = picker === "subject" ? subjects : topics;
  const filteredItems = useMemo(() => {
    const search = normalize(query.trim());
    return pickerItems
      .filter((item) => normalize(item.name).includes(search))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [pickerItems, query]);
  const timerProgress = plannedMinutes
    ? Math.min(100, (seconds / (plannedMinutes * 60)) * 100)
    : 0;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!changingPicker.current) return;
    Animated.timing(pickerProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      changingPicker.current = false;
    });
  }, [picker, pickerProgress]);

  const openSettings = () => {
    pickerProgress.stopAnimation();
    pickerProgress.setValue(1);
    changingPicker.current = false;
    setPicker(null);
    setQuery("");
    settingsSheet.current?.open();
  };
  const transitionPicker = (
    next: "subject" | "topic" | null,
    onSwitch?: () => void,
  ) => {
    if (changingPicker.current || picker === next) return;
    changingPicker.current = true;
    Animated.timing(pickerProgress, {
      toValue: 0,
      duration: 110,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        changingPicker.current = false;
        return;
      }
      onSwitch?.();
      setQuery("");
      setVisibleCount(30);
      setPicker(next);
    });
  };
  const chooseItem = (id: string) => {
    if (picker === "subject") {
      transitionPicker("topic", () => {
        if (id !== subjectId) setTopicId("");
        setSubjectId(id);
        setError("");
      });
    } else {
      transitionPicker(null, () => {
        setTopicId(id);
        setError("");
      });
    }
  };
  const openFinish = () => {
    if (!subjectId || !topicId) {
      openSettings();
      return;
    }
    setRunning(false);
    setError("");
    if (!minutesEdited) {
      setMinutes(suggestedMinutes ? String(suggestedMinutes) : "");
    }
    finishSheet.current?.open();
  };
  const save = async () => {
    const input = {
      examId,
      subjectId,
      topicId,
      type,
      minutes: enteredMinutes ? Number(enteredMinutes) : suggestedMinutes,
      questions: type === "Questões" ? Number(questions) || 0 : undefined,
      correct: type === "Questões" ? Number(correct) || 0 : undefined,
      note: note.trim() || undefined,
    };
    const problem = validateSession(input);
    if (problem) {
      setError(problem);
      return;
    }
    await update((current) => {
      const next = recordSession(current, input, planId);
      return cycleId
        ? {
            ...next,
            cyclePosition: {
              ...next.cyclePosition,
              [examId]: (next.cyclePosition[examId] || 0) + 1,
            },
          }
        : next;
    });
    router.replace(cycleId ? "/ciclo" : "/");
  };

  return (
    <Page eyebrow="SEU MOMENTO" title="Hora de focar.">
      <View style={s.content}>
        <Text style={s.intro}>Respire fundo e siga no seu ritmo. ☁</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajustar matéria, assunto e tipo de estudo"
          onPress={openSettings}
          style={s.subjectCard}
        >
          <View style={s.subjectCardTop}>
            <Text style={s.cardEyebrow}>
              {plan
                ? "DO SEU PLANO"
                : cycleItem
                  ? "DO SEU CICLO"
                  : "ESTUDO LIVRE"}
            </Text>
            <Text style={s.editPill}>Editar ↗</Text>
          </View>
          <Text style={s.topicTitle} numberOfLines={2}>
            {topicName}
          </Text>
          <Text style={s.subjectName} numberOfLines={1}>
            {subjectName}
          </Text>
          <View style={s.cardTags}>
            <View style={s.cardTag}>
              <Text style={s.cardTagText}>{type}</Text>
            </View>
            {plannedMinutes > 0 && (
              <View style={s.cardTag}>
                <Text style={s.cardTagText}>
                  {plannedMinutes} min planejados
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        <View style={s.timerCard}>
          <Text style={s.timerEyebrow}>SEU TEMPO DE FOCO</Text>
          <View style={s.timerCircle}>
            <View style={s.timerCircleInner}>
              <Text style={s.timerTime}>{formatTime(seconds)}</Text>
              <Text style={s.timerStatus}>
                {running
                  ? "Você está no seu momento ✦"
                  : seconds
                    ? "Pausado. Volte quando quiser."
                    : "Pronto quando você estiver"}
              </Text>
            </View>
          </View>
          {plannedMinutes > 0 && (
            <View style={s.progressWrap}>
              <View style={s.progressTrack}>
                <View
                  style={[s.progressFill, { width: `${timerProgress}%` }]}
                />
              </View>
              <Text style={s.progressText}>Meta: {plannedMinutes} min</Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setRunning((value) => !value)}
            style={({ pressed }) => [s.timerButton, pressed && s.pressed]}
          >
            <Text style={s.timerButtonText}>
              {running
                ? "Ⅱ  Pausar"
                : seconds
                  ? "▶  Continuar"
                  : "▶  Começar estudo"}
            </Text>
          </Pressable>
          {seconds > 0 && !running && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSeconds(0)}
              style={s.resetButton}
            >
              <Text style={s.resetText}>Zerar cronômetro</Text>
            </Pressable>
          )}
        </View>

        <View style={s.finishArea}>
          <Text style={s.finishHint}>
            Terminou por hoje? Seu progresso fica registrado aqui.
          </Text>
          <Button
            title={
              subjectId && topicId
                ? "Concluir e registrar  →"
                : "Escolher o que estudar  →"
            }
            onPress={openFinish}
          />
        </View>
      </View>

      <BottomSheet
        ref={settingsSheet}
        contentKey={picker || "settings"}
        title={
          picker === "subject"
            ? "Escolher matéria"
            : picker === "topic"
              ? "Escolher assunto"
              : "Ajustar estudo"
        }
      >
        <Animated.View
          style={{
            opacity: pickerProgress,
            transform: [
              {
                translateY: pickerProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          {picker ? (
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={() => transitionPicker(null)}
                style={s.backButton}
              >
                <Text style={s.backText}>← Voltar ao estudo</Text>
              </Pressable>
              {picker === "topic" && (
                <Text style={s.pickerContext} numberOfLines={1}>
                  {subjectName}
                </Text>
              )}
              <TextInput
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setVisibleCount(30);
                }}
                placeholder={
                  picker === "subject" ? "Buscar matéria" : "Buscar assunto"
                }
                placeholderTextColor={palette.muted}
                clearButtonMode="while-editing"
                accessibilityLabel={
                  picker === "subject" ? "Buscar matéria" : "Buscar assunto"
                }
                style={s.searchInput}
              />
              <Text style={s.resultCount}>
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "resultado" : "resultados"}
              </Text>
              {filteredItems.length ? (
                <View style={s.results}>
                  {filteredItems.slice(0, visibleCount).map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => chooseItem(item.id)}
                      style={({ pressed }) => [
                        s.resultRow,
                        pressed && s.pressed,
                      ]}
                    >
                      <Text style={s.resultName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={s.resultArrow}>›</Text>
                    </Pressable>
                  ))}
                  {filteredItems.length > visibleCount && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setVisibleCount((count) => count + 30)}
                      style={s.moreResults}
                    >
                      <Text style={s.moreResultsText}>
                        Mostrar mais resultados
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <Text style={s.noResults}>
                  {pickerItems.length
                    ? "Nenhum resultado para essa busca."
                    : picker === "subject"
                      ? "Ainda não há matérias neste concurso."
                      : "Esta matéria ainda não tem assuntos."}
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text style={s.sheetIntro}>
                Escolha seu foco. Você pode ajustar antes de registrar.
              </Text>
              <Text style={s.formLabel}>O QUE ESTUDAR</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => transitionPicker("subject")}
                style={s.selectionCard}
              >
                <View style={[s.selectionIcon, s.subjectIcon]}>
                  <Text style={s.selectionIconText}>01</Text>
                </View>
                <View style={s.selectionContent}>
                  <Text style={s.selectionLabel}>Matéria</Text>
                  <Text
                    style={[
                      s.selectionValue,
                      !subjectId && s.selectionPlaceholder,
                    ]}
                    numberOfLines={2}
                  >
                    {subjectName}
                  </Text>
                </View>
                <Text style={s.selectionArrow}>›</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!subjectId}
                onPress={() => transitionPicker("topic")}
                style={[s.selectionCard, !subjectId && s.selectionDisabled]}
              >
                <View style={[s.selectionIcon, s.topicIcon]}>
                  <Text style={s.selectionIconText}>02</Text>
                </View>
                <View style={s.selectionContent}>
                  <Text style={s.selectionLabel}>Assunto</Text>
                  <Text
                    style={[
                      s.selectionValue,
                      !topicId && s.selectionPlaceholder,
                    ]}
                    numberOfLines={2}
                  >
                    {subjectId ? topicName : "Escolha a matéria primeiro"}
                  </Text>
                </View>
                <Text style={s.selectionArrow}>›</Text>
              </Pressable>
              <Text style={[s.formLabel, s.typeLabel]}>TIPO DE ESTUDO</Text>
              <View style={s.typeRow}>
                {studyTypes.map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: type === value }}
                    onPress={() => setType(value)}
                    style={[s.typeChip, type === value && s.typeChipActive]}
                  >
                    <Text
                      style={[
                        s.typeChipText,
                        type === value && s.typeChipTextActive,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.settingsAction}>
                <Button
                  title="Pronto"
                  onPress={() => settingsSheet.current?.close()}
                  disabled={!subjectId || !topicId}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </BottomSheet>

      <BottomSheet ref={finishSheet} title="Registrar estudo">
        <Text style={s.sheetIntro}>Mais uma etapa concluída. Como foi?</Text>
        <View style={s.finishSummary}>
          <Text style={s.finishSummaryTopic} numberOfLines={2}>
            {topicName}
          </Text>
          <Text style={s.finishSummaryMeta}>
            {subjectName} · {type}
          </Text>
        </View>
        <Field
          label="Minutos estudados"
          value={enteredMinutes}
          onChangeText={(value) => {
            setMinutes(value);
            setMinutesEdited(true);
          }}
          keyboardType="numeric"
          placeholder="Ex.: 45"
        />
        {type === "Questões" && (
          <View style={s.questionsRow}>
            <View style={s.questionField}>
              <Field
                label="Questões"
                value={questions}
                onChangeText={setQuestions}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={s.questionField}>
              <Field
                label="Acertos"
                value={correct}
                onChangeText={setCorrect}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        )}
        {type === "Questões" &&
          Number(questions) > 0 &&
          Number(correct) <= Number(questions) && (
            <Text style={s.performance}>
              Você acertou{" "}
              {Math.round((Number(correct) / Number(questions)) * 100)}% das
              questões.
            </Text>
          )}
        <Field
          label="Uma anotação? (opcional)"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="O que vale lembrar depois?"
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={s.registerAction}>
          <Button title="Salvar sessão  ✓" onPress={save} />
        </View>
      </BottomSheet>
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 680, alignSelf: "center" },
  intro: { color: palette.muted, fontSize: 13, marginBottom: 21 },
  subjectCard: {
    backgroundColor: "#DDE7FB",
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  subjectCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardEyebrow: {
    color: "#53647A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  editPill: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.62)",
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  topicTitle: {
    color: palette.text,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 5,
  },
  subjectName: { color: "#53647A", fontSize: 13, fontWeight: "600" },
  cardTags: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 21 },
  cardTag: {
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cardTagText: { color: palette.text, fontSize: 11, fontWeight: "700" },
  timerCard: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 25,
    padding: 23,
    alignItems: "center",
  },
  timerEyebrow: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 21,
  },
  timerCircle: {
    width: 222,
    height: 222,
    borderRadius: 111,
    borderWidth: 12,
    borderColor: "#E9DFF7",
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F4FC",
  },
  timerCircleInner: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#EFE7F8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
  },
  timerTime: {
    color: palette.text,
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -1.2,
    fontVariant: ["tabular-nums"],
  },
  timerStatus: {
    color: "#747284",
    fontSize: 10,
    textAlign: "center",
    marginTop: 9,
  },
  progressWrap: { width: "100%", marginTop: 23, alignItems: "center" },
  progressTrack: {
    width: "100%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F0ECF4",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#B8A5E6", borderRadius: 4 },
  progressText: { color: palette.muted, fontSize: 11, marginTop: 9 },
  timerButton: {
    backgroundColor: palette.dark,
    borderRadius: 17,
    minHeight: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 23,
  },
  timerButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  resetButton: { paddingHorizontal: 15, paddingVertical: 11, marginTop: 4 },
  resetText: { color: palette.muted, fontSize: 11, fontWeight: "700" },
  finishArea: { marginTop: 22, marginBottom: 25 },
  finishHint: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: 11,
    textAlign: "center",
  },
  pressed: { opacity: 0.65 },
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
  selectionCard: {
    backgroundColor: "#F7F7F2",
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 17,
    minHeight: 72,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },
  selectionDisabled: { opacity: 0.55 },
  selectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  subjectIcon: { backgroundColor: "#DFD6FA" },
  topicIcon: { backgroundColor: "#DCECCF" },
  selectionIconText: { color: palette.dark, fontSize: 13, fontWeight: "800" },
  selectionContent: { flex: 1, minWidth: 0 },
  selectionLabel: { color: palette.muted, fontSize: 11, marginBottom: 3 },
  selectionValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  selectionPlaceholder: { color: "#6B7479", fontWeight: "500" },
  selectionArrow: {
    color: palette.text,
    fontSize: 28,
    marginLeft: 10,
    marginBottom: 4,
  },
  typeLabel: { marginTop: 18 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  typeChip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 20,
    backgroundColor: "#F7F7F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeChipActive: { backgroundColor: palette.dark, borderColor: palette.dark },
  typeChipText: { color: palette.text, fontSize: 12, fontWeight: "700" },
  typeChipTextActive: { color: "#FFFFFF" },
  settingsAction: { marginTop: 26 },
  backButton: { alignSelf: "flex-start", paddingVertical: 7, marginBottom: 12 },
  backText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  pickerContext: { color: palette.muted, fontSize: 12, marginBottom: 12 },
  searchInput: {
    backgroundColor: "#F7F7F2",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: palette.text,
    fontSize: 15,
  },
  resultCount: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 14,
    marginBottom: 6,
  },
  results: { gap: 7 },
  resultRow: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#F7F7F2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  resultName: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  resultArrow: { color: palette.muted, fontSize: 23, marginLeft: 12 },
  moreResults: { alignItems: "center", padding: 13 },
  moreResultsText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  noResults: {
    color: palette.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 28,
  },
  finishSummary: {
    backgroundColor: "#F2EDF8",
    borderRadius: 17,
    padding: 16,
    marginBottom: 23,
  },
  finishSummaryTopic: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  finishSummaryMeta: { color: palette.muted, fontSize: 12 },
  questionsRow: { flexDirection: "row", gap: 12 },
  questionField: { flex: 1, minWidth: 0 },
  performance: {
    color: "#6D5BB8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 15,
  },
  error: { color: palette.danger, fontSize: 12, marginBottom: 12 },
  registerAction: { marginTop: 5 },
});
