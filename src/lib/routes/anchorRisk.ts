/**
 * Rizikové kotvy pro pokročilé podmínky — pole, jejichž hodnotu mění operátor
 * nebo pravidla VkŘ. Pokud uživatel zvolí kotvu nad takovým polem, riskuje
 * tautologický cyklus.
 *
 * Toto je jen informativní seznam pro varování v editoru — nic neblokuje.
 */

export const RISKY_ANCHOR_FIELDS: Record<string, string> = {
  promised_delivery_at: "Avizované datum doručení (ADD) — mění operátor i pravidla VkŘ.",
  promised_delivery_changed_at: "Časová známka změny ADD — generuje pravidlo VkŘ.",
  promised_delivery_change_count_today: "Počítadlo změn ADD dnes — generuje pravidlo VkŘ.",
  today_delivery_check_state: "Stav posouzení dnešního doručení — nastavují pravidla VkŘ.",
  today_delivery_check_count: "Počítadlo kontrol dnešního doručení — generuje pravidlo VkŘ.",
};

export function isRiskyAnchorField(fieldId: string | undefined): boolean {
  if (!fieldId) return false;
  return fieldId in RISKY_ANCHOR_FIELDS;
}

export const ANCHOR_RISK_HINT =
  "Hodnotu tohoto pole mění operátor nebo pravidla VkŘ. Pravidlo s `condition_met` nad stejným polem může způsobit cyklus. Zvaž použití carrier_announced_delivery_at, eta nebo pickup_done.";
