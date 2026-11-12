import { POPULAR_EXAMS, type StarterSubject, startExam } from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export type Step = 1 | 2 | 3;
export const HOUR_OPTIONS = [10, 15, 20, 30];

type DraftSubject = { key: string; name: string; topics: string[] };

let counter = 0;
const draft = (subject: StarterSubject): DraftSubject => ({
  key: `m${(counter += 1)}`,
  name: subject.name,
  topics: subject.topics ?? [],
});

/** Primeiro concurso em três passos: qual prova, quanto tempo, quais matérias. */
export function useOnboarding() {
  const store = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState(20);
  const [subjects, setSubjects] = useState<DraftSubject[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [error, setError] = useState("");

  const pickPopular = (popularName: string) => {
    const popular = POPULAR_EXAMS.find((exam) => exam.name === popularName);
    if (!popular) return;
    setName(popular.name);
    setRole(popular.role);
    setSubjects(popular.subjects.map(draft));
  };

  const next = () => {
    setError("");
    if (step === 1) {
      if (!name.trim()) return setError("Diga qual é o concurso.");
      return setStep(2);
    }
    if (step === 2) {
      if (!(hours >= 1 && hours <= 112)) return setError("Escolha entre 1 e 112 horas por semana.");
      return setStep(3);
    }
  };

  const addSubject = () => {
    const clean = newSubject.trim();
    if (!clean) return;
    setSubjects((list) => [...list, draft({ name: clean })]);
    setNewSubject("");
  };

  const finish = async () => {
    if (!subjects.length) return setError("Acrescente pelo menos uma matéria.");
    store.update((data) =>
      startExam(data, {
        name,
        role,
        examDate: examDate || undefined,
        hoursPerWeek: hours,
        subjects: subjects.map((s) => ({ name: s.name, topics: s.topics })),
      }),
    );
    await navigate({ to: "/" });
  };

  return {
    step,
    back: () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s)),
    next,
    finish,
    error,
    popular: POPULAR_EXAMS.map((e) => e.name),
    pickPopular,
    name,
    setName,
    role,
    setRole,
    examDate,
    setExamDate,
    hours,
    setHours,
    subjects,
    removeSubject: (key: string) => setSubjects((list) => list.filter((s) => s.key !== key)),
    newSubject,
    setNewSubject,
    addSubject,
  };
}
