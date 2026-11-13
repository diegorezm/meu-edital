import { AchievementsPage } from "@features/conquistas";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/conquistas")({ component: AchievementsPage });
