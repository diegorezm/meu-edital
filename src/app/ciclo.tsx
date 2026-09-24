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
import { StudyType, uid } from "@/domain/types";

export default function CycleScreen() {
  const { data, update } = useStore();
  const examId = data?.activeExamId || "";
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState<StudyType>("Teoria");
  const [minutes, setMinutes] = useState(60);
  const [error, setError] = useState("");
  const items =
    data?.cycle
      .filter((c) => c.examId === examId)
      .sort((a, b) => a.order - b.order) || [];
  const position = data?.cyclePosition[examId] || 0;
  const next = items[position % items.length];
  const subjects = data?.subjects.filter((s) => s.examId === examId) || [];
  const topics = data?.topics.filter((t) => t.subjectId === subjectId) || [];
  return (
    <Page eyebrow="Ritmo flexível" title="Ciclo de estudos">
      <Text
        style={{
          color: palette.muted,
          marginBottom: 26,
          maxWidth: 650,
          lineHeight: 21,
        }}
      >
        Siga a sequência sem prender as sessões a um dia. Ao concluir, avance
        para a próxima.
      </Text>
      <Section title="Próximo no ciclo">
        {next ? (
          <View
            style={{
              backgroundColor: palette.blue,
              borderRadius: 24,
              padding: 22,
            }}
          >
            <Text
              style={{
                color: palette.text,
                fontSize: 20,
                fontWeight: "800",
                marginBottom: 7,
              }}
            >
              {data?.subjects.find((s) => s.id === next.subjectId)?.name} ·{" "}
              {data?.topics.find((t) => t.id === next.topicId)?.name}
            </Text>
            <Text style={{ color: palette.muted, marginBottom: 18 }}>
              {next.type} · {next.minutes} min
            </Text>
            <Button
              title="Iniciar estudo"
              onPress={() =>
                router.push({
                  pathname: "/estudar",
                  params: { cycleId: next.id },
                })
              }
            />
          </View>
        ) : (
          <Empty text="Adicione itens ao ciclo." />
        )}
      </Section>
      <Section title="Adicionar ao ciclo">
        <View style={{ maxWidth: 650 }}>
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
              (x) => ({ label: x, value: x }),
            )}
          />
          <SelectRow
            label="Duração"
            value={minutes}
            onChange={setMinutes}
            options={[30, 45, 60, 90, 120].map((x) => ({
              label: `${x} min`,
              value: x,
            }))}
          />
          {error && (
            <Text style={{ color: palette.danger, marginBottom: 10 }}>
              {error}
            </Text>
          )}
          <Button
            title="Adicionar item"
            onPress={() => {
              if (!subjectId || !topicId) {
                setError("Selecione matéria e assunto.");
                return;
              }
              update((d) => ({
                ...d,
                cycle: [
                  ...d.cycle,
                  {
                    id: uid(),
                    examId,
                    subjectId,
                    topicId,
                    type,
                    minutes,
                    order: items.length,
                  },
                ],
              }));
              setError("");
            }}
          />
        </View>
      </Section>
      <Section title="Sequência">
        {items.map((item, index) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              borderBottomWidth: 1,
              borderColor: palette.line,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color:
                  index === position % items.length
                    ? palette.accent
                    : palette.muted,
                width: 25,
              }}
            >
              {index + 1}.
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontWeight: "700" }}>
                {data?.subjects.find((s) => s.id === item.subjectId)?.name} ·{" "}
                {data?.topics.find((t) => t.id === item.topicId)?.name}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 12 }}>
                {item.type} · {item.minutes} min
              </Text>
            </View>
            <Button
              title="↑"
              secondary
              onPress={() => {
                if (index === 0) return;
                const previous = items[index - 1];
                update((d) => ({
                  ...d,
                  cycle: d.cycle.map((c) =>
                    c.id === item.id
                      ? { ...c, order: previous.order }
                      : c.id === previous.id
                        ? { ...c, order: item.order }
                        : c,
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
                  cycle: d.cycle.filter((c) => c.id !== item.id),
                  cyclePosition: { ...d.cyclePosition, [examId]: 0 },
                }))
              }
            />
          </View>
        ))}
      </Section>
    </Page>
  );
}
