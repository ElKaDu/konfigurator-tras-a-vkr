import { createFileRoute } from "@tanstack/react-router";
import { RoutesAndSegmentsPage } from "@/components/routes/RoutesAndSegmentsPage";

export const Route = createFileRoute("/trasy")({
  head: () => ({
    meta: [
      { title: "Trasy zásilek — Bytorp" },
      {
        name: "description",
        content:
          "Konfigurátor obchodních tras: baseline checkpointy pro kombinace dopravce, typu služby a cílové země.",
      },
    ],
  }),
  component: RoutesAndSegmentsPage,
});
