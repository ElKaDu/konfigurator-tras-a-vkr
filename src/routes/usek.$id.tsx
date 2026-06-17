import { createFileRoute } from "@tanstack/react-router";
import { SegmentEditorPage } from "@/components/routes/SegmentEditorPage";

export const Route = createFileRoute("/usek/$id")({
  head: () => ({ meta: [{ title: "Editace úseku — Bytorp" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    from: (search.from as string | undefined) ?? null,
  }),
  component: UsekEditorRoute,
});

function UsekEditorRoute() {
  const { id } = Route.useParams();
  const { from } = Route.useSearch();
  return <SegmentEditorPage segmentId={id} fromRouteId={from} />;
}
