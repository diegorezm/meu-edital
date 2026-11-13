import { subjectsInOrder, topicPath } from "./topics";
import type { AppData } from "./types";

const cell = (value: unknown) => {
  const text = value === undefined || value === null ? "" : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Sessões em CSV (separador ";", como o Excel em português espera), uma por
 * linha, com concurso, matéria e assunto por nome.
 */
export function sessionsCsv(data: AppData): string {
  const exams = new Map(data.exams.map((e) => [e.id, e.name]));
  const subjects = new Map(data.subjects.map((s) => [s.id, s.name]));
  const topics = new Map(data.topics.map((t) => [t.id, topicPath(data, t)]));
  const header = ["data", "concurso", "materia", "assunto", "tipo", "minutos", "questoes", "acertos", "anotacao"];
  const rows = [...data.sessions]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((s) =>
      [s.date, exams.get(s.examId), subjects.get(s.subjectId), topics.get(s.topicId), s.type, s.minutes, s.questions, s.correct, s.note]
        .map(cell)
        .join(";"),
    );
  return [header.join(";"), ...rows].join("\r\n") + "\r\n";
}

/** Exportação completa em JSON, com nomes legíveis ao lado dos ids. */
export function exportJson(data: AppData) {
  return {
    formato: "meu-edital",
    versao: 1,
    concursos: data.exams.map((exam) => ({
      ...exam,
      materias: subjectsInOrder(data, exam.id).map((subject) => ({
        ...subject,
        assuntos: data.topics.filter((t) => t.subjectId === subject.id),
      })),
      jornada: data.cycle.filter((c) => c.examId === exam.id),
      sessoes: data.sessions.filter((s) => s.examId === exam.id),
      revisoes: data.reviews.filter((r) => r.examId === exam.id),
      simulados: data.mockExams.filter((m) => m.examId === exam.id),
      metasSemanais: data.weekTargets.filter((w) => w.examId === exam.id),
    })),
    preferencias: { intervalosDeRevisao: data.reviewOffsets, skin: data.skin },
  };
}
