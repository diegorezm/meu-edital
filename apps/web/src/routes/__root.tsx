import { CookieBanner } from "@global/legal/CookieBanner";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <CookieBanner />
    </>
  ),
});
