import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Text, View } from "react-native";
import {
  Button,
  Empty,
  Field,
  Page,
  palette,
  Section,
  SelectRow,
} from "@/components/ui";
import { useStore } from "@/data/store";
import { ExternalCopyPasteProvider } from "@/interchange/prompts";
import { currentWeekStart } from "@/domain/types";
import {
  ExamImport,
  importExam,
  parseExam,
  parseWeeklyPlan,
  resolveWeeklyPlan,
  WeeklyPlanImport,
} from "@/interchange/schemas";

export default function AIScreen() {
  const { data, update } = useStore();
  const examId = data?.activeExamId || "";
  const [mode, setMode] = useState<"exam" | "week">("exam");
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ExamImport | WeeklyPlanImport | null>(
    null,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const prompt =
    data && examId
      ? mode === "exam"
        ? ExternalCopyPasteProvider.examPrompt(data, examId)
        : ExternalCopyPasteProvider.weeklyPrompt(data, examId)
      : "";
  const validate = () => {
    try {
      const parsed =
        mode === "exam" ? parseExam(input) : parseWeeklyPlan(input);
      if (
        mode === "exam" &&
        data &&
        (parsed as ExamImport).exam.toLocaleLowerCase() !==
          data.exams.find((e) => e.id === examId)?.name.toLocaleLowerCase()
      )
        throw new Error(
          "O nome do concurso na resposta não corresponde ao concurso ativo.",
        );
      if (mode === "week" && data)
        resolveWeeklyPlan(data, examId, parsed as WeeklyPlanImport);
      setPreview(parsed);
      setError("");
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Formato inválido.");
    }
  };
  const confirm = () => {
    if (!preview || !data) return;
    if (mode === "exam")
      update((d) => importExam(d, examId, preview as ExamImport));
    else {
      const sessions = resolveWeeklyPlan(
        data,
        examId,
        preview as WeeklyPlanImport,
      );
      update((d) => ({
        ...d,
        planned: [
          ...d.planned.filter(
            (p) => p.examId !== examId || p.weekStart !== currentWeekStart(),
          ),
          ...sessions,
        ],
      }));
    }
    setMessage(
      mode === "exam"
        ? "Matérias e assuntos importados."
        : "Plano semanal importado. O plano anterior deste concurso foi substituído.",
    );
    setInput("");
    setPreview(null);
  };
  return (
    <Page eyebrow="Copiar e colar" title="Importar com IA externa">
      <View style={{ maxWidth: 780 }}>
        <Text
          style={{
            color: palette.muted,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          Envie seu edital para ChatGPT, Gemini, Claude ou NotebookLM. O
          aplicativo apenas gera um prompt; nada é enviado automaticamente.
        </Text>
        <SelectRow
          label="O que deseja fazer?"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setPreview(null);
            setInput("");
            setError("");
          }}
          options={[
            { label: "Importar edital", value: "exam" },
            { label: "Planejar semana", value: "week" },
          ]}
        />
        <Section title="1. Copie o prompt">
          <Text
            selectable
            style={{
              color: palette.muted,
              backgroundColor: palette.panel,
              borderWidth: 1,
              borderColor: palette.line,
              borderRadius: 10,
              padding: 16,
              fontSize: 12,
              lineHeight: 19,
              maxHeight: 250,
            }}
          >
            {prompt || "Selecione um concurso primeiro."}
          </Text>
          <View style={{ marginTop: 12 }}>
            <Button
              title="Copiar prompt"
              onPress={async () => {
                await Clipboard.setStringAsync(prompt);
                setMessage("Prompt copiado.");
              }}
              disabled={!prompt}
            />
          </View>
        </Section>
        <Section title="2. Cole a resposta da IA">
          <Field
            label="Resposta em JSON"
            value={input}
            onChangeText={(v) => {
              setInput(v);
              setPreview(null);
            }}
            multiline
            placeholder={
              mode === "exam"
                ? '{"exam":"...","role":"...","subjects":[...]}'
                : '{"sessions":[...]}'
            }
          />
          <Button title="Validar e visualizar" secondary onPress={validate} />
          {error && (
            <Text style={{ color: palette.danger, marginTop: 12 }}>
              {error}
            </Text>
          )}
          {message && (
            <Text style={{ color: palette.accent, marginTop: 12 }}>
              {message}
            </Text>
          )}
        </Section>
        <Section title="3. Confirme a importação">
          {preview ? (
            <>
              <Text style={{ color: palette.text, marginBottom: 14 }}>
                {mode === "exam"
                  ? `${(preview as ExamImport).subjects.length} matérias encontradas:`
                  : `${(preview as WeeklyPlanImport).sessions.length} sessões para a semana:`}
              </Text>
              {mode === "exam"
                ? (preview as ExamImport).subjects.map((s, i) => (
                    <Text
                      key={i}
                      style={{ color: palette.muted, marginBottom: 6 }}
                    >
                      • {s.name} — {s.topics.length} assuntos
                    </Text>
                  ))
                : (preview as WeeklyPlanImport).sessions.map((s, i) => (
                    <Text
                      key={i}
                      style={{ color: palette.muted, marginBottom: 6 }}
                    >
                      • {s.day}: {s.subject} · {s.topic} · {s.minutes} min
                    </Text>
                  ))}
              <View style={{ marginTop: 18 }}>
                <Button title="Confirmar importação" onPress={confirm} />
              </View>
            </>
          ) : (
            <Empty text="Valide uma resposta para ver o preview aqui." />
          )}
        </Section>
      </View>
    </Page>
  );
}
