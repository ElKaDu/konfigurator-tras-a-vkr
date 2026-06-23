import { createFileRoute } from "@tanstack/react-router";
import { RuleCreatorPage } from "@/components/rules/RuleCreatorPage";

export const Route = createFileRoute("/rules/$ruleId/edit")({
  head: () => ({
    meta: [{ title: "Upravit pravidlo — Bytorp" }],
  }),
  component: RuleEditExistingPage,
});

function RuleEditExistingPage() {
  const { ruleId } = Route.useParams();
  return <RuleCreatorPage ruleId={ruleId} />;
}
