import { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import {
  Button,
  Empty,
  Page,
  palette,
  Section,
  SelectRow,
} from "@/components/ui";
import { useStore } from "@/data/store";
import {
  currentWeekStart,
  Day,
  StudyType,
  uid,
  weekdays,
} from "@/domain/types";

export default function PlanScreen() {
  const { data, update } = useStore();
  const examId = data?.activeExamId || "";
  const [day, setDay] = useState<Day>(0);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState<StudyType>("Teoria");
  const [minutes, setMinutes] = useState(60);
  const [error, setError] = useState("");
  const subjects = data?.subjects.filter((s) => s.examId === examId) || [];
  const topics = data?.topics.filter((t) => t.subjectId === subjectId) || [];
  const planned =
    data?.planned.filter(
      (p) => p.examId === examId && p.weekStart === currentWeekStart(),
    ) || [];
  const name = (id: string) =>
    data?.topics.find((t) => t.id === id)?.name || "";
  const subject = (id: string) =>
    data?.subjects.find((s) => s.id === id)?.name || "";
  return (
    <Page
      eyebrow="Organização"
      title="Plano semanal"
      action={
        <Button
          title="Planejar com IA externa"
          secondary
          onPress={() => router.push("/ia")}
        />
      }
    >
      <Section title="Adicionar sessão">
        <View style={{ maxWidth: 650 }}>
          <SelectRow
            label="Dia"
            value={day}
            onChange={setDay}
            options={weekdays.map((label, value) => ({
              label,
              value: value as Day,
            }))}
          />
          <SelectRow
            label="Matéria"
            value={subjectId}
            onChange={(v) => {
              setSubjectId(v);
              setTopicId("");
            }}
            options={subjects.map((s) => ({ label: s.name, value: s.id }))}
          />
          <SelectRow
            label="Assunto"
            value={topicId}
            onChange={setTopicId}
            options={topics.map((t) => ({ label: t.name, value: t.id }))}
          />
          <SelectRow
            label="Tipo"
            value={type}
            onChange={setType}
            options={(["Teoria", "Questões", "Revisão"] as StudyType[]).map(
              (t) => ({ label: t, value: t }),
            )}
          />
          <SelectRow
            label="Duração"
            value={minutes}
            onChange={setMinutes}
            options={[30, 45, 60, 90, 120].map((n) => ({
              label: `${n} min`,
              value: n,
            }))}
          />
          {error && (
            <Text style={{ color: palette.danger, marginBottom: 10 }}>
              {error}
            </Text>
          )}
          <Button
            title="Adicionar ao plano"
            onPress={() => {
              if (!subjectId || !topicId) {
                setError("Escolha uma matéria e um assunto.");
                return;
              }
              update((d) => ({
                ...d,
                planned: [
                  ...d.planned,
                  {
                    id: uid(),
                    examId,
                    weekStart: currentWeekStart(),
                    day,
                    subjectId,
                    topicId,
                    type,
                    minutes,
                    order:
                      Math.max(
                        0,
                        ...d.planned
                          .filter((p) => p.examId === examId && p.day === day)
                          .map((p) => p.order),
                      ) + 1,
                    completed: false,
                  },
                ],
              }));
              setError("");
            }}
          />
        </View>
      </Section>
      <Section title="Sua semana" aside={`${planned.length} sessões`}>
        {weekdays.map((label, day) => {
          const rows = planned
            .filter((p) => p.day === day)
            .sort((a, b) => a.order - b.order);
          return (
            <View key={label} style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: palette.accent,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {label.toUpperCase()}
              </Text>
              {rows.length ? (
                rows.map((p, index) => (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 9,
                      borderBottomWidth: 1,
                      borderColor: palette.line,
                      paddingVertical: 10,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 180 }}>
                      <Text
                        style={{
                          color: palette.text,
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        {p.completed ? "✓ " : ""}
                        {subject(p.subjectId)} · {name(p.topicId)}
                      </Text>
                      <Text
                        style={{
                          color: palette.muted,
                          fontSize: 12,
                          marginTop: 3,
                        }}
                      >
                        {p.type} · {p.minutes} min
                      </Text>
                    </View>
                    <Button
                      title="Estudar"
                      secondary
                      onPress={() =>
                        router.push({
                          pathname: "/estudar",
                          params: { planId: p.id },
                        })
                      }
                    />
                    <Button
                      title="↑"
                      secondary
                      onPress={() => {
                        if (index === 0) return;
                        const prev = rows[index - 1];
                        update((d) => ({
                          ...d,
                          planned: d.planned.map((x) =>
                            x.id === p.id
                              ? { ...x, order: prev.order }
                              : x.id === prev.id
                                ? { ...x, order: p.order }
                                : x,
                          ),
                        }));
                      }}
                    />
                    <Button
                      title="↓"
                      secondary
                      onPress={() => {
                        if (index === rows.length - 1) return;
                        const next = rows[index + 1];
                        update((d) => ({
                          ...d,
                          planned: d.planned.map((x) =>
                            x.id === p.id
                              ? { ...x, order: next.order }
                              : x.id === next.id
                                ? { ...x, order: p.order }
                                : x,
                          ),
                        }));
                      }}
                    />
                    <Button
                      title="Excluir"
                      secondary
                      onPress={() =>
                        update((d) => ({
                          ...d,
                          planned: d.planned.filter((x) => x.id !== p.id),
                        }))
                      }
                    />
                  </View>
                ))
              ) : (
                <Empty text="Sem sessões planejadas." />
              )}
            </View>
          );
        })}
      </Section>
    </Page>
  );
}
