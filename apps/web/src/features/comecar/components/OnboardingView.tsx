import {
  Button,
  Chip,
  Crest,
  Field,
  IconButton,
  ListRow,
  Mascot,
  Notice,
  Sheet,
} from "@meu-edital/ui";
import type { FormEvent } from "react";
import { HOUR_OPTIONS, type useOnboarding } from "../hooks/useOnboarding";

const lines = {
  1: "Me conta qual é a prova e eu monto a jornada.",
  2: "Faltou um dia? Sem problema: a jornada espera você.",
  3: "Essas são as matérias. Dá para ajustar tudo depois, no Edital.",
} as const;

export function OnboardingView({ flow }: { flow: ReturnType<typeof useOnboarding> }) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (flow.step === 3) void flow.finish();
    else flow.next();
  };
  return (
    <div className="mx-auto grid max-w-3xl items-center gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="hidden text-center md:block">
        <Mascot pose={flow.step === 3 ? "comemorando" : "parado"} className="w-44" />
        <Sheet className="mt-3 text-sm">{lines[flow.step]}</Sheet>
      </div>
      <Sheet title={`Passo ${flow.step} de 3`}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {flow.error && <Notice tone="error">{flow.error}</Notice>}
          {flow.step === 1 && <StepExam flow={flow} />}
          {flow.step === 2 && <StepHours flow={flow} />}
          {flow.step === 3 && <StepSubjects flow={flow} />}
          <div className="flex items-center justify-between gap-2">
            {flow.step > 1 ? (
              <Button variant="quiet" onClick={flow.back}>
                Voltar
              </Button>
            ) : (
              <span className="text-xs text-ink-muted">Dá para mudar tudo depois, no Edital.</span>
            )}
            <Button type="submit">{flow.step === 3 ? "Montar jornada" : "Seguir"}</Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}

function StepExam({ flow }: { flow: ReturnType<typeof useOnboarding> }) {
  return (
    <>
      <Field label="Qual concurso?" value={flow.name} onChange={(e) => flow.setName(e.target.value)} autoFocus />
      <p className="-mb-2 text-xs text-ink-muted">Editais prontos (confira os números com o seu edital depois):</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Editais prontos">
        {flow.popular.map((name) => (
          <Chip key={name} pressed={flow.name === name} onClick={() => flow.pickPopular(name)}>
            {name}
          </Chip>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cargo" value={flow.role} onChange={(e) => flow.setRole(e.target.value)} />
        <Field
          label="Data da prova"
          type="date"
          hint="Opcional."
          value={flow.examDate}
          onChange={(e) => flow.setExamDate(e.target.value)}
        />
      </div>
    </>
  );
}

function StepHours({ flow }: { flow: ReturnType<typeof useOnboarding> }) {
  return (
    <>
      <p>Quantas horas por semana dá para estudar?</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Horas por semana">
        {HOUR_OPTIONS.map((h) => (
          <Chip key={h} pressed={flow.hours === h} onClick={() => flow.setHours(h)}>
            {h} h
          </Chip>
        ))}
      </div>
      <Field
        label="Ou outro número"
        type="number"
        min={1}
        max={112}
        value={flow.hours}
        onChange={(e) => flow.setHours(Number(e.target.value))}
        hint="Uma volta da jornada soma essa meta."
      />
    </>
  );
}

function StepSubjects({ flow }: { flow: ReturnType<typeof useOnboarding> }) {
  return (
    <>
      <div>
        {flow.subjects.map((subject, index) => (
          <ListRow
            key={subject.key}
            aside={
              <IconButton icon="trash" tone="danger" label={`Tirar ${subject.name}`} onClick={() => flow.removeSubject(subject.key)} />
            }
          >
            <span className="flex items-center gap-2">
              <Crest name={subject.name} index={index} size={26} showInitials={false} />
              <span>
                {subject.name}{" "}
                <span className="text-xs text-ink-muted">
                  {subject.topics.length ? `${subject.topics.length} assuntos` : "assuntos depois"}
                  {subject.questions ? ` · ${subject.questions} questões` : ""}
                </span>
              </span>
            </span>
          </ListRow>
        ))}
        {!flow.subjects.length && <p className="text-sm text-ink-muted">Nenhuma matéria ainda.</p>}
      </div>
      <div className="flex items-end gap-2">
        <Field
          className="flex-1"
          label="Nova matéria"
          value={flow.newSubject}
          onChange={(e) => flow.setNewSubject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              flow.addSubject();
            }
          }}
        />
        <Button variant="quiet" onClick={flow.addSubject}>
          Pôr
        </Button>
      </div>
    </>
  );
}
