import { useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  addDays,
  currentWeekStart,
  subjectsBehind,
  weekdays,
  weekSummary,
} from "@meu-edital/domain";
import { Button, Empty, Page, palette, Section } from "@global/components/ui";
import { useStore } from "@global/store/store";
import { formatDuration, formatShortDate } from "@global/utils/formatDuration";

export default function WeekScreen() {
  const { data } = useStore();
  const examId = data?.activeExamId || "";
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const isCurrent = weekStart === currentWeekStart();
  const week = data && examId ? weekSummary(data, examId, weekStart) : null;
  const behind = week ? subjectsBehind(week) : [];
  const goal = week?.targetMinutes
    ? Math.min(100, Math.round((100 * week.minutes) / week.targetMinutes))
    : 0;
  const maxDay = Math.max(60, ...(week?.days.map((day) => day.minutes) || []));
  const sessions = (data?.sessions || [])
    .filter(
      (item) =>
        item.examId === examId &&
        week &&
        item.date >= week.weekStart &&
        item.date <= week.weekEnd,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const subjectName = (id: string) =>
    data?.subjects.find((item) => item.id === id)?.name || "Matéria";
  const topicName = (id: string) =>
    data?.topics.find((item) => item.id === id)?.name || "Assunto";

  return (
    <Page eyebrow="ACOMPANHAMENTO" title="Sua semana">
      <View style={s.content}>
        <View style={s.weekNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Semana anterior"
            onPress={() => setWeekStart((value) => addDays(value, -7))}
            style={s.weekArrow}
          >
            <Text style={s.weekArrowText}>‹</Text>
          </Pressable>
          <View style={s.weekLabel}>
            <Text style={s.weekTitle}>
              {week
                ? `${formatShortDate(week.weekStart)} – ${formatShortDate(week.weekEnd)}`
                : ""}
            </Text>
            <Text style={s.weekCaption}>
              {isCurrent ? "Semana atual" : "Semana encerrada"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próxima semana"
            disabled={isCurrent}
            onPress={() => setWeekStart((value) => addDays(value, 7))}
            style={[s.weekArrow, isCurrent && s.disabled]}
          >
            <Text style={s.weekArrowText}>›</Text>
          </Pressable>
        </View>

        {!week ? (
          <Section title="Nenhum concurso ativo">
            <Empty text="Cadastre um concurso em Editais para acompanhar sua semana." />
          </Section>
        ) : (
          <>
            <View style={s.summaryCard}>
              <Text style={s.overline}>TEMPO ESTUDADO</Text>
              <Text style={s.summaryValue}>
                {formatDuration(week.minutes)}
                <Text style={s.summaryTarget}>
                  {" "}
                  de {formatDuration(week.targetMinutes)}
                </Text>
              </Text>
              <View style={s.track}>
                <View style={[s.trackFill, { width: `${goal}%` }]} />
              </View>
              <View style={s.tiles}>
                <Tile value={String(week.sessions)} label="sessões" />
                <Tile value={String(week.cycleBlocks)} label="blocos do ciclo" />
                <Tile value={String(week.questions)} label="questões" />
                <Tile
                  value={week.accuracy === null ? "—" : `${week.accuracy}%`}
                  label="de acertos"
                />
              </View>
            </View>

            <Section title="Dia a dia">
              <View style={s.days}>
                {week.days.map((day, index) => (
                  <View key={day.date} style={s.day}>
                    <Text style={s.dayValue}>
                      {day.minutes ? formatDuration(day.minutes) : ""}
                    </Text>
                    <View style={s.dayBarArea}>
                      <View
                        style={[
                          s.dayBar,
                          { height: `${Math.max(3, (100 * day.minutes) / maxDay)}%` },
                          !day.minutes && s.dayBarEmpty,
                        ]}
                      />
                    </View>
                    <Text style={s.dayLabel}>{weekdays[index]}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Por matéria" aside="estudado / meta">
              {week.subjects.length ? (
                week.subjects.map((item) => {
                  const percent = item.targetMinutes
                    ? Math.min(100, (100 * item.minutes) / item.targetMinutes)
                    : 0;
                  const late = behind.some((row) => row.subjectId === item.subjectId);
                  return (
                    <View key={item.subjectId} style={s.subjectRow}>
                      <View style={s.subjectLine}>
                        <Text style={s.subjectName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[s.subjectMeta, late && !isCurrent && s.late]}>
                          {formatDuration(item.minutes)} /{" "}
                          {formatDuration(item.targetMinutes)}
                        </Text>
                      </View>
                      <View style={s.track}>
                        <View
                          style={[
                            s.trackFill,
                            { width: `${percent}%` },
                            percent >= 100 && s.trackDone,
                          ]}
                        />
                      </View>
                      {item.questions > 0 && (
                        <Text style={s.subjectHint}>
                          {item.questions} questões · {item.accuracy}% de acertos
                        </Text>
                      )}
                    </View>
                  );
                })
              ) : (
                <Empty text="Este concurso ainda não tem matérias." />
              )}
            </Section>

            {behind.length > 0 && (
              <Section title={isCurrent ? "Ainda dá tempo" : "Para a próxima semana"}>
                <Text style={s.hint}>
                  {isCurrent
                    ? "Estas matérias estão abaixo do ritmo da meta. O ciclo traz cada uma de volta na vez dela."
                    : "Estas matérias ficaram abaixo de 75% da meta. Vale ajustar o peso ou pedir uma análise da semana."}
                </Text>
                {behind.map((item) => (
                  <Text key={item.subjectId} style={s.behindRow}>
                    • {item.name}: faltaram{" "}
                    {formatDuration(item.targetMinutes - item.minutes)}
                  </Text>
                ))}
                <View style={s.actions}>
                  <Button title="Ver ciclo  →" secondary onPress={() => router.push("/ciclo")} />
                  <Button
                    title="Analisar com IA  ✦"
                    secondary
                    onPress={() => router.push({ pathname: "/ia", params: { task: "revisar-semana" } })}
                  />
                </View>
              </Section>
            )}

            <Section title="Sessões" aside={`${sessions.length}`}>
              {sessions.length ? (
                sessions.map((item) => (
                  <View key={item.id} style={s.sessionRow}>
                    <Text style={s.sessionDate}>{formatShortDate(item.date)}</Text>
                    <View style={s.sessionText}>
                      <Text style={s.sessionTitle} numberOfLines={1}>
                        {topicName(item.topicId)}
                      </Text>
                      <Text style={s.sessionMeta} numberOfLines={1}>
                        {subjectName(item.subjectId)} · {item.type}
                        {item.questions ? ` · ${item.correct || 0}/${item.questions}` : ""}
                      </Text>
                    </View>
                    <Text style={s.sessionMinutes}>{formatDuration(item.minutes)}</Text>
                  </View>
                ))
              ) : (
                <Empty
                  text={
                    isCurrent
                      ? "Nenhuma sessão registrada nesta semana ainda."
                      : "Nenhuma sessão registrada nesta semana."
                  }
                />
              )}
            </Section>
          </>
        )}
      </View>
    </Page>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.tile}>
      <Text style={s.tileValue}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 760, alignSelf: "center" },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  weekArrow: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  weekArrowText: { color: palette.text, fontSize: 24, lineHeight: 26 },
  disabled: { opacity: 0.35 },
  weekLabel: { flex: 1, alignItems: "center" },
  weekTitle: { color: palette.text, fontSize: 16, fontWeight: "800" },
  weekCaption: { color: palette.muted, fontSize: 11, marginTop: 2 },
  summaryCard: {
    backgroundColor: "#BDD1FC",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  overline: {
    color: "#4D6295",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  summaryValue: {
    color: palette.text,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 8,
  },
  summaryTarget: { color: "#495979", fontSize: 15, fontWeight: "600" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  tile: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 15,
    padding: 12,
  },
  tileValue: { color: palette.text, fontSize: 18, fontWeight: "800" },
  tileLabel: { color: "#495979", fontSize: 11, marginTop: 2 },
  track: {
    height: 7,
    borderRadius: 6,
    backgroundColor: "rgba(236,238,240,0.9)",
    marginTop: 10,
    overflow: "hidden",
  },
  trackFill: { height: "100%", borderRadius: 6, backgroundColor: "#937ED8" },
  trackDone: { backgroundColor: "#6FAE86" },
  days: { flexDirection: "row", gap: 6, height: 150 },
  day: { flex: 1, alignItems: "center" },
  dayValue: { color: palette.muted, fontSize: 9, height: 14 },
  dayBarArea: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    marginVertical: 6,
  },
  dayBar: {
    width: "70%",
    maxWidth: 34,
    borderRadius: 8,
    backgroundColor: "#A9C3FC",
  },
  dayBarEmpty: { backgroundColor: palette.line },
  dayLabel: { color: palette.text, fontSize: 11, fontWeight: "700" },
  subjectRow: { marginBottom: 16 },
  subjectLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  subjectName: { color: palette.text, fontSize: 13, fontWeight: "700", flex: 1 },
  subjectMeta: { color: palette.muted, fontSize: 12 },
  subjectHint: { color: palette.muted, fontSize: 11, marginTop: 6 },
  late: { color: palette.danger, fontWeight: "700" },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  behindRow: { color: palette.text, fontSize: 13, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  sessionDate: { color: palette.muted, fontSize: 11, width: 46 },
  sessionText: { flex: 1, minWidth: 0 },
  sessionTitle: { color: palette.text, fontSize: 13, fontWeight: "700" },
  sessionMeta: { color: palette.muted, fontSize: 11, marginTop: 3 },
  sessionMinutes: { color: palette.text, fontSize: 12, fontWeight: "800" },
});
