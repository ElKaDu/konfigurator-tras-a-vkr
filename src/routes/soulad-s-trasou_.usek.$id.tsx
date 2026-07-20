import { createFileRoute } from "@tanstack/react-router";
import { SouladSTrasouUsekPage } from "@/components/soulad/SouladSTrasouUsekPage";

export const Route = createFileRoute("/soulad-s-trasou_/usek/$id")({
  head: () => ({ meta: [{ title: "Úsek — Soulad s trasou — Bytorp" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    from: (search.from as string | undefined) ?? undefined,
  }),
  component: UsekRoute,
});

function UsekRoute() {
  const { id } = Route.useParams();
  return <SouladSTrasouUsekPage segmentId={id} />;
}
