import { createFileRoute } from "@tanstack/react-router";
import { RuleCreatorPage } from "@/components/rules/RuleCreatorPage";

export const Route = createFileRoute("/rules/new/")({
  head: () => ({
    meta: [{ title: "Nové pravidlo — Bytorp" }],
  }),
  component: RuleCreatorPage,
});
