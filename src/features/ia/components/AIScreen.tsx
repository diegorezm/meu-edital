import { useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  BottomSheet,
  BottomSheetHandle,
  Button,
  Field,
  Page,
  palette,
} from "@global/components/ui";
import { useStore } from "@global/store/store";
import { weeklyAllocation, weeklyPlanBalance } from "@domain/weeklyAllocation";
import { ExternalCopyPasteProvider } from "../services/externalCopyPasteProvider";
import {
  ExamImport,
  parseExam,
  parseWeeklyPlan,
  WeeklyPlanImport,
} from "../schemas/aiImportSchema";
import {
  applyWeekImport,
  importExam,
  resolveWeeklyPlan,
  validateExamImport,
} from "../services/importService";

export default function AIScreen() {
  const { data, update } = useStore();
  const examId = data?.activeExamId || "";
  const exam = data?.exams.find((item) => item.id === examId);
  const [mode, setMode] = useState<"exam" | "week">("exam");
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ExamImport | WeeklyPlanImport | null>(
    null,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const promptSheet = useRef<BottomSheetHandle>(null);
  const importSheet = useRef<BottomSheetHandle>(null);
  const [previewProgress] = useState(() => new Animated.Value(1));
  const changingPreview = useRef(false);
  useEffect(() => {
    if (!changingPreview.current) return;
    Animated.timing(previewProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      changingPreview.current = false;
    });
  }, [preview, previewProgress]);
  const transitionPreview = (next: ExamImport | WeeklyPlanImport | null) => {
    if (changingPreview.current) return;
    changingPreview.current = true;
    Animated.timing(previewProgress, {
      toValue: 0,
      duration: 110,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        changingPreview.current = false;
        return;
      }
      setPreview(next);
    });
  };
  const prompt =
    data && examId
      ? mode === "exam"
        ? ExternalCopyPasteProvider.examPrompt(data, examId)
        : ExternalCopyPasteProvider.weeklyPrompt(data, examId)
      : "";
  const balance =
    mode === "week" && preview && data
      ? weeklyPlanBalance(
          weeklyAllocation(data, examId),
          resolveWeeklyPlan(data, examId, preview as WeeklyPlanImport),
        )
      : null;
  const changeMode = (next: "exam" | "week") => {
    setMode(next);
    setInput("");
    setPreview(null);
    setError("");
    setMessage("");
  };
  const copyPrompt = async () => {
    if (!prompt) return;
    await Clipboard.setStringAsync(prompt);
    setMessage("Prompt copiado. Agora cole na IA de sua preferência.");
  };
  const validate = () => {
    try {
      const parsed =
        mode === "exam" ? parseExam(input) : parseWeeklyPlan(input);
      if (mode === "exam" && data) {
        validateExamImport(data, examId, parsed as ExamImport);
      }
      if (mode === "week" && data) {
        resolveWeeklyPlan(data, examId, parsed as WeeklyPlanImport);
      }
      transitionPreview(parsed);
      setError("");
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Formato inválido.");
    }
  };
  const confirm = async () => {
    if (!preview || !data) return;
    if (mode === "exam") {
      await update((current) =>
        importExam(current, examId, preview as ExamImport),
      );
    } else {
      const sessions = resolveWeeklyPlan(
        data,
        examId,
        preview as WeeklyPlanImport,
      );
      await update((current) => applyWeekImport(current, examId, sessions));
    }
    setMessage(
      mode === "exam"
        ? "Matérias e assuntos importados."
        : "Semana importada. O plano anterior foi substituído.",
    );
    importSheet.current?.close(() => {
      setInput("");
      setPreview(null);
    });
  };

  return (
    <Page eyebrow="COM SUA AJUDA" title="Planejar com IA">
      <View style={s.content}>
        <View style={s.hero}>
          <Text style={s.heroEyebrow}>UM APOIO PARA ORGANIZAR</Text>
          <Text style={s.heroTitle}>
            Mais clareza para o seu próximo passo. ✦
          </Text>
          <Text style={s.heroText}>
            Escolha uma tarefa, copie o pedido para sua IA preferida e traga a
            resposta para cá.
          </Text>
        </View>

        <Text style={s.sectionTitle}>O que vamos organizar?</Text>
        <View style={s.modeRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === "exam" }}
            onPress={() => changeMode("exam")}
            style={[s.modeCard, mode === "exam" && s.modeActive]}
          >
            <Text style={s.modeIcon}>▤</Text>
            <Text style={s.modeTitle}>Meu edital</Text>
            <Text style={s.modeHint}>Matérias e assuntos</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === "week" }}
            onPress={() => changeMode("week")}
            style={[s.modeCard, mode === "week" && s.modeActive]}
          >
            <Text style={s.modeIcon}>▦</Text>
            <Text style={s.modeTitle}>Minha semana</Text>
            <Text style={s.modeHint}>Sessões de estudo</Text>
          </Pressable>
        </View>

        <View style={s.stepsCard}>
          <View style={s.stepRow}>
            <Text style={s.stepNumber}>01</Text>
            <Text style={s.stepText}>
              Copie o pedido preparado para {exam?.name || "seu concurso"}.
            </Text>
          </View>
          <View style={s.stepRow}>
            <Text style={s.stepNumber}>02</Text>
            <Text style={s.stepText}>
              Cole na IA que você usa e pegue a resposta em JSON.
            </Text>
          </View>
          <View style={s.stepRow}>
            <Text style={s.stepNumber}>03</Text>
            <Text style={s.stepText}>Revise a prévia antes de importar.</Text>
          </View>
        </View>

        <View style={s.actions}>
          <Button
            title="Copiar pedido  ↗"
            onPress={copyPrompt}
            disabled={!prompt}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => promptSheet.current?.open()}
            style={s.secondaryAction}
          >
            <Text style={s.secondaryActionText}>Ver o pedido completo</Text>
          </Pressable>
          <Button
            title="Colar resposta da IA  →"
            secondary
            onPress={() => {
              previewProgress.stopAnimation();
              previewProgress.setValue(1);
              changingPreview.current = false;
              setError("");
              importSheet.current?.open();
            }}
            disabled={!prompt}
          />
        </View>
        {message ? <Text style={s.message}>{message}</Text> : null}
        {!exam && (
          <Text style={s.noExam}>
            Cadastre um concurso em Editais para começar.
          </Text>
        )}
        <Text style={s.privacyNote}>
          O app prepara o texto e valida o retorno. Você escolhe onde usar a IA;
          nada é enviado automaticamente.
        </Text>
      </View>

      <BottomSheet ref={promptSheet} title="Pedido para a IA">
        <Text style={s.sheetIntro}>
          Copie este texto e envie à IA de sua preferência.
        </Text>
        <Text selectable style={s.promptText}>
          {prompt || "Selecione um concurso primeiro."}
        </Text>
        <View style={s.sheetAction}>
          <Button
            title="Copiar pedido"
            onPress={copyPrompt}
            disabled={!prompt}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        ref={importSheet}
        contentKey={preview ? "preview" : "input"}
        title={preview ? "Revise a importação" : "Resposta da IA"}
      >
        <Animated.View
          style={{
            opacity: previewProgress,
            transform: [
              {
                translateY: previewProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          {preview ? (
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={() => transitionPreview(null)}
                style={s.backButton}
              >
                <Text style={s.backText}>← Editar resposta</Text>
              </Pressable>
              <View style={s.previewCard}>
                <Text style={s.previewCount}>
                  {mode === "exam"
                    ? (preview as ExamImport).subjects.length
                    : (preview as WeeklyPlanImport).sessions.length}
                </Text>
                <Text style={s.previewLabel}>
                  {mode === "exam"
                    ? "matérias encontradas"
                    : "sessões para a semana"}
                </Text>
              </View>
              {mode === "exam"
                ? (preview as ExamImport).subjects.map((item, index) => (
                    <View key={`${item.name}-${index}`} style={s.previewRow}>
                      <Text style={s.previewRowTitle}>{item.name}</Text>
                      <Text style={s.previewRowMeta}>
                        {item.topics.length} assuntos
                        {item.questions && item.pointsPerQuestion
                          ? ` · ${item.questions} questões × ${item.pointsPerQuestion} pontos`
                          : item.weight
                            ? ` · peso ${item.weight}`
                            : " · peso padrão"}
                      </Text>
                    </View>
                  ))
                : (preview as WeeklyPlanImport).sessions.map((item, index) => (
                    <View key={`${item.day}-${index}`} style={s.previewRow}>
                      <Text style={s.previewRowTitle}>{item.topic}</Text>
                      <Text style={s.previewRowMeta}>
                        {item.day} · {item.subject} · {item.minutes} min
                      </Text>
                    </View>
                  ))}
              {balance && (
                <View style={s.balanceCard}>
                  <Text style={s.previewRowTitle}>Tempo por matéria</Text>
                  <Text style={s.previewRowMeta}>
                    Planejado {balance.plannedTotal} min de{" "}
                    {balance.targetTotal} min disponíveis
                  </Text>
                  {balance.rows.map((row) => (
                    <Text
                      key={row.subjectId}
                      style={[
                        s.balanceRow,
                        row.outsideTarget && s.balanceWarning,
                      ]}
                    >
                      {row.name}: {row.plannedMinutes} min / {row.minutes} min
                      sugeridos
                    </Text>
                  ))}
                  {balance.outsideTarget && (
                    <Text style={s.balanceWarning}>
                      A distribuição se afastou do peso sugerido. Revise a
                      resposta antes de importar.
                    </Text>
                  )}
                </View>
              )}
              {mode === "week" && (
                <Text style={s.replaceNote}>
                  Esta importação substitui o plano atual desta semana.
                </Text>
              )}
              <View style={s.sheetAction}>
                <Button title="Confirmar importação" onPress={confirm} />
              </View>
            </View>
          ) : (
            <View>
              <Text style={s.sheetIntro}>
                Cole o JSON recebido. Vamos conferir tudo antes de salvar.
              </Text>
              <Field
                label="Resposta em JSON"
                value={input}
                onChangeText={(value) => {
                  setInput(value);
                  setError("");
                }}
                multiline
                placeholder={
                  mode === "exam"
                    ? '{"exam":"...","role":"...","subjects":[...]}'
                    : '{"sessions":[...]}'
                }
              />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <View style={s.sheetAction}>
                <Button
                  title="Validar e ver prévia  →"
                  onPress={validate}
                  disabled={!input.trim()}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </BottomSheet>
    </Page>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center" },
  hero: {
    backgroundColor: "#DFD6FA",
    borderRadius: 25,
    padding: 23,
    marginBottom: 27,
  },
  heroEyebrow: {
    color: "#675895",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 29,
    letterSpacing: -0.5,
    marginTop: 17,
    maxWidth: 360,
  },
  heroText: {
    color: "#675895",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
    maxWidth: 440,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 13,
  },
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  modeCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 19,
    padding: 16,
    minHeight: 116,
  },
  modeActive: {
    borderColor: "#8F7AC5",
    borderWidth: 2,
    backgroundColor: "#F9F6FF",
  },
  modeIcon: { color: "#675895", fontSize: 22, marginBottom: 11 },
  modeTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  modeHint: { color: palette.muted, fontSize: 10, marginTop: 4 },
  stepsCard: {
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    paddingVertical: 9,
  },
  stepNumber: { color: "#8D78B9", fontSize: 12, fontWeight: "800", width: 22 },
  stepText: { color: palette.text, fontSize: 12, lineHeight: 18, flex: 1 },
  actions: { gap: 10, marginTop: 20 },
  secondaryAction: { alignItems: "center", paddingVertical: 7 },
  secondaryActionText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  message: {
    color: "#508363",
    backgroundColor: "#E4F2E5",
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    marginTop: 16,
  },
  noExam: { color: palette.danger, fontSize: 12, marginTop: 12 },
  privacyNote: {
    color: palette.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 23,
    marginBottom: 25,
  },
  sheetIntro: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  promptText: {
    color: palette.text,
    backgroundColor: "#F7F7F2",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 15,
    padding: 16,
    fontSize: 12,
    lineHeight: 19,
  },
  sheetAction: { marginTop: 18 },
  error: { color: palette.danger, fontSize: 12, marginBottom: 10 },
  backButton: { alignSelf: "flex-start", paddingVertical: 7, marginBottom: 12 },
  backText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  previewCard: {
    backgroundColor: "#DFD6FA",
    borderRadius: 18,
    padding: 17,
    marginBottom: 15,
  },
  previewCount: { color: palette.text, fontSize: 33, fontWeight: "800" },
  previewLabel: { color: "#675895", fontSize: 12, fontWeight: "700" },
  previewRow: {
    backgroundColor: "#F7F7F2",
    borderRadius: 14,
    padding: 13,
    marginBottom: 7,
  },
  previewRowTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  previewRowMeta: { color: palette.muted, fontSize: 11, marginTop: 4 },
  replaceNote: {
    color: "#8B6256",
    backgroundColor: "#FBEBDC",
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    marginTop: 11,
  },
  balanceCard: {
    backgroundColor: "#F7F7F2",
    borderRadius: 14,
    padding: 13,
    marginTop: 10,
  },
  balanceRow: { color: palette.text, fontSize: 12, marginTop: 8 },
  balanceWarning: { color: palette.danger, fontSize: 12, marginTop: 8 },
});
