import { ConsentView } from "./components/ConsentView";
import { type ConsentSearch, useConsent } from "./hooks/useConsent";

export function ConsentPage({ search }: { search: ConsentSearch }) {
  return <ConsentView consent={useConsent(search)} />;
}
