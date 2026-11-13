import { OraclePage } from "@features/oraculo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/oraculo")({ component: OraclePage });
