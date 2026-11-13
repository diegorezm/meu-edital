import { LegalPage } from "@features/legal";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  component: () => <LegalPage document="privacidade" />,
});
