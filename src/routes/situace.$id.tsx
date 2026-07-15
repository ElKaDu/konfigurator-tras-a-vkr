import { createFileRoute } from "@tanstack/react-router";
import { SituationEditorPage } from "@/components/situations/SituationEditorPage";

export const Route = createFileRoute("/situace/$id")({
  head: () => ({ meta: [{ title: "Editace situace — Bytorp" }] }),
  component: SituaceEditorRoute,
});

function SituaceEditorRoute() {
  const { id } = Route.useParams();
  return <SituationEditorPage situationId={id} />;
}
