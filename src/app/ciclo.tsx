import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
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
  Page,
  palette,
} from "@/components/ui";
import { useStore } from "@/data/store";
import { StudyType, uid } from "@/domain/types";

const studyTypes: StudyType[] = ["Teoria", "Questões", "Revisão"];
const durations = [30, 45, 60, 90, 120];
const colors = ["#DAEACD", "#F8DDD0", "#DAE3F7", "#E9DDF2", "#D7E9EA"];
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function CycleScreen() {
  const { data, update } = useStore();
  const examId = data?.activeExamId || "";
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState<StudyType>("Teoria");
  const [minutes, setMinutes] = useState(60);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<"subject" | "topic" | null>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const [pickerProgress] = useState(() => new Animated.Value(1));
  const changingPicker = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formSheet = useRef<BottomSheetHandle>(null);
  const itemSheet = useRef<BottomSheetHandle>(null);

  const items =
    data?.cycle
      .filter((item) => item.examId === examId)
      .sort((a, b) => a.order - b.order) || [];
  const position = data?.cyclePosition[examId] || 0;
  const next = items[position % items.length];
  const selected = items.find((item) => item.id === selectedId);
  const selectedIndex = items.findIndex((item) => item.id === selectedId);
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
  const subject = (id: string) =>
    data?.subjects.find((item) => item.id === id)?.name || "Matéria";
  const topic = (id: string) =>
    data?.topics.find((item) => item.id === id)?.name || "Assunto";

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
  const openForm = () => {
    pickerProgress.stopAnimation();
    pickerProgress.setValue(1);
    changingPicker.current = false;
    setPicker(null);
    setQuery("");
    setError("");
    formSheet.current?.open();
  };
  const transitionPicker = (
    nextPicker: "subject" | "topic" | null,
    onSwitch?: () => void,
  ) => {
    if (changingPicker.current || picker === nextPicker) return;
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
      setPicker(nextPicker);
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
  const addItem = async () => {
    if (!examId || !subjectId || !topicId) {
      setError("Escolha uma matéria e um assunto.");
      return;
    }
    await update((current) => ({
      ...current,
      cycle: [
        ...current.cycle,
        {
          id: uid(),
          examId,
          subjectId,
          topicId,
          type,
          minutes,
          order:
            Math.max(
              -1,
              ...current.cycle
                .filter((item) => item.examId === examId)
                .map((item) => item.order),
            ) + 1,
        },
      ],
    }));
    formSheet.current?.close(() => {
      setSubjectId("");
      setTopicId("");
      setType("Teoria");
      setMinutes(60);
      setError("");
    });
  };
  const moveSelected = (direction: -1 | 1) => {
    if (!selected) return;
    const neighbor = items[selectedIndex + direction];
    if (!neighbor) return;
    update((current) => ({
      ...current,
      cycle: current.cycle.map((item) =>
        item.id === selected.id
          ? { ...item, order: neighbor.order }
          : item.id === neighbor.id
            ? { ...item, order: selected.order }
            : item,
      ),
    }));
    itemSheet.current?.close();
  };
  const removeSelected = () => {
    if (!selected) return;
    update((current) => ({
      ...current,
      cycle: current.cycle.filter((item) => item.id !== selected.id),
      cyclePosition: { ...current.cyclePosition, [examId]: 0 },
    }));
    itemSheet.current?.close();
  };

  return (
    <Page eyebrow="RITMO FLEXÍVEL" title="Seu ciclo">
      <View style={s.content}>
        <Text style={s.intro}>
          Uma sessão de cada vez, sem prender seu estudo ao calendário.
        </Text>
        {next ? (
          <View style={s.nextCard}>
            <Text style={s.nextEyebrow}>
              PRÓXIMO PASSO · {(position % items.length) + 1} DE {items.length}
            </Text>
            <Text style={s.nextTitle} numberOfLines={2}>
              {topic(next.topicId)}
            </Text>
            <Text style={s.nextSubject} numberOfLines={1}>
              {subject(next.subjectId)}
            </Text>
            <View style={s.nextTags}>
              <Text style={s.nextTag}>{next.type}</Text>
              <Text style={s.nextTag}>{next.minutes} min</Text>
            </View>
            <Button
              title="Começar estudo  →"
              onPress={() =>
                router.push({
                  pathname: "/estudar",
                  params: { cycleId: next.id },
                })
              }
            />
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>◌</Text>
            <Text style={s.emptyTitle}>Seu ciclo começa aqui</Text>
            <Text style={s.emptyHint}>
              Adicione um assunto para criar uma sequência flexível.
            </Text>
            <Button title="Adicionar primeiro estudo" onPress={openForm} />
          </View>
        )}

        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Sequência</Text>
            <Text style={s.sectionSubtitle}>
              {items.length} {items.length === 1 ? "estudo" : "estudos"} no
              ciclo
            </Text>
          </View>
          {items.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={openForm}
              style={s.addButton}
            >
              <Text style={s.addText}>+ Adicionar</Text>
            </Pressable>
          )}
        </View>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Opções de ${topic(item.topicId)}`}
            onPress={() => {
              setSelectedId(item.id);
              itemSheet.current?.open();
            }}
            style={[
              s.itemCard,
              { backgroundColor: colors[index % colors.length] },
            ]}
          >
            <View style={s.itemNumber}>
              <Text style={s.itemNumberText}>
                {String(index + 1).padStart(2, "0")}
              </Text>
            </View>
            <View style={s.itemBody}>
              <Text style={s.itemTitle} numberOfLines={2}>
                {topic(item.topicId)}
              </Text>
              <Text style={s.itemMeta} numberOfLines={1}>
                {subject(item.subjectId)} · {item.type} · {item.minutes} min
              </Text>
            </View>
            <Text style={s.itemArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <BottomSheet
        ref={formSheet}
        contentKey={picker || "form"}
        title={
          picker === "subject"
            ? "Escolher matéria"
            : picker === "topic"
              ? "Escolher assunto"
              : "Adicionar ao ciclo"
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
                <Text style={s.backText}>← Voltar ao ciclo</Text>
              </Pressable>
              {picker === "topic" && (
                <Text style={s.pickerContext} numberOfLines={1}>
                  {subject(subjectId)}
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
                      style={s.resultRow}
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
                Escolha o próximo assunto para sua sequência.
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
                    {subjectId ? subject(subjectId) : "Escolher matéria"}
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
                    {topicId
                      ? topic(topicId)
                      : subjectId
                        ? "Escolher assunto"
                        : "Escolha a matéria primeiro"}
                  </Text>
                </View>
                <Text style={s.selectionArrow}>›</Text>
              </Pressable>
              <Text style={[s.formLabel, s.optionsLabel]}>TIPO DE ESTUDO</Text>
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
                        type === value && s.choiceTextActive,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.durationLabel}>Duração</Text>
              <View style={s.choiceRow}>
                {durations.map((value) => (
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
                        minutes === value && s.choiceTextActive,
                      ]}
                    >
                      {value} min
                    </Text>
                  </Pressable>
                ))}
              </View>
              {error ? <Text style={s.error}>{error}</Text> : null}
              <View style={s.formAction}>
                <Button
                  title="Adicionar ao ciclo"
                  onPress={addItem}
                  disabled={!subjectId || !topicId}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </BottomSheet>

      <BottomSheet ref={itemSheet} title="Estudo no ciclo">
        {selected && (
          <View>
            <Text style={s.selectedTitle}>{topic(selected.topicId)}</Text>
            <Text style={s.selectedMeta}>
              {subject(selected.subjectId)} · {selected.type} ·{" "}
              {selected.minutes} min
            </Text>
            <View style={s.itemActions}>
              <Button
                title="Começar estudo  →"
                onPress={() =>
                  itemSheet.current?.close(() =>
                    router.push({
                      pathname: "/estudar",
                      params: { cycleId: selected.id },
                    }),
                  )
                }
              />
              <View style={s.orderActions}>
                <Button
                  title="Mover para cima"
                  secondary
                  disabled={selectedIndex <= 0}
                  onPress={() => moveSelected(-1)}
                />
                <Button
                  title="Mover para baixo"
                  secondary
                  disabled={selectedIndex >= items.length - 1}
                  onPress={() => moveSelected(1)}
                />
              </View>
              <Button
                title="Excluir do ciclo"
                danger
                onPress={removeSelected}
              />
            </View>
          </View>
        )}
      </BottomSheet>
    </Page>
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
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    letterSpacing: -0.5,
    marginTop: 23,
  },
  nextSubject: { color: "#53647A", fontSize: 13, marginTop: 5 },
  nextTags: { flexDirection: "row", gap: 7, marginTop: 18, marginBottom: 23 },
  nextTag: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
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
  sectionTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
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
    minHeight: 87,
    padding: 14,
    marginBottom: 10,
  },
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
  itemMeta: { color: "#59636A", fontSize: 10, marginTop: 5 },
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
  optionsLabel: { marginTop: 18 },
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
  durationLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 9,
  },
  formAction: { marginTop: 25 },
  error: { color: palette.danger, fontSize: 12, marginTop: 13 },
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
