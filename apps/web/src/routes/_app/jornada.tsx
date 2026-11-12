import { JourneyPage } from "@features/jornada";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/jornada")({ component: JourneyPage });
