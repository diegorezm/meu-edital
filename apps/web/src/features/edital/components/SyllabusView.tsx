import { BottomSheet, Button, buttonClass, Crest, Field, IconButton, Mascot, Sheet, XpBar } from "@meu-edital/ui";
import { useLayout } from "@global/hooks/useLayout";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { useState } from "react";
import type { Syllabus } from "../hooks/useSyllabus";
import { ExamForm } from "./ExamForm";
import { SubjectPanel } from "./SubjectPanel";

/**
 * Edital. Desktop: dados do concurso no topo, matérias à esquerda e a
 * matéria escolhida à direita. Celular: a matéria abre numa folha da base.
 */
export function SyllabusView({ syllabus }: { syllabus: Syllabus }) {
  const { mobile } = useLayout();
  const { view } = syllabus;
  const [newSubject, setNewSubject] = useState("");
  const [open, setOpen] = useState(false);
  if (!view)
    return (
      <Sheet title="Edital" className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot pose="dormindo" className="w-36" />
          <p>Nenhum concurso ainda.</p>
          <Link to="/comecar" className={buttonClass()}>
            Começar
          </Link>
        </div>
      </Sheet>
    );

  const list = (
    <div>
      {view.subjects.map((subject) => {
        const active = view.current?.id === subject.id && !mobile;
        return (
          <div key={subject.id} className={clsx("mb-1 flex items-center rounded-[5px] border-2", active ? "border-ink bg-paper-raised" : "border-transparent")}>
            <button
              type="button"
              onClick={() => {
                syllabus.select(subject.id);
                setOpen(true);
              }}
              className="flex min-h-11 flex-1 items-center gap-2 px-1.5 py-1 text-left"
            >
              <Crest name={subject.name} index={subject.index} size={26} showInitials={false} />
              <span className="min-w-0 flex-1">
                <span className={clsx("block truncate", active && "font-extrabold")}>{subject.name}</span>
                <XpBar value={subject.coverage / 100} label={`${subject.coverage}% estudado`} className="mt-0.5 h-3" />
              </span>
              <span className="text-xs text-ink-muted">peso {subject.weight}</span>
            </button>
            {!mobile && (
              <IconButton icon="caret" className="rotate-180" label={`Subir ${subject.name}`} disabled={subject.index === 0} onClick={() => syllabus.moveSubject(subject.id, -1)} />
            )}
          </div>
        );
      })}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          syllabus.addSubject(newSubject);
          setNewSubject("");
        }}
        className="mt-2 flex items-end gap-2"
      >
        <Field className="flex-1" label="Nova matéria" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
        <Button type="submit" variant="quiet">
          Pôr
        </Button>
      </form>
    </div>
  );

  const confirm = (
    <BottomSheet
      open={Boolean(syllabus.pending)}
      onOpenChange={(o) => !o && syllabus.cancelDelete()}
      title="Excluir?"
      description={
        syllabus.pending
          ? `${syllabus.pending.name}${syllabus.pending.sessions ? ` e ${syllabus.pending.sessions} ${syllabus.pending.sessions === 1 ? "sessão registrada" : "sessões registradas"}` : ""} vão embora, sem volta.`
          : undefined
      }
    >
      <div className="flex gap-2">
        <Button variant="quiet" className="flex-1" onClick={syllabus.cancelDelete}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={() => void syllabus.confirmDelete()}>
          Excluir
        </Button>
      </div>
    </BottomSheet>
  );

  return (
    <div className="flex flex-col gap-[26px]">
      <Sheet title={view.exam.name}>
        <ExamForm key={view.exam.id} exam={view.exam} syllabus={syllabus} />
      </Sheet>
      {mobile ? (
        <>
          <Sheet title="Matérias" tone="gold" ribbonSize="sm" className="pt-[26px]">
            {list}
          </Sheet>
          <BottomSheet open={open && Boolean(view.current)} onOpenChange={setOpen} title={view.current?.name ?? "Matéria"}>
            {view.current && <SubjectPanel key={view.current.id} view={view} syllabus={syllabus} />}
          </BottomSheet>
        </>
      ) : (
        <div className="grid grid-cols-[280px_minmax(0,1fr)] items-start gap-[18px]">
          <Sheet title="Matérias" tone="gold" ribbonSize="sm" className="pt-[26px]">
            {list}
          </Sheet>
          {view.current ? (
            <Sheet title={view.current.name}>
              <SubjectPanel key={view.current.id} view={view} syllabus={syllabus} />
            </Sheet>
          ) : (
            <Sheet>Acrescente a primeira matéria à esquerda.</Sheet>
          )}
        </div>
      )}
      {confirm}
    </div>
  );
}
