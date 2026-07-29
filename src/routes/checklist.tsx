import { createFileRoute } from "@tanstack/react-router";
import { ChecklistPage } from "@/components/checklist/ChecklistPage";

export const Route = createFileRoute("/checklist")({
  head: () => ({
    meta: [
      { title: "Checklist objednávky — Bytorp" },
      { name: "description", content: "Vyhodnocení a kontrola objednávky, Krok 2." },
    ],
  }),
  component: ChecklistPage,
});
