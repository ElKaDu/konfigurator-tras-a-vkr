import { createFileRoute } from "@tanstack/react-router";
import { RuleEditor } from "@/components/rules/RuleEditor";
import type { Area } from "@/lib/model/types";

export const Route = createFileRoute("/rules/new/edit")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      area: (search.area as Area | undefined) ?? ("tracking_records" as Area),
      name: (search.name as string | undefined) ?? "",
    };
  },
  head: () => ({
    meta: [{ title: "Editor pravidla — Bytorp" }],
  }),
  component: RulesNewEditPage,
});

function RulesNewEditPage() {
  const search = Route.useSearch();
  return <RuleEditor area={search.area} name={search.name || "Nové pravidlo"} />;
}
