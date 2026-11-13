import {
  applyProposal,
  type ChangePreview,
  parseTaskResponse,
  previewProposal,
  type Proposal,
  type ProposalPayload,
  renderPrompt,
  syllabusTask,
  weeklyReviewTask,
} from "@meu-edital/agent-context";
import { getJson, sendJson } from "@global/api";
import { useStore } from "@global/store/useStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export type TaskId = "semana" | "edital";
type Connection = { id: string; name: string; scope: string[]; createdAt: number | null };

const DAY = 86_400_000;
const NO_PROPOSALS: Proposal[] = [];
const PROPOSALS = ["oraculo", "propostas"] as const;
const CONNECTIONS = ["oraculo", "conexoes"] as const;

/** Caixa de propostas, conexões de IA e o caminho de copiar e colar. */
export function useOracle() {
  const store = useStore();
  const { data } = store;
  const examId = data.activeExamId;
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: PROPOSALS,
    queryFn: () => getJson<{ proposals: Proposal[] }>("/proposals").then((r) => r.proposals),
  });
  const connectionsQuery = useQuery({
    queryKey: CONNECTIONS,
    queryFn: () => getJson<{ connections: Connection[] }>("/oraculo/conexoes").then((r) => r.connections),
  });
  const proposals = inbox.isError ? NO_PROPOSALS : (inbox.data ?? null);
  const connections = connectionsQuery.data ?? [];
  const setProposals = (change: (list: Proposal[]) => Proposal[]) =>
    queryClient.setQueryData<Proposal[]>(PROPOSALS, (list) => change(list ?? []));
  const setConnections = (change: (list: Connection[]) => Connection[]) =>
    queryClient.setQueryData<Connection[]>(CONNECTIONS, (list) => change(list ?? []));
  const [actionError, setError] = useState("");
  const error =
    actionError || (inbox.isError ? "Sem conexão agora. A caixa aparece quando a rede voltar." : "");
  const [notice, setNotice] = useState("");
  const [task, setTask] = useState<TaskId>("semana");
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  // Referência para "expira em N dias", fixada ao abrir a tela.
  const [now] = useState(() => Date.now());

  const cards = useMemo(
    () =>
      (proposals ?? []).map((proposal) => {
        let preview: ChangePreview[] = [];
        let problem = "";
        try {
          preview = previewProposal(data, proposal.examId, proposal.payload);
        } catch (e) {
          problem = e instanceof Error ? e.message : "Esta proposta não combina mais com seus dados.";
        }
        const days = Math.max(0, Math.ceil((proposal.expiresAt - now) / DAY));
        return {
          proposal,
          preview,
          problem,
          when: new Date(proposal.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
          expires: days <= 1 ? "expira hoje" : `expira em ${days} dias`,
          title:
            proposal.payload.kind === "syllabus"
              ? `${proposal.author} · importar edital`
              : proposal.payload.kind === "exam"
                ? `${proposal.author} · novo concurso`
                : proposal.author,
        };
      }),
    [proposals, data, now],
  );

  const settle = async (proposal: Proposal, status: "aplicada" | "descartada") => {
    setBusy(proposal.id);
    setError("");
    try {
      if (status === "aplicada") store.update((d) => applyProposal(d, proposal.examId, proposal.payload));
      await sendJson(`/proposals/${proposal.id}/status`, "POST", { status });
      setProposals((list) => list.filter((p) => p.id !== proposal.id));
      setNotice(
        status === "descartada"
          ? "Proposta descartada."
          : proposal.payload.kind === "exam"
            ? "Concurso criado. Ele já é o seu concurso ativo."
            : "Proposta aplicada. A jornada já está atualizada.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu certo agora.");
    } finally {
      setBusy(null);
    }
  };

  const copyPrompt = async () => {
    if (!examId) return;
    const text =
      task === "semana" ? renderPrompt(weeklyReviewTask, data, examId) : renderPrompt(syllabusTask, data, examId);
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Pedido copiado. Cole na sua IA e traga a resposta de volta.");
    } catch {
      setError("Não deu para copiar. Seu navegador bloqueou a área de transferência.");
    }
  };

  const submitPasted = async () => {
    setError("");
    let payload: ProposalPayload;
    let reason: string;
    try {
      if (task === "semana") {
        const review = parseTaskResponse(weeklyReviewTask, pasted);
        if (!review.changes.length) {
          setPasting(false);
          setNotice(`A IA não propôs mudanças. Resumo: ${review.summary}`);
          return;
        }
        payload = { kind: "changes", changes: review.changes };
        reason = review.summary.slice(0, 1000);
      } else {
        payload = { kind: "syllabus", syllabus: parseTaskResponse(syllabusTask, pasted) };
        reason = "Edital importado pela resposta colada.";
      }
      const { proposal } = await sendJson<{ proposal: Proposal }>("/proposals", "POST", { reason, payload });
      setProposals((list) => [proposal, ...list]);
      setPasted("");
      setPasting(false);
      setNotice("A resposta entrou na caixa. Confira antes de aplicar.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "A resposta não está no formato esperado.");
    }
  };

  const disconnect = async (id: string) => {
    try {
      await sendJson(`/oraculo/conexoes/${id}`, "DELETE");
      setConnections((list) => list.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para desconectar.");
    }
  };

  return {
    hasExam: Boolean(examId),
    loading: proposals === null,
    cards,
    connections,
    mcpUrl: `${window.location.origin}/mcp`,
    copyUrl: () =>
      navigator.clipboard
        .writeText(`${window.location.origin}/mcp`)
        .then(() => setNotice("Endereço copiado."))
        .catch(() => setError("Não deu para copiar.")),
    error,
    notice,
    busy,
    apply: (p: Proposal) => settle(p, "aplicada"),
    discard: (p: Proposal) => settle(p, "descartada"),
    disconnect,
    task,
    setTask,
    copyPrompt,
    pasting,
    setPasting,
    pasted,
    setPasted,
    submitPasted,
  };
}

export type Oracle = ReturnType<typeof useOracle>;
