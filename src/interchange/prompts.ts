import { AppData } from "@/domain/types";
import { weeklyStats } from "@/domain/logic";

export interface AIProvider {
  examPrompt(data: AppData, examId: string): string;
  weeklyPrompt(data: AppData, examId: string): string;
}

export const ExternalCopyPasteProvider: AIProvider = {
  examPrompt(data, examId) {
    const exam = data.exams.find((e) => e.id === examId);
    return `Analise o edital anexado ou colado nesta conversa. Extraia APENAS as matérias e assuntos do cargo ${exam?.role || ""} do concurso ${exam?.name || ""}. Não invente conteúdo. Responda somente com JSON válido, sem markdown nem explicações. Use exatamente este formato:\n{"exam":"${exam?.name || "Nome do concurso"}","role":"${exam?.role || "Cargo"}","subjects":[{"name":"Português","topics":[{"name":"Interpretação de textos","subtopics":[{"name":"Tipos de texto"}]},{"name":"Crase"}]}]}\nCada matéria deve ter ao menos um assunto. Subtopics é opcional. Não inclua comentários ou campos extras.`;
  },
  weeklyPrompt(data, examId) {
    const exam = data.exams.find((e) => e.id === examId);
    const subjects = data.subjects
      .filter((s) => s.examId === examId)
      .map((s) => ({
        name: s.name,
        topics: data.topics
          .filter((t) => t.subjectId === s.id)
          .map((t) => ({
            name: t.name,
            studied: t.studied,
            sessions: data.sessions.filter((x) => x.topicId === t.id).length,
          })),
      }));
    const pending = data.reviews
      .filter(
        (r) =>
          r.examId === examId &&
          !r.completed &&
          r.dueDate <= new Date().toISOString().slice(0, 10),
      )
      .map((r) => data.topics.find((t) => t.id === r.topicId)?.name)
      .filter(Boolean);
    const recent = data.sessions
      .filter((s) => s.examId === examId)
      .slice(0, 10)
      .map((s) => ({
        date: s.date,
        topic: data.topics.find((t) => t.id === s.topicId)?.name,
        type: s.type,
        minutes: s.minutes,
        questions: s.questions,
        correct: s.correct,
      }));
    return `Crie um plano de estudo para a semana atual, de segunda a domingo. Considere os dados abaixo. Não invente matérias ou assuntos; use os nomes EXATOS. Distribua aproximadamente ${exam?.hoursPerWeek || 0} horas na semana, incluindo revisões pendentes e foco em assuntos pouco estudados ou com baixo desempenho. Responda SOMENTE JSON válido, sem markdown. Formato: {"sessions":[{"day":"Seg","subject":"Português","topic":"Crase","type":"Teoria","minutes":60}]}. Dias permitidos: Seg, Ter, Qua, Qui, Sex, Sáb, Dom. Tipos: Teoria, Questões, Revisão. Duração em minutos inteiros.\n\nDados:\n${JSON.stringify({ exam: exam?.name, role: exam?.role, hoursPerWeek: exam?.hoursPerWeek, subjects, pendingReviews: pending, weeklyPerformance: weeklyStats(data, examId), recentSessions: recent })}`;
  },
};
