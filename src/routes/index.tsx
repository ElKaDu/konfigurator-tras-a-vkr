import { createFileRoute } from "@tanstack/react-router";
import { RulesList } from "@/components/rules/RulesList";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nastavení pravidel — Bytorp" },
      { name: "description", content: "Konfigurátor pravidel — automatizovaně vytváří Věci k řešení (VkŘ) pro operátory." },
    ],
  }),
  component: () => <RulesList />,
});
