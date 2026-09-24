import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheet,
  BottomSheetHandle,
  Button,
  Page,
  palette,
} from "@global/components/ui";
import { useStore } from "@global/store/store";
import { SearchablePicker } from "@global/components/shared/SearchablePicker";
import { studyDurations, studyTypes } from "@global/constants/studyOptions";
import {
  addDays,
  currentWeekStart,
  Day,
  PlannedSession,
  StudyType,
  uid,
  weekdays,
} from "@domain/types";
import {
  getDayPlan,
  getWeekPlan,
  removePlannedSession,
} from "../utils/planOperations";

const dayColors = [
  "#DAEACD",
  "#F8DDD0",
  "#DAE3F7",
  "#E9DDF2",
  "#D7E9EA",
  "#E8E4D8",
  "#F6E9CB",
];
const monthNames = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export default function PlanScreen() {
  const { data, update } = useStore();
  const examId = data?.activeExamId || "";
  const todayIndex = ((new Date().getDay() + 6) % 7) as Day;
  const [showToday, setShowToday] = useState(false);
  const [day, setDay] = useState<Day>(todayIndex);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState<StudyType>("Teoria");
  const [minutes, setMinutes] = useState(60);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<"subject" | "topic" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formSheet = useRef<BottomSheetHandle>(null);
  const sessionSheet = useRef<BottomSheetHandle>(null);
  const [contentProgress] = useState(() => new Animated.Value(1));
  const changingPicker = useRef(false);

  useEffect(() => {
    if (!changingPicker.current) return;
    Animated.timing(contentProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      changingPicker.current = false;
    });
  }, [picker, contentProgress]);

  const weekStart = currentWeekStart();
  const subjects = useMemo(
    () => data?.subjects.filter((item) => item.examId === examId) || [],
    [data?.subjects, examId],
  );
  const topics = useMemo(
    () => data?.topics.filter((item) => item.subjectId === subjectId) || [],
    [data?.topics, subjectId],
  );
  const pickerItems = picker === "subject" ? subjects : topics;
  const planned = data ? getWeekPlan(data, examId, weekStart) : [];
  const completed = planned.filter((item) => item.completed).length;
  const selected = planned.find((item) => item.id === selectedId);
  const selectedRows = selected
    ? planned
        .filter((item) => item.day === selected.day)
        .sort((a, b) => a.order - b.order)
    : [];
  const selectedPosition = selectedRows.findIndex(
    (item) => item.id === selectedId,
  );
  const subject = (id: string) =>
    data?.subjects.find((item) => item.id === id)?.name || "Matéria";
  const topic = (id: string) =>
    data?.topics.find((item) => item.id === id)?.name || "Assunto";
  const startDate = new Date(`${weekStart}T12:00:00`);
  const endDate = new Date(`${addDays(weekStart, 6)}T12:00:00`);
  const range = `${startDate.getDate()} ${monthNames[startDate.getMonth()].toLowerCase()} – ${endDate.getDate()} ${monthNames[endDate.getMonth()].toLowerCase()}`;

  const openForm = (selectedDay: Day) => {
    contentProgress.stopAnimation();
    contentProgress.setValue(1);
    changingPicker.current = false;
    setDay(selectedDay);
    setError("");
    setPicker(null);
    formSheet.current?.open();
  };
  const transitionPicker = (
    next: "subject" | "topic" | null,
    onSwitch?: () => void,
  ) => {
    if (changingPicker.current || picker === next) return;
    changingPicker.current = true;
    Animated.timing(contentProgress, {
      toValue: 0,
      duration: 110,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        changingPicker.current = false;
        return;
      }
      onSwitch?.();
      setPicker(next);
    });
  };
  const openPicker = (next: "subject" | "topic") => {
    if (next === "topic" && !subjectId) return;
    transitionPicker(next);
  };
  const chooseItem = (id: string) => {
    if (picker === "subject") {
      transitionPicker("topic", () => {
        setError("");
        if (id !== subjectId) setTopicId("");
        setSubjectId(id);
      });
    } else {
      transitionPicker(null, () => {
        setError("");
        setTopicId(id);
      });
    }
  };
  const save = async () => {
    if (!examId || !subjectId || !topicId) {
      setError("Escolha uma matéria e um assunto.");
      return;
    }
    await update((current) => ({
      ...current,
      planned: [
        ...current.planned,
        {
          id: uid(),
          examId,
          weekStart,
          day,
          subjectId,
          topicId,
          type,
          minutes,
          order:
            Math.max(
              0,
              ...current.planned
                .filter(
                  (item) =>
                    item.examId === examId &&
                    item.weekStart === weekStart &&
                    item.day === day,
                )
                .map((item) => item.order),
            ) + 1,
          completed: false,
        },
      ],
    }));
    setSubjectId("");
    setTopicId("");
    setType("Teoria");
    setMinutes(60);
    setError("");
    formSheet.current?.close();
  };
  const openSession = (item: PlannedSession) => {
    setSelectedId(item.id);
    sessionSheet.current?.open();
  };
  const moveSelected = (direction: -1 | 1) => {
    if (!selected) return;
    const neighbor = selectedRows[selectedPosition + direction];
    if (!neighbor) return;
    update((current) => ({
      ...current,
      planned: current.planned.map((item) =>
        item.id === selected.id
          ? { ...item, order: neighbor.order }
          : item.id === neighbor.id
            ? { ...item, order: selected.order }
            : item,
      ),
    }));
    sessionSheet.current?.close();
  };
  const removeSelected = () => {
    if (!selected) return;
    update((current) => removePlannedSession(current, selected.id));
    sessionSheet.current?.close();
  };

  return (
    <Page eyebrow="ORGANIZAÇÃO" title="Sua semana">
      <View style={s.content}>
        <View style={s.overview}>
          <View>
            <Text style={s.range}>{range}</Text>
            <Text style={s.summary}>
              {planned.length
                ? `${completed} de ${planned.length} ${planned.length === 1 ? "sessão concluída" : "sessões concluídas"}`
                : "Sua semana está livre para planejar"}
            </Text>
          </View>
          <Button title="+ Sessão" onPress={() => openForm(todayIndex)} />
        </View>

        <View style={s.toolbar}>
          <View style={s.filters}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowToday(false)}
              style={[s.filter, !showToday && s.filterActive]}
            >
              <Text style={[s.filterText, !showToday && s.filterTextActive]}>
                Semana
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowToday(true)}
              style={[s.filter, showToday && s.filterActive]}
            >
              <Text style={[s.filterText, showToday && s.filterTextActive]}>
                Hoje
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/ia")}
            style={s.aiLink}
          >
            <Text style={s.aiLinkText}>Planejar com IA ↗</Text>
          </Pressable>
        </View>

        {(showToday
          ? [todayIndex]
          : weekdays.map((_, index) => index as Day)
        ).map((dayIndex) => {
          const date = new Date(`${addDays(weekStart, dayIndex)}T12:00:00`);
          const rows = data
            ? getDayPlan(data, examId, weekStart, dayIndex)
            : [];
          return (
            <View
              key={dayIndex}
              style={[
                s.dayCard,
                { backgroundColor: dayColors[dayIndex] },
                dayIndex === todayIndex && s.todayCard,
              ]}
            >
              <View style={s.dateBlock}>
                <Text style={s.weekday}>
                  {weekdays[dayIndex].toUpperCase()}
                </Text>
                <Text style={s.dateNumber}>{date.getDate()}</Text>
                <Text style={s.month}>{monthNames[date.getMonth()]}</Text>
              </View>
              <View style={s.dateDivider} />
              <View style={s.dayBody}>
                <View style={s.dayHeading}>
                  <Text style={s.dayCount}>
                    {rows.length
                      ? `${rows.length} ${rows.length === 1 ? "sessão" : "sessões"}`
                      : "Dia livre"}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Adicionar sessão em ${weekdays[dayIndex]}`}
                    onPress={() => openForm(dayIndex)}
                    style={s.addDay}
                  >
                    <Text style={s.addDayText}>+</Text>
                  </Pressable>
                </View>
                {rows.length ? (
                  rows.map((item) => (
                    <View key={item.id} style={s.sessionRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Estudar ${topic(item.topicId)}`}
                        onPress={() =>
                          router.push({
                            pathname: "/estudar",
                            params: { planId: item.id },
                          })
                        }
                        style={s.sessionMain}
                      >
                        <Text
                          style={[
                            s.sessionTitle,
                            item.completed && s.completedTitle,
                          ]}
                          numberOfLines={2}
                        >
                          {item.completed ? "✓  " : ""}
                          {topic(item.topicId)}
                        </Text>
                        <Text style={s.sessionMeta} numberOfLines={1}>
                          {subject(item.subjectId)} · {item.type} ·{" "}
                          {item.minutes} min
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Opções de ${topic(item.topicId)}`}
                        onPress={() => openSession(item)}
                        style={s.moreButton}
                      >
                        <Text style={s.moreText}>⋯</Text>
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <Text style={s.freeDay}>Um espaço para respirar.</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <BottomSheet
        ref={formSheet}
        contentKey={picker || "form"}
        title={
          picker === "subject"
            ? "Escolher matéria"
            : picker === "topic"
              ? "Escolher assunto"
              : "Nova sessão"
        }
      >
        <Animated.View
          style={{
            opacity: contentProgress,
            transform: [
              {
                translateY: contentProgress.interpolate({
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
                style={s.pickerBack}
              >
                <Text style={s.pickerBackText}>← Voltar à sessão</Text>
              </Pressable>
              {picker === "topic" && (
                <Text style={s.pickerContext} numberOfLines={1}>
                  {subject(subjectId)}
                </Text>
              )}
              <SearchablePicker
                items={pickerItems}
                label={
                  picker === "subject" ? "Buscar matéria" : "Buscar assunto"
                }
                emptyText={
                  picker === "subject"
                    ? "Ainda não há matérias neste concurso."
                    : "Esta matéria ainda não tem assuntos."
                }
                pressedStyle={s.resultPressed}
                onSelect={(item) => chooseItem(item.id)}
              />
            </View>
          ) : (
            <View>
              <Text style={s.sheetIntro}>
                Um passo de cada vez. O que você quer estudar?
              </Text>
              <View style={s.formSection}>
                <Text style={s.formLabel}>O QUE ESTUDAR</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openPicker("subject")}
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
                      {subjectId ? subject(subjectId) : "Escolher matéria"}
                    </Text>
                  </View>
                  <Text style={s.selectionArrow}>›</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!subjectId}
                  onPress={() => openPicker("topic")}
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
                      {topicId
                        ? topic(topicId)
                        : subjectId
                          ? "Escolher assunto"
                          : "Escolha a matéria primeiro"}
                    </Text>
                  </View>
                  <Text style={s.selectionArrow}>›</Text>
                </Pressable>
              </View>
              <View style={s.formSection}>
                <Text style={s.formLabel}>QUANDO</Text>
                <View style={s.dayChoices}>
                  {weekdays.map((label, index) => (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: day === index }}
                      onPress={() => setDay(index as Day)}
                      style={[s.dayChoice, day === index && s.choiceActive]}
                    >
                      <Text
                        style={[
                          s.dayChoiceText,
                          day === index && s.choiceActiveText,
                        ]}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[
                          s.dayChoiceNumber,
                          day === index && s.choiceActiveText,
                        ]}
                      >
                        {new Date(
                          `${addDays(weekStart, index)}T12:00:00`,
                        ).getDate()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={s.formSection}>
                <Text style={s.formLabel}>COMO ESTUDAR</Text>
                <View style={s.choiceRow}>
                  {studyTypes.map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: type === value }}
                      onPress={() => setType(value)}
                      style={[s.choice, type === value && s.choiceActive]}
                    >
                      <Text
                        style={[
                          s.choiceText,
                          type === value && s.choiceActiveText,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={s.durationLabel}>Duração</Text>
                <View style={s.choiceRow}>
                  {studyDurations.map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: minutes === value }}
                      onPress={() => setMinutes(value)}
                      style={[s.choice, minutes === value && s.choiceActive]}
                    >
                      <Text
                        style={[
                          s.choiceText,
                          minutes === value && s.choiceActiveText,
                        ]}
                      >
                        {value} min
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              {error ? <Text style={s.error}>{error}</Text> : null}
              <View style={s.formSubmit}>
                <Button
                  title="Adicionar ao plano"
                  onPress={save}
                  disabled={!subjectId || !topicId}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </BottomSheet>

      <BottomSheet ref={sessionSheet} title="Sessão planejada">
        {selected && (
          <View>
            <Text style={s.selectedTitle}>{topic(selected.topicId)}</Text>
            <Text style={s.selectedMeta}>
              {subject(selected.subjectId)} · {selected.type} ·{" "}
              {selected.minutes} min
            </Text>
            <View style={s.sheetActions}>
              <Button
                title="Iniciar estudo  →"
                onPress={() =>
                  sessionSheet.current?.close(() =>
                    router.push({
                      pathname: "/estudar",
                      params: { planId: selected.id },
                    }),
                  )
                }
              />
              <View style={s.orderActions}>
                <Button
                  title="Mover para cima"
                  secondary
                  disabled={selectedPosition <= 0}
                  onPress={() => moveSelected(-1)}
                />
                <Button
                  title="Mover para baixo"
                  secondary
                  disabled={selectedPosition >= selectedRows.length - 1}
                  onPress={() => moveSelected(1)}
                />
              </View>
              <Button title="Excluir sessão" danger onPress={removeSelected} />
            </View>
          </View>
        )}
      </BottomSheet>
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 800, alignSelf: "center" },
  overview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 23,
  },
  range: {
    color: palette.text,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  summary: { color: palette.muted, fontSize: 12, marginTop: 4 },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  filters: { flexDirection: "row", gap: 7 },
  filter: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panel,
  },
  filterActive: { backgroundColor: palette.dark, borderColor: palette.dark },
  filterText: { color: palette.text, fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  aiLink: { paddingVertical: 10 },
  aiLinkText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  dayCard: {
    flexDirection: "row",
    borderRadius: 23,
    padding: 17,
    marginBottom: 12,
    minHeight: 137,
  },
  todayCard: { borderWidth: 2, borderColor: palette.dark },
  dateBlock: { width: 62, justifyContent: "center" },
  weekday: { color: "#45505A", fontSize: 11, fontWeight: "800" },
  dateNumber: {
    color: palette.dark,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1.1,
    marginTop: 4,
  },
  month: { color: "#45505A", fontSize: 11, fontWeight: "700" },
  dateDivider: {
    width: 1,
    backgroundColor: "rgba(32,39,49,0.18)",
    marginRight: 16,
  },
  dayBody: { flex: 1, minWidth: 0 },
  dayHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dayCount: { color: "#45505A", fontSize: 11, fontWeight: "800" },
  addDay: {
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  addDayText: { color: palette.dark, fontSize: 22, lineHeight: 25 },
  freeDay: { color: "#586167", fontSize: 12, marginTop: 12 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.67)",
    borderRadius: 13,
    marginTop: 7,
    minHeight: 58,
  },
  sessionMain: { flex: 1, minWidth: 0, paddingVertical: 10, paddingLeft: 12 },
  sessionTitle: { color: palette.text, fontSize: 12, fontWeight: "800" },
  completedTitle: { textDecorationLine: "line-through", opacity: 0.6 },
  sessionMeta: { color: "#59636A", fontSize: 10, marginTop: 4 },
  moreButton: {
    width: 36,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { color: palette.text, fontSize: 20, lineHeight: 22 },
  sheetIntro: {
    color: palette.muted,
    fontSize: 13,
    marginBottom: 24,
    lineHeight: 19,
  },
  formSection: { marginBottom: 24 },
  formLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 11,
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
  dayChoices: { flexDirection: "row", gap: 5 },
  dayChoice: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 13,
    alignItems: "center",
    paddingVertical: 9,
    backgroundColor: "#F7F7F2",
  },
  dayChoiceText: { color: palette.muted, fontSize: 10, fontWeight: "700" },
  dayChoiceNumber: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 3,
  },
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
  choiceActiveText: { color: "#FFFFFF" },
  durationLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 9,
  },
  formSubmit: { marginTop: 2 },
  pickerBack: { alignSelf: "flex-start", paddingVertical: 7, marginBottom: 12 },
  pickerBackText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  pickerContext: { color: palette.muted, fontSize: 12, marginBottom: 12 },
  resultPressed: { opacity: 0.6 },
  error: { color: palette.danger, fontSize: 12, marginBottom: 12 },
  selectedTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 5,
  },
  selectedMeta: { color: palette.muted, fontSize: 12 },
  sheetActions: { gap: 14, marginTop: 24 },
  orderActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
