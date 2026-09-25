import { useEffect, useMemo, useRef, useState } from "react";
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
} from "@global/components/ui";
import { useStore } from "@global/store/store";
import { examProgress } from "@domain/stats";
import { Exam, Subject, today, Topic, uid } from "@domain/types";
import { normalizeText } from "@global/utils/normalizeText";
import ExamDateField from "./ExamDateField";
import { displayExamDate, parseExamDate } from "../utils/examDate";
import {
  removeExam as removeExamData,
  removeSubject as removeSubjectData,
  removeTopicTree,
} from "../utils/catalogOperations";

type CatalogView = "list" | "subject" | "topic" | "subjectForm" | "topicForm";
const colors = ["#DAEACD", "#DAE3F7", "#F8DDD0", "#E9DDF2", "#D7E9EA"];

export default function ExamsScreen() {
  const { data, update } = useStore();
  const exam = data?.exams.find((item) => item.id === data.activeExamId);
  const subjects = useMemo(
    () => data?.subjects.filter((item) => item.examId === exam?.id) || [],
    [data?.subjects, exam?.id],
  );
  const [examView, setExamView] = useState<"actions" | "form">("form");
  const [examTargetId, setExamTargetId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [board, setBoard] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("20");
  const [examError, setExamError] = useState("");
  const [catalogView, setCatalogView] = useState<CatalogView>("list");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [parentId, setParentId] = useState<string | undefined>();
  const [catalogError, setCatalogError] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const [catalogProgress] = useState(() => new Animated.Value(1));
  const changingCatalog = useRef(false);
  const examSheet = useRef<BottomSheetHandle>(null);
  const catalogSheet = useRef<BottomSheetHandle>(null);

  const selectedSubject = subjects.find(
    (item) => item.id === selectedSubjectId,
  );
  const selectedTopic = data?.topics.find(
    (item) => item.id === selectedTopicId,
  );
  const subjectTopics =
    data?.topics.filter((item) => item.subjectId === selectedSubjectId) || [];
  const filteredSubjects = subjects
    .filter((item) =>
      normalizeText(item.name).includes(normalizeText(query.trim())),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const filteredTopics = subjectTopics.filter((item) =>
    normalizeText(item.name).includes(normalizeText(query.trim())),
  );
  const topicDepth = (item: Topic) => {
    let depth = 0;
    let parent = item.parentId;
    while (parent && depth < 4) {
      depth += 1;
      parent = subjectTopics.find((topic) => topic.id === parent)?.parentId;
    }
    return depth;
  };

  useEffect(() => {
    if (!changingCatalog.current) return;
    Animated.timing(catalogProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      changingCatalog.current = false;
    });
  }, [catalogView, catalogProgress]);
  const openCatalog = (
    view: CatalogView,
    subjectId?: string,
    topicId?: string,
  ) => {
    catalogProgress.stopAnimation();
    catalogProgress.setValue(1);
    changingCatalog.current = false;
    setSelectedSubjectId(subjectId || null);
    setSelectedTopicId(topicId || null);
    setCatalogView(view);
    setQuery("");
    setVisibleCount(30);
    setCatalogError("");
    setConfirm(null);
    if (view === "subjectForm") {
      setEditingSubjectId(null);
      setSubjectName("");
    }
    catalogSheet.current?.open();
  };
  const transitionCatalog = (view: CatalogView, onSwitch?: () => void) => {
    if (changingCatalog.current || catalogView === view) return;
    changingCatalog.current = true;
    Animated.timing(catalogProgress, {
      toValue: 0,
      duration: 110,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        changingCatalog.current = false;
        return;
      }
      onSwitch?.();
      setQuery("");
      setVisibleCount(30);
      setCatalogError("");
      setConfirm(null);
      setCatalogView(view);
    });
  };
  const openExamForm = (item?: Exam, inSheet = false) => {
    setEditingExamId(item?.id || null);
    setName(item?.name || "");
    setRole(item?.role || "");
    setBoard(item?.board || "");
    setDate(displayExamDate(item?.examDate));
    setHours(String(item?.hoursPerWeek || 20));
    setExamError("");
    setConfirm(null);
    setExamView("form");
    if (!inSheet) examSheet.current?.open();
  };
  const saveExam = async () => {
    const examDate = parseExamDate(date);
    if (
      !name.trim() ||
      !role.trim() ||
      !Number.isFinite(Number(hours)) ||
      Number(hours) <= 0 ||
      examDate === null
    ) {
      setExamError(
        "Informe nome, cargo, horas válidas e uma data real em DD/MM/AAAA.",
      );
      return;
    }
    const id = editingExamId || uid();
    await update((current) => ({
      ...current,
      exams: editingExamId
        ? current.exams.map((item) =>
            item.id === editingExamId
              ? {
                  ...item,
                  name: name.trim(),
                  role: role.trim(),
                  board: board.trim(),
                  examDate: examDate || undefined,
                  hoursPerWeek: Number(hours),
                }
              : item,
          )
        : [
            ...current.exams,
            {
              id,
              name: name.trim(),
              role: role.trim(),
              board: board.trim(),
              examDate: examDate || undefined,
              hoursPerWeek: Number(hours),
              createdAt: today(),
            },
          ],
      activeExamId: id,
    }));
    setEditingExamId(null);
    setExamError("");
    examSheet.current?.close();
  };
  const removeExam = async (id: string) => {
    await update((current) => removeExamData(current, id));
    setConfirm(null);
    examSheet.current?.close();
  };
  const openSubjectForm = (item?: Subject) =>
    transitionCatalog("subjectForm", () => {
      setEditingSubjectId(item?.id || null);
      setSubjectName(item?.name || "");
    });
  const saveSubject = async () => {
    const value = subjectName.trim();
    if (!value) {
      setCatalogError("Informe o nome da matéria.");
      return;
    }
    if (
      subjects.some(
        (item) =>
          item.id !== editingSubjectId &&
          normalizeText(item.name) === normalizeText(value),
      )
    ) {
      setCatalogError("Já existe uma matéria com esse nome neste concurso.");
      return;
    }
    const id = editingSubjectId || uid();
    await update((current) => ({
      ...current,
      subjects: editingSubjectId
        ? current.subjects.map((item) =>
            item.id === id ? { ...item, name: value } : item,
          )
        : [...current.subjects, { id, examId: exam!.id, name: value }],
    }));
    transitionCatalog("subject", () => {
      setSelectedSubjectId(id);
      setEditingSubjectId(null);
      setSubjectName("");
    });
  };
  const removeSubject = async () => {
    if (!selectedSubject) return;
    if (confirm !== selectedSubject.id) {
      setConfirm(selectedSubject.id);
      return;
    }
    const id = selectedSubject.id;
    await update((current) => removeSubjectData(current, id));
    setSelectedSubjectId(null);
    setConfirm(null);
    setCatalogView("list");
  };
  const openTopicForm = (item?: Topic, asChild = false) =>
    transitionCatalog("topicForm", () => {
      setEditingTopicId(asChild ? null : item?.id || null);
      setTopicName(asChild ? "" : item?.name || "");
      setParentId(asChild ? item?.id : item?.parentId);
    });
  const saveTopic = async () => {
    if (!selectedSubject) return;
    const value = topicName.trim();
    if (!value) {
      setCatalogError("Informe o nome do assunto.");
      return;
    }
    if (
      subjectTopics.some(
        (item) =>
          item.id !== editingTopicId &&
          item.parentId === parentId &&
          normalizeText(item.name) === normalizeText(value),
      )
    ) {
      setCatalogError("Já existe um assunto com esse nome neste nível.");
      return;
    }
    const id = editingTopicId || uid();
    await update((current) => ({
      ...current,
      topics: editingTopicId
        ? current.topics.map((item) =>
            item.id === id ? { ...item, name: value } : item,
          )
        : [
            ...current.topics,
            {
              id,
              subjectId: selectedSubject.id,
              parentId,
              name: value,
              studied: false,
            },
          ],
    }));
    transitionCatalog("subject", () => {
      setEditingTopicId(null);
      setTopicName("");
      setParentId(undefined);
    });
  };
  const toggleStudied = (id: string) =>
    update((current) => ({
      ...current,
      topics: current.topics.map((item) =>
        item.id === id ? { ...item, studied: !item.studied } : item,
      ),
    }));
  const removeTopic = async () => {
    if (!selectedTopic) return;
    if (confirm !== selectedTopic.id) {
      setConfirm(selectedTopic.id);
      return;
    }
    await update((current) => removeTopicTree(current, selectedTopic.id));
    setSelectedTopicId(null);
    setConfirm(null);
    setCatalogView("subject");
  };
  const topicRow = (item: Topic) => (
    <Pressable
      key={item.id}
      accessibilityRole="button"
      onPress={() =>
        transitionCatalog("topic", () => setSelectedTopicId(item.id))
      }
      style={[s.topicRow, { marginLeft: topicDepth(item) * 14 }]}
    >
      <View style={[s.topicMark, item.studied && s.topicMarkDone]}>
        <Text style={s.topicMarkText}>{item.studied ? "✓" : "○"}</Text>
      </View>
      <Text style={s.topicRowTitle} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={s.rowArrow}>›</Text>
    </Pressable>
  );

  return (
    <Page eyebrow="SEU OBJETIVO" title="Meus editais">
      <View style={s.content}>
        {exam ? (
          <View style={s.hero}>
            <View style={s.heroTop}>
              <Text style={s.heroEyebrow}>CONCURSO ATIVO</Text>
              <Text style={s.heroProgress}>
                {data ? examProgress(data, exam.id) : 0}%
              </Text>
            </View>
            <Text style={s.heroTitle} numberOfLines={2}>
              {exam.name}
            </Text>
            <Text style={s.heroRole}>{exam.role}</Text>
            <View style={s.heroMeta}>
              <Text style={s.heroTag}>{exam.hoursPerWeek}h por semana</Text>
              {exam.examDate && (
                <Text style={s.heroTag}>Prova: {displayExamDate(exam.examDate)}</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setExamTargetId(exam.id);
                setExamView("actions");
                setConfirm(null);
                examSheet.current?.open();
              }}
              style={s.heroAction}
            >
              <Text style={s.heroActionText}>Ajustar concurso ›</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.emptyHero}>
            <Text style={s.emptyTitle}>Seu próximo objetivo começa aqui.</Text>
            <Text style={s.emptyHint}>
              Cadastre um concurso para organizar matérias e estudos.
            </Text>
            <Button
              title="Criar meu primeiro concurso"
              onPress={() => openExamForm()}
            />
          </View>
        )}

        {exam && (
          <>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>Matérias</Text>
                <Text style={s.sectionSubtitle}>
                  {subjects.length} no seu edital
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => openCatalog("subjectForm")}
                style={s.addButton}
              >
                <Text style={s.addText}>+ Adicionar</Text>
              </Pressable>
            </View>
            {subjects.slice(0, 6).map((item, index) => {
              const topics =
                data?.topics.filter((topic) => topic.subjectId === item.id) ||
                [];
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => openCatalog("subject", item.id)}
                  style={[
                    s.subjectCard,
                    { backgroundColor: colors[index % colors.length] },
                  ]}
                >
                  <View style={s.subjectBadge}>
                    <Text style={s.subjectBadgeText}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={s.subjectBody}>
                    <Text style={s.subjectTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={s.subjectMeta}>
                      {topics.filter((topic) => topic.studied).length} de{" "}
                      {topics.length} assuntos estudados
                    </Text>
                  </View>
                  <Text style={s.rowArrow}>›</Text>
                </Pressable>
              );
            })}
            {!subjects.length && (
              <Text style={s.emptyList}>
                Adicione sua primeira matéria para montar o edital.
              </Text>
            )}
            {subjects.length > 6 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => openCatalog("list")}
                style={s.allButton}
              >
                <Text style={s.allText}>
                  Ver todas as {subjects.length} matérias →
                </Text>
              </Pressable>
            )}
          </>
        )}

        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Outros concursos</Text>
            <Text style={s.sectionSubtitle}>Alterne quando quiser</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => openExamForm()}
            style={s.addButton}
          >
            <Text style={s.addText}>+ Novo</Text>
          </Pressable>
        </View>
        {data?.exams
          .filter((item) => item.id !== exam?.id)
          .map((item) => (
            <View key={item.id} style={s.otherCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ativar ${item.name}`}
                onPress={() =>
                  update((current) => ({ ...current, activeExamId: item.id }))
                }
                style={s.otherMain}
              >
                <Text style={s.otherTitle} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={s.otherMeta}>
                  {item.role} · {data ? examProgress(data, item.id) : 0}%
                  concluído
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Opções de ${item.name}`}
                onPress={() => {
                  setExamTargetId(item.id);
                  setExamView("actions");
                  setConfirm(null);
                  examSheet.current?.open();
                }}
                style={s.moreButton}
              >
                <Text style={s.moreText}>⋯</Text>
              </Pressable>
            </View>
          ))}
      </View>

      <BottomSheet
        ref={examSheet}
        title={
          examView === "form"
            ? editingExamId
              ? "Editar concurso"
              : "Novo concurso"
            : "Concurso"
        }
      >
        {examView === "form" ? (
          <View>
            <Text style={s.sheetIntro}>
              Organize seu objetivo em um lugar só.
            </Text>
            <Field
              label="Nome do concurso"
              value={name}
              onChangeText={setName}
              placeholder="Ex.: DETRAN-SP"
            />
            <Field
              label="Cargo"
              value={role}
              onChangeText={setRole}
              placeholder="Ex.: Agente Estadual"
            />
            <Field
              label="Banca (opcional)"
              value={board}
              onChangeText={setBoard}
            />
            <ExamDateField value={date} onChange={setDate} />
            <Field
              label="Horas por semana"
              value={hours}
              onChangeText={setHours}
              keyboardType="numeric"
            />
            {examError ? <Text style={s.error}>{examError}</Text> : null}
            <Button
              title={editingExamId ? "Salvar alterações" : "Criar concurso"}
              onPress={saveExam}
            />
          </View>
        ) : (
          <View>
            <Text style={s.detailTitle}>
              {data?.exams.find((item) => item.id === examTargetId)?.name}
            </Text>
            <Text style={s.detailMeta}>
              {data?.exams.find((item) => item.id === examTargetId)?.role}
            </Text>
            <View style={s.detailActions}>
              {examTargetId !== data?.activeExamId && (
                <Button
                  title="Tornar ativo"
                  onPress={() => {
                    update((current) => ({
                      ...current,
                      activeExamId: examTargetId,
                    }));
                    examSheet.current?.close();
                  }}
                />
              )}
              <Button
                title="Editar concurso"
                secondary
                onPress={() =>
                  openExamForm(
                    data?.exams.find((item) => item.id === examTargetId),
                    true,
                  )
                }
              />
              {confirm === examTargetId && (
                <Text style={s.confirmText}>
                  Isso exclui matérias, sessões e revisões deste concurso.
                </Text>
              )}
              <Button
                title={
                  confirm === examTargetId
                    ? "Confirmar exclusão"
                    : "Excluir concurso"
                }
                danger
                onPress={() =>
                  confirm === examTargetId
                    ? removeExam(examTargetId!)
                    : setConfirm(examTargetId)
                }
              />
            </View>
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        ref={catalogSheet}
        contentKey={catalogView}
        title={
          catalogView === "list"
            ? "Todas as matérias"
            : catalogView === "subject"
              ? selectedSubject?.name || "Matéria"
              : catalogView === "topic"
                ? "Assunto"
                : catalogView === "subjectForm"
                  ? editingSubjectId
                    ? "Editar matéria"
                    : "Nova matéria"
                  : editingTopicId
                    ? "Editar assunto"
                    : parentId
                      ? "Novo subassunto"
                      : "Novo assunto"
        }
      >
        <Animated.View
          style={{
            opacity: catalogProgress,
            transform: [
              {
                translateY: catalogProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          {catalogView === "list" && (
            <View>
              <Text style={s.sheetIntro}>
                Encontre uma matéria ou adicione uma nova.
              </Text>
              <TextInput
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setVisibleCount(30);
                }}
                placeholder="Buscar matéria"
                placeholderTextColor={palette.muted}
                accessibilityLabel="Buscar matéria"
                style={s.searchInput}
              />
              <Text style={s.resultCount}>
                {filteredSubjects.length}{" "}
                {filteredSubjects.length === 1 ? "matéria" : "matérias"}
              </Text>
              {filteredSubjects.slice(0, visibleCount).map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() =>
                    transitionCatalog("subject", () =>
                      setSelectedSubjectId(item.id),
                    )
                  }
                  style={s.listRow}
                >
                  <Text style={s.listTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={s.rowArrow}>›</Text>
                </Pressable>
              ))}
              {filteredSubjects.length > visibleCount && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setVisibleCount((count) => count + 30)}
                  style={s.allButton}
                >
                  <Text style={s.allText}>Mostrar mais resultados</Text>
                </Pressable>
              )}
              {!filteredSubjects.length && (
                <Text style={s.emptyList}>Nenhuma matéria encontrada.</Text>
              )}
              <View style={s.sheetAction}>
                <Button
                  title="+ Nova matéria"
                  onPress={() => openSubjectForm()}
                />
              </View>
            </View>
          )}
          {catalogView === "subject" && selectedSubject && (
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={() => transitionCatalog("list")}
                style={s.backButton}
              >
                <Text style={s.backText}>← Todas as matérias</Text>
              </Pressable>
              <View style={s.subjectSummary}>
                <Text style={s.summaryName}>{selectedSubject.name}</Text>
                <Text style={s.summaryMeta}>
                  {subjectTopics.filter((item) => item.studied).length} de{" "}
                  {subjectTopics.length} assuntos estudados
                </Text>
              </View>
              <View style={s.inlineActions}>
                <Button title="+ Assunto" onPress={() => openTopicForm()} />
                <Button
                  title="Editar matéria"
                  secondary
                  onPress={() => openSubjectForm(selectedSubject)}
                />
              </View>
              <TextInput
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setVisibleCount(30);
                }}
                placeholder="Buscar assunto"
                placeholderTextColor={palette.muted}
                accessibilityLabel="Buscar assunto"
                style={s.searchInput}
              />
              <Text style={s.resultCount}>
                {filteredTopics.length}{" "}
                {filteredTopics.length === 1 ? "assunto" : "assuntos"}
              </Text>
              {filteredTopics.slice(0, visibleCount).map(topicRow)}
              {filteredTopics.length > visibleCount && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setVisibleCount((count) => count + 30)}
                  style={s.allButton}
                >
                  <Text style={s.allText}>Mostrar mais resultados</Text>
                </Pressable>
              )}
              {!filteredTopics.length && (
                <Text style={s.emptyList}>
                  {subjectTopics.length
                    ? "Nenhum assunto encontrado."
                    : "Adicione o primeiro assunto desta matéria."}
                </Text>
              )}
              <View style={s.dangerArea}>
                {confirm === selectedSubject.id && (
                  <Text style={s.confirmText}>
                    Isso também remove os assuntos e registros ligados a esta
                    matéria.
                  </Text>
                )}
                <Button
                  title={
                    confirm === selectedSubject.id
                      ? "Confirmar exclusão"
                      : "Excluir matéria"
                  }
                  danger
                  onPress={removeSubject}
                />
              </View>
            </View>
          )}
          {catalogView === "topic" && selectedTopic && (
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={() => transitionCatalog("subject")}
                style={s.backButton}
              >
                <Text style={s.backText}>← Voltar à matéria</Text>
              </Pressable>
              <View style={s.subjectSummary}>
                <Text style={s.summaryName}>{selectedTopic.name}</Text>
                <Text style={s.summaryMeta}>
                  {selectedTopic.parentId ? "Subassunto" : "Assunto principal"}{" "}
                  · {selectedTopic.studied ? "Estudado" : "Ainda não estudado"}
                </Text>
              </View>
              <View style={s.detailActions}>
                <Button
                  title={
                    selectedTopic.studied
                      ? "Marcar como não estudado"
                      : "Marcar como estudado  ✓"
                  }
                  onPress={() => toggleStudied(selectedTopic.id)}
                />
                <Button
                  title="+ Adicionar subassunto"
                  secondary
                  onPress={() => openTopicForm(selectedTopic, true)}
                />
                <Button
                  title="Editar assunto"
                  secondary
                  onPress={() => openTopicForm(selectedTopic)}
                />
                {confirm === selectedTopic.id && (
                  <Text style={s.confirmText}>
                    Isso remove este assunto, seus subassuntos e registros
                    ligados a eles.
                  </Text>
                )}
                <Button
                  title={
                    confirm === selectedTopic.id
                      ? "Confirmar exclusão"
                      : "Excluir assunto"
                  }
                  danger
                  onPress={removeTopic}
                />
              </View>
            </View>
          )}
          {catalogView === "subjectForm" && (
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  transitionCatalog(
                    editingSubjectId
                      ? "subject"
                      : selectedSubjectId
                        ? "subject"
                        : "list",
                  )
                }
                style={s.backButton}
              >
                <Text style={s.backText}>← Voltar</Text>
              </Pressable>
              <Text style={s.sheetIntro}>
                Dê um nome claro para encontrar a matéria com facilidade.
              </Text>
              <Field
                label="Nome da matéria"
                value={subjectName}
                onChangeText={setSubjectName}
                placeholder="Ex.: Direito Constitucional"
              />
              {catalogError ? (
                <Text style={s.error}>{catalogError}</Text>
              ) : null}
              <Button
                title={
                  editingSubjectId ? "Salvar matéria" : "Adicionar matéria"
                }
                onPress={saveSubject}
              />
            </View>
          )}
          {catalogView === "topicForm" && (
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  transitionCatalog(
                    editingTopicId || parentId ? "topic" : "subject",
                  )
                }
                style={s.backButton}
              >
                <Text style={s.backText}>← Voltar</Text>
              </Pressable>
              <Text style={s.sheetIntro}>
                {parentId
                  ? `Dentro de ${data?.topics.find((item) => item.id === parentId)?.name || "um assunto"}.`
                  : `Em ${selectedSubject?.name || "sua matéria"}.`}
              </Text>
              <Field
                label={parentId ? "Nome do subassunto" : "Nome do assunto"}
                value={topicName}
                onChangeText={setTopicName}
                placeholder="Ex.: Crase"
              />
              {catalogError ? (
                <Text style={s.error}>{catalogError}</Text>
              ) : null}
              <Button
                title={
                  editingTopicId
                    ? "Salvar assunto"
                    : parentId
                      ? "Adicionar subassunto"
                      : "Adicionar assunto"
                }
                onPress={saveTopic}
              />
            </View>
          )}
        </Animated.View>
      </BottomSheet>
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 760, alignSelf: "center" },
  hero: {
    backgroundColor: "#DDE7FB",
    borderRadius: 25,
    padding: 23,
    marginBottom: 28,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroEyebrow: {
    color: "#53647A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroProgress: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 31,
    marginTop: 18,
  },
  heroRole: { color: "#53647A", fontSize: 13, marginTop: 4 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 19 },
  heroTag: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroAction: { alignSelf: "flex-start", paddingVertical: 11, marginTop: 13 },
  heroActionText: { color: palette.text, fontSize: 12, fontWeight: "800" },
  emptyHero: {
    backgroundColor: "#DDE7FB",
    borderRadius: 24,
    padding: 23,
    marginBottom: 28,
  },
  emptyTitle: { color: palette.text, fontSize: 20, fontWeight: "800" },
  emptyHint: { color: "#53647A", fontSize: 12, marginTop: 7, marginBottom: 19 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 13,
    marginTop: 7,
  },
  sectionTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
  addButton: {
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  addText: { color: palette.text, fontSize: 11, fontWeight: "800" },
  subjectCard: {
    borderRadius: 18,
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    marginBottom: 9,
  },
  subjectBadge: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.62)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  subjectBadgeText: { color: palette.text, fontSize: 15, fontWeight: "800" },
  subjectBody: { flex: 1, minWidth: 0 },
  subjectTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  subjectMeta: { color: "#59636A", fontSize: 10, marginTop: 5 },
  rowArrow: { color: palette.text, fontSize: 25, marginLeft: 10 },
  emptyList: { color: palette.muted, fontSize: 12, paddingVertical: 19 },
  allButton: { alignItems: "center", paddingVertical: 13, marginBottom: 15 },
  allText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  otherCard: {
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },
  otherMain: { flex: 1, minWidth: 0, padding: 15 },
  otherTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  otherMeta: { color: palette.muted, fontSize: 11, marginTop: 5 },
  moreButton: {
    width: 45,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { color: palette.text, fontSize: 21 },
  sheetIntro: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  error: { color: palette.danger, fontSize: 12, marginBottom: 12 },
  detailTitle: { color: palette.text, fontSize: 19, fontWeight: "800" },
  detailMeta: { color: palette.muted, fontSize: 12, marginTop: 5 },
  detailActions: { gap: 12, marginTop: 25 },
  confirmText: { color: palette.danger, fontSize: 12, lineHeight: 18 },
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
  listRow: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#F7F7F2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  listTitle: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  sheetAction: { marginTop: 17 },
  backButton: { alignSelf: "flex-start", paddingVertical: 7, marginBottom: 12 },
  backText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  subjectSummary: {
    backgroundColor: "#E7E1F8",
    borderRadius: 18,
    padding: 17,
    marginBottom: 16,
  },
  summaryName: { color: palette.text, fontSize: 17, fontWeight: "800" },
  summaryMeta: { color: "#695F84", fontSize: 11, marginTop: 5 },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 19,
  },
  topicRow: {
    minHeight: 51,
    borderRadius: 13,
    backgroundColor: "#F7F7F2",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 7,
  },
  topicMark: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#BBC2BD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  topicMarkDone: { backgroundColor: "#D6EACF", borderColor: "#D6EACF" },
  topicMarkText: { color: "#54765A", fontSize: 16 },
  topicRowTitle: {
    flex: 1,
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  dangerArea: { gap: 10, marginTop: 25 },
});
