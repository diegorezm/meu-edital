import { UnderConstruction } from "@global/components/UnderConstruction";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/conquistas")({
  component: () => <UnderConstruction title="Conquistas" />,
});
