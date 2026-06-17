import { createFileRoute } from "@tanstack/react-router";
import { RouteEditorPage } from "@/components/routes/RouteEditorPage";

export const Route = createFileRoute("/trasa/$id")({
  head: () => ({ meta: [{ title: "Editace trasy — Bytorp" }] }),
  component: TraseEditorRoute,
});

function TraseEditorRoute() {
  const { id } = Route.useParams();
  return <RouteEditorPage routeId={id} />;
}
