import { AccountPage } from "@features/conta";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/conta")({ component: AccountPage });
