import { BottomSheet, Button, Chip, Icon, ListRow, Mascot, Notice, Sheet, TextAreaField } from "@meu-edital/ui";
import { useLayout } from "@global/hooks/useLayout";
import { useState } from "react";
import type { Oracle } from "../hooks/useOracle";
import { ConnectGuide } from "./ConnectGuide";
import { ProposalCard } from "./ProposalCard";

/** Oráculo: caixa de propostas, conectar uma IA e copiar e colar. */
export function OracleView({ oracle }: { oracle: Oracle }) {
  const { mobile } = useLayout();
  const [panel, setPanel] = useState<"conectar" | "colar" | null>(null);

  const inbox = (
    <Sheet title={`Caixa de propostas${oracle.cards.length ? ` · ${oracle.cards.length}` : ""}`}>
      {oracle.notice && (
        <div className="mb-3">
          <Notice>{oracle.notice}</Notice>
        </div>
      )}
      {oracle.error && (
        <div className="mb-3">
          <Notice tone="error">{oracle.error}</Notice>
        </div>
      )}
      {oracle.loading ? (
        <p className="text-sm text-ink-muted">Consultando o Oráculo...</p>
      ) : oracle.cards.length ? (
        oracle.cards.map((card) => <ProposalCard key={card.proposal.id} card={card} oracle={oracle} />)
      ) : (
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <Mascot pose="dormindo" className="w-28" />
          <p className="text-sm text-ink-muted">Nenhuma proposta. Peça à sua IA para revisar sua semana.</p>
        </div>
      )}
    </Sheet>
  );

  const connect = (
    <div className="flex flex-col gap-3">
      <p className="text-sm">Conecte o ChatGPT, o Claude ou o Perplexity ao seu estudo com este endereço:</p>
      <div className="flex items-center gap-2">
        <code className="min-h-11 flex-1 truncate rounded-[5px] border-2 border-ink bg-paper-raised px-2.5 py-2.5 text-sm">{oracle.mcpUrl}</code>
        <Button variant="quiet" onClick={() => void oracle.copyUrl()}>
          Copiar
        </Button>
      </div>
      <ConnectGuide />
      {oracle.connections.map((c) => (
        <ListRow
          key={c.id}
          aside={
            <Button variant="quiet" onClick={() => void oracle.disconnect(c.id)}>
              Desconectar
            </Button>
          }
        >
          <span className="flex items-center gap-2">
            <Icon name="orb" />
            <span>
              <b className="font-extrabold">{c.name}</b>
              <span className="block text-xs text-ink-muted">
                {c.createdAt ? `conectado em ${new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} · ` : ""}
                {c.scope.includes("estudo:propor") ? "ler e propor" : "ler"}
              </span>
            </span>
          </span>
        </ListRow>
      ))}
    </div>
  );

  const paste = (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Tarefa">
        <Chip pressed={oracle.task === "semana"} onClick={() => oracle.setTask("semana")}>
          Revisar a semana
        </Chip>
        <Chip pressed={oracle.task === "edital"} onClick={() => oracle.setTask("edital")}>
          Importar edital
        </Chip>
      </div>
      <p className="text-xs text-ink-muted">
        {oracle.task === "semana"
          ? "A IA analisa suas últimas semanas e propõe ajustes de peso, meta ou jornada."
          : "Anexe o PDF do edital na sua IA junto com o pedido; ela devolve matérias e assuntos."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="quiet" disabled={!oracle.hasExam} onClick={() => void oracle.copyPrompt()}>
          Copiar pedido
        </Button>
        <Button disabled={!oracle.hasExam} onClick={() => oracle.setPasting(true)}>
          Colar resposta
        </Button>
      </div>
    </div>
  );

  const pasteSheet = (
    <BottomSheet open={oracle.pasting} onOpenChange={oracle.setPasting} title="Colar resposta">
      <div className="flex flex-col gap-3">
        {oracle.error && <Notice tone="error">{oracle.error}</Notice>}
        <TextAreaField label="Resposta da IA" rows={8} value={oracle.pasted} onChange={(e) => oracle.setPasted(e.target.value)} />
        <Button onClick={() => void oracle.submitPasted()}>Conferir</Button>
      </div>
    </BottomSheet>
  );

  if (mobile)
    return (
      <div className="flex flex-col gap-[26px]">
        {inbox}
        <Sheet>
          <ListRow aside={<Icon name="back" className="rotate-180" />}>
            <button type="button" className="flex min-h-11 w-full items-center gap-2" onClick={() => setPanel("conectar")}>
              <Icon name="orb" /> Conectar uma IA
            </button>
          </ListRow>
          <ListRow aside={<Icon name="back" className="rotate-180" />}>
            <button type="button" className="flex min-h-11 w-full items-center gap-2" onClick={() => setPanel("colar")}>
              <Icon name="pencil" /> Copiar e colar
            </button>
          </ListRow>
        </Sheet>
        <BottomSheet open={panel === "conectar"} onOpenChange={(o) => setPanel(o ? "conectar" : null)} title="Conectar uma IA">
          {connect}
        </BottomSheet>
        <BottomSheet open={panel === "colar"} onOpenChange={(o) => setPanel(o ? "colar" : null)} title="Sem MCP">
          {paste}
        </BottomSheet>
        {pasteSheet}
      </div>
    );

  return (
    <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {inbox}
      <div className="flex flex-col gap-[26px]">
        <Sheet title="Conectar uma IA" tone="gold" ribbonSize="sm" className="pt-[26px]">
          {connect}
        </Sheet>
        <Sheet title="Sem MCP" tone="gold" ribbonSize="sm" className="pt-[26px]">
          {paste}
        </Sheet>
      </div>
      {pasteSheet}
    </div>
  );
}
