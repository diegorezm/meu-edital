import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@global/constants/colors";
import { normalizeText } from "@global/utils/normalizeText";
import type { Subject, Topic } from "@domain/types";

type Item = Subject | Topic;

export function SearchablePicker({
  items,
  label,
  emptyText,
  pressedStyle,
  onSelect,
}: {
  items: (Subject | Topic)[];
  label: string;
  emptyText: string;
  pressedStyle?: object;
  onSelect: (item: Item) => void;
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const filtered = useMemo(() => {
    const search = normalizeText(query.trim());
    return items
      .filter((item) => normalizeText(item.name).includes(search))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [items, query]);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setVisibleCount(30);
        }}
        placeholder={label}
        placeholderTextColor={palette.muted}
        clearButtonMode="while-editing"
        accessibilityLabel={label}
        style={s.search}
      />
      <Text style={s.count}>
        {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
      </Text>
      {filtered.length ? (
        <View style={s.results}>
          {filtered.slice(0, visibleCount).map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => onSelect(item)}
              style={({ pressed }) => [s.row, pressed && pressedStyle]}
            >
              <Text style={s.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={s.arrow}>›</Text>
            </Pressable>
          ))}
          {filtered.length > visibleCount && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisibleCount((count) => count + 30)}
              style={s.more}
            >
              <Text style={s.moreText}>Mostrar mais resultados</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Text style={s.empty}>
          {items.length ? "Nenhum resultado para essa busca." : emptyText}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  search: {
    backgroundColor: "#F7F7F2",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: palette.text,
    fontSize: 15,
  },
  count: { color: palette.muted, fontSize: 11, marginTop: 14, marginBottom: 6 },
  results: { gap: 7 },
  row: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#F7F7F2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  arrow: { color: palette.muted, fontSize: 23, marginLeft: 12 },
  more: { alignItems: "center", padding: 13 },
  moreText: { color: "#6D5BB8", fontSize: 12, fontWeight: "800" },
  empty: {
    color: palette.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 28,
  },
});
