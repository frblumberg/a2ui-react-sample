# A2UI React Sample

Beispiel-Architektur aus dem Workshop „A2UI“: Agenten liefern Oberflächen als A2UI-JSON, die React-Web-Shell rendert
sie mit den Komponenten des Multi-Brand-Design-Systems. Überblick und Architektur-Diagramm: @README.md

## Befehle

- `npm run dev`: Gateway (:8787) und Web-Shell (:5173) zusammen starten
- `npm test`: Vitest (Validierung, Agenten-Flows inkl. offiziellem A2UI-Processor, Gateway über HTTP)
- `npm run typecheck`: `tsc` über alle Pakete (eine Root-`tsconfig.json`)
- `npm run build`: Produktions-Build der Web-Shell
- `npm run catalog:export`: Marken-Katalog nach `packages/brand-catalog/catalog.json`

Vor jedem Commit den Skill `verify` ausführen (typecheck, test, build).

## Aufbau

- `packages/shared`: Protokoll- und API-Typen, Katalog-IDs. Keine Laufzeit-Abhängigkeiten.
- `packages/brand-catalog`: `apis.ts` (Zod-Schemas = Vertrag mit dem Agenten), `components.tsx` (React),
  `schema.ts` (Katalog ohne React, für Server/Export), `catalog.ts` (Katalog mit React), `brands.ts` (Tokens)
- `services/agents`: `orchestrator.ts` (Intent, Katalog-Aushandlung, Action-Routing), `agents/*` (Fach-Agenten),
  `ui.ts` (Builder für A2UI-Nachrichten), `mcp/tools.ts` (Mock-Tools)
- `services/gateway`: `app.ts` (HTTP, NDJSON-Stream, Rate-Limit, Audit), `validate.ts` (Prüfung jeder A2UI-Nachricht)
- `apps/web-shell`: `useAgentSession.ts` verbindet Gateway-Stream und `MessageProcessor`
- `tests/`: alle Tests liegen hier, nicht in den Paketen

## Regeln

- **Protokoll ist A2UI v0.9** (`version: 'v0.9'`, Bindungen als `{path: …}`, Imports aus `@a2ui/*/v0_9`).
  Nicht mit 1.0-Syntax (`@path`, `@call`) mischen. Details: Skill `a2ui-messages`.
- **Genau eine Kopie von `@a2ui/web_core`.** Die Version ist über `overrides` in der Root-`package.json` gepinnt.
  `@a2ui/react` und `@a2ui/web_core` nur gemeinsam und auf dieselbe Version heben, danach `npm ls @a2ui/web_core` prüfen.
- **Agenten bauen A2UI nur über die Builder in `services/agents/src/ui.ts`.** Design-System-Komponenten immer über
  `brandHeader()`/`statusBanner()` (oder neue Helfer mit Fallback auf Basis-Komponenten für den Basiskatalog).
- **Werte aus Actions nie vertrauen:** im Agenten erneut prüfen. Verbindliche Aktionen brauchen einen
  Bestätigungsschritt (siehe `tariffAgent.ts`).
- **Ohne A2UI muss es auch gehen:** Ist `ctx.catalogId === null`, antwortet der Agent nur mit Text.
- **Datensparsamkeit:** `sendDataModel: true` nur, wenn der Agent das Datenmodell wirklich braucht.
- Code in TypeScript, `strict`. UI-Texte und Kommentare auf Deutsch, Bezeichner auf Englisch.
- Neue Fach-Agenten → Skill `new-domain-agent`. Neue Design-System-Komponenten → Skill `new-ds-component`.

## Stolperfallen

- Tests mit React-Komponenten aus `@a2ui/react` brauchen `// @vitest-environment jsdom` (die Renderer greifen
  beim Import auf `HTMLElement` zu). Server-Code und Export-Skript importieren deshalb `schema.ts`, nicht `catalog.ts`.
- Die Basiskomponenten sind Lit-Web-Components (Light DOM). In Browser-Tests über `.surface input`/`.surface button` selektieren.
- Die Meldung „Lit is in dev mode“ in Tests und Dev-Server ist erwartet.
- `MessageProcessor` ist generisch: In der Web-Shell `MessageProcessor<ReactCatalogComponent>` verwenden.
