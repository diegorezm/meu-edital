import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Empty, Field, Page, palette, Section } from "@/components/ui";
import { useStore } from "@/data/store";
import { examProgress } from "@/domain/logic";
import { today, uid } from "@/domain/types";

export default function ExamsScreen() {
  const { data, update } = useStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [board, setBoard] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("20");
  const [subjectName, setSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [topicName, setTopicName] = useState("");
  const [parentId, setParentId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const exam = data?.exams.find((e) => e.id === data.activeExamId);
  const subjects = data?.subjects.filter((s) => s.examId === exam?.id) || [];
  const saveExam = async () => {
    if (
      !name.trim() ||
      !role.trim() ||
      !Number.isFinite(Number(hours)) ||
      Number(hours) <= 0 ||
      (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
    ) {
      setError(
        "Informe nome, cargo, horas válidas e data no formato AAAA-MM-DD.",
      );
      return;
    }
    const id = editing || uid();
    await update((d) => ({
      ...d,
      exams: editing
        ? d.exams.map((e) =>
            e.id === editing
              ? {
                  ...e,
                  name: name.trim(),
                  role: role.trim(),
                  board: board.trim(),
                  examDate: date || undefined,
                  hoursPerWeek: Number(hours),
                }
              : e,
          )
        : [
            ...d.exams,
            {
              id,
              name: name.trim(),
              role: role.trim(),
              board: board.trim(),
              examDate: date || undefined,
              hoursPerWeek: Number(hours),
              createdAt: today(),
            },
          ],
      activeExamId: id,
    }));
    setName("");
    setRole("");
    setBoard("");
    setDate("");
    setHours("20");
    setEditing(null);
    setError("");
  };
  const editExam = (id: string) => {
    const e = data?.exams.find((x) => x.id === id);
    if (!e) return;
    setEditing(id);
    setName(e.name);
    setRole(e.role);
    setBoard(e.board || "");
    setDate(e.examDate || "");
    setHours(String(e.hoursPerWeek));
  };
  const removeExam = async (id: string) => {
    await update((d) => {
      const subjectIds = new Set(
        d.subjects.filter((s) => s.examId === id).map((s) => s.id),
      );
      return {
        ...d,
        exams: d.exams.filter((e) => e.id !== id),
        subjects: d.subjects.filter((s) => s.examId !== id),
        topics: d.topics.filter((t) => !subjectIds.has(t.subjectId)),
        planned: d.planned.filter((p) => p.examId !== id),
        sessions: d.sessions.filter((s) => s.examId !== id),
        reviews: d.reviews.filter((r) => r.examId !== id),
        cycle: d.cycle.filter((c) => c.examId !== id),
        activeExamId:
          d.activeExamId === id
            ? d.exams.find((e) => e.id !== id)?.id || null
            : d.activeExamId,
      };
    });
    setConfirm(null);
  };
  return (
    <Page eyebrow="Seu espaço" title="Concursos e edital">
      <Section title="Meus concursos">
        {data?.exams.map((e) => (
          <View key={e.id} style={s.examRow}>
            <Pressable
              onPress={() => update((d) => ({ ...d, activeExamId: e.id }))}
              style={{ flex: 1 }}
            >
              <Text style={s.rowTitle}>
                {e.id === data.activeExamId ? "● " : "○ "}
                {e.name}
              </Text>
              <Text style={s.meta}>
                {e.role} · {examProgress(data, e.id)}% concluído
              </Text>
            </Pressable>
            <Button title="Editar" secondary onPress={() => editExam(e.id)} />
            {confirm === e.id ? (
              <Button
                title="Confirmar exclusão"
                danger
                onPress={() => removeExam(e.id)}
              />
            ) : (
              <Button
                title="Excluir"
                secondary
                onPress={() => setConfirm(e.id)}
              />
            )}
          </View>
        ))}
        {!data?.exams.length && <Empty text="Nenhum concurso cadastrado." />}
      </Section>
      <Section title={editing ? "Editar concurso" : "Novo concurso"}>
        <View style={s.form}>
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
          <Field
            label="Data da prova (AAAA-MM-DD)"
            value={date}
            onChangeText={setDate}
          />
          <Field
            label="Horas por semana"
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button
            title={editing ? "Salvar alterações" : "Criar concurso"}
            onPress={saveExam}
          />
        </View>
      </Section>
      {exam && (
        <>
          <Section title={`Matérias de ${exam.name}`}>
            <View style={s.addLine}>
              <View style={{ flex: 1 }}>
                <Field
                  label={editingSubject ? "Editar matéria" : "Nova matéria"}
                  value={subjectName}
                  onChangeText={setSubjectName}
                  placeholder="Nome da matéria"
                />
              </View>
              <Button
                title={editingSubject ? "Salvar" : "Adicionar"}
                onPress={() => {
                  if (!subjectName.trim()) return;
                  if (
                    subjects.some(
                      (s) =>
                        s.id !== editingSubject &&
                        s.name.toLocaleLowerCase() ===
                          subjectName.trim().toLocaleLowerCase(),
                    )
                  ) {
                    setCatalogError(
                      "Já existe uma matéria com esse nome neste concurso.",
                    );
                    return;
                  }
                  update((d) => ({
                    ...d,
                    subjects: editingSubject
                      ? d.subjects.map((x) =>
                          x.id === editingSubject
                            ? { ...x, name: subjectName.trim() }
                            : x,
                        )
                      : [
                          ...d.subjects,
                          {
                            id: uid(),
                            examId: exam.id,
                            name: subjectName.trim(),
                          },
                        ],
                  }));
                  setSubjectName("");
                  setEditingSubject(null);
                  setCatalogError("");
                }}
              />
            </View>
            {!!catalogError && <Text style={s.error}>{catalogError}</Text>}
            {subjects.map((subject) => {
              const topics = data!.topics.filter(
                (t) => t.subjectId === subject.id,
              );
              return (
                <View key={subject.id} style={s.subject}>
                  <Pressable
                    onPress={() => setSelectedSubject(subject.id)}
                    style={{ flex: 1 }}
                  >
                    <Text style={s.rowTitle}>
                      {subject.name}{" "}
                      <Text style={s.meta}>
                        ({topics.filter((t) => t.studied).length}/
                        {topics.length})
                      </Text>
                    </Text>
                  </Pressable>
                  <Button
                    title="Editar"
                    secondary
                    onPress={() => {
                      setSelectedSubject(subject.id);
                      setSubjectName(subject.name);
                      setEditingSubject(subject.id);
                    }}
                  />
                  <Button
                    title="Excluir"
                    secondary
                    onPress={() => {
                      if (confirm === subject.id) {
                        update((d) => ({
                          ...d,
                          subjects: d.subjects.filter(
                            (x) => x.id !== subject.id,
                          ),
                          topics: d.topics.filter(
                            (t) => t.subjectId !== subject.id,
                          ),
                          planned: d.planned.filter(
                            (p) => p.subjectId !== subject.id,
                          ),
                          sessions: d.sessions.filter(
                            (x) => x.subjectId !== subject.id,
                          ),
                          cycle: d.cycle.filter(
                            (c) => c.subjectId !== subject.id,
                          ),
                          reviews: d.reviews.filter(
                            (r) => !topics.some((t) => t.id === r.topicId),
                          ),
                        }));
                        setConfirm(null);
                      } else setConfirm(subject.id);
                    }}
                  />
                  {confirm === subject.id && (
                    <Text style={s.error}>
                      Toque em Excluir novamente para confirmar.
                    </Text>
                  )}
                  {selectedSubject === subject.id && (
                    <View style={{ width: "100%", marginTop: 12 }}>
                      {topics.map((t) => (
                        <View key={t.id} style={s.topicRow}>
                          <Pressable
                            onPress={() =>
                              update((d) => ({
                                ...d,
                                topics: d.topics.map((x) =>
                                  x.id === t.id
                                    ? { ...x, studied: !x.studied }
                                    : x,
                                ),
                              }))
                            }
                          >
                            <Text style={s.check}>{t.studied ? "✓" : "○"}</Text>
                          </Pressable>
                          <Text style={[s.meta, { flex: 1 }]}>
                            {t.parentId ? "   ↳ " : ""}
                            {t.name}
                          </Text>
                          <Pressable
                            onPress={() => {
                              setTopicName(t.name);
                              setParentId(`edit:${t.id}`);
                            }}
                          >
                            <Text style={s.link}>Editar</Text>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              update((d) => {
                                const ids = new Set([
                                  t.id,
                                  ...d.topics
                                    .filter((x) => x.parentId === t.id)
                                    .map((x) => x.id),
                                ]);
                                return {
                                  ...d,
                                  topics: d.topics.filter(
                                    (x) => !ids.has(x.id),
                                  ),
                                  planned: d.planned.filter(
                                    (p) => !ids.has(p.topicId),
                                  ),
                                  sessions: d.sessions.filter(
                                    (x) => !ids.has(x.topicId),
                                  ),
                                  reviews: d.reviews.filter(
                                    (r) => !ids.has(r.topicId),
                                  ),
                                  cycle: d.cycle.filter(
                                    (c) => !ids.has(c.topicId),
                                  ),
                                };
                              })
                            }
                          >
                            <Text style={s.link}>Excluir</Text>
                          </Pressable>
                        </View>
                      ))}
                      <Field
                        label="Novo assunto ou subassunto"
                        value={topicName}
                        onChangeText={setTopicName}
                        placeholder="Ex.: Crase"
                      />
                      <View style={s.addLine}>
                        <Button
                          title={
                            parentId.startsWith("edit:")
                              ? "Salvar assunto"
                              : "Adicionar assunto"
                          }
                          onPress={() => {
                            if (!topicName.trim()) return;
                            const editId = parentId.startsWith("edit:")
                              ? parentId.slice(5)
                              : null;
                            const parent = editId
                              ? topics.find((t) => t.id === editId)?.parentId
                              : parentId || undefined;
                            if (
                              topics.some(
                                (t) =>
                                  t.id !== editId &&
                                  t.parentId === parent &&
                                  t.name.toLocaleLowerCase() ===
                                    topicName.trim().toLocaleLowerCase(),
                              )
                            ) {
                              setCatalogError(
                                "Já existe um assunto com esse nome neste nível.",
                              );
                              return;
                            }
                            update((d) => ({
                              ...d,
                              topics: parentId.startsWith("edit:")
                                ? d.topics.map((t) =>
                                    t.id === parentId.slice(5)
                                      ? { ...t, name: topicName.trim() }
                                      : t,
                                  )
                                : [
                                    ...d.topics,
                                    {
                                      id: uid(),
                                      subjectId: subject.id,
                                      parentId: parentId || undefined,
                                      name: topicName.trim(),
                                      studied: false,
                                    },
                                  ],
                            }));
                            setTopicName("");
                            setParentId("");
                            setCatalogError("");
                          }}
                        />
                        <Button
                          title={
                            parentId && !parentId.startsWith("edit:")
                              ? `Subassunto de ${topics.find((t) => t.id === parentId)?.name}`
                              : "Assunto principal"
                          }
                          secondary
                          onPress={() => setParentId("")}
                        />
                      </View>
                      <View style={s.parents}>
                        {topics
                          .filter((t) => !t.parentId)
                          .map((t) => (
                            <Pressable
                              key={t.id}
                              onPress={() => setParentId(t.id)}
                            >
                              <Text style={s.link}>
                                + subassunto em {t.name}{" "}
                              </Text>
                            </Pressable>
                          ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </Section>
        </>
      )}
    </Page>
  );
}
const s = StyleSheet.create({
  examRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
    borderColor: palette.line,
    paddingVertical: 13,
  },
  rowTitle: { color: palette.text, fontSize: 14, fontWeight: "700" },
  meta: { color: palette.muted, fontSize: 12, marginTop: 4 },
  form: { maxWidth: 480 },
  error: { color: palette.danger, marginBottom: 12 },
  addLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  subject: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
    borderColor: palette.line,
    paddingVertical: 16,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 9,
  },
  check: { color: palette.accent, fontSize: 20 },
  link: { color: palette.accent, fontSize: 12, fontWeight: "700" },
  parents: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
});
