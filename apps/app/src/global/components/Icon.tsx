import type { IconProps } from "phosphor-react-native";
import { ArrowDownIcon } from "phosphor-react-native/src/icons/ArrowDown";
import { ArrowRightIcon } from "phosphor-react-native/src/icons/ArrowRight";
import { ArrowsClockwiseIcon } from "phosphor-react-native/src/icons/ArrowsClockwise";
import { ArrowUpIcon } from "phosphor-react-native/src/icons/ArrowUp";
import { BooksIcon } from "phosphor-react-native/src/icons/Books";
import { CalendarBlankIcon } from "phosphor-react-native/src/icons/CalendarBlank";
import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { ChartBarIcon } from "phosphor-react-native/src/icons/ChartBar";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { CheckSquareIcon } from "phosphor-react-native/src/icons/CheckSquare";
import { CircleIcon } from "phosphor-react-native/src/icons/Circle";
import { ClockCounterClockwiseIcon } from "phosphor-react-native/src/icons/ClockCounterClockwise";
import { CopyIcon } from "phosphor-react-native/src/icons/Copy";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { FileTextIcon } from "phosphor-react-native/src/icons/FileText";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { SparkleIcon } from "phosphor-react-native/src/icons/Sparkle";
import { SquareIcon } from "phosphor-react-native/src/icons/Square";
import { TimerIcon } from "phosphor-react-native/src/icons/Timer";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { palette } from "@global/constants/colors";

/**
 * Ícones do Phosphor no peso Light, que combina com o traço fino de caneta.
 * Cada ícone é importado do próprio arquivo para não levar o pacote inteiro
 * para o bundle da web.
 */
const icons = {
  arrowDown: ArrowDownIcon,
  arrowRight: ArrowRightIcon,
  arrowUp: ArrowUpIcon,
  books: BooksIcon,
  calendar: CalendarBlankIcon,
  caretDown: CaretDownIcon,
  caretRight: CaretRightIcon,
  chartBar: ChartBarIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  checkSquare: CheckSquareIcon,
  circle: CircleIcon,
  close: XIcon,
  copy: CopyIcon,
  cycle: ArrowsClockwiseIcon,
  fileText: FileTextIcon,
  home: HouseIcon,
  more: DotsThreeIcon,
  play: PlayIcon,
  reviews: ClockCounterClockwiseIcon,
  search: MagnifyingGlassIcon,
  signOut: SignOutIcon,
  sparkle: SparkleIcon,
  square: SquareIcon,
  timer: TimerIcon,
};

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 20,
  color = palette.ink,
  weight = "light",
}: { name: IconName } & Pick<IconProps, "size" | "color" | "weight">) {
  const Component = icons[name];
  return <Component size={size} color={color} weight={weight} />;
}
