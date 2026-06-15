import { createFileRoute } from "@tanstack/react-router";
import { TestPanel } from "@/components/test/TestPanel";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Otestovat pravidlo — Bytorp" },
      {
        name: "description",
        content: "Otestuj pravidlo na vzorové zásilce a prohlédni si ukázkový výsledek.",
      },
    ],
  }),
  component: TestPanel,
});
