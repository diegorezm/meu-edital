import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { mark } from "@meu-edital/brand";
import { Text } from "@global/components/Text";
import { palette } from "@global/constants/colors";

/** Símbolo da marca: o "m" grifado com marca-texto, num quadro de papel. */
export function BrandMark({ size = 32 }: { size?: number }) {
  const { frame } = mark;
  return (
    <Svg width={size} height={size} viewBox={mark.viewBox}>
      <Rect width={120} height={120} rx={27} fill={palette.bg} />
      <Rect
        x={frame.x}
        y={frame.y}
        width={frame.size}
        height={frame.size}
        rx={frame.radius}
        fill="none"
        stroke={palette.ink}
        strokeWidth={frame.stroke}
      />
      <Path d={mark.highlight} fill={palette.highlight} />
      <Path
        d={mark.letter.d}
        transform={mark.letter.transform}
        fill={palette.ink}
      />
      <Circle
        cx={mark.dot.cx}
        cy={mark.dot.cy}
        r={mark.dot.r}
        fill={palette.danger}
      />
    </Svg>
  );
}

/** Marca do app. `large` é usada nas telas públicas (login, cadastro). */
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <View style={s.row}>
      <BrandMark size={large ? 38 : 32} />
      <Text style={[s.logo, large && s.logoLarge]}>
        meu edital<Text style={s.dot}>.</Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 9 },
  logo: { color: palette.ink, fontSize: 20, fontWeight: "700" },
  logoLarge: { fontSize: 23 },
  dot: { color: palette.danger },
});
