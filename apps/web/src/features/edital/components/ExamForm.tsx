import { Button, Field } from "@meu-edital/ui";
import { useState } from "react";
import type { Syllabus } from "../hooks/useSyllabus";

type Exam = NonNullable<Syllabus["view"]>["exam"];

/** Dados do concurso. Salva ao sair de cada campo. */
export function ExamForm({ exam, syllabus }: { exam: Exam; syllabus: Syllabus }) {
  const [draft, setDraft] = useState({
    name: exam.name,
    role: exam.role,
    board: exam.board ?? "",
    examDate: exam.examDate ?? "",
    hoursPerWeek: String(exam.hoursPerWeek),
  });
  const set = (field: keyof typeof draft) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));
  const save = () => {
    const hours = Number(draft.hoursPerWeek);
    syllabus.saveExam({
      name: draft.name.trim() || exam.name,
      role: draft.role.trim(),
      board: draft.board.trim() || undefined,
      examDate: draft.examDate || undefined,
      ...(hours >= 1 && hours <= 112 ? { hoursPerWeek: hours } : {}),
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Concurso" value={draft.name} onChange={set("name")} onBlur={save} />
        <Field label="Cargo" value={draft.role} onChange={set("role")} onBlur={save} />
        <Field label="Banca" value={draft.board} onChange={set("board")} onBlur={save} />
        <Field label="Data da prova" type="date" value={draft.examDate} onChange={set("examDate")} onBlur={save} />
        <Field
          label="Horas por semana"
          type="number"
          min={1}
          max={112}
          value={draft.hoursPerWeek}
          onChange={set("hoursPerWeek")}
          onBlur={save}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="quiet" onClick={syllabus.newExam}>
          Novo concurso
        </Button>
        <Button variant="quiet" className="text-rose-strong" onClick={() => syllabus.askDelete("exam", exam.id, exam.name)}>
          Excluir concurso
        </Button>
      </div>
    </div>
  );
}
