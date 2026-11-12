import { OnboardingPage } from "@features/comecar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/comecar")({ component: OnboardingPage });
