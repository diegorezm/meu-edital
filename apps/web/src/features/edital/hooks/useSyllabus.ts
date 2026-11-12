import {
  addSubject,
  addTopic,
  type ExamChange,
  isTopicStudied,
  moveSubject,
  moveTopic,
  removeExam,
  removeSubject,
  removeTopicTree,
  renameTopic,
  sessionsAffected,
  subjectCoverage,
  subjectsInOrder,
  subjectWeight,
  topicsInOrder,
  topicTreeIds,
  updateExam,
  type SubjectChange,
  updateSubject,
} from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export type PendingDelete =
  | { kind: "exam"; id: string; name: string; sessions: number }
  | { kind: "subject"; id: string; name: string; sessions: number }
  | { kind: "topic"; id: string; name: string; sessions: number };

/** Estado e ações do Edital: dados do concurso, matérias, pesos e assuntos. */
export function useSyllabus() {
  const store = useStore();
  const navigate = useNavigate();
  const { data } = store;
  const exam = data.exams.find((e) => e.id === data.activeExamId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const view = useMemo(() => {
    if (!exam) return null;
    const subjects = subjectsInOrder(data, exam.id).map((subject, index) => ({
      id: subject.id,
      name: subject.name,
      index,
      weight: subjectWeight(subject),
      questions: subject.questions,
      pointsPerQuestion: subject.pointsPerQuestion,
      directWeight: subject.weight,
      coverage: subjectCoverage(data, subject.id).percent,
    }));
    const current = subjects.find((s) => s.id === selectedId) ?? subjects[0] ?? null;
    const depth = (parentId?: string): number => {
      let d = 0;
      for (let id = parentId; id && d < 6; d += 1) id = data.topics.find((t) => t.id === id)?.parentId;
      return d;
    };
    const topics = current
      ? topicsInOrder(data, current.id).map((topic) => ({
          id: topic.id,
          name: topic.name,
          parentId: topic.parentId,
          depth: depth(topic.parentId),
          studied: isTopicStudied(data, topic.id),
        }))
      : [];
    return { exam, subjects, current, topics };
  }, [data, exam, selectedId]);

  const askDelete = (kind: PendingDelete["kind"], id: string, name: string) => {
    const sessions =
      kind === "exam"
        ? sessionsAffected(data, { examId: id })
        : kind === "subject"
          ? sessionsAffected(data, { subjectId: id })
          : sessionsAffected(data, { topicIds: topicTreeIds(data, id) });
    setPending({ kind, id, name, sessions });
  };

  return {
    view,
    select: setSelectedId,
    saveExam: (change: ExamChange) => exam && store.update((d) => updateExam(d, exam.id, change)),
    addSubject: (name: string) => {
      if (!exam || !name.trim()) return;
      const next = store.update((d) => addSubject(d, exam.id, name));
      setSelectedId(subjectsInOrder(next, exam.id).at(-1)?.id ?? null);
    },
    saveSubject: (id: string, change: SubjectChange) => store.update((d) => updateSubject(d, id, change)),
    moveSubject: (id: string, direction: -1 | 1) => store.update((d) => moveSubject(d, id, direction)),
    addTopic: (subjectId: string, name: string, parentId?: string) =>
      store.update((d) => addTopic(d, subjectId, name, parentId)),
    renameTopic: (id: string, name: string) => store.update((d) => renameTopic(d, id, name)),
    moveTopic: (id: string, direction: -1 | 1) => store.update((d) => moveTopic(d, id, direction)),
    pending,
    askDelete,
    cancelDelete: () => setPending(null),
    confirmDelete: async () => {
      if (!pending) return;
      if (pending.kind === "exam") store.update((d) => removeExam(d, pending.id));
      if (pending.kind === "subject") store.update((d) => removeSubject(d, pending.id));
      if (pending.kind === "topic") store.update((d) => removeTopicTree(d, pending.id));
      setPending(null);
      if (pending.kind === "exam") await navigate({ to: "/" });
    },
    newExam: () => navigate({ to: "/comecar" }),
  };
}

export type Syllabus = ReturnType<typeof useSyllabus>;
