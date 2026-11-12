import { UnderConstruction } from "@global/components/UnderConstruction";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/guilda")({
  component: () => (
    <UnderConstruction title="Guilda" soon="Grupos de amigos com liga semanal. Chega em uma fase futura." />
  ),
});
