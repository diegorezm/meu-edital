import { StyleSheet, Text, View } from "react-native";
import { palette } from "@global/constants/colors";

/**
 * Marca do app. `large` é usada nas telas públicas (landing, login);
 * `inverted` deixa o símbolo escuro, para fundos lavanda.
 */
export function Brand({
  large = false,
  inverted = false,
}: {
  large?: boolean;
  inverted?: boolean;
}) {
  return (
    <View style={s.row}>
      <View style={[s.mark, large && s.markLarge, inverted && s.markInverted]}>
        <Text
          style={[
            s.markText,
            large && s.markTextLarge,
            inverted && s.markTextInverted,
          ]}
        >
          m.
        </Text>
      </View>
      <Text style={[s.logo, large && s.logoLarge]}>
        meu edital<Text style={s.dot}>.</Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 9 },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: palette.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  markLarge: { width: 36, height: 36, borderRadius: 13 },
  markInverted: { backgroundColor: palette.dark },
  markText: {
    color: palette.dark,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  markTextLarge: { fontSize: 18 },
  markTextInverted: { color: palette.lavender },
  logo: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  logoLarge: { fontSize: 20, letterSpacing: -0.9 },
  dot: { color: "#8B75DB" },
});
