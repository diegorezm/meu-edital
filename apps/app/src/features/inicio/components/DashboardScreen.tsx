import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  cycleState,
  daysUntil,
  dueReviews,
  examProgress,
  monthSummary,
  suggestNextTopic,
  topicPerformance,
  weekSummary,
} from "@meu-edital/domain";
import { Text } from "@global/components/Text";
import {
  AnswerSheet,
  BottomDrawer,
  Button,
  Empty,
  HandNote,
  Highlight,
  InlineLink,
  Label,
  Page,
  palette,
  Rule,
  Section,
  Stamp,
  useLayout,
} from "@global/components/ui";
import { fonts } from "@global/constants/fonts";
import { useStore } from "@global/store/store";
import { displayExamDate } from "@global/utils/examDate";
import {
  formatDuration,
  formatMonth,
  formatShortDate,
} from "@global/utils/formatDuration";
import { subjectTone } from "@global/utils/subjectTone";

export default function Dashboard() {
  const { data } = useStore();
  const { mobile, wide } = useLayout();
  const exam = data?.exams.find((item) => item.id === data.activeExamId);
  const week = data && exam ? weekSummary(data, exam.id) : null;
  const month = data && exam ? monthSummary(data, exam.id) : null;
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
      <Page eyebrow="Início" title="Um passo de cada vez.">
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

  const title =
    daysLeft !== null && daysLeft > 0 ? (
      <>
        {daysLeft === 1 ? "Falta " : "Faltam "}
        <Highlight>
          {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
        </Highlight>{" "}
        para a prova.
      </>
    ) : daysLeft === 0 ? (
      <>
        A prova é <Highlight>hoje</Highlight>. Boa prova!
      </>
    ) : (
      "Um passo de cada vez."
    );
  const eyebrow = [exam.name, exam.role].filter(Boolean).join(" · ");
  const facts = [
    exam.examDate && daysLeft !== null && daysLeft >= 0
      ? `Prova ${displayExamDate(exam.examDate)}`
      : null,
    `${progress}% do edital`,
  ]
    .filter(Boolean)
    .join(" · ");

  const upcoming = cycle
    ? Array.from(
        { length: Math.min(5, Math.max(0, cycle.items.length - 1)) },
        (_, index) =>
          cycle.items[(cycle.position + 1 + index) % cycle.items.length],
      )
    : [];

  const focusCard = (
    <View style={[s.focusCard, !mobile && s.focusCardDesktop]}>
      <Text style={s.focusOverline}>
        {next && cycle
          ? `Bloco ${String(cycle.position + 1).padStart(2, "0")} de ${cycle.items.length} · volta ${cycle.laps + 1}`
          : "Próximo passo"}
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
        inverted
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
          <Text
            accessibilityRole="link"
            onPress={() => router.push("/revisoes")}
            style={s.reviewHintLink}
          >
            Revisar →
          </Text>
        </View>
      )}
    </View>
  );

  const answerSection = cycle && cycle.items.length > 0 && (
    <Section
      title="Cartão-resposta do ciclo"
      aside={`${cycle.position} de ${cycle.items.length}`}
    >
      <AnswerSheet
        total={cycle.items.length}
        position={cycle.position}
        size={mobile ? 20 : 18}
      />
      <View style={s.handNote}>
        <HandNote>faltou um dia? segue daqui.</HandNote>
      </View>
    </Section>
  );

  const weekSection = (
    <Section
      title="Esta semana"
      aside={`${formatDuration(week?.minutes || 0)} / ${formatDuration(week?.targetMinutes || 0)}`}
    >
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
            <View style={s.track}>
              <View style={[s.trackFill, { width: `${percent}%` }]} />
            </View>
          </View>
        );
      })}
      <Rule style={s.innerRule} />
      <Text style={s.supportingText}>
        {week?.questions || 0} questões
        {week?.accuracy === null || week?.accuracy === undefined
          ? ""
          : ` · ${week.accuracy}% de acertos`}
        {" · "}
        {cycle?.laps || 0} {cycle?.laps === 1 ? "volta" : "voltas"} no ciclo
      </Text>
      <View style={s.sectionFooter}>
        <InlineLink href="/semana" label="Ver semana" />
      </View>
    </Section>
  );

  const monthSection = month && (
    <Section
      title={formatMonth(month.monthStart)}
      aside={`${month.sessions.length} ${month.sessions.length === 1 ? "sessão" : "sessões"} · ${formatDuration(month.minutes)}`}
    >
      {month.sessions.length ? (
        month.sessions.slice(0, mobile ? 4 : 6).map((item) => (
          <View key={item.id} style={s.logRow}>
            <View
              style={[
                s.logBar,
                { backgroundColor: subjectTone(data, item.subjectId) },
              ]}
            />
            <View style={s.logBody}>
              <View style={s.logLine}>
                <Text style={s.logTitle} numberOfLines={1}>
                  {formatShortDate(item.date)} · {subject(item.subjectId)}
                </Text>
                <Text style={s.logMinutes}>{formatDuration(item.minutes)}</Text>
              </View>
              <View style={s.logLine}>
                <Label style={s.logMeta}>
                  {item.type === "Revisão"
                    ? topic(item.topicId)
                    : `${item.type} · ${topic(item.topicId)}`}
                  {item.questions
                    ? ` · ${item.correct || 0}/${item.questions}`
                    : ""}
                </Label>
                {item.type === "Revisão" && <Stamp label="Revisada" />}
              </View>
              {item.note ? <Text style={s.logNote}>{item.note}</Text> : null}
            </View>
          </View>
        ))
      ) : (
        <Empty text="Nenhuma sessão neste mês ainda. O primeiro bloco já está te esperando." />
      )}
    </Section>
  );

  const queueSection = upcoming.length > 0 && (
    <Section title="Depois deste bloco" aside={`${cycle?.items.length} no ciclo`}>
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

  const reviews = pending.length ? (
    pending.slice(0, mobile ? 3 : 5).map((item) => (
      <View key={item.id} style={s.detailRow}>
        <Text style={s.detailText}>{topic(item.topicId)}</Text>
        <Text style={s.detailMeta}>{formatShortDate(item.dueDate)}</Text>
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
          <View key={item.id} style={s.weekRow}>
            <View style={s.weekLine}>
              <Text style={s.weekName}>{item.name}</Text>
              <Text style={s.weekMeta}>{value}%</Text>
            </View>
            <View style={s.track}>
              <View style={[s.trackFill, { width: `${value}%` }]} />
            </View>
          </View>
        );
      })}
      {(weak.length > 0 || notStarted.length > 0) && (
        <View style={s.focusHint}>
          <Label>Para focar depois</Label>
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

  const factsLine = <Label style={s.facts}>{facts}</Label>;

  if (mobile)
    return (
      <Page eyebrow={eyebrow} title={title}>
        <View style={s.content}>
          {factsLine}
          {focusCard}
          {answerSection}
          {weekSection}
          {monthSection}
          <Label style={s.detailsTitle}>Quando quiser ver mais</Label>
          <BottomDrawer
            title="Revisões"
            action={{ label: "Abrir revisões  →", href: "/revisoes" }}
            summary={reviewsAside}
          >
            {reviews}
          </BottomDrawer>
          <BottomDrawer
            title="Matérias"
            summary={`${subjects.length} ${subjects.length === 1 ? "matéria" : "matérias"} · ${progress}% do edital`}
          >
            {coverage}
          </BottomDrawer>
        </View>
      </Page>
    );

  const reviewsSection = (
    <Section title="Revisões" aside={reviewsAside}>
      {reviews}
      <View style={s.sectionFooter}>
        <InlineLink href="/revisoes" label="Abrir revisões" />
      </View>
    </Section>
  );
  const coverageSection = (
    <Section title="Cobertura do edital" aside={`${progress}%`}>
      {coverage}
    </Section>
  );

  return (
    <Page eyebrow={eyebrow} title={title} action={factsLine}>
      {wide ? (
        <View style={s.grid}>
          <View style={[s.column, s.columnMain]}>
            {focusCard}
            {answerSection}
            {queueSection}
          </View>
          <View style={s.column}>
            {weekSection}
            {reviewsSection}
          </View>
          <View style={s.column}>
            {monthSection}
            {coverageSection}
          </View>
        </View>
      ) : (
        <View style={s.grid}>
          <View style={s.column}>
            {focusCard}
            {answerSection}
            {weekSection}
          </View>
          <View style={s.column}>
            {monthSection}
            {reviewsSection}
            {coverageSection}
          </View>
        </View>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 760, alignSelf: "center" },
  grid: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  column: { flex: 1, minWidth: 0 },
  columnMain: { flex: 1.2 },
  facts: { marginBottom: 16 },
  focusCard: {
    backgroundColor: palette.ink,
    borderRadius: 4,
    padding: 20,
    marginBottom: 16,
  },
  focusCardDesktop: { padding: 24 },
  focusOverline: {
    color: "#C9C3B4",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  focusTitle: {
    color: palette.bg,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "700",
    marginTop: 8,
  },
  focusTitleDesktop: { fontSize: 32, lineHeight: 38 },
  focusMeta: {
    color: "#DCD6C8",
    fontFamily: fonts.typewriter,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  reviewHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 18,
    paddingTop: 13,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderTopColor: "#6A7488",
  },
  reviewHintText: { color: "#DCD6C8", fontSize: 12 },
  reviewHintLink: {
    color: palette.bg,
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  handNote: { marginTop: 8 },
  weekRow: { paddingVertical: 7 },
  weekLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  weekName: { color: palette.ink, fontSize: 13, flex: 1 },
  weekMeta: { color: palette.muted, fontSize: 12 },
  track: {
    height: 7,
    borderWidth: 1,
    borderColor: palette.ink,
    backgroundColor: palette.field,
    marginTop: 6,
    overflow: "hidden",
  },
  trackFill: { height: "100%", backgroundColor: palette.ink },
  innerRule: { marginTop: 12, marginBottom: 4 },
  sectionFooter: { marginTop: 14 },
  supportingText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  logRow: { flexDirection: "row", gap: 11, paddingVertical: 9 },
  logBar: { width: 4, alignSelf: "stretch", minHeight: 34 },
  logBody: { flex: 1, minWidth: 0, gap: 3 },
  logLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  logTitle: { color: palette.ink, fontSize: 13, flex: 1 },
  logMinutes: { color: palette.ink, fontSize: 13 },
  logMeta: { fontSize: 11, flex: 1 },
  logNote: {
    color: palette.inkSoft,
    fontFamily: fonts.typewriter,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  queueNumber: { color: palette.muted, fontSize: 12, width: 22 },
  queueName: { color: palette.ink, fontSize: 13, flex: 1 },
  detailsTitle: { marginTop: 6, marginBottom: 10 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  detailText: { color: palette.ink, fontSize: 13, flex: 1 },
  detailMeta: { color: palette.muted, fontSize: 11 },
  focusHint: {
    marginTop: 16,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderTopColor: palette.rule,
    paddingTop: 14,
  },
});
