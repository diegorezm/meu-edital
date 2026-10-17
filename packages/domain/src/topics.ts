import type { AppData, Topic } from "./types";

/** Nome do assunto com os assuntos-pai, ex.: "Crase › Uso facultativo". */
export function topicPath(data: AppData, topic: Topic) {
  const names = [topic.name];
  let parentId = topic.parentId;
  for (let depth = 0; parentId && depth < 6; depth += 1) {
    const parent = data.topics.find((item) => item.id === parentId);
    if (!parent) break;
    names.unshift(parent.name);
    parentId = parent.parentId;
  }
  return names.join(" › ");
}

/** Assuntos da matéria na ordem do edital: cada assunto seguido dos seus subassuntos. */
export function topicsInOrder(data: AppData, subjectId: string): Topic[] {
  const topics = data.topics.filter((t) => t.subjectId === subjectId);
  const ids = new Set(topics.map((t) => t.id));
  const result: Topic[] = [];
  const visit = (parentId: string | undefined, depth: number) => {
    if (depth > 6) return;
    for (const topic of topics) {
      const isRoot = !topic.parentId || !ids.has(topic.parentId);
      if (parentId ? topic.parentId === parentId : isRoot) {
        result.push(topic);
        visit(topic.id, depth + 1);
      }
    }
  };
  visit(undefined, 0);
  return result;
}

/**
 * Sugere o assunto para um bloco do ciclo: o primeiro assunto ainda não
 * estudado (preferindo os mais específicos, sem subassuntos) ou, quando o
 * edital da matéria já foi coberto, o assunto estudado há mais tempo.
 */
export function suggestNextTopic(
  data: AppData,
  subjectId: string,
): Topic | undefined {
  const topics = topicsInOrder(data, subjectId);
  const parents = new Set(topics.map((t) => t.parentId).filter(Boolean));
  const leaves = topics.filter((t) => !parents.has(t.id));
  const pending = leaves.find((t) => !t.studied) || topics.find((t) => !t.studied);
  if (pending) return pending;
  const lastStudied = new Map<string, string>();
  for (const session of data.sessions) {
    if (session.subjectId !== subjectId) continue;
    const previous = lastStudied.get(session.topicId);
    if (!previous || session.date > previous)
      lastStudied.set(session.topicId, session.date);
  }
  return [...leaves].sort((a, b) =>
    (lastStudied.get(a.id) || "").localeCompare(lastStudied.get(b.id) || ""),
  )[0];
}
