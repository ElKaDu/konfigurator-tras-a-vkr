import { createFileRoute } from "@tanstack/react-router";
import { RouteEditorPage } from "@/components/soulad/RouteEditorPage";

export const Route = createFileRoute("/soulad-s-trasou_/trasa/$id")({
  head: () => ({ meta: [{ title: "Úprava trasy — Soulad s trasou — Bytorp" }] }),
  component: TrasaEditorRoute,
});

function TrasaEditorRoute() {
  const { id } = Route.useParams();
  return <RouteEditorPage routeId={id} />;
}
