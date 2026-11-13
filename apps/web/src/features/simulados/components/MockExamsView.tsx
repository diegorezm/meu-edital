import { Art, BottomSheet, Button, Field, IconButton, ListRow, Mascot, Notice, Sheet } from "@meu-edital/ui";
import type { MockExams } from "../hooks/useMockExams";
import { ScoreChart } from "./ScoreChart";

const bossText = {
  waiting: { title: "O chefe espera", body: "Ao fechar uma volta da jornada, um simulado mede sua força. É opcional." },
  threat: { title: "", body: "Que tal um simulado para medir a força? É opcional: pular não trava a jornada." },
  defeated: { title: "", body: "Chefe derrotado nesta volta. O próximo aparece ao fim da volta seguinte." },
};

export function MockExamsView({ mocks }: { mocks: MockExams }) {
  const { view } = mocks;
  if (!view)
    return (
      <Sheet title="Simulados" className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <Mascot pose="dormindo" className="w-32" />
          <p>Monte seu concurso para registrar simulados.</p>
        </div>
      </Sheet>
    );
  const text = bossText[view.boss];
  return (
    <div className="grid items-start gap-[18px] lg:grid-cols-2">
      <div className="flex flex-col gap-[26px]">
        <Sheet title={view.laps ? `Chefe da volta ${view.laps}` : "Chefe da volta"} tone="maroon">
          <div className="flex items-center gap-3">
            <Art name={view.boss === "defeated" ? "chefe.derrotado" : "chefe.ameacando"} className="w-24 flex-none" />
            <div>
              <b className="font-extrabold">{view.boss === "threat" ? `Você fechou a volta ${view.laps}.` : text.title}</b>
              <p className="text-sm text-ink-muted">{text.body}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => mocks.setRegistering(true)}>Registrar simulado</Button>
          </div>
        </Sheet>
        {view.chart.length > 1 && (
          <Sheet title="Evolução" tone="gold" ribbonSize="sm" className="pt-[26px]">
            <ScoreChart points={view.chart} />
          </Sheet>
        )}
      </div>
      <div className="flex flex-col gap-[26px]">
        {view.bySubject.length > 0 && (
          <Sheet title="Por matéria" tone="gold" ribbonSize="sm" className="pt-[26px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink text-left text-xs text-ink-muted">
                  <th className="py-1 font-bold">Matéria</th>
                  <th className="py-1 font-bold">Último</th>
                  <th className="py-1 font-bold">Antes</th>
                </tr>
              </thead>
              <tbody>
                {view.bySubject.map((s) => (
                  <tr key={s.id} className="border-b-[1.5px] border-dashed border-rule last:border-b-0">
                    <td className="py-1.5">{s.name}</td>
                    <td className="py-1.5 font-extrabold">{s.last}%</td>
                    <td className="py-1.5 text-ink-muted">{s.before === null ? "—" : `${s.before}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sheet>
        )}
        <Sheet title="Simulados feitos" tone="gold" ribbonSize="sm" className="pt-[26px]">
          {view.mocks.length ? (
            view.mocks.map((m) => (
              <ListRow
                key={m.id}
                aside={
                  <span className="flex items-center gap-1">
                    <b className="font-extrabold">{m.score}%</b>
                    <IconButton icon="trash" tone="danger" label={`Excluir ${m.title}`} onClick={() => mocks.askDelete(m.id)} />
                  </span>
                }
              >
                {m.title} <span className="text-xs text-ink-muted">· {m.date}</span>
              </ListRow>
            ))
          ) : (
            <p className="text-sm text-ink-muted">Nenhum simulado ainda.</p>
          )}
        </Sheet>
      </div>
      <BottomSheet open={mocks.registering} onOpenChange={mocks.setRegistering} title="Novo simulado">
        <div className="flex flex-col gap-3">
          {mocks.error && <Notice tone="error">{mocks.error}</Notice>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Título" placeholder="Simulado" value={mocks.title} onChange={(e) => mocks.setTitle(e.target.value)} />
            <Field label="Data" type="date" value={mocks.date} onChange={(e) => mocks.setDate(e.target.value)} />
          </div>
          <div>
            <div className="grid grid-cols-[1fr_72px_72px] gap-2 border-b-2 border-ink pb-1 text-xs font-bold text-ink-muted">
              <span>Matéria</span>
              <span>Questões</span>
              <span>Acertos</span>
            </div>
            {view.subjects.map((s) => (
              <div key={s.id} className="grid grid-cols-[1fr_72px_72px] items-center gap-2 border-b-[1.5px] border-dashed border-rule py-1.5 text-sm">
                <span>{s.name}</span>
                <input
                  aria-label={`Questões de ${s.name}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="min-h-10 rounded-[5px] border-2 border-ink bg-paper-raised px-2"
                  value={mocks.rows[s.id]?.questions ?? ""}
                  onChange={(e) => mocks.setRow(s.id, "questions", e.target.value)}
                />
                <input
                  aria-label={`Acertos de ${s.name}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="min-h-10 rounded-[5px] border-2 border-ink bg-paper-raised px-2"
                  value={mocks.rows[s.id]?.correct ?? ""}
                  onChange={(e) => mocks.setRow(s.id, "correct", e.target.value)}
                />
              </div>
            ))}
          </div>
          <Button onClick={mocks.register}>Registrar</Button>
        </div>
      </BottomSheet>
      <BottomSheet
        open={Boolean(mocks.deleting)}
        onOpenChange={(o) => !o && mocks.askDelete(null)}
        title="Excluir simulado?"
        description={mocks.deleting ? `${mocks.deleting.title} (${mocks.deleting.date}) some do histórico.` : undefined}
      >
        <div className="flex gap-2">
          <Button variant="quiet" className="flex-1" onClick={() => mocks.askDelete(null)}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={mocks.confirmDelete}>
            Excluir
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
