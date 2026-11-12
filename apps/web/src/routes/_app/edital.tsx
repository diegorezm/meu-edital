import { SyllabusPage } from "@features/edital";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/edital")({ component: SyllabusPage });
