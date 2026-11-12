import { Button, Field, Notice, Tag, TextAreaField } from "@meu-edital/ui";
import type { FormEvent } from "react";
import type { Study } from "../hooks/useStudy";

/** Registro da sessão: minutos, data, questões, acertos e anotação, com o XP previsto. */
export function RegisterForm({ study }: { study: Study }) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void study.register();
  };
  const { form } = study;
  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      {study.error && <Notice tone="error">{study.error}</Notice>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minutos" type="number" min={1} inputMode="numeric" value={form.minutes} onChange={(e) => study.setField("minutes", e.target.value)} />
        <Field label="Data" type="date" value={form.date} onChange={(e) => study.setField("date", e.target.value)} />
        <Field label="Questões" type="number" min={0} inputMode="numeric" value={form.questions} onChange={(e) => study.setField("questions", e.target.value)} />
        <Field label="Acertos" type="number" min={0} inputMode="numeric" value={form.correct} onChange={(e) => study.setField("correct", e.target.value)} />
      </div>
      <TextAreaField label="Anotação" placeholder="opcional" value={form.note} onChange={(e) => study.setField("note", e.target.value)} />
      <div className="flex items-center justify-between gap-2">
        <Tag icon="coin">+{study.preview} XP</Tag>
        <Button type="submit">Registrar</Button>
      </div>
    </form>
  );
}
