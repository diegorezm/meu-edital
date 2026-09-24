import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import {
  Button,
  Field,
  Page,
  palette,
  Section,
  SelectRow,
} from "@/components/ui";
import { useStore } from "@/data/store";
import { recordSession, validateSession } from "@/domain/logic";
import { StudyType } from "@/domain/types";

export default function StudyScreen() {
  const { planId, cycleId } = useLocalSearchParams<{
    planId?: string;
    cycleId?: string;
  }>();
  return (
    <StudySession
      key={`${planId || ""}:${cycleId || ""}`}
      planId={planId}
      cycleId={cycleId}
    />
  );
}

function StudySession({
  planId,
  cycleId,
}: {
  planId?: string;
  cycleId?: string;
}) {
  const { data, update } = useStore();
  const plan = data?.planned.find((p) => p.id === planId);
  const cycleItem = data?.cycle.find((c) => c.id === cycleId);
  const examId = data?.activeExamId || "";
  const target = plan || cycleItem;
  const [selectedSubjectId, setSubjectId] = useState("");
  const [selectedTopicId, setTopicId] = useState("");
  const [selectedType, setType] = useState<StudyType | null>(null);
  const [enteredMinutes, setMinutes] = useState("");
  const [questions, setQuestions] = useState("");
  const [correct, setCorrect] = useState("");
  const [note, setNote] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const subjectId = selectedSubjectId || target?.subjectId || "";
  const topicId =
    selectedTopicId || (subjectId === target?.subjectId ? target.topicId : "");
  const type = selectedType || target?.type || "Teoria";
  const minutes = enteredMinutes || (target ? String(target.minutes) : "");
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);
  const subjects = data?.subjects.filter((s) => s.examId === examId) || [];
  const topics = data?.topics.filter((t) => t.subjectId === subjectId) || [];
  const save = async () => {
    const input = {
      examId,
      subjectId,
      topicId,
      type,
      minutes: minutes ? Number(minutes) : Math.round(seconds / 60),
      questions: type === "Questões" ? Number(questions) || 0 : undefined,
      correct: type === "Questões" ? Number(correct) || 0 : undefined,
      note: note.trim() || undefined,
    };
    const problem = validateSession(input);
    if (problem) {
      setError(problem);
      return;
    }
    await update((d) => {
      const next = recordSession(d, input, planId);
      return cycleId
        ? {
            ...next,
            cyclePosition: {
              ...next.cyclePosition,
              [examId]: (next.cyclePosition[examId] || 0) + 1,
            },
          }
        : next;
    });
    router.replace(cycleId ? "/ciclo" : "/");
  };
  return (
    <Page eyebrow="Foco" title="Sessão de estudo">
      <View style={{ maxWidth: 680 }}>
        <Section title="O que você vai estudar?">
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
            label="Tipo de estudo"
            value={type}
            onChange={setType}
            options={(["Teoria", "Questões", "Revisão"] as StudyType[]).map(
              (t) => ({ label: t, value: t }),
            )}
          />
        </Section>
        <Section title="Timer">
          <Text
            style={{
              color: palette.text,
              fontSize: 54,
              fontWeight: "800",
              marginBottom: 15,
            }}
          >
            {String(Math.floor(seconds / 3600)).padStart(2, "0")}:
            {String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </Text>
          <View style={{ flexDirection: "row", gap: 9 }}>
            <Button
              title={
                running ? "Pausar" : seconds ? "Continuar" : "Iniciar estudo"
              }
              onPress={() => setRunning(!running)}
            />
            <Button
              title="Zerar"
              secondary
              onPress={() => {
                setRunning(false);
                setSeconds(0);
              }}
            />
          </View>
        </Section>
        <Section title="Concluir e registrar">
          <Field
            label="Duração em minutos"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="numeric"
            placeholder="Preencha ou use o timer"
          />
          {type === "Questões" && (
            <>
              <Field
                label="Questões realizadas"
                value={questions}
                onChangeText={setQuestions}
                keyboardType="numeric"
              />
              <Field
                label="Acertos"
                value={correct}
                onChangeText={setCorrect}
                keyboardType="numeric"
              />
              {Number(questions) > 0 && (
                <Text style={{ color: palette.accent, marginBottom: 15 }}>
                  Desempenho:{" "}
                  {Math.round((Number(correct) / Number(questions)) * 100)}%
                </Text>
              )}
            </>
          )}
          <Field
            label="Observação (opcional)"
            value={note}
            onChangeText={setNote}
            multiline
          />
          {error && (
            <Text style={{ color: palette.danger, marginBottom: 12 }}>
              {error}
            </Text>
          )}
          <Button title="Concluir sessão" onPress={save} />
        </Section>
      </View>
    </Page>
  );
}
