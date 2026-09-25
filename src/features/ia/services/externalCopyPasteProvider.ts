import { AppData } from "@domain/types";
import { weeklyStats } from "@domain/stats";
import { weeklyAllocation } from "@domain/weeklyAllocation";

const jsonCodeBlockInstruction =
  "Responda somente com JSON válido dentro de um único bloco de código marcado como json (```json ... ```). Não escreva explicações nem texto fora do bloco.";

export interface AIProvider {
  examPrompt(data: AppData, examId: string): string;
  weeklyPrompt(data: AppData, examId: string): string;
}

export const ExternalCopyPasteProvider: AIProvider = {
  examPrompt(data, examId) {
    const exam = data.exams.find((e) => e.id === examId);
    return `Analise o edital anexado ou colado nesta conversa. Extraia APENAS as matérias e assuntos do cargo ${exam?.role || ""} do concurso ${exam?.name || ""}. Não invente conteúdo. Para cada matéria, inclua questions (número de questões) e pointsPerQuestion (pontos por questão) quando o edital informar ambos. Se informar apenas um peso ou pontuação total, use weight (número positivo). Omita esses campos quando não constarem no edital; não estime. ${jsonCodeBlockInstruction} Use exatamente este formato:\n{"exam":"${exam?.name || "Nome do concurso"}","role":"${exam?.role || "Cargo"}","subjects":[{"name":"Português","questions":10,"pointsPerQuestion":2,"topics":[{"name":"Interpretação de textos","subtopics":[{"name":"Tipos de texto"}]},{"name":"Crase"}]}]}\nCada matéria deve ter ao menos um assunto. Subtopics, questions, pointsPerQuestion e weight são opcionais. Não inclua comentários ou campos extras.`;
  },
  weeklyPrompt(data, examId) {
    const exam = data.exams.find((e) => e.id === examId);
    const subjects = data.subjects
      .filter((s) => s.examId === examId)
      .map((s) => ({
        name: s.name,
        weight: s.weight,
        questions: s.questions,
        pointsPerQuestion: s.pointsPerQuestion,
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
    const allocation = weeklyAllocation(data, examId).map((item) => ({
      subject: item.name,
      weight: item.weight,
      targetMinutes: item.minutes,
      reviewMinutes: item.reviewMinutes,
    }));
    return `Crie um plano de estudo para a semana atual, de segunda a domingo. Considere os dados abaixo. Não invente matérias ou assuntos; use os nomes EXATOS. Respeite aproximadamente targetMinutes de cada matéria em subjectAllocation, incluindo reviewMinutes para revisões pendentes. Priorize assuntos pouco estudados ou com baixo desempenho dentro dessa distribuição. Se não houver peso informado, o app usa peso igual. ${jsonCodeBlockInstruction} Formato: {"sessions":[{"day":"Seg","subject":"Português","topic":"Crase","type":"Teoria","minutes":60}]}. Dias permitidos: Seg, Ter, Qua, Qui, Sex, Sáb, Dom. Tipos: Teoria, Questões, Revisão. Duração em minutos inteiros.\n\nDados:\n${JSON.stringify({ exam: exam?.name, role: exam?.role, hoursPerWeek: exam?.hoursPerWeek, subjectAllocation: allocation, subjects, pendingReviews: pending, weeklyPerformance: weeklyStats(data, examId), recentSessions: recent })}`;
  },
};
