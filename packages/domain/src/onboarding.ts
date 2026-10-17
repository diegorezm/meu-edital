import { buildCycle } from "./cycle";
import type { AppData, Subject, Topic } from "./types";
import { today, uid } from "./types";

export type StarterSubject = {
  name: string;
  /** Assuntos iniciais, em ordem. Sem eles a matéria ganha um assunto genérico. */
  topics?: string[];
};

export type StartExamInput = {
  name: string;
  role?: string;
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
    const subject: Subject = { id: uid(), examId, name };
    subjects.push(subject);
    const names = (starter.topics || []).map((t) => t.trim()).filter(Boolean);
    for (const topic of names.length ? names : [GENERAL_TOPIC])
      topics.push({
        id: uid(),
        subjectId: subject.id,
        name: topic,
        studied: false,
      });
  }
  const next: AppData = {
    ...data,
    exams: [
      ...data.exams,
      {
        id: examId,
        name: input.name.trim(),
        role: input.role?.trim() || "",
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
