import { createFileRoute } from "@tanstack/react-router";
import { RuleCreatorPage } from "@/components/rules/RuleCreatorPage";

export const Route = createFileRoute("/rules/$ruleId/edit")({
  // Odkud se sem uživatel dostal — po uložení i po zpět se tam vrátíme.
  validateSearch: (search: Record<string, unknown>) => ({
    fromSituation: (search.fromSituation as string | undefined) ?? undefined,
  }),
  head: () => ({
    meta: [{ title: "Upravit pravidlo — Bytorp" }],
  }),
  component: RuleEditExistingPage,
});

function RuleEditExistingPage() {
  const { ruleId } = Route.useParams();
  const { fromSituation } = Route.useSearch();
  return <RuleCreatorPage ruleId={ruleId} returnToSituationId={fromSituation} />;
}
