import { Text, View } from "react-native";
import { Button, Empty, Field, Page, palette, Section } from "@/components/ui";
import { useState } from "react";
import { useStore } from "@/data/store";
import { today } from "@/domain/types";

export default function ReviewsScreen() {
  const { data, update } = useStore();
  const [offsets, setOffsets] = useState("");
  const [error, setError] = useState("");
  const reviews =
    data?.reviews
      .filter((r) => r.examId === data.activeExamId && !r.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)) || [];
  const due = reviews.filter((r) => r.dueDate <= today());
  const later = reviews.filter((r) => r.dueDate > today());
  const render = (items: typeof reviews) =>
    items.length ? (
      items.map((r) => (
        <View
          key={r.id}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottomWidth: 1,
            borderColor: palette.line,
            paddingVertical: 12,
          }}
        >
          <View>
            <Text style={{ color: palette.text, fontWeight: "700" }}>
              {data?.topics.find((t) => t.id === r.topicId)?.name}
            </Text>
            <Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>
              {r.stage}ª revisão · {r.dueDate}
            </Text>
          </View>
          <Button
            title="Concluir"
            secondary
            onPress={() =>
              update((d) => ({
                ...d,
                reviews: d.reviews.map((x) =>
                  x.id === r.id ? { ...x, completed: true } : x,
                ),
              }))
            }
          />
        </View>
      ))
    ) : (
      <Empty text="Nenhuma revisão nesta lista." />
    );
  return (
    <Page eyebrow="Retenção" title="Revisões">
      <Section title="Vencidas e de hoje" aside={`${due.length} pendentes`}>
        {render(due)}
      </Section>
      <Section title="Próximas revisões">{render(later)}</Section>
      <Section title="Intervalos para novos assuntos">
        <Text style={{ color: palette.muted, marginBottom: 13, fontSize: 13 }}>
          Padrão: {data?.reviewOffsets.join(", ")} dias após a primeira sessão.
          Alterações valem para novas revisões.
        </Text>
        <View style={{ maxWidth: 360 }}>
          <Field
            label="Dias separados por vírgula"
            value={offsets}
            onChangeText={setOffsets}
            placeholder="1, 7, 30"
          />
          {error && <Text style={{ color: palette.danger }}>{error}</Text>}
          <Button
            title="Salvar intervalos"
            onPress={() => {
              const values = offsets.split(",").map((x) => Number(x.trim()));
              if (
                !values.length ||
                values.some((x) => !Number.isInteger(x) || x < 1) ||
                values.some((x, i) => i > 0 && x <= values[i - 1])
              ) {
                setError("Use dias inteiros, positivos e em ordem crescente.");
                return;
              }
              update((d) => ({ ...d, reviewOffsets: values }));
              setOffsets("");
              setError("");
            }}
          />
        </View>
      </Section>
    </Page>
  );
}
