import type { AppData, Topic } from "./types";

/** Ids dos assuntos com ao menos uma sessão. */
export function studiedTopicIds(data: AppData): Set<string> {
  return new Set(data.sessions.map((session) => session.topicId));
}

export function isTopicStudied(data: AppData, topicId: string): boolean {
  return data.sessions.some((session) => session.topicId === topicId);
}

const byPosition = (a: { position: number; id: string }, b: { position: number; id: string }) =>
  a.position - b.position || a.id.localeCompare(b.id);

/** Matérias do concurso na ordem do edital. */
export function subjectsInOrder(data: AppData, examId: string) {
  return data.subjects.filter((s) => s.examId === examId).sort(byPosition);
}

/** Próxima posição livre em uma lista ordenada. */
export function nextPosition(items: { position: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.position + 1), 0);
}

/** Nome do assunto com os assuntos-pai, ex.: "Crase › Uso facultativo". */
export function topicPath(data: AppData, topic: Topic) {
  const byId = new Map(data.topics.map((item) => [item.id, item]));
  const names = [topic.name];
  const seen = new Set<string>([topic.id]);
  let parentId = topic.parentId;
  for (let depth = 0; parentId && depth < 6 && !seen.has(parentId); depth += 1) {
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    names.unshift(parent.name);
    parentId = parent.parentId;
  }
  return names.join(" › ");
}

/** Assuntos da matéria na ordem do edital: cada assunto seguido dos seus subassuntos. */
export function topicsInOrder(data: AppData, subjectId: string): Topic[] {
  const topics = data.topics.filter((t) => t.subjectId === subjectId).sort(byPosition);
  const ids = new Set(topics.map((t) => t.id));
  const children = new Map<string, Topic[]>();
  const roots: Topic[] = [];
  for (const topic of topics) {
    if (!topic.parentId || !ids.has(topic.parentId)) {
      roots.push(topic);
    } else {
      const list = children.get(topic.parentId) ?? [];
      list.push(topic);
      children.set(topic.parentId, list);
    }
  }
  const result: Topic[] = [];
  const visited = new Set<string>();
  const visit = (list: Topic[], depth: number) => {
    if (depth > 6) return;
    for (const topic of list) {
      if (visited.has(topic.id)) continue;
      visited.add(topic.id);
      result.push(topic);
      const sub = children.get(topic.id);
      if (sub) visit(sub, depth + 1);
    }
  };
  visit(roots, 0);
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
  const studied = studiedTopicIds(data);
  const parents = new Set(topics.map((t) => t.parentId).filter(Boolean));
  const leaves = topics.filter((t) => !parents.has(t.id));
  const pending =
    leaves.find((t) => !studied.has(t.id)) || topics.find((t) => !studied.has(t.id));
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
