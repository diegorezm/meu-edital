import { PerformancePage } from "@features/desempenho";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/desempenho")({ component: PerformancePage });
