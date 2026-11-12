import { Button, Chip, Crest, Icon, SelectField, Sheet, toRoman } from "@meu-edital/ui";
import type { Study } from "../hooks/useStudy";

/** Folha do cronômetro: o que está sendo estudado, o relógio e os botões. */
export function TimerSheet({ study }: { study: Study }) {
  const title = study.blockNumeral
    ? `Bloco ${toRoman(study.blockNumeral)} · ${study.subject?.name ?? ""}`
    : study.active?.type === "Revisão"
      ? "Revisão"
      : "Estudo livre";
  return (
    <Sheet title={title}>
      <div className="flex flex-col items-center gap-4 text-center">
        {study.subject && (
          <div className="flex items-center gap-3 text-left">
            <Crest name={study.subject.name} index={study.subjectIndex} />
            <div>
              <b className="font-extrabold">{study.subject.name}</b>
              <div className="text-sm text-ink-muted">{study.topic ?? "Escolha um assunto"}</div>
            </div>
          </div>
        )}
        <div className="font-title text-[84px] leading-[.9]" role="timer" aria-live="off">
          {study.clock}
        </div>
        <p className="-mt-2 text-sm text-ink-muted">
          {study.plannedMinutes ? `de ${study.plannedMinutes} min planejados` : "sem tempo planejado"}
        </p>
        <div className="grid w-full grid-cols-3 gap-1.5" role="group" aria-label="Tipo de estudo">
          {study.types.map((type) => (
            <Chip key={type} pressed={study.active?.type === type} onClick={() => study.changeType(type)}>
              {type}
            </Chip>
          ))}
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          {!study.blockNumeral && (
            <SelectField
              label="Matéria"
              value={study.active?.subjectId ?? ""}
              onChange={(e) => study.changeSubject(e.target.value)}
              options={study.subjects.map((s) => ({ value: s.id, label: s.name }))}
            />
          )}
          <SelectField
            className={study.blockNumeral ? "sm:col-span-2" : undefined}
            label="Assunto"
            value={study.active?.topicId ?? ""}
            onChange={(e) => study.changeTopic(e.target.value)}
            options={study.topics.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {!study.started && (
            <Button onClick={study.start}>
              <span className="flex items-center gap-1.5">
                <Icon name="play" className="size-4" /> Começar
              </span>
            </Button>
          )}
          {study.started && study.running && (
            <Button variant="quiet" onClick={study.pause}>
              <span className="flex items-center gap-1.5">
                <Icon name="pause" className="size-4" /> Pausar
              </span>
            </Button>
          )}
          {study.started && !study.running && (
            <Button variant="quiet" onClick={study.resume}>
              <span className="flex items-center gap-1.5">
                <Icon name="play" className="size-4" /> Continuar
              </span>
            </Button>
          )}
          <Button variant={study.started ? "primary" : "quiet"} onClick={study.openRegister}>
            Registrar
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-ink-muted">
          {study.blockNumeral > 0 && !study.started && (
            <button type="button" onClick={study.goFree} className="min-h-11 underline">
              Estudar outra coisa
            </button>
          )}
          {study.started && (
            <button type="button" onClick={study.discard} className="min-h-11 underline">
              Descartar o cronômetro
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
