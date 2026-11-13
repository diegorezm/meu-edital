import { MockExamsPage } from "@features/simulados";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/simulados")({ component: MockExamsPage });
