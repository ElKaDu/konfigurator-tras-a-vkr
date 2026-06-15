import { createFileRoute } from "@tanstack/react-router";
import { AreaPicker } from "@/components/rules/AreaPicker";
import type { Area } from "@/lib/model/types";

export const Route = createFileRoute("/rules/new")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      area: search.area as Area | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Nové pravidlo — Bytorp" },
    ],
  }),
  component: RulesNewPage,
});

function RulesNewPage() {
  const search = Route.useSearch();
  return <AreaPicker preselectedArea={search.area} />;
}
