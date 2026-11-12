import { ReviewsPage } from "@features/revisoes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/revisoes")({ component: ReviewsPage });
