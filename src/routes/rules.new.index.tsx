import { createFileRoute } from "@tanstack/react-router";
import { RuleCreatorPage } from "@/components/rules/RuleCreatorPage";

export const Route = createFileRoute("/rules/new/")({
  validateSearch: (search: Record<string, unknown>) => ({
    situationId: (search.situationId as string | undefined) ?? undefined,
    severityId: (search.severityId as string | undefined) ?? undefined,
  }),
  head: () => ({
    meta: [{ title: "Nové pravidlo — Bytorp" }],
  }),
  component: RulesNewIndexPage,
});

function RulesNewIndexPage() {
  const { situationId, severityId } = Route.useSearch();
  return <RuleCreatorPage initialSituationId={situationId} initialSeverityId={severityId} />;
}
