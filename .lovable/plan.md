## Problém

Náhled „specifikace-konfigurator-pravidel.md" v Lovable Files ukazuje **artefakt** v `/mnt/documents/`, ne soubor v repu:

- **Artefakt (co vidíš)**: `/mnt/documents/specifikace-konfigurator-pravidel.md` — verze 2.1 (v11 delta), 2026-06-08, starý titulek „Specifikace — Konfigurátor pravidel & Trasy zásilek".
- **Repo (aktuální)**: `docs/specifikace-konfigurator-pravidel.md` — 2026-06-10, titulek „Specifikace: Konfigurátor pravidel Věcí k řešení (VkŘ)", nová terminologie „pokročilá podmínka", 3 spouštěče, §6.5 UI workflow, bez changelogu.

## Plán

1. Přepsat `/mnt/documents/specifikace-konfigurator-pravidel.md` obsahem `docs/specifikace-konfigurator-pravidel.md` (`cp -f`).
2. Znovu vystavit přes `<presentation-artifact>` — náhled se obnoví na aktuální verzi.

Žádná změna kódu ani repo souboru. Jen synchronizace artefaktu.
