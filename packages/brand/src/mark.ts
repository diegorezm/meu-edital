/**
 * Símbolo da marca num quadro de 120 × 120: o "m" da Newsreader em traço
 * vetorial, grifado com marca-texto e com o ponto vermelho do nome.
 * O app e o site desenham o mesmo símbolo a partir destes dados.
 */
export const mark = {
  viewBox: "0 0 120 120",
  /** Contorno do quadro, por dentro da borda. */
  frame: { x: 5, y: 5, size: 110, radius: 23, stroke: 4 },
  /** Traço do marca-texto, levemente torto como um grifo feito à mão. */
  highlight: "M20 61.5 C40 57.5 72 56.5 99 58.5 L98 77.5 C72 75.5 42 76.5 21 79.5 Z",
  /** O "m", já posicionado no quadro. */
  letter: {
    transform: "translate(21.56 75.5) scale(0.038 -0.038)",
    d: "M436 712V94L549 50V0H55V50L191 99V670Q171 695 138.0 716.0Q105 737 48 762V800L351 914H385ZM1006 636V94L1118 50V0H647V50L760 94V588Q760 635 742.5 665.0Q725 695 690.5 709.5Q656 724 606 724Q548 724 495.0 707.0Q442 690 412 661L377 707Q441 771 490.5 811.5Q540 852 582.0 874.0Q624 896 665.0 904.5Q706 913 752 913Q841 913 897.0 879.0Q953 845 979.5 782.5Q1006 720 1006 636ZM1575 607V99L1712 50V0H1217V50L1330 94V588Q1330 636 1312.0 665.5Q1294 695 1259.5 709.5Q1225 724 1175 724Q1117 724 1064.0 706.5Q1011 689 981 661L946 707Q1010 771 1059.5 811.5Q1109 852 1151.5 874.0Q1194 896 1235.0 904.5Q1276 913 1322 913Q1454 913 1514.5 835.0Q1575 757 1575 607Z",
  },
  dot: { cx: 96, cy: 70.5, r: 6.5 },
};
