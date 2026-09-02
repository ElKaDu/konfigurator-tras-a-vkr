import { createFileRoute } from "@tanstack/react-router";
import { SituationsListPage } from "@/components/situations/SituationsListPage";

export const Route = createFileRoute("/situace")({
  // Návrat z editoru pravidla rozbalí situaci, ze které uživatel odešel.
  validateSearch: (search: Record<string, unknown>) => ({
    open: (search.open as string | undefined) ?? undefined,
  }),
  head: () => ({
    meta: [
      { title: "Situace a závažnosti — Bytorp" },
      { name: "description", content: "Šablony pro věci k řešení podle situace a závažnosti." },
    ],
  }),
  component: SituaceListRoute,
});

function SituaceListRoute() {
  const { open } = Route.useSearch();
  return <SituationsListPage openSituationId={open} />;
}
