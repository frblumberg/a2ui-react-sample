---
name: verify
description: Prüft das A2UI-Sample vollständig (Typecheck, Tests, Build). Vor jedem Commit und nach Änderungen an Agenten, Katalog, Gateway oder Web-Shell ausführen.
---

# Projekt prüfen

Führe nacheinander aus und brich beim ersten Fehler ab:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`

Wurden Abhängigkeiten geändert, zusätzlich `npm ls @a2ui/web_core` ausführen: Es darf nur Version `0.15.0` bzw. die
in `overrides` gepinnte Version vorkommen (sonst „deduped“/„overridden“ prüfen).

Wurde `packages/brand-catalog/src/apis.ts` geändert, `npm run catalog:export` ausführen und die geänderte
`catalog.json` mit committen.

Melde das Ergebnis kurz: was lief, was fehlschlug, mit der relevanten Fehlermeldung.
