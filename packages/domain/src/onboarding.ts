import { buildCycle } from "./cycle";
import { today } from "./dates";
import { uid } from "./ids";
import type { AppData, Subject, Topic } from "./types";

export type StarterSubject = {
  name: string;
  /** Questões e pontos por questão, quando o edital informa (viram o peso). */
  questions?: number;
  pointsPerQuestion?: number;
  /** Assuntos iniciais, em ordem. Sem eles a matéria ganha um assunto genérico. */
  topics?: string[];
};

export type StartExamInput = {
  name: string;
  role?: string;
  board?: string;
  /** Data da prova em AAAA-MM-DD, quando já é conhecida. */
  examDate?: string;
  hoursPerWeek: number;
  subjects: StarterSubject[];
};

export const GENERAL_TOPIC = "Conteúdo geral";

/**
 * Cria o primeiro concurso com matérias, assuntos e um ciclo pronto, deixando-o
 * ativo. Toda matéria recebe ao menos um assunto para que a primeira sessão já
 * possa ser registrada. Nomes de matéria repetidos ou vazios são ignorados.
 */
export function startExam(data: AppData, input: StartExamInput): AppData {
  const examId = uid();
  const seen = new Set<string>();
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  for (const starter of input.subjects) {
    const name = starter.name.trim();
    const key = name.toLocaleLowerCase("pt-BR");
    if (!name || seen.has(key)) continue;
    seen.add(key);
    const subject: Subject = {
      id: uid(),
      examId,
      name,
      position: subjects.length,
      ...(starter.questions ? { questions: starter.questions, pointsPerQuestion: starter.pointsPerQuestion ?? 1 } : {}),
    };
    subjects.push(subject);
    const names = (starter.topics || []).map((t) => t.trim()).filter(Boolean);
    (names.length ? names : [GENERAL_TOPIC]).forEach((topic, position) =>
      topics.push({ id: uid(), subjectId: subject.id, name: topic, position }),
    );
  }
  const next: AppData = {
    ...data,
    exams: [
      ...data.exams,
      {
        id: examId,
        name: input.name.trim(),
        role: input.role?.trim() || "",
        ...(input.board?.trim() ? { board: input.board.trim() } : {}),
        ...(input.examDate ? { examDate: input.examDate } : {}),
        hoursPerWeek: input.hoursPerWeek,
        createdAt: today(),
        cyclePosition: 0,
        cycleLaps: 0,
      },
    ],
    subjects: [...data.subjects, ...subjects],
    topics: [...data.topics, ...topics],
    activeExamId: examId,
  };
  return { ...next, cycle: [...next.cycle, ...buildCycle(next, examId)] };
}

/** Concurso de exemplo, para conhecer o app antes de montar o próprio edital. */
export const EXAMPLE_EXAM: StartExamInput = {
  name: "Concurso de exemplo",
  role: "Técnico",
  hoursPerWeek: 20,
  subjects: [
    { name: "Português", topics: ["Interpretação de textos", "Crase", "Concordância", "Pontuação"] },
    { name: "Raciocínio Lógico", topics: ["Proposições", "Porcentagem", "Probabilidade"] },
    { name: "Direito Constitucional", topics: ["Direitos fundamentais", "Organização do Estado"] },
    { name: "Direito Administrativo", topics: ["Atos administrativos", "Licitações", "Agentes públicos"] },
    { name: "Informática", topics: ["Segurança da informação", "Redes", "Planilhas"] },
  ],
};
