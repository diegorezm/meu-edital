import { WeekPage } from "@features/semana";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/semana")({ component: WeekPage });
