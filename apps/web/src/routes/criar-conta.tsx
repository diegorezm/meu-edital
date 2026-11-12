import { SignUpPage } from "@features/conta";
import { requireGuest } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/criar-conta")({
  beforeLoad: requireGuest,
  component: SignUpPage,
});
