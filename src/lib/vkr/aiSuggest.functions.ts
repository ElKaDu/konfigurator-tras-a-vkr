import { createServerFn } from "@tanstack/react-start";
import { FIELDS, TRIGGER_LABELS, ACTION_LABELS, OPERATOR_LABELS } from "./fields";

export type AISuggestion = {
  name: string;
  description: string;
  folderId: string;
  priority?: number;
  trigger: {
    type: string;
    fieldId?: string;
    toStatus?: string;
    fromStatus?: string;
    schedule?: { mode: string; timeOfDay?: string; intervalMinutes?: number; fieldId?: string; offsetMinutes?: number };
  };
  conditionGroup: {
    operator: "AND" | "OR";
    children: Array<
      | { kind: "field"; fieldId: string; operator: string; value?: string | number | boolean }
      | { operator: "AND" | "OR"; children: Array<{ kind: "field"; fieldId: string; operator: string; value?: string | number | boolean }> }
    >;
  };
  actions: Array<{
    type: string;
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assignMode?: "shipment_operator" | "specific_user" | "role" | "round_robin";
    assignValue?: string;
    toMode?: "shipment_operator" | "customer" | "specific_address" | "role";
    toValue?: string;
    subject?: string;
    body?: string;
    fieldId?: string;
    fieldValue?: string;
    toPhase?: string;
    newPriority?: "low" | "medium" | "high" | "urgent";
    noteText?: string;
  }>;
};

const PHASE_TO_FOLDER: Record<string, string> = {
  objednani: "A", vyzvednuti: "B", preprava: "C", cleni: "D",
  doruceni: "E", fakturace: "G", po_doruceni: "H", jine: "A",
};

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "Krátký výstižný název věci k řešení (3-6 slov)" },
    description: { type: "string", description: "1-2 věty popisující co pravidlo dělá a proč" },
    folderId: { type: "string", enum: ["A", "B", "C", "D", "E", "F", "G", "H"] },
    priority: { type: "number", description: "1-1000, výchozí 100" },
    trigger: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["field_change", "status_change", "tracking_event", "schedule", "shipment_created", "order_created", "vkr_status_change", "manual"] },
        fieldId: { type: "string" },
        toStatus: { type: "string" },
        fromStatus: { type: "string" },
        schedule: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["daily", "interval", "relative_to_field"] },
            timeOfDay: { type: "string" },
            intervalMinutes: { type: "number" },
            fieldId: { type: "string" },
            offsetMinutes: { type: "number" },
          },
        },
      },
      required: ["type"],
    },
    conditionGroup: {
      type: "object",
      properties: {
        operator: { type: "string", enum: ["AND", "OR"] },
        children: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["field"] },
              fieldId: { type: "string" },
              operator: { type: "string" },
              value: {},
            },
          },
        },
      },
      required: ["operator", "children"],
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["create_vkr", "send_email", "set_field", "change_phase", "update_vkr", "add_note"] },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          assignMode: { type: "string", enum: ["shipment_operator", "specific_user", "role", "round_robin"] },
          assignValue: { type: "string" },
          toMode: { type: "string", enum: ["shipment_operator", "customer", "specific_address", "role"] },
          toValue: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
          fieldId: { type: "string" },
          fieldValue: { type: "string" },
          toPhase: { type: "string" },
          newPriority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          noteText: { type: "string" },
        },
        required: ["type"],
      },
    },
  },
  required: ["name", "description", "folderId", "trigger", "conditionGroup", "actions"],
} as const;

function buildSystemPrompt(phaseLabel: string): string {
  const fieldList = FIELDS.map((f) => `- ${f.id} (${f.type}${f.enumValues ? `, hodnoty: ${f.enumValues.join("|")}` : ""}): ${f.label} [${f.category}]`).join("\n");
  const triggers = Object.entries(TRIGGER_LABELS).map(([k, v]) => `${k} = ${v}`).join("; ");
  const actions = Object.entries(ACTION_LABELS).map(([k, v]) => `${k} = ${v}`).join("; ");
  const ops = Object.entries(OPERATOR_LABELS).map(([k, v]) => `${k} = ${v}`).join("; ");

  return `Jsi konfigurátor "Věcí k řešení" (VkŘ) pro logistický systém Bytorp.
Uživatel popisuje vlastními slovy, co chce, aby systém automaticky hlídal.
Tvým úkolem je navrhnout strukturu pravidla, které vytvoří VkŘ.

Fáze, kterou uživatel vybral: **${phaseLabel}**.

Pravidla:
1. Vyber správný **trigger** (spouštěč).
2. Sestav **conditionGroup** s konkrétními poli — používej PŘESNÉ fieldId.
3. Navrhni **actions** — typicky create_vkr s rozumným title/description, priority a assignMode.
4. Vyplň **name** (krátký) a **description** (1-2 věty česky).
5. Vyber **folderId** podle fáze.

Dostupné fieldId:
${fieldList}

Triggery: ${triggers}
Akce: ${actions}
Operátory: ${ops}

Buď stručný. Vrať pouze validní data přes tool call.`;
}

export const suggestRule = createServerFn({ method: "POST" })
  .inputValidator((d: { phase: string; phaseLabel: string; prompt: string }) => d)
  .handler(async ({ data }): Promise<AISuggestion> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY není nastaven.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystemPrompt(data.phaseLabel) },
          { role: "user", content: data.prompt },
        ],
        tools: [{ type: "function", function: { name: "suggest_vkr", description: "Návrh struktury Věci k řešení", parameters: SCHEMA } }],
        tool_choice: { type: "function", function: { name: "suggest_vkr" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Překročen rate limit Lovable AI. Zkus to za chvíli.");
      if (res.status === 402) throw new Error("Vyčerpané kredity Lovable AI. Doplň je v Settings → Workspace → Usage.");
      throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("AI nevrátila návrh.");

    const parsed = JSON.parse(call.function.arguments) as AISuggestion;
    if (!parsed.folderId) parsed.folderId = PHASE_TO_FOLDER[data.phase] ?? "A";
    return parsed;
  });

export const PHASES = [
  { id: "objednani", label: "Objednání" },
  { id: "vyzvednuti", label: "Vyzvednutí" },
  { id: "preprava", label: "Přeprava" },
  { id: "cleni", label: "Celní řízení" },
  { id: "doruceni", label: "Doručení" },
  { id: "fakturace", label: "Fakturace" },
  { id: "po_doruceni", label: "Po doručení" },
  { id: "jine", label: "Jiné" },
] as const;
