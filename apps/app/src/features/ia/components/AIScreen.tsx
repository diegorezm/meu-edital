import { useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  applyChanges,
  buildStudyContext,
  type ChangePreview,
  importSyllabus,
  parseTaskResponse,
  previewChanges,
  renderPrompt,
  type SyllabusImport,
  syllabusTask,
  validateSyllabusImport,
  type WeeklyReview,
  weeklyReviewTask,
} from "@meu-edital/agent-context";
import {
  BottomSheet,
  BottomSheetHandle,
  Button,
  Field,
  Page,
  palette,
  Section,
  useLayout,
} from "@global/components/ui";
import { useStore } from "@global/store/store";

type TaskId = Preview["task"];
type Preview =
  | { task: "importar-edital"; value: SyllabusImport }
  | {
      task: "revisar-semana";
      value: WeeklyReview;
      changes: ChangePreview[];
    };

const taskCards = [
  {
    id: "importar-edital",
    icon: "▤",
    title: "Importar edital",
    hint: "Matérias, assuntos e pesos",
  },
  {
    id: "revisar-semana",
    icon: "▦",
    title: "Revisar a semana",
    hint: "Análise e ajustes do ciclo",
  },
] as const;

export default function AIScreen() {
  const params = useLocalSearchParams<{ task?: string }>();
  const { data, update } = useStore();
  const { mobile } = useLayout();
  const examId = data?.activeExamId || "";
  const exam = data?.exams.find((item) => item.id === examId);
  const [task, setTask] = useState<TaskId>(
    params.task === weeklyReviewTask.id ? "revisar-semana" : "importar-edital",
  );
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [accepted, setAccepted] = useState<boolean[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const promptSheet = useRef<BottomSheetHandle>(null);
  const importSheet = useRef<BottomSheetHandle>(null);

  const prompt =
    data && exam
      ? task === syllabusTask.id
        ? renderPrompt(syllabusTask, data, examId)
        : renderPrompt(weeklyReviewTask, data, examId)
      : "";

  const changeTask = (next: TaskId) => {
    setTask(next);
    setInput("");
    setPreview(null);
    setError("");
    setMessage("");
  };
  const copy = async (text: string, done: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setMessage(done);
  };
  const validate = () => {
    if (!data) return;
    try {
      if (task === syllabusTask.id) {
        const value = parseTaskResponse(syllabusTask, input);
        validateSyllabusImport(data, examId, value);
        setPreview({ task: "importar-edital", value });
      } else {
        const value = parseTaskResponse(weeklyReviewTask, input);
        const changes = previewChanges(data, examId, value.changes);
        setAccepted(changes.map(() => true));
        setPreview({ task: "revisar-semana", value, changes });
      }
      setError("");
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Formato inválido.");
    }
  };
  const confirm = async () => {
    if (!preview) return;
    if (preview.task === "importar-edital") {
      await update((current) => importSyllabus(current, examId, preview.value));
      setMessage("Matérias e assuntos importados.");
    } else {
      const selected = preview.value.changes.filter(
        (_, index) => accepted[index],
      );
      if (selected.length)
        await update((current) => applyChanges(current, examId, selected));
      setMessage(
        selected.length
          ? `${selected.length} ${selected.length === 1 ? "ajuste aplicado" : "ajustes aplicados"}.`
          : "Análise lida. Nenhum ajuste aplicado.",
      );
    }
    const reset = () => {
      setInput("");
      setPreview(null);
    };
    if (mobile) importSheet.current?.close(reset);
    else reset();
  };

  const importContent = (
    <>
      {preview ? (
        <View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPreview(null)}
            style={s.backButton}
          >
            <Text style={s.backText}>← Editar resposta</Text>
          </Pressable>
          {preview.task === "importar-edital" ? (
            <>
              <View style={s.previewCard}>
                <Text style={s.previewCount}>
                  {preview.value.subjects.length}
                </Text>
                <Text style={s.previewLabel}>matérias encontradas</Text>
              </View>
              {preview.value.subjects.map((item, index) => (
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
              ))}
            </>
          ) : (
            <>
              <View style={s.previewCard}>
                <Text style={s.previewSummary}>{preview.value.summary}</Text>
              </View>
              {preview.value.recommendations.map((item, index) => (
                <Text key={index} style={s.recommendation}>
                  • {item}
                </Text>
              ))}
              <Text style={[s.sectionTitle, s.changesTitle]}>
                {preview.changes.length
                  ? "Ajustes sugeridos"
                  : "Nenhum ajuste sugerido"}
              </Text>
              {preview.changes.map((change, index) => (
                <Pressable
                  key={index}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: accepted[index] }}
                  onPress={() =>
                    setAccepted((current) =>
                      current.map((value, i) => (i === index ? !value : value)),
                    )
                  }
                  style={[
                    s.previewRow,
                    s.changeRow,
                    !accepted[index] && s.changeOff,
                  ]}
                >
                  <Text style={s.check}>{accepted[index] ? "☑" : "☐"}</Text>
                  <View style={s.changeText}>
                    <Text style={s.previewRowTitle}>{change.title}</Text>
                    <Text style={s.previewRowMeta}>
                      {change.before} → {change.after}
                    </Text>
                    {change.reason ? (
                      <Text style={s.previewRowMeta}>{change.reason}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </>
          )}
          <View style={s.sheetAction}>
            <Button
              title={
                preview.task === "importar-edital"
                  ? "Confirmar importação"
                  : "Aplicar ajustes marcados"
              }
              onPress={confirm}
            />
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
              task === syllabusTask.id
                ? '{"exam":"...","role":"...","subjects":[...]}'
                : '{"summary":"...","recommendations":[...],"changes":[...]}'
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
    </>
  );

  if (mobile)
    return (
      <Page eyebrow="AGENTES EXTERNOS" title="IA externa">
        <View style={s.content}>
          <View style={s.hero}>
            <Text style={s.heroEyebrow}>A IA SUGERE, VOCÊ DECIDE</Text>
            <Text style={s.heroTitle}>
              Leve seu contexto para qualquer IA. ✦
            </Text>
            <Text style={s.heroText}>
              O app prepara um pedido com seus dados de estudo e o formato exato
              da resposta. Nada é aplicado sem a sua confirmação.
            </Text>
          </View>

          <Text style={s.sectionTitle}>O que vamos fazer?</Text>
          <View style={s.modeRow}>
            {taskCards.map((card) => (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityState={{ selected: task === card.id }}
                onPress={() => changeTask(card.id)}
                style={[s.modeCard, task === card.id && s.modeActive]}
              >
                <Text style={s.modeIcon}>{card.icon}</Text>
                <Text style={s.modeTitle}>{card.title}</Text>
                <Text style={s.modeHint}>{card.hint}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.stepsCard}>
            <Step
              number="01"
              text={`Copie o pedido preparado para ${exam?.name || "seu concurso"}.`}
            />
            <Step
              number="02"
              text={
                task === syllabusTask.id
                  ? "Cole na IA junto com o PDF ou o texto do edital."
                  : "Cole na IA que você usa e pegue a resposta em JSON."
              }
            />
            <Step
              number="03"
              text="Cole a resposta aqui e revise a prévia antes de aplicar."
            />
          </View>

          <View style={s.actions}>
            <Button
              title="Copiar pedido  ↗"
              onPress={() =>
                copy(
                  prompt,
                  "Pedido copiado. Agora cole na IA de sua preferência.",
                )
              }
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
                setError("");
                importSheet.current?.open();
              }}
              disabled={!prompt}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!data || !exam}
              onPress={() =>
                data &&
                exam &&
                copy(
                  JSON.stringify(buildStudyContext(data, examId), null, 2),
                  "Contexto copiado em JSON (versão 1). Use-o com qualquer agente.",
                )
              }
              style={s.secondaryAction}
            >
              <Text style={s.secondaryActionText}>
                Copiar só o contexto (JSON)
              </Text>
            </Pressable>
          </View>
          {message ? <Text style={s.message}>{message}</Text> : null}
          {!exam && (
            <Text style={s.noExam}>
              Cadastre um concurso em Editais para começar.
            </Text>
          )}
          <Text style={s.privacyNote}>
            Você escolhe onde usar a IA; nada é enviado automaticamente. A
            resposta é tratada como dado: o app valida o formato, confere os
            nomes das matérias e mostra cada alteração antes de salvar.
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
              onPress={() => copy(prompt, "Pedido copiado.")}
              disabled={!prompt}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          ref={importSheet}
          contentKey={preview ? "preview" : "input"}
          title={preview ? "Revise antes de aplicar" : "Resposta da IA"}
        >
          {importContent}
        </BottomSheet>
      </Page>
    );

  return (
    <Page eyebrow="AGENTES EXTERNOS" title="IA externa">
      <View style={s.desktop}>
        <View style={s.desktopSide}>
          <View style={s.hero}>
            <Text style={s.heroEyebrow}>A IA SUGERE, VOCÊ DECIDE</Text>
            <Text style={s.heroTitle}>
              Leve seu contexto para qualquer IA. ✦
            </Text>
            <Text style={s.heroText}>
              O app prepara um pedido com seus dados de estudo e o formato exato
              da resposta. Nada é aplicado sem a sua confirmação.
            </Text>
          </View>

          <Text style={s.sectionTitle}>O que vamos fazer?</Text>
          <View style={s.modeRow}>
            {taskCards.map((card) => (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityState={{ selected: task === card.id }}
                onPress={() => changeTask(card.id)}
                style={[s.modeCard, task === card.id && s.modeActive]}
              >
                <Text style={s.modeIcon}>{card.icon}</Text>
                <Text style={s.modeTitle}>{card.title}</Text>
                <Text style={s.modeHint}>{card.hint}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.stepsCard}>
            <Step
              number="01"
              text={`Copie o pedido preparado para ${exam?.name || "seu concurso"}.`}
            />
            <Step
              number="02"
              text={
                task === syllabusTask.id
                  ? "Cole na IA junto com o PDF ou o texto do edital."
                  : "Cole na IA que você usa e pegue a resposta em JSON."
              }
            />
            <Step
              number="03"
              text="Cole a resposta aqui e revise a prévia antes de aplicar."
            />
          </View>

          <View style={s.actions}>
            <Button
              title="Copiar pedido  ↗"
              onPress={() =>
                copy(
                  prompt,
                  "Pedido copiado. Agora cole na IA de sua preferência.",
                )
              }
              disabled={!prompt}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => promptSheet.current?.open()}
              style={s.secondaryAction}
            >
              <Text style={s.secondaryActionText}>Ver o pedido completo</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!data || !exam}
              onPress={() =>
                data &&
                exam &&
                copy(
                  JSON.stringify(buildStudyContext(data, examId), null, 2),
                  "Contexto copiado em JSON (versão 1). Use-o com qualquer agente.",
                )
              }
              style={s.secondaryAction}
            >
              <Text style={s.secondaryActionText}>
                Copiar só o contexto (JSON)
              </Text>
            </Pressable>
          </View>
          {message ? <Text style={s.message}>{message}</Text> : null}
          {!exam && (
            <Text style={s.noExam}>
              Cadastre um concurso em Editais para começar.
            </Text>
          )}
          <Text style={s.privacyNote}>
            Você escolhe onde usar a IA; nada é enviado automaticamente. A
            resposta é tratada como dado: o app valida o formato, confere os
            nomes das matérias e mostra cada alteração antes de salvar.
          </Text>
        </View>
        <View style={s.desktopMain}>
          <Section
            title={preview ? "Revise antes de aplicar" : "Resposta da IA"}
          >
            {importContent}
          </Section>
        </View>
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
            onPress={() => copy(prompt, "Pedido copiado.")}
            disabled={!prompt}
          />
        </View>
      </BottomSheet>
    </Page>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <View style={s.stepRow}>
      <Text style={s.stepNumber}>{number}</Text>
      <Text style={s.stepText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center" },
  desktop: { flexDirection: "row", alignItems: "flex-start", gap: 22 },
  desktopSide: { width: 400, flexShrink: 0 },
  desktopMain: { flex: 1, minWidth: 0 },
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
    maxWidth: 380,
  },
  heroText: {
    color: "#675895",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
    maxWidth: 460,
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
  previewSummary: { color: palette.text, fontSize: 13, lineHeight: 20 },
  recommendation: {
    color: palette.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  changesTitle: { marginTop: 16 },
  previewRow: {
    backgroundColor: "#F7F7F2",
    borderRadius: 14,
    padding: 13,
    marginBottom: 7,
  },
  changeRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  changeOff: { opacity: 0.5 },
  check: { color: palette.text, fontSize: 18, lineHeight: 20 },
  changeText: { flex: 1, minWidth: 0 },
  previewRowTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  previewRowMeta: { color: palette.muted, fontSize: 11, marginTop: 4 },
});
