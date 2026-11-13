import { OracleView } from "./components/OracleView";
import { useOracle } from "./hooks/useOracle";

export function OraclePage() {
  return <OracleView oracle={useOracle()} />;
}
