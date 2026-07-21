import { createFileRoute } from "@tanstack/react-router";
import { SituationsListPage } from "@/components/situations/SituationsListPage";

export const Route = createFileRoute("/situace")({
  head: () => ({
    meta: [
      { title: "Situace a závažnosti — Bytorp" },
      { name: "description", content: "Šablony pro věci k řešení podle situace a závažnosti." },
    ],
  }),
  component: SituationsListPage,
});
