import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cycleState, startExam } from "@meu-edital/domain";
import { Brand } from "@global/components/Brand";
import { Button, Field, palette, useLayout } from "@global/components/ui";
import { useAuth } from "@global/store/auth";
import { useStore } from "@global/store/store";
import { formatDuration } from "@global/utils/formatDuration";
import {
  commonSubjects,
  hourOptions,
  popularExams,
} from "../constants/starters";

type Step = "exam" | "hours" | "subjects" | "ready";
const order: Step[] = ["exam", "hours", "subjects", "ready"];
// A barra começa adiantada: a pessoa já criou a conta, que é parte do caminho.
const progress: Record<Step, number> = {
  exam: 25,
  hours: 55,
  subjects: 80,
  ready: 100,
};
const tones = [palette.lavender, palette.blue, palette.peach, palette.mint];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { mobile } = useLayout();
  const { enabled, signOut } = useAuth();
  const { data, update, error } = useStore();
  const [step, setStep] = useState<Step>("exam");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [hours, setHours] = useState(15);
  const [selected, setSelected] = useState<string[]>(["Português"]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [busy, setBusy] = useState(false);

  const subjectNames = [
    ...commonSubjects
      .map((item) => item.name)
      .filter((n) => selected.includes(n)),
    ...custom,
  ];
  const toggle = (subject: string) =>
    setSelected((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    );
  const addCustom = () => {
    const value = customInput.trim();
    if (!value) return;
    const known = commonSubjects.find(
      (item) =>
        item.name.toLocaleLowerCase("pt-BR") ===
        value.toLocaleLowerCase("pt-BR"),
    );
    if (known) {
      if (!selected.includes(known.name)) toggle(known.name);
    } else if (
      !custom.some(
        (item) =>
          item.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setCustom([...custom, value]);
    }
    setCustomInput("");
  };
  const back = () => setStep(order[Math.max(0, order.indexOf(step) - 1)]);
  const finish = async () => {
    setBusy(true);
    await update((current) =>
      startExam(current, {
        name,
        role,
        hoursPerWeek: hours,
        subjects: [
          ...commonSubjects.filter((item) => selected.includes(item.name)),
          ...custom.map((item) => ({ name: item })),
        ],
      }),
    );
    setBusy(false);
    setStep("ready");
  };

  const examName = name.trim() || "Seu concurso";
  const perDay = formatDuration((hours * 60) / 7);

  if (step === "ready") {
    const examId = data?.activeExamId;
    const cycle = data && examId ? cycleState(data, examId) : null;
    const subjectName = (id: string) =>
      data?.subjects.find((item) => item.id === id)?.name || "";
    const examSubjects =
      data?.subjects.filter((item) => item.examId === examId) || [];
    const toneOf = (subjectId: string) =>
      tones[
        Math.max(
          0,
          examSubjects.findIndex((item) => item.id === subjectId),
        ) % tones.length
      ];
    return (
      <SafeAreaView style={s.root}>
        <ScrollView
          contentContainerStyle={[s.center, mobile && s.centerMobile]}
        >
          <View style={[s.readyCard, mobile && s.readyCardMobile]}>
            <View style={s.badge}>
              <Text style={s.badgeText}>✓</Text>
            </View>
            <Text style={s.eyebrow}>PRONTO</Text>
            <Text style={[s.title, mobile && s.titleMobile]}>
              Seu ciclo para {examName} está montado.
            </Text>
            <Text style={s.lead}>
              {cycle?.items.length || 0} blocos somam{" "}
              {formatDuration(cycle?.lapMinutes || 0)}. Uma volta é a sua
              semana. Faltou um dia? Continue do bloco onde parou.
            </Text>
            <View style={s.blocks}>
              {cycle?.items.slice(0, 8).map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    s.block,
                    { backgroundColor: toneOf(item.subjectId) },
                    index === 0 && s.blockFirst,
                  ]}
                >
                  <Text style={s.blockIndex}>
                    {index === 0 ? "Agora" : `${index + 1}º`}
                  </Text>
                  <Text style={s.blockName} numberOfLines={1}>
                    {subjectName(item.subjectId)}
                  </Text>
                  <Text style={s.blockMinutes}>
                    {formatDuration(item.minutes)}
                  </Text>
                </View>
              ))}
              {(cycle?.items.length || 0) > 8 && (
                <Text style={s.more}>
                  +{(cycle?.items.length || 0) - 8} blocos
                </Text>
              )}
            </View>
            <Button
              title="Ver meu primeiro bloco  →"
              onPress={onDone}
              full={mobile}
            />
            <Text style={s.hint}>
              Os pesos, assuntos e a ordem dos blocos ficam em Editais e Ciclo.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const canNext =
    step === "exam"
      ? Boolean(name.trim())
      : step === "hours"
        ? hours > 0
        : subjectNames.length > 0;
  const next = () => {
    if (!canNext || busy) return;
    if (step === "subjects") finish();
    else setStep(order[order.indexOf(step) + 1]);
  };

  const form = (
    <View style={[s.formCard, mobile ? s.formCardMobile : s.formCardDesktop]}>
      <View style={s.track}>
        <View style={[s.bar, { width: `${progress[step]}%` }]} />
      </View>
      <Text style={s.stepLabel}>Passo {order.indexOf(step) + 1} de 3</Text>

      {step === "exam" && (
        <>
          <Text style={[s.title, mobile && s.titleMobile]}>
            Para qual concurso você estuda?
          </Text>
          <Text style={s.lead}>Tudo no app gira em torno dele.</Text>
          <Field
            label="Concurso"
            value={name}
            onChangeText={setName}
            placeholder="Ex.: INSS, TRT 2ª Região"
            autoFocus={!mobile}
            onSubmitEditing={next}
          />
          <View style={s.chips}>
            {popularExams.map((item) => (
              <Chip
                key={item}
                label={item}
                active={name === item}
                onPress={() => setName(item)}
              />
            ))}
          </View>
          <View style={s.gap} />
          <Field
            label="Cargo (opcional)"
            value={role}
            onChangeText={setRole}
            placeholder="Ex.: Técnico do Seguro Social"
            onSubmitEditing={next}
          />
        </>
      )}

      {step === "hours" && (
        <>
          <Text style={[s.title, mobile && s.titleMobile]}>
            Quantas horas por semana você consegue estudar?
          </Text>
          <Text style={s.lead}>
            Seja realista. Uma meta que você cumpre vale mais que uma que
            assusta.
          </Text>
          <View style={s.hours}>
            {hourOptions.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: hours === item }}
                onPress={() => setHours(item)}
                style={[s.hour, hours === item && s.hourActive]}
              >
                <Text
                  style={[s.hourValue, hours === item && s.hourValueActive]}
                >
                  {item}h
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.perDay}>
            ≈ <Text style={s.strong}>{perDay} por dia</Text>, todos os dias. Dá
            para mudar depois.
          </Text>
        </>
      )}

      {step === "subjects" && (
        <>
          <Text style={[s.title, mobile && s.titleMobile]}>
            Quais matérias caem na prova?
          </Text>
          <Text style={s.lead}>
            Toque nas do seu edital. Já vêm com os assuntos que mais caem.
          </Text>
          <View style={s.chips}>
            {commonSubjects.map((item) => (
              <Chip
                key={item.name}
                label={item.name}
                active={selected.includes(item.name)}
                onPress={() => toggle(item.name)}
              />
            ))}
            {custom.map((item) => (
              <Chip
                key={item}
                label={`${item}  ×`}
                active
                onPress={() => setCustom(custom.filter((c) => c !== item))}
              />
            ))}
          </View>
          <View style={s.addRow}>
            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={addCustom}
              submitBehavior="submit"
              placeholder="Outra matéria"
              placeholderTextColor={palette.muted}
              style={s.addInput}
            />
            <Button
              title="Adicionar"
              secondary
              onPress={addCustom}
              disabled={!customInput.trim()}
            />
          </View>
          <Text style={s.hint}>
            Tem o edital em PDF? Depois de começar, use IA externa para importar
            todas as matérias, assuntos e pesos.
          </Text>
        </>
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={s.nav}>
        {step !== "exam" ? (
          <Pressable
            accessibilityRole="button"
            onPress={back}
            style={s.backButton}
          >
            <Text style={s.backText}>← Voltar</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Button
          title={
            step === "subjects"
              ? busy
                ? "Montando..."
                : `Montar meu ciclo (${subjectNames.length})  →`
              : "Continuar  →"
          }
          onPress={next}
          disabled={!canNext || busy}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <View style={[s.top, mobile && s.topMobile]}>
        <Brand />
        {enabled && (
          <Pressable
            accessibilityRole="button"
            onPress={signOut}
            style={s.signOut}
          >
            <Text style={s.signOutText}>Sair</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        contentContainerStyle={[s.center, mobile && s.centerMobile]}
        keyboardShouldPersistTaps="handled"
      >
        {mobile ? (
          form
        ) : (
          <View style={s.split}>
            {form}
            <Summary
              exam={examName}
              role={role.trim()}
              hours={hours}
              perDay={perDay}
              subjects={step === "subjects" ? subjectNames : []}
              step={step}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Prévia ao lado do formulário no desktop: o ciclo vai tomando forma a cada resposta. */
function Summary({
  exam,
  role,
  hours,
  perDay,
  subjects,
  step,
}: {
  exam: string;
  role: string;
  hours: number;
  perDay: string;
  subjects: string[];
  step: Step;
}) {
  return (
    <View style={s.summary}>
      <Text style={s.summaryEyebrow}>SEU CICLO</Text>
      <Text style={s.summaryTitle}>{exam}</Text>
      {role ? <Text style={s.summaryRole}>{role}</Text> : null}
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>Meta</Text>
        <Text style={[s.summaryValue, step === "exam" && s.summaryPending]}>
          {step === "exam" ? "—" : `${hours}h por semana · ${perDay}/dia`}
        </Text>
      </View>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>Matérias</Text>
        <Text style={[s.summaryValue, !subjects.length && s.summaryPending]}>
          {subjects.length ? subjects.length : "—"}
        </Text>
      </View>
      <View style={s.summaryChips}>
        {subjects.map((item, index) => (
          <View
            key={item}
            style={[
              s.summaryChip,
              { backgroundColor: tones[index % tones.length] },
            ]}
          >
            <Text style={s.summaryChipText}>{item}</Text>
          </View>
        ))}
      </View>
      <Text style={s.summaryFoot}>
        O app divide as horas pelos pesos e intercala as matérias para não
        repetir em sequência.
      </Text>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.chip, active && s.chipActive]}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>
        {active && !label.endsWith("×") ? "✓ " : ""}
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  top: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  topMobile: { paddingHorizontal: 16, paddingVertical: 10 },
  signOut: { paddingHorizontal: 10, paddingVertical: 6 },
  signOutText: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  center: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerMobile: { justifyContent: "flex-start", padding: 16, paddingTop: 6 },
  split: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 940,
    gap: 18,
    alignItems: "stretch",
  },
  formCard: {
    backgroundColor: palette.panel,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 32,
  },
  formCardDesktop: { flex: 1.3 },
  formCardMobile: { width: "100%", padding: 20, borderRadius: 24 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EFF0ED",
    overflow: "hidden",
  },
  bar: { height: 6, borderRadius: 3, backgroundColor: palette.accent },
  stepLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 10,
  },
  eyebrow: {
    color: "#8573CE",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 18,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginTop: 18,
  },
  titleMobile: { fontSize: 25, lineHeight: 31, letterSpacing: -1 },
  lead: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },
  strong: { color: palette.text, fontWeight: "800" },
  gap: { height: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: "#F9FAF8",
  },
  chipActive: {
    backgroundColor: palette.lavender,
    borderColor: palette.lavender,
  },
  chipText: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: palette.dark },
  hours: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hour: {
    minWidth: 64,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAF8",
  },
  hourActive: { backgroundColor: palette.dark, borderColor: palette.dark },
  hourValue: { color: palette.text, fontSize: 16, fontWeight: "800" },
  hourValueActive: { color: "#FFFFFF" },
  perDay: { color: palette.muted, fontSize: 14, marginTop: 18 },
  addRow: { flexDirection: "row", gap: 8, marginTop: 16, alignItems: "center" },
  addInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#F9FAF8",
    color: palette.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 16 },
  error: { color: palette.danger, fontSize: 13, marginTop: 14 },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
  },
  backButton: { paddingVertical: 8, paddingRight: 12 },
  backText: { color: palette.muted, fontSize: 13, fontWeight: "700" },

  summary: {
    flex: 1,
    backgroundColor: palette.dark,
    borderRadius: 28,
    padding: 28,
  },
  summaryEyebrow: {
    color: palette.lavender,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 10,
  },
  summaryRole: { color: "#AEB4BB", fontSize: 13, marginTop: 3 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
    marginTop: 16,
  },
  summaryLabel: { color: "#AEB4BB", fontSize: 13 },
  summaryValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  summaryPending: { color: "#6B727A" },
  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  summaryChip: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  summaryChipText: { color: palette.dark, fontSize: 11, fontWeight: "700" },
  summaryFoot: {
    color: "#8C939B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: "auto",
    paddingTop: 20,
  },

  readyCard: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: palette.panel,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 36,
  },
  readyCardMobile: { padding: 22, borderRadius: 24 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: palette.dark, fontSize: 24, fontWeight: "900" },
  blocks: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 26 },
  block: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 120,
    maxWidth: 180,
  },
  blockFirst: { borderWidth: 2, borderColor: palette.dark },
  blockIndex: { color: "#4B5360", fontSize: 10, fontWeight: "800" },
  blockName: {
    color: palette.dark,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  blockMinutes: { color: "#4B5360", fontSize: 11, marginTop: 1 },
  more: {
    color: palette.muted,
    fontSize: 12,
    alignSelf: "center",
    marginLeft: 4,
  },
});
