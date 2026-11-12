import { Button, Field, IconButton, ListRow, Stamp } from "@meu-edital/ui";
import clsx from "clsx";
import { type FormEvent, useState } from "react";
import type { Syllabus } from "../hooks/useSyllabus";

type View = NonNullable<Syllabus["view"]>;

/** Matéria escolhida: peso e árvore de assuntos. */
export function SubjectPanel({ view, syllabus }: { view: View; syllabus: Syllabus }) {
  const subject = view.current!;
  const [weights, setWeights] = useState({
    questions: subject.questions ? String(subject.questions) : "",
    points: subject.pointsPerQuestion ? String(subject.pointsPerQuestion) : "",
    weight: subject.directWeight ? String(subject.directWeight) : "",
  });
  const [newTopic, setNewTopic] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [childOf, setChildOf] = useState<string | null>(null);

  const saveWeights = () => {
    const q = Number(weights.questions);
    const p = Number(weights.points);
    const w = Number(weights.weight);
    if (w > 0) syllabus.saveSubject(subject.id, { weight: w });
    else if (q > 0 && p > 0) syllabus.saveSubject(subject.id, { questions: q, pointsPerQuestion: p });
  };
  const submitTopic = (event: FormEvent) => {
    event.preventDefault();
    syllabus.addTopic(subject.id, newTopic, childOf ?? undefined);
    setNewTopic("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Field label="Questões" type="number" min={0} value={weights.questions} onChange={(e) => setWeights({ ...weights, questions: e.target.value, weight: "" })} onBlur={saveWeights} />
        <Field label="Pontos cada" type="number" min={0} step="0.5" value={weights.points} onChange={(e) => setWeights({ ...weights, points: e.target.value, weight: "" })} onBlur={saveWeights} />
        <Field label="Ou peso" type="number" min={0} value={weights.weight} onChange={(e) => setWeights({ ...weights, weight: e.target.value })} onBlur={saveWeights} />
      </div>
      <p className="text-xs text-ink-muted">Peso efetivo: {subject.weight}. Ele decide quanto tempo a matéria ganha na jornada.</p>
      <div>
        {view.topics.map((topic, i) => {
          const siblings = view.topics.filter((t) => t.parentId === topic.parentId);
          const pos = siblings.findIndex((t) => t.id === topic.id);
          return (
            <ListRow
              key={topic.id}
              aside={
                <span className="flex items-center">
                  {topic.studied && <Stamp>Estudado</Stamp>}
                  <IconButton icon="caret" className="rotate-180" label="Subir" disabled={pos === 0} onClick={() => syllabus.moveTopic(topic.id, -1)} />
                  <IconButton icon="pencil" label={`Renomear ${topic.name}`} onClick={() => setEditing({ id: topic.id, name: topic.name })} />
                  {topic.depth === 0 && (
                    <IconButton icon="plus" label={`Subassunto em ${topic.name}`} onClick={() => setChildOf(topic.id)} />
                  )}
                  <IconButton icon="trash" tone="danger" label={`Excluir ${topic.name}`} onClick={() => syllabus.askDelete("topic", topic.id, topic.name)} />
                </span>
              }
            >
              {editing?.id === topic.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    syllabus.renameTopic(topic.id, editing.name);
                    setEditing(null);
                  }}
                  className="flex gap-2"
                >
                  <input
                    aria-label="Novo nome"
                    autoFocus
                    className="min-h-10 flex-1 rounded-[5px] border-2 border-ink bg-paper-raised px-2"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onBlur={() => {
                      syllabus.renameTopic(topic.id, editing.name);
                      setEditing(null);
                    }}
                  />
                </form>
              ) : (
                <span className={clsx("flex gap-2", topic.depth && "pl-6")}>
                  <span className="text-xs text-ink-muted">{topic.depth ? "·" : i + 1}</span>
                  {topic.name}
                </span>
              )}
            </ListRow>
          );
        })}
      </div>
      <form onSubmit={submitTopic} className="flex items-end gap-2">
        <Field
          className="flex-1"
          label={childOf ? `Subassunto de ${view.topics.find((t) => t.id === childOf)?.name}` : "Novo assunto"}
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
        />
        <Button type="submit" variant="quiet">
          Pôr
        </Button>
        {childOf && (
          <Button variant="quiet" onClick={() => setChildOf(null)}>
            Cancelar
          </Button>
        )}
      </form>
      <div className="flex justify-end">
        <Button variant="quiet" className="text-rose-strong" onClick={() => syllabus.askDelete("subject", subject.id, subject.name)}>
          Excluir matéria
        </Button>
      </div>
    </div>
  );
}
