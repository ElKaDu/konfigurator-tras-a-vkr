import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { T as Toaster$1 } from "../_libs/sonner.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const appCss = "/assets/styles-yzNW9n7m.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$b = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Prototype Builder creates interactive prototypes for business processes." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Prototype Builder creates interactive prototypes for business processes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "Prototype Builder creates interactive prototypes for business processes." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1906d091-d613-4698-b9ad-d76a852cac66/id-preview-91988d80--a38f63ac-dc0f-4217-b3fc-48a4780ef979.lovable.app-1780038616793.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1906d091-d613-4698-b9ad-d76a852cac66/id-preview-91988d80--a38f63ac-dc0f-4217-b3fc-48a4780ef979.lovable.app-1780038616793.png" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$b.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, {})
  ] });
}
const $$splitComponentImporter$a = () => import("./trasy-BM5JrnOf.mjs");
const Route$a = createFileRoute("/trasy")({
  head: () => ({
    meta: [{
      title: "Trasy zásilek — Bytorp"
    }, {
      name: "description",
      content: "Konfigurátor obchodních tras: baseline checkpointy pro kombinace dopravce, typu služby a cílové země."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./test-CG1rBZxV.mjs");
const Route$9 = createFileRoute("/test")({
  head: () => ({
    meta: [{
      title: "Otestovat pravidlo — Bytorp"
    }, {
      name: "description",
      content: "Otestuj pravidlo na vzorové zásilce a prohlédni si ukázkový výsledek."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./situace-CsValprV.mjs");
const Route$8 = createFileRoute("/situace")({
  head: () => ({
    meta: [{
      title: "Situace a závažnosti — Bytorp"
    }, {
      name: "description",
      content: "Šablony pro věci k řešení podle situace a závažnosti."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./index-z4seZjT1.mjs");
const Route$7 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Konfigurátor pravidel — Bytorp"
    }, {
      name: "description",
      content: "Konfigurátor pravidel — automatizovaně vytváří Věci k řešení (VkŘ) pro operátory."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./usek._id-ZN0sdyzs.mjs");
const Route$6 = createFileRoute("/usek/$id")({
  head: () => ({
    meta: [{
      title: "Editace úseku — Bytorp"
    }]
  }),
  validateSearch: (search) => ({
    from: search.from ?? null
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./trasa._id-D1cPoa3E.mjs");
const Route$5 = createFileRoute("/trasa/$id")({
  head: () => ({
    meta: [{
      title: "Editace trasy — Bytorp"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./situace_._id-DB_DeW3h.mjs");
const Route$4 = createFileRoute("/situace_/$id")({
  head: () => ({
    meta: [{
      title: "Editace situace — Bytorp"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./rules.new-C8sQMAFu.mjs");
const Route$3 = createFileRoute("/rules/new")({
  head: () => ({
    meta: [{
      title: "Nové pravidlo — Bytorp"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./rules.new.index-DUtZEUz0.mjs");
const Route$2 = createFileRoute("/rules/new/")({
  validateSearch: (search) => ({
    situationId: search.situationId ?? void 0,
    severityId: search.severityId ?? void 0
  }),
  head: () => ({
    meta: [{
      title: "Nové pravidlo — Bytorp"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./rules.new.edit-BEYQk2ml.mjs");
const Route$1 = createFileRoute("/rules/new/edit")({
  validateSearch: (search) => {
    return {
      area: search.area ?? "tracking_records",
      name: search.name ?? ""
    };
  },
  head: () => ({
    meta: [{
      title: "Editor pravidla — Bytorp"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./rules._ruleId.edit-BHxlSMIZ.mjs");
const Route = createFileRoute("/rules/$ruleId/edit")({
  head: () => ({
    meta: [{
      title: "Upravit pravidlo — Bytorp"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const TrasyRoute = Route$a.update({
  id: "/trasy",
  path: "/trasy",
  getParentRoute: () => Route$b
});
const TestRoute = Route$9.update({
  id: "/test",
  path: "/test",
  getParentRoute: () => Route$b
});
const SituaceRoute = Route$8.update({
  id: "/situace",
  path: "/situace",
  getParentRoute: () => Route$b
});
const IndexRoute = Route$7.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$b
});
const UsekIdRoute = Route$6.update({
  id: "/usek/$id",
  path: "/usek/$id",
  getParentRoute: () => Route$b
});
const TrasaIdRoute = Route$5.update({
  id: "/trasa/$id",
  path: "/trasa/$id",
  getParentRoute: () => Route$b
});
const SituaceIdRoute = Route$4.update({
  id: "/situace_/$id",
  path: "/situace/$id",
  getParentRoute: () => Route$b
});
const RulesNewRoute = Route$3.update({
  id: "/rules/new",
  path: "/rules/new",
  getParentRoute: () => Route$b
});
const RulesNewIndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => RulesNewRoute
});
const RulesNewEditRoute = Route$1.update({
  id: "/edit",
  path: "/edit",
  getParentRoute: () => RulesNewRoute
});
const RulesRuleIdEditRoute = Route.update({
  id: "/rules/$ruleId/edit",
  path: "/rules/$ruleId/edit",
  getParentRoute: () => Route$b
});
const RulesNewRouteChildren = {
  RulesNewEditRoute,
  RulesNewIndexRoute
};
const RulesNewRouteWithChildren = RulesNewRoute._addFileChildren(
  RulesNewRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  SituaceRoute,
  TestRoute,
  TrasyRoute,
  RulesNewRoute: RulesNewRouteWithChildren,
  SituaceIdRoute,
  TrasaIdRoute,
  UsekIdRoute,
  RulesRuleIdEditRoute
};
const routeTree = Route$b._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$6 as R,
  Route$5 as a,
  Route$4 as b,
  Route$2 as c,
  Route$1 as d,
  Route as e,
  router as r
};
