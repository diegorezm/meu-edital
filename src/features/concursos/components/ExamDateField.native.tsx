import { useState } from "react";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@global/components/ui";
import { parseExamDate } from "../utils/examDate";

type Props = { value: string; onChange: (value: string) => void };

export default function ExamDateField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const isoDate = parseExamDate(value);
  const selected = isoDate ? new Date(`${isoDate}T12:00:00`) : new Date();

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Data da prova (opcional)</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `Data da prova: ${value}` : "Selecionar data da prova"}
        onPress={() => setOpen(true)}
        style={styles.input}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value || "Selecionar data"}
        </Text>
        <Text style={styles.icon}>▦</Text>
      </Pressable>
      {open && (
        <View>
          <DateTimePicker
            value={selected}
            mode="date"
            presentation={Platform.OS === "android" ? "dialog" : "inline"}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onValueChange={(_, date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              onChange(`${day}/${month}/${year}`);
              if (Platform.OS === "android") setOpen(false);
            }}
            onDismiss={() => setOpen(false)}
          />
          {Platform.OS === "ios" && (
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.done}>
              <Text style={styles.doneText}>Concluir</Text>
            </Pressable>
          )}
        </View>
      )}
      {!!value && (
        <Pressable accessibilityRole="button" onPress={() => { onChange(""); setOpen(false); }} style={styles.clear}>
          <Text style={styles.clearText}>Remover data</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 15 },
  label: { color: palette.text, fontSize: 12, fontWeight: "700", marginBottom: 7 },
  input: { minHeight: 48, backgroundColor: "#F7F7F2", borderWidth: 1, borderColor: palette.line, borderRadius: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  value: { color: palette.text, fontSize: 15 },
  placeholder: { color: palette.muted, fontSize: 15 },
  icon: { color: palette.muted, fontSize: 20 },
  done: { alignSelf: "flex-end", padding: 10 },
  doneText: { color: "#6D5BB8", fontSize: 13, fontWeight: "700" },
  clear: { alignSelf: "flex-start", paddingVertical: 8 },
  clearText: { color: palette.muted, fontSize: 12 },
});
