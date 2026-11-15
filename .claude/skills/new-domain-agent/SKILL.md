---
name: new-domain-agent
description: Legt einen neuen Fach-Agenten im A2UI-Sample an (z. B. Störung melden, Abschlag ändern) – mit Surface, Actions, Text-Fallback, Routing und Tests.
---

# Neuen Fach-Agenten anlegen

Argument: Anliegen des Agenten, z. B. `/new-domain-agent Störung melden`. Vorlage: `services/agents/src/agents/meterAgent.ts`.

## Schritte

1. **Tools:** Fehlende Systemzugriffe als Mock in `services/agents/src/mcp/tools.ts` ergänzen (Interface `Tools`
   und `createMockTools()`). Namen im Stil `system.verb` (z. B. `outage.report`), Signatur wie ein MCP-Tool:
   ein Argument-Objekt rein, Promise mit Ergebnis raus.
2. **Agent:** `services/agents/src/agents/<name>Agent.ts` mit `DomainAgent` (`name`, `description`, `onText`, `onAction`).
   - Tools nur über `yield* callTool(ctx, …)` aufrufen (erzeugt Trace-Events).
   - `ctx.catalogId === null` → nur Text antworten (`say()`), ggf. `ctx.session.awaitingTextFor` setzen.
   - Surface: `ctx.newSurfaceId()`, `ctx.session.surfaceOwner.set(sid, NAME)`, dann `createSurface` →
     `updateComponents` → `updateDataModel` über die Builder aus `ui.ts`. Genau eine Komponente mit `id: 'root'`.
   - Eingaben mit `checks` (siehe `checks.required`/`checks.regex`), dieselben Checks auch an den Absende-Button.
   - In `onAction` jeden Wert erneut prüfen. Verbindliche Aktionen nur nach Bestätigungsschritt.
3. **Routing:** Agent in `Orchestrator.agents` eintragen und `classifyIntent()` um Schlüsselwörter erweitern.
   Falls sinnvoll, einen Button im Hilfe-Surface (`help()`) ergänzen.
4. **Web-Shell:** Optional einen Vorschlag in `SUGGESTIONS` (`apps/web-shell/src/App.tsx`) ergänzen.
5. **Tests** in `tests/agents.test.ts` (Datei hat bereits `@vitest-environment jsdom`):
   - Surface wird vom offiziellen Processor akzeptiert (`render(msgs)`)
   - Basiskatalog ohne Marken-Komponenten, Text-Modus ohne Katalog
   - Action-Pfade inkl. ungültiger Eingaben
6. Skill `verify` ausführen.
