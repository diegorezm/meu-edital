import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  cycleState,
  daysUntil,
  dueReviews,
  examProgress,
  suggestNextTopic,
  topicPerformance,
  weekSummary,
} from "@meu-edital/domain";
import { useStore } from "@global/store/store";
import { formatDuration } from "@global/utils/formatDuration";
import {
  Button,
  BottomDrawer,
  Empty,
  InlineLink,
  Page,
  palette,
  Section,
  useLayout,
} from "@global/components/ui";

export default function Dashboard() {
  const { data } = useStore();
  const { mobile, wide } = useLayout();
  const exam = data?.exams.find((item) => item.id === data.activeExamId);
  const week = data && exam ? weekSummary(data, exam.id) : null;
  const cycle = data && exam ? cycleState(data, exam.id) : null;
  const next = cycle?.next;
  const suggestion =
    data && next ? suggestNextTopic(data, next.subjectId) : undefined;
  const pending = data && exam ? dueReviews(data, exam.id) : [];
  const subject = (id: string) =>
    data?.subjects.find((item) => item.id === id)?.name || "Matéria";
  const topic = (id: string) =>
    data?.topics.find((item) => item.id === id)?.name || "Assunto";
  const progress = exam && data ? examProgress(data, exam.id) : 0;
  const daysLeft = exam?.examDate ? daysUntil(exam.examDate) : null;
  const goal = week?.targetMinutes
    ? Math.min(100, Math.round((100 * week.minutes) / week.targetMinutes))
    : 0;
  const subjects =
    data?.subjects.filter((item) => item.examId === exam?.id) || [];
  const topicStats = data && exam ? topicPerformance(data, exam.id) : [];
  const weak = topicStats
    .filter((item) => item.accuracy !== null)
    .sort((a, b) => (a.accuracy || 0) - (b.accuracy || 0))
    .slice(0, 2);
  const notStarted = topicStats
    .filter((item) => item.sessions === 0)
    .slice(0, 2);

  if (!data || !exam)
    return (
      <Page eyebrow="INÍCIO" title="Um passo de cada vez.">
        <View style={s.content}>
          <Section title="Seu próximo capítulo começa aqui">
            <Empty text="Crie seu primeiro concurso e organize seus estudos com calma." />
            <Button
              title="Adicionar concurso  →"
              onPress={() => router.push("/concursos")}
            />
          </Section>
        </View>
      </Page>
    );

  const upcoming = cycle
    ? Array.from(
        { length: Math.min(5, Math.max(0, cycle.items.length - 1)) },
        (_, index) =>
          cycle.items[(cycle.position + 1 + index) % cycle.items.length],
      )
    : [];

  const examCard = (
    <View style={s.examCard}>
      <View style={s.examInfo}>
        <Text style={s.overline}>SEU OBJETIVO</Text>
        <Text style={s.examName}>{exam.name}</Text>
        <Text style={s.examRole}>{exam.role}</Text>
        {daysLeft !== null && daysLeft >= 0 && (
          <Text style={s.examCountdown}>
            {daysLeft === 0
              ? "A prova é hoje"
              : daysLeft === 1
                ? "Falta 1 dia para a prova"
                : `Faltam ${daysLeft} dias para a prova`}
          </Text>
        )}
      </View>
      <View style={s.progressBadge}>
        <Text style={s.progressValue}>{progress}%</Text>
        <Text style={s.progressCaption}>do edital</Text>
      </View>
    </View>
  );

  const focusCard = (
    <View style={[s.focusCard, !mobile && s.focusCardDesktop]}>
      <Text style={s.focusOverline}>
        {next && cycle
          ? `PRÓXIMO DO CICLO · ${cycle.position + 1} DE ${cycle.items.length} · VOLTA ${cycle.laps + 1}`
          : "PRÓXIMO PASSO"}
      </Text>
      <Text style={[s.focusTitle, !mobile && s.focusTitleDesktop]}>
        {next ? subject(next.subjectId) : "Monte seu ciclo"}
      </Text>
      <Text style={s.focusMeta}>
        {next
          ? `${suggestion ? `${suggestion.name} · ` : ""}${formatDuration(next.minutes)}`
          : "Gere a sequência de estudos pelos pesos das matérias."}
      </Text>
      <Button
        title={next ? "Começar estudo  →" : "Abrir ciclo  →"}
        onPress={() =>
          router.push(
            next
              ? { pathname: "/estudar", params: { cycleId: next.id } }
              : "/ciclo",
          )
        }
      />
      {pending.length > 0 && (
        <View style={s.reviewHint}>
          <Text style={s.reviewHintText}>
            {pending.length}{" "}
            {pending.length === 1 ? "revisão vencida" : "revisões vencidas"}
          </Text>
          <InlineLink href="/revisoes" label="Revisar" />
        </View>
      )}
    </View>
  );

  const weekSection = (
    <Section
      title="Esta semana"
      aside={`${formatDuration(week?.minutes || 0)} de ${formatDuration(week?.targetMinutes || 0)}`}
    >
      <View style={s.track}>
        <View style={[s.trackFill, { width: `${goal}%` }]} />
      </View>
      {week?.subjects.map((item) => {
        const percent = item.targetMinutes
          ? Math.min(100, (100 * item.minutes) / item.targetMinutes)
          : 0;
        return (
          <View key={item.subjectId} style={s.weekRow}>
            <View style={s.weekLine}>
              <Text style={s.weekName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={s.weekMeta}>
                {formatDuration(item.minutes)} /{" "}
                {formatDuration(item.targetMinutes)}
              </Text>
            </View>
            {!mobile && (
              <View style={s.miniTrack}>
                <View style={[s.trackFill, { width: `${percent}%` }]} />
              </View>
            )}
          </View>
        );
      })}
      <View style={s.sectionFooter}>
        <InlineLink href="/semana" label="Ver semana" />
      </View>
    </Section>
  );

  const queueSection = upcoming.length > 0 && (
    <Section
      title="Depois deste bloco"
      aside={`${cycle?.items.length} no ciclo`}
    >
      {upcoming.map((item, index) => (
        <View key={`${item.id}-${index}`} style={s.queueRow}>
          <Text style={s.queueNumber}>
            {String(
              ((cycle!.position + 1 + index) % cycle!.items.length) + 1,
            ).padStart(2, "0")}
          </Text>
          <Text style={s.queueName} numberOfLines={1}>
            {subject(item.subjectId)}
          </Text>
          <Text style={s.weekMeta}>{formatDuration(item.minutes)}</Text>
        </View>
      ))}
      <View style={s.sectionFooter}>
        <InlineLink href="/ciclo" label="Ver ciclo" />
      </View>
    </Section>
  );

  const performance = (
    <>
      <View style={s.statsRow}>
        <View style={[s.statTile, s.mint]}>
          <Text style={s.statValue}>{formatDuration(week?.minutes || 0)}</Text>
          <Text style={s.statLabel}>de estudo</Text>
        </View>
        <View style={[s.statTile, s.peach]}>
          <Text style={s.statValue}>{week?.questions || 0}</Text>
          <Text style={s.statLabel}>questões</Text>
        </View>
      </View>
      <Text style={s.supportingText}>
        {week?.accuracy === null || week?.accuracy === undefined
          ? "Registre questões para acompanhar seus acertos."
          : `${week.accuracy}% de acertos nas questões registradas.`}
      </Text>
      <Text style={s.supportingText}>
        {cycle?.laps || 0}{" "}
        {cycle?.laps === 1 ? "volta completa" : "voltas completas"} no ciclo.
      </Text>
    </>
  );

  const reviews = pending.length ? (
    pending.slice(0, mobile ? 3 : 5).map((item) => (
      <View key={item.id} style={s.detailRow}>
        <Text style={s.detailText}>{topic(item.topicId)}</Text>
        <Text style={s.detailMeta}>{item.dueDate}</Text>
      </View>
    ))
  ) : (
    <Empty text="Tudo em dia por aqui." />
  );

  const coverage = (
    <>
      {subjects.map((item) => {
        const topics = data.topics.filter(
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
              • {item.topic.name} · {item.accuracy}% de acertos
            </Text>
          ))}
          {notStarted.map((item) => (
            <Text key={item.topic.id} style={s.supportingText}>
              • {item.topic.name} · ainda não estudado
            </Text>
          ))}
        </View>
      )}
    </>
  );

  const reviewsAside = pending.length
    ? `${pending.length} ${pending.length === 1 ? "pendente" : "pendentes"}`
    : "Tudo em dia";

  if (mobile)
    return (
      <Page eyebrow="INÍCIO" title="Um passo de cada vez.">
        <View style={s.content}>
          {examCard}
          {focusCard}
          {weekSection}
          <Text style={s.detailsTitle}>Quando quiser ver mais</Text>
          <BottomDrawer
            title="Desempenho da semana"
            summary={`${week?.questions || 0} questões · ${week?.cycleBlocks || 0} blocos do ciclo`}
          >
            {performance}
          </BottomDrawer>
          <BottomDrawer
            title="Revisões"
            action={{ label: "Abrir revisões  →", href: "/revisoes" }}
            summary={reviewsAside}
          >
            {reviews}
          </BottomDrawer>
          <BottomDrawer
            title="Matérias"
            summary={`${subjects.length} ${subjects.length === 1 ? "matéria" : "matérias"} no edital`}
          >
            {coverage}
          </BottomDrawer>
        </View>
      </Page>
    );

  return (
    <Page eyebrow="INÍCIO" title="Um passo de cada vez.">
      <View style={[s.grid, wide && s.gridWide]}>
        <View style={[s.column, wide && s.mainColumn]}>
          {focusCard}
          {weekSection}
          {queueSection}
        </View>
        <View style={[s.column, wide && s.sideColumn]}>
          {examCard}
          <Section title="Desempenho da semana">{performance}</Section>
          <Section title="Revisões" aside={reviewsAside}>
            {reviews}
            <View style={s.sectionFooter}>
              <InlineLink href="/revisoes" label="Abrir revisões" />
            </View>
          </Section>
          <Section title="Cobertura do edital" aside={`${progress}%`}>
            {coverage}
          </Section>
        </View>
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 760, alignSelf: "center" },
  grid: { width: "100%", gap: 18 },
  gridWide: { flexDirection: "row", alignItems: "flex-start" },
  column: { gap: 0, minWidth: 0 },
  mainColumn: { flex: 3 },
  sideColumn: { flex: 2 },
  focusCardDesktop: { padding: 28 },
  focusTitleDesktop: { fontSize: 34, lineHeight: 40 },
  weekLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  miniTrack: {
    height: 5,
    borderRadius: 4,
    backgroundColor: "#ECEEF0",
    marginTop: 7,
    overflow: "hidden",
  },
  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  queueNumber: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
    width: 22,
  },
  queueName: { color: palette.text, fontSize: 13, fontWeight: "700", flex: 1 },
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
  examCountdown: {
    color: palette.dark,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },
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
  sectionFooter: { marginTop: 14 },
  reviewHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.55)",
  },
  reviewHintText: { color: "#495979", fontSize: 12, fontWeight: "700" },
  weekRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  weekName: { color: palette.text, fontSize: 13, fontWeight: "700", flex: 1 },
  weekMeta: { color: palette.muted, fontSize: 12 },
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
