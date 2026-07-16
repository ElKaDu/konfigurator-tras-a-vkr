import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { R as Root2, T as Trigger, P as Portal, C as Content2 } from "../_libs/radix-ui__react-popover.mjs";
import { m as useActionTags, c as cn, n as actionTagsStore } from "./store-CVlU6jxP.mjs";
import { P as Plus } from "../_libs/lucide-react.mjs";
const Popover = Root2;
const PopoverTrigger = Trigger;
const PopoverContent = reactExports.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = Content2.displayName;
function ActionTagPicker({
  excludeIds,
  onPick
}) {
  const tags = useActionTags();
  const [open, setOpen] = reactExports.useState(false);
  const [query, setQuery] = reactExports.useState("");
  const available = tags.filter((t) => !excludeIds.includes(t.id));
  const filtered = available.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = tags.some((t) => t.label.toLowerCase() === query.trim().toLowerCase());
  function pick(tag) {
    onPick(tag);
    setOpen(false);
    setQuery("");
  }
  function createAndPick() {
    const label = query.trim();
    if (!label) return;
    const tag = { id: "at_" + Date.now(), label };
    actionTagsStore.upsert(tag);
    pick(tag);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
      " Přidat akci"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { align: "start", className: "w-64 p-0 overflow-hidden", sideOffset: 4, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border px-2.5 py-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          autoFocus: true,
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Hledat nebo vytvořit akci…",
          className: "w-full bg-transparent text-xs focus:outline-none"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-56 overflow-y-auto p-1", children: [
        filtered.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => pick(tag),
            className: "w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60",
            children: tag.label
          },
          tag.id
        )),
        filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-3 text-center text-xs text-muted-foreground", children: "Nic nenalezeno" }),
        query.trim() && !exactMatch && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: createAndPick,
            className: "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-primary hover:bg-primary-soft/40",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3" }),
              " Vytvořit „",
              query.trim(),
              '"'
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  ActionTagPicker as A,
  Popover as P,
  PopoverTrigger as a,
  PopoverContent as b
};
