import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useStore } from "@/data/store";
import { examProgress, weeklyStats } from "@/domain/logic";
import { currentWeekStart, weekdays, today } from "@/domain/types";
import {
  Button,
  Empty,
  InlineLink,
  Page,
  palette,
  Section,
} from "@/components/ui";

export default function Dashboard() {
  const { data } = useStore();
  const { width } = useWindowDimensions();
  const exam = data?.exams.find((e) => e.id === data.activeExamId);
  const stats = data && exam ? weeklyStats(data, exam.id) : null;
  const day = (new Date().getDay() + 6) % 7;
  const planned =
    data?.planned
      .filter(
        (p) =>
          p.examId === exam?.id &&
          p.weekStart === currentWeekStart() &&
          p.day === day,
      )
      .sort((a, b) => a.order - b.order) || [];
  const pending =
    data?.reviews
      .filter(
        (r) => r.examId === exam?.id && !r.completed && r.dueDate <= today(),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)) || [];
  const next = planned.find((p) => !p.completed);
  const topic = (id: string) =>
    data?.topics.find((t) => t.id === id)?.name || "Assunto";
  const subject = (id: string) =>
    data?.subjects.find((s) => s.id === id)?.name || "Matéria";
  const topicStats =
    data?.topics
      .filter((t) =>
        data.subjects.some(
          (s) => s.id === t.subjectId && s.examId === exam?.id,
        ),
      )
      .map((t) => {
        const sessions = data.sessions.filter(
          (s) => s.topicId === t.id && s.questions,
        );
        const questions = sessions.reduce((n, s) => n + (s.questions || 0), 0);
        const correct = sessions.reduce((n, s) => n + (s.correct || 0), 0);
        return {
          topic: t,
          rate: questions ? Math.round((100 * correct) / questions) : null,
          count: data.sessions.filter((s) => s.topicId === t.id).length,
        };
      }) || [];
  const weak = topicStats
    .filter((x) => x.rate !== null)
    .sort((a, b) => (a.rate || 0) - (b.rate || 0))
    .slice(0, 3);
  const least = topicStats.filter((x) => x.count === 0).slice(0, 3);
  return (
    <Page
      eyebrow="Painel de estudos"
      title="O que estudar agora?"
      action={
        <Button
          title="+ Registrar estudo"
          onPress={() => router.push("/estudar")}
        />
      }
    >
      {exam ? (
        <>
          <View style={s.examLine}>
            <View>
              <Text style={s.examName}>{exam.name}</Text>
              <Text style={s.subline}>
                {exam.role} · {exam.hoursPerWeek}h por semana
              </Text>
            </View>
            <View style={s.progress}>
              <Text style={s.progressNumber}>
                {examProgress(data!, exam.id)}%
              </Text>
              <Text style={s.subline}>do edital</Text>
            </View>
          </View>
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${examProgress(data!, exam.id)}%` },
              ]}
            />
          </View>
          <View style={[s.grid, width < 920 && { flexDirection: "column" }]}>
            <View style={s.primary}>
              <View style={s.hero}>
                <Text style={s.heroLabel}>PRÓXIMO ESTUDO</Text>
                <Text style={s.heroTitle}>
                  {next
                    ? topic(next.topicId)
                    : pending.length
                      ? topic(pending[0].topicId)
                      : "Sua semana começa aqui"}
                </Text>
                <Text style={s.heroMeta}>
                  {next
                    ? `${subject(next.subjectId)} · ${next.type} · ${next.minutes} min`
                    : pending.length
                      ? "Revisão pendente"
                      : "Monte um plano ou inicie uma sessão livre."}
                </Text>
                <Button
                  title="Iniciar estudo →"
                  onPress={() =>
                    router.push(
                      next
                        ? { pathname: "/estudar", params: { planId: next.id } }
                        : "/estudar",
                    )
                  }
                />
              </View>
              <Section title="Hoje" aside={weekdays[day]}>
                {planned.length ? (
                  planned.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() =>
                        router.push({
                          pathname: "/estudar",
                          params: { planId: p.id },
                        })
                      }
                      style={s.listRow}
                    >
                      <Text
                        style={[
                          s.marker,
                          p.completed && { color: palette.accent },
                        ]}
                      >
                        {p.completed ? "✓" : "○"}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowTitle}>
                          {subject(p.subjectId)} · {topic(p.topicId)}
                        </Text>
                        <Text style={s.rowMeta}>
                          {p.type} · {p.minutes} min
                        </Text>
                      </View>
                      <Text style={s.arrow}>→</Text>
                    </Pressable>
                  ))
                ) : (
                  <Empty text="Nenhuma sessão planejada para hoje." />
                )}
              </Section>
              <Section title="Revisões" aside={`${pending.length} pendentes`}>
                {pending.length ? (
                  pending.slice(0, 4).map((r) => (
                    <View key={r.id} style={s.listRow}>
                      <Text style={[s.marker, { color: palette.danger }]}>
                        !
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowTitle}>{topic(r.topicId)}</Text>
                        <Text style={s.rowMeta}>Prazo: {r.dueDate}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Empty text="Você está em dia com as revisões." />
                )}
                <InlineLink href="/revisoes" label="Ver revisões" />
              </Section>
            </View>
            <View style={s.secondary}>
              <Section title="Esta semana">
                <View style={s.stat}>
                  <Text style={s.statValue}>
                    {Math.floor((stats?.minutes || 0) / 60)}h{" "}
                    {String((stats?.minutes || 0) % 60).padStart(2, "0")}m
                  </Text>
                  <Text style={s.statLabel}>tempo estudado</Text>
                </View>
                <View style={s.statRow}>
                  <View>
                    <Text style={s.statSmall}>{stats?.questions || 0}</Text>
                    <Text style={s.statLabel}>questões</Text>
                  </View>
                  <View>
                    <Text style={s.statSmall}>
                      {stats?.accuracy === null ? "—" : `${stats?.accuracy}%`}
                    </Text>
                    <Text style={s.statLabel}>acertos</Text>
                  </View>
                </View>
                <Text style={s.goal}>
                  Meta: {exam.hoursPerWeek}h ·{" "}
                  {Math.min(
                    100,
                    Math.round(
                      ((stats?.minutes || 0) / (exam.hoursPerWeek * 60)) * 100,
                    ),
                  )}
                  % concluída
                </Text>
              </Section>
              <Section title="Atenção aos assuntos">
                {weak.length ? (
                  weak.map((x) => (
                    <View key={x.topic.id} style={s.compactRow}>
                      <Text style={s.rowTitle}>{x.topic.name}</Text>
                      <Text style={s.warn}>{x.rate}%</Text>
                    </View>
                  ))
                ) : (
                  <Text style={s.rowMeta}>
                    Registre questões para ver o desempenho.
                  </Text>
                )}
                {least.length > 0 && (
                  <>
                    <Text style={s.smallHeading}>AINDA NÃO ESTUDADOS</Text>
                    {least.map((x) => (
                      <Text key={x.topic.id} style={s.rowMeta}>
                        · {x.topic.name}
                      </Text>
                    ))}
                  </>
                )}
              </Section>
              <Section title="Progresso por matéria">
                {data!.subjects
                  .filter((x) => x.examId === exam.id)
                  .map((x) => {
                    const topics = data!.topics.filter(
                      (t) => t.subjectId === x.id,
                    );
                    const value = topics.length
                      ? Math.round(
                          (100 * topics.filter((t) => t.studied).length) /
                            topics.length,
                        )
                      : 0;
                    return (
                      <View key={x.id} style={s.subjectProgress}>
                        <View style={s.statRow}>
                          <Text style={s.rowTitle}>{x.name}</Text>
                          <Text style={s.rowMeta}>{value}%</Text>
                        </View>
                        <View style={s.smallTrack}>
                          <View
                            style={[s.progressFill, { width: `${value}%` }]}
                          />
                        </View>
                      </View>
                    );
                  })}
              </Section>
            </View>
          </View>
        </>
      ) : (
        <Empty text="Crie seu primeiro concurso para começar." />
      )}
    </Page>
  );
}
const s = StyleSheet.create({
  examLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  examName: { color: palette.text, fontSize: 18, fontWeight: "800" },
  subline: { color: palette.muted, fontSize: 12, marginTop: 4 },
  progress: { alignItems: "flex-end" },
  progressNumber: { color: palette.accent, fontSize: 22, fontWeight: "800" },
  progressTrack: {
    height: 4,
    backgroundColor: palette.line,
    borderRadius: 2,
    marginTop: 17,
    marginBottom: 34,
  },
  progressFill: {
    height: "100%",
    backgroundColor: palette.accent,
    borderRadius: 2,
  },
  grid: { flexDirection: "row", gap: 42 },
  primary: { flex: 1.65 },
  secondary: { flex: 1 },
  hero: {
    backgroundColor: "#23372c",
    borderRadius: 15,
    padding: 26,
    marginBottom: 36,
    gap: 13,
  },
  heroLabel: {
    color: palette.accent,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  heroTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  heroMeta: { color: palette.muted, fontSize: 13, marginBottom: 7 },
  listRow: {
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: palette.line,
    paddingVertical: 13,
  },
  marker: { color: palette.muted, fontSize: 22, width: 20 },
  rowTitle: { color: palette.text, fontSize: 13, fontWeight: "700" },
  rowMeta: { color: palette.muted, fontSize: 12, marginTop: 4 },
  arrow: { color: palette.accent },
  stat: { borderBottomWidth: 1, borderColor: palette.line, paddingBottom: 15 },
  statValue: { color: palette.text, fontSize: 31, fontWeight: "800" },
  statLabel: { color: palette.muted, fontSize: 11, marginTop: 5 },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statSmall: { color: palette.text, fontSize: 23, fontWeight: "800" },
  goal: { color: palette.accent, fontSize: 12, marginTop: 20 },
  compactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  warn: { color: palette.danger, fontWeight: "800", fontSize: 13 },
  smallHeading: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 6,
  },
  subjectProgress: { marginBottom: 15 },
  smallTrack: {
    backgroundColor: palette.line,
    height: 3,
    borderRadius: 2,
    marginTop: 9,
  },
});
