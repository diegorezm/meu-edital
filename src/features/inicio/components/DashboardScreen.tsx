import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useStore } from "@global/store/store";
import { examProgress, weeklyStats } from "@domain/stats";
import { weekdays } from "@domain/types";
import {
  getDueReviews,
  getTodayPlan,
  getTopicPerformance,
} from "../utils/dashboardSelectors";
import {
  Button,
  BottomDrawer,
  Empty,
  InlineLink,
  Page,
  palette,
  Section,
} from "@global/components/ui";

export default function Dashboard() {
  const { data } = useStore();
  const exam = data?.exams.find((item) => item.id === data.activeExamId);
  const stats = data && exam ? weeklyStats(data, exam.id) : null;
  const day = (new Date().getDay() + 6) % 7;
  const planned = data && exam ? getTodayPlan(data, exam.id) : [];
  const pending = data && exam ? getDueReviews(data, exam.id) : [];
  const next = planned.find((item) => !item.completed);
  const subject = (id: string) =>
    data?.subjects.find((item) => item.id === id)?.name || "Matéria";
  const topic = (id: string) =>
    data?.topics.find((item) => item.id === id)?.name || "Assunto";
  const progress = exam && data ? examProgress(data, exam.id) : 0;
  const hours = Math.floor((stats?.minutes || 0) / 60);
  const minutes = String((stats?.minutes || 0) % 60).padStart(2, "0");
  const goal =
    exam && exam.hoursPerWeek > 0
      ? Math.min(
          100,
          Math.round(((stats?.minutes || 0) / (exam.hoursPerWeek * 60)) * 100),
        )
      : 0;
  const subjects =
    data?.subjects.filter((item) => item.examId === exam?.id) || [];
  const topicStats = data && exam ? getTopicPerformance(data, exam.id) : [];
  const weak = topicStats
    .filter((item) => item.rate !== null)
    .sort((a, b) => (a.rate || 0) - (b.rate || 0))
    .slice(0, 2);
  const notStarted = topicStats.filter((item) => item.count === 0).slice(0, 2);

  return (
    <Page eyebrow="INÍCIO" title="Um passo de cada vez.">
      <View style={s.content}>
        {exam ? (
          <>
            <View style={s.examCard}>
              <View style={s.examInfo}>
                <Text style={s.overline}>SEU OBJETIVO</Text>
                <Text style={s.examName}>{exam.name}</Text>
                <Text style={s.examRole}>{exam.role}</Text>
              </View>
              <View style={s.progressBadge}>
                <Text style={s.progressValue}>{progress}%</Text>
                <Text style={s.progressCaption}>do edital</Text>
              </View>
            </View>

            <View style={s.focusCard}>
              <Text style={s.focusOverline}>PRÓXIMO PASSO</Text>
              <Text style={s.focusTitle}>
                {next
                  ? topic(next.topicId)
                  : pending.length
                    ? "Hora de revisar"
                    : "Vamos começar?"}
              </Text>
              <Text style={s.focusMeta}>
                {next
                  ? `${subject(next.subjectId)} · ${next.type} · ${next.minutes} min`
                  : pending.length
                    ? `${pending.length} ${pending.length === 1 ? "revisão espera" : "revisões esperam"} por você`
                    : "Escolha um assunto e siga no seu ritmo."}
              </Text>
              <Button
                title={
                  pending.length && !next
                    ? "Ver revisões  →"
                    : "Começar estudo  →"
                }
                onPress={() =>
                  router.push(
                    next
                      ? { pathname: "/estudar", params: { planId: next.id } }
                      : pending.length
                        ? "/revisoes"
                        : "/estudar",
                  )
                }
              />
            </View>

            <Section title="Hoje" aside={weekdays[day]}>
              {planned.length ? (
                <>
                  {planned.slice(0, 3).map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname: "/estudar",
                          params: { planId: item.id },
                        })
                      }
                      style={s.planRow}
                    >
                      <View
                        style={[
                          s.planMarker,
                          item.completed && s.planMarkerDone,
                        ]}
                      >
                        <Text style={s.planMarkerText}>
                          {item.completed ? "✓" : "○"}
                        </Text>
                      </View>
                      <View style={s.planText}>
                        <Text style={s.planTitle}>{topic(item.topicId)}</Text>
                        <Text style={s.planMeta}>
                          {subject(item.subjectId)} · {item.minutes} min
                        </Text>
                      </View>
                      <Text style={s.rowArrow}>›</Text>
                    </Pressable>
                  ))}
                  {planned.length > 3 && (
                    <Text style={s.moreCount}>
                      + {planned.length - 3} no seu plano
                    </Text>
                  )}
                </>
              ) : (
                <Empty text="Nada marcado para hoje. Você pode estudar livremente." />
              )}
              <View style={s.sectionFooter}>
                <InlineLink href="/plano" label="Ver semana" />
              </View>
            </Section>

            <Text style={s.detailsTitle}>Quando quiser ver mais</Text>
            <BottomDrawer
              title="Progresso"
              summary={`${hours}h ${minutes} estudadas · ${goal}% da meta semanal`}
            >
              <View style={s.statsRow}>
                <View style={[s.statTile, s.mint]}>
                  <Text style={s.statValue}>
                    {hours}h {minutes}
                  </Text>
                  <Text style={s.statLabel}>de estudo</Text>
                </View>
                <View style={[s.statTile, s.peach]}>
                  <Text style={s.statValue}>{stats?.questions || 0}</Text>
                  <Text style={s.statLabel}>questões</Text>
                </View>
              </View>
              <View style={s.progressLine}>
                <Text style={s.progressLineLabel}>
                  Meta de {exam.hoursPerWeek}h
                </Text>
                <Text style={s.progressLineValue}>{goal}%</Text>
              </View>
              <View style={s.track}>
                <View style={[s.trackFill, { width: `${goal}%` }]} />
              </View>
              <Text style={s.supportingText}>
                {stats?.accuracy === null
                  ? "Registre questões para acompanhar seus acertos."
                  : `${stats?.accuracy}% de acertos nas questões registradas.`}
              </Text>
            </BottomDrawer>

            <BottomDrawer
              title="Revisões"
              action={{ label: "Abrir revisões  →", href: "/revisoes" }}
              summary={
                pending.length
                  ? `${pending.length} ${pending.length === 1 ? "pendente" : "pendentes"}`
                  : "Tudo em dia"
              }
            >
              {pending.length ? (
                pending.slice(0, 3).map((item) => (
                  <View key={item.id} style={s.detailRow}>
                    <Text style={s.detailText}>{topic(item.topicId)}</Text>
                    <Text style={s.detailMeta}>{item.dueDate}</Text>
                  </View>
                ))
              ) : (
                <Empty text="Tudo em dia por aqui." />
              )}
            </BottomDrawer>

            <BottomDrawer
              title="Matérias"
              summary={`${subjects.length} ${subjects.length === 1 ? "matéria" : "matérias"} no edital`}
            >
              {subjects.map((item) => {
                const topics = data!.topics.filter(
                  (topic) => topic.subjectId === item.id,
                );
                const value = topics.length
                  ? Math.round(
                      (100 * topics.filter((topic) => topic.studied).length) /
                        topics.length,
                    )
                  : 0;
                return (
                  <View key={item.id} style={s.subjectRow}>
                    <View style={s.progressLine}>
                      <Text style={s.detailText}>{item.name}</Text>
                      <Text style={s.detailMeta}>{value}%</Text>
                    </View>
                    <View style={s.track}>
                      <View style={[s.trackFill, { width: `${value}%` }]} />
                    </View>
                  </View>
                );
              })}
              {(weak.length > 0 || notStarted.length > 0) && (
                <View style={s.focusHint}>
                  <Text style={s.focusHintTitle}>Para focar depois</Text>
                  {weak.map((item) => (
                    <Text key={item.topic.id} style={s.supportingText}>
                      • {item.topic.name} · {item.rate}% de acertos
                    </Text>
                  ))}
                  {notStarted.map((item) => (
                    <Text key={item.topic.id} style={s.supportingText}>
                      • {item.topic.name} · ainda não estudado
                    </Text>
                  ))}
                </View>
              )}
            </BottomDrawer>
          </>
        ) : (
          <Section title="Seu próximo capítulo começa aqui">
            <Empty text="Crie seu primeiro concurso e organize seus estudos com calma." />
            <Button
              title="Adicionar concurso  →"
              onPress={() => router.push("/concursos")}
            />
          </Section>
        )}
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 760, alignSelf: "center" },
  examCard: {
    backgroundColor: "#EBE6FF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  examInfo: { flex: 1, minWidth: 0 },
  overline: {
    color: "#7767B3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  examName: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 5,
  },
  examRole: { color: "#655F78", fontSize: 12, marginTop: 3 },
  progressBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  progressValue: { color: "#6C58B2", fontSize: 17, fontWeight: "900" },
  progressCaption: { color: palette.muted, fontSize: 9 },
  focusCard: {
    backgroundColor: "#BDD1FC",
    borderRadius: 24,
    padding: 23,
    marginBottom: 18,
  },
  focusOverline: {
    color: "#4D6295",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  focusTitle: {
    color: palette.text,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 11,
  },
  focusMeta: { color: "#495979", fontSize: 12, marginTop: 6, marginBottom: 19 },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  planMarker: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#E9EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  planMarkerDone: { backgroundColor: palette.mint },
  planMarkerText: { color: palette.text, fontSize: 17, fontWeight: "800" },
  planText: { flex: 1, minWidth: 0 },
  planTitle: { color: palette.text, fontSize: 13, fontWeight: "700" },
  planMeta: { color: palette.muted, fontSize: 11, marginTop: 3 },
  rowArrow: { color: palette.muted, fontSize: 24 },
  moreCount: { color: palette.muted, fontSize: 12, marginTop: 11 },
  sectionFooter: { marginTop: 14 },
  detailsTitle: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 7,
    marginBottom: 11,
  },
  statsRow: { flexDirection: "row", gap: 9, marginTop: 16 },
  statTile: { flex: 1, borderRadius: 16, padding: 15 },
  mint: { backgroundColor: palette.mint },
  peach: { backgroundColor: palette.peach },
  statValue: { color: palette.text, fontSize: 19, fontWeight: "800" },
  statLabel: { color: "#576161", fontSize: 11, marginTop: 3 },
  progressLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  progressLineLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 18,
  },
  progressLineValue: {
    color: "#6C58B2",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 18,
  },
  track: {
    height: 6,
    borderRadius: 6,
    backgroundColor: "#ECEEF0",
    marginTop: 8,
    overflow: "hidden",
  },
  trackFill: { height: "100%", borderRadius: 6, backgroundColor: "#937ED8" },
  supportingText: {
    color: palette.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  detailText: { color: palette.text, fontSize: 12, fontWeight: "700", flex: 1 },
  detailMeta: { color: palette.muted, fontSize: 11 },
  subjectRow: { marginTop: 15 },
  focusHint: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 14,
  },
  focusHintTitle: { color: palette.text, fontSize: 12, fontWeight: "800" },
});
