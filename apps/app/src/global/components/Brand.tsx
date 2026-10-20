import { StyleSheet, View } from "react-native";
import { Text } from "@global/components/Text";
import { palette } from "@global/constants/colors";

/**
 * Marca do app. `large` é usada nas telas públicas (landing, login);
 * `inverted` preenche o símbolo com a tinta.
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
    width: 30,
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  markLarge: { width: 36, height: 36 },
  markInverted: { backgroundColor: palette.ink },
  markText: { color: palette.ink, fontSize: 20, fontWeight: "700" },
  markTextLarge: { fontSize: 23 },
  markTextInverted: { color: palette.bg },
  logo: { color: palette.ink, fontSize: 20, fontWeight: "700" },
  logoLarge: { fontSize: 23 },
  dot: { color: palette.danger },
});
