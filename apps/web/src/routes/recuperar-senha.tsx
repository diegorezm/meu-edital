import { ForgotPasswordPage } from "@features/conta";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/recuperar-senha")({ component: ForgotPasswordPage });
