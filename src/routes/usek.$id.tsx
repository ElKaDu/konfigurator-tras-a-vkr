import { createFileRoute } from "@tanstack/react-router";
import { SegmentEditorPage } from "@/components/routes/SegmentEditorPage";

export const Route = createFileRoute("/usek/$id")({
  head: () => ({ meta: [{ title: "Editace úseku — Bytorp" }] }),
  component: UsekEditorRoute,
});

function UsekEditorRoute() {
  const { id } = Route.useParams();
  return <SegmentEditorPage segmentId={id} />;
}
