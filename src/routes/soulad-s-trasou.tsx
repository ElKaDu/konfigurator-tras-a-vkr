import { createFileRoute } from "@tanstack/react-router";
import { SouladSTrasouListPage } from "@/components/soulad/SouladSTrasouListPage";

export const Route = createFileRoute("/soulad-s-trasou")({
  head: () => ({ meta: [{ title: "Soulad s trasou — Bytorp" }] }),
  component: SouladSTrasouListPage,
});
