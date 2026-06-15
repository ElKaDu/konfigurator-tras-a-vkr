import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/rules/new")({
  head: () => ({
    meta: [
      { title: "Nové pravidlo — Bytorp" },
    ],
  }),
  component: RulesNewLayout,
});

// Layout-only: child routes (/rules/new and /rules/new/edit) render via Outlet.
// The index child (rules.new.index.tsx) renders AreaPicker at /rules/new.
function RulesNewLayout() {
  return <Outlet />;
}
