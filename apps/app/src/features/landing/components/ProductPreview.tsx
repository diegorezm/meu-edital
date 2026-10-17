import { StyleSheet, Text, View } from "react-native";
import { palette } from "@global/components/ui";

const cycle = [
  { name: "Português", color: palette.lavender },
  { name: "Dir. Adm.", color: palette.blue },
  { name: "Matemática", color: palette.peach },
  { name: "Dir. Const.", color: palette.mint },
  { name: "Português", color: palette.lavender },
];
// Minutos por dia numa semana de exemplo, meta de 150 min/dia.
const week = [150, 120, 165, 90, 140, 0, 0];
const days = ["S", "T", "Q", "Q", "S", "S", "D"];

/** Retrato estático do app para a landing: mostra o resultado em vez de explicar. */
export function ProductPreview() {
  return (
    <View style={s.root} accessibilityLabel="Exemplo da tela inicial do app">
      <Text style={s.sample}>EXEMPLO</Text>
      <View style={s.next}>
        <Text style={s.eyebrow}>PRÓXIMO BLOCO</Text>
        <Text style={s.subject}>Direito Administrativo</Text>
        <Text style={s.meta}>60 min · Teoria</Text>
        <View style={s.topic}>
          <Text style={s.topicLabel}>Assunto sugerido</Text>
          <Text style={s.topicName}>Atos administrativos</Text>
        </View>
        <View style={s.play}>
          <Text style={s.playText}>▷ Começar agora</Text>
        </View>
      </View>
      <View style={s.row}>
        <View style={[s.card, s.flex]}>
          <Text style={s.cardTitle}>Ciclo</Text>
          <View style={s.chips}>
            {cycle.map((item, index) => (
              <View
                key={index}
                style={[
                  s.chip,
                  { backgroundColor: item.color },
                  index === 1 && s.chipCurrent,
                ]}
              >
                <Text style={s.chipText}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[s.card, s.reviews]}>
          <Text style={s.cardTitle}>Revisões</Text>
          <Text style={s.big}>3</Text>
          <Text style={s.small}>vencem hoje</Text>
        </View>
      </View>
      <View style={s.card}>
        <View style={s.weekHead}>
          <Text style={s.cardTitle}>Semana</Text>
          <Text style={s.small}>11h05 de 17h30</Text>
        </View>
        <View style={s.bars}>
          {week.map((minutes, index) => (
            <View key={index} style={s.barCol}>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.bar,
                    { height: `${Math.min(100, (minutes / 165) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={s.day}>{days[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: palette.bg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14,
    gap: 10,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    shadowColor: "#202731",
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  sample: {
    position: "absolute",
    top: -10,
    right: 18,
    zIndex: 1,
    backgroundColor: palette.dark,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  next: { backgroundColor: palette.dark, borderRadius: 22, padding: 18 },
  eyebrow: {
    color: palette.lavender,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  subject: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginTop: 8,
  },
  meta: { color: "#AEB4BB", fontSize: 12, marginTop: 3 },
  topic: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 11,
    marginTop: 14,
  },
  topicLabel: { color: "#AEB4BB", fontSize: 10 },
  topicName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  play: {
    backgroundColor: palette.lavender,
    borderRadius: 13,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  playText: { color: palette.dark, fontSize: 13, fontWeight: "800" },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  card: {
    backgroundColor: palette.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EFF0ED",
    padding: 13,
  },
  cardTitle: { color: palette.text, fontSize: 12, fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 9 },
  chip: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  chipCurrent: { borderWidth: 1.5, borderColor: palette.dark },
  chipText: { color: palette.dark, fontSize: 10, fontWeight: "700" },
  reviews: { width: 96, alignItems: "flex-start" },
  big: {
    color: palette.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 4,
  },
  small: { color: palette.muted, fontSize: 10 },
  weekHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bars: { flexDirection: "row", gap: 8, height: 70, marginTop: 10 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F1F2EF",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: { width: "100%", backgroundColor: palette.accent, borderRadius: 6 },
  day: { color: palette.muted, fontSize: 9, fontWeight: "700" },
});
