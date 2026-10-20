import React, { createContext, useContext } from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";
import { palette } from "@global/constants/colors";
import { fonts } from "@global/constants/fonts";

/**
 * Escolhe a família pela intenção do estilo, para que as telas continuem
 * escrevendo só `fontWeight`: texto grande e forte vira título em serifa,
 * texto forte vira mono médio e o resto, mono regular.
 */
export function paperFont(style: TextStyle): TextStyle {
  if (style.fontFamily) return style;
  const { fontWeight, letterSpacing, ...rest } = style;
  const weight = Number(fontWeight) || 400;
  const size = style.fontSize ?? 14;
  if (weight >= 600 && size >= 19)
    return {
      ...rest,
      fontFamily: fonts.serif,
      // A serifa já é estreita; o espaçamento negativo dos títulos antigos a amassava.
      letterSpacing:
        letterSpacing === undefined ? undefined : Math.max(letterSpacing, -0.4),
    };
  return {
    ...rest,
    letterSpacing,
    fontFamily: weight >= 600 ? fonts.monoMedium : fonts.mono,
  };
}

const base: TextStyle = { color: palette.text, fontSize: 14 };

/** Estilo do `Text` de fora: o texto aninhado herda tamanho e fonte dele. */
const Parent = createContext<TextStyle | null>(null);

/** `Text` do app: mesma API do React Native, com as fontes da marca. */
export const Text = React.forwardRef<NativeText, TextProps>(function Text(
  { style, ...props },
  ref,
) {
  const parent = useContext(Parent);
  const own = StyleSheet.flatten(style) || {};
  let resolved: TextStyle;
  if (!parent) resolved = paperFont({ ...base, ...own });
  else if (
    own.fontWeight === undefined &&
    own.fontSize === undefined &&
    !own.fontFamily
  )
    resolved = own;
  else resolved = paperFont({ fontSize: parent.fontSize, ...own });
  const context = {
    fontSize: resolved.fontSize ?? parent?.fontSize,
    fontFamily: resolved.fontFamily ?? parent?.fontFamily,
  };
  return (
    <Parent.Provider value={context}>
      <NativeText ref={ref} {...props} style={resolved} />
    </Parent.Provider>
  );
});

/** `TextInput` do app, com a fonte mono e a tinta da marca. */
export const TextInput = React.forwardRef<NativeTextInput, TextInputProps>(
  function TextInput({ style, ...props }, ref) {
    return (
      <NativeTextInput
        ref={ref}
        placeholderTextColor={palette.muted}
        selectionColor={palette.ink}
        {...props}
        style={paperFont(StyleSheet.flatten([base, style]) || base)}
      />
    );
  },
);
