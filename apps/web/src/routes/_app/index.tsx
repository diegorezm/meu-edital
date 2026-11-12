import { HomePage } from "@features/inicio";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({ component: HomePage });
