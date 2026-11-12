import { type SessionChange, type StudySession, today } from "@meu-edital/domain";
import { Button, Field, Notice, TextAreaField } from "@meu-edital/ui";
import { type FormEvent, useState } from "react";

/** Corrige minutos, data, questões, acertos e anotação de uma sessão. */
export function SessionForm({
  session,
  onSave,
}: {
  session: StudySession;
  onSave: (id: string, change: SessionChange) => void;
}) {
  const [form, setForm] = useState({
    minutes: String(session.minutes),
    date: session.date,
    questions: session.questions ? String(session.questions) : "",
    correct: session.correct ? String(session.correct) : "",
    note: session.note ?? "",
  });
  const [error, setError] = useState("");
  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const minutes = Number(form.minutes);
    const questions = form.questions ? Number(form.questions) : undefined;
    const correct = form.correct ? Number(form.correct) : undefined;
    if (!(minutes >= 1)) return setError("A duração deve ser maior que zero.");
    if ((correct ?? 0) > (questions ?? 0)) return setError("Acertos não podem superar o número de questões.");
    if (form.date > today()) return setError("A data não pode estar no futuro.");
    onSave(session.id, { minutes, date: form.date, questions, correct, note: form.note.trim() || undefined });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minutos" type="number" min={1} value={form.minutes} onChange={set("minutes")} />
        <Field label="Data" type="date" value={form.date} onChange={set("date")} />
        <Field label="Questões" type="number" min={0} value={form.questions} onChange={set("questions")} />
        <Field label="Acertos" type="number" min={0} value={form.correct} onChange={set("correct")} />
      </div>
      <TextAreaField label="Anotação" value={form.note} onChange={set("note")} />
      <p className="text-xs text-ink-muted">Para trocar matéria, assunto ou tipo, exclua e registre de novo.</p>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
