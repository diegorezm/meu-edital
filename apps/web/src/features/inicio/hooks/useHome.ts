import {
  type AppData,
  cycleState,
  dailyContracts,
  dueReviews,
  EXAMPLE_EXAM,
  skipToCycleItem,
  startExam,
  subjectLevels,
  subjectsInOrder,
  suggestNextTopic,
  today,
  topicPath,
  weekSummary,
} from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { formatDuration, relativeDay } from "@global/utils/format";
import { type BlockState, toRoman } from "@meu-edital/ui";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

export type JourneyCard = {
  key: string;
  cycleItemId?: string;
  state: BlockState;
  numeral: string;
  subject: string;
  subjectIndex: number;
  topic?: string;
  minutes?: number;
  xp?: number;
};

const PAST_CARDS = 2;
const NEXT_CARDS = 4;

/** Cartas visíveis da jornada: as duas últimas concluídas, a atual, as próximas e o chefe. */
function journeyCards(data: AppData, examId: string): JourneyCard[] {
  const { items, position } = cycleState(data, examId);
  if (!items.length) return [];
  const order = subjectsInOrder(data, examId);
  const subjectIndex = (id: string) => Math.max(0, order.findIndex((s) => s.id === id));
  const subjectName = (id: string) => order.find((s) => s.id === id)?.name ?? "Matéria";
  const topicName = (id: string) => {
    const topic = data.topics.find((t) => t.id === id);
    return topic ? topicPath(data, topic) : undefined;
  };
  const lastTopicOf = (cycleItemId: string) =>
    data.sessions
      .filter((s) => s.cycleItemId === cycleItemId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0]?.topicId;

  const cards: JourneyCard[] = [];
  for (let i = Math.max(0, position - PAST_CARDS); i < Math.min(items.length, position + 1 + NEXT_CARDS); i += 1) {
    const item = items[i];
    const state: BlockState = i < position ? "done" : i === position ? "now" : "next";
    const topicId = state === "done" ? lastTopicOf(item.id) : suggestNextTopic(data, item.subjectId)?.id;
    cards.push({
      key: item.id,
      cycleItemId: item.id,
      state,
      numeral: toRoman(i + 1),
      subject: subjectName(item.subjectId),
      subjectIndex: subjectIndex(item.subjectId),
      topic: topicId ? topicName(topicId) : undefined,
      minutes: item.minutes,
      xp: item.minutes,
    });
  }
  cards.push({
    key: "chefe",
    state: "boss",
    numeral: "Chefe",
    subject: "Simulado da volta",
    subjectIndex: 0,
    topic: `ao fim do bloco ${items.length}`,
  });
  return cards;
}

/** Estado e ações da tela Início. */
export function useHome() {
  const store = useStore();
  const navigate = useNavigate();
  const { data } = store;
  const view = useMemo(() => {
    const date = today();
    const exam = data.exams.find((e) => e.id === data.activeExamId);
    if (!exam) return null;
    const cycle = cycleState(data, exam.id);
    const order = subjectsInOrder(data, exam.id);
    const levels = subjectLevels(data, exam.id, date);
    const week = weekSummary(data, exam.id);
    const due = dueReviews(data, exam.id, date);
    const dayTarget = week.targetMinutes / 7;
    const maxDay = Math.max(dayTarget, ...week.days.map((d) => d.minutes), 1);
    return {
      exam,
      lap: cycle.laps + 1,
      position: cycle.items.length ? cycle.position + 1 : 0,
      blocks: cycle.items.length,
      cards: journeyCards(data, exam.id),
      subjects: order.map((subject, index) => {
        const level = levels.find((l) => l.subjectId === subject.id);
        return {
          id: subject.id,
          name: subject.name,
          index,
          stars: level?.stars ?? 1,
          caption:
            level?.accuracy === null || level?.accuracy === undefined
              ? "sem questões"
              : `${Math.round(level.accuracy * 100)}% de acertos`,
        };
      }),
      contracts: dailyContracts(data, exam.id, date),
      reviews: due.slice(0, 5).map((review) => {
        const topic = data.topics.find((t) => t.id === review.topicId);
        return {
          id: review.id,
          topic: topic ? topicPath(data, topic) : "Assunto",
          when: relativeDay(review.dueDate, date),
        };
      }),
      dueCount: due.length,
      week: {
        studied: formatDuration(week.minutes),
        target: formatDuration(week.targetMinutes),
        percent: week.targetMinutes ? Math.round((100 * week.minutes) / week.targetMinutes) : 0,
        days: week.days.map((day) => ({
          date: day.date,
          minutes: day.minutes,
          height: Math.round((100 * day.minutes) / maxDay),
          today: day.date === date,
        })),
      },
    };
  }, [data]);

  return {
    view,
    start: (cycleItemId: string) => navigate({ to: "/estudar", search: { bloco: cycleItemId } }),
    skipTo: (cycleItemId: string) =>
      view && store.update((current) => skipToCycleItem(current, view.exam.id, cycleItemId)),
    review: () => navigate({ to: "/revisoes" }),
    useExample: () => store.update((current) => startExam(current, EXAMPLE_EXAM)),
  };
}

export type HomeView = NonNullable<ReturnType<typeof useHome>["view"]>;
