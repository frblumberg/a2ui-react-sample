---
name: a2ui-messages
description: Referenz für A2UI-v0.9-Nachrichten in diesem Projekt (createSurface, updateComponents, updateDataModel, action, Bindungen, Checks, List-Templates). Laden, wenn A2UI-JSON geschrieben, geprüft oder debuggt wird.
---

# A2UI v0.9 – Kurzreferenz für dieses Projekt

Maßgeblich sind die Schemas in `node_modules/@a2ui/web_core/src/v0_9/schemas/` und der Basiskatalog
(`basicCatalog.toJson()`). Im Zweifel dort nachsehen, nicht raten.

## Agent → Client

```json
{"version": "v0.9", "createSurface": {"surfaceId": "meter-1", "catalogId": "<Katalog-ID>", "sendDataModel": true}}
{"version": "v0.9", "updateComponents": {"surfaceId": "meter-1", "components": [
  {"id": "root", "component": "Card", "child": "col"},
  {"id": "col", "component": "Column", "children": ["title", "field"]},
  {"id": "title", "component": "Text", "text": {"path": "/title"}, "variant": "h3"},
  {"id": "field", "component": "TextField", "label": "Wert", "value": {"path": "/value"}, "variant": "number",
   "checks": [{"condition": {"call": "required", "args": {"value": {"path": "/value"}}}, "message": "Pflichtfeld"}]}
]}}
{"version": "v0.9", "updateDataModel": {"surfaceId": "meter-1", "path": "/", "value": {"title": "…", "value": ""}}}
{"version": "v0.9", "deleteSurface": {"surfaceId": "meter-1"}}
```

- `components` ist flach. Beziehungen nur über IDs (`child`, `children`). Genau eine Komponente heißt `root`.
- `updateComponents` ersetzt Komponenten mit gleicher ID (Upsert). Um etwas „zu entfernen“, den Eltern-Container mit neuer
  `children`-Liste schicken.
- Bindungen: absolut `{"path": "/a/b"}`, in List-Templates relativ `{"path": "name"}`.
- List-Template: `{"component": "List", "children": {"path": "/items", "componentId": "item-tpl"}}`.
- Button: `{"component": "Button", "child": "<Text-ID>", "variant": "primary|default|borderless",
  "action": {"event": {"name": "doIt", "context": {"id": {"path": "id"}}}}}`. Checks am Button sperren ihn.
- Basis-Funktionen für `checks`: `required`, `regex` (`pattern`), `length`, `numeric` (`min`/`max`), `email`,
  `and`, `or`, `not`. Formatierung: `formatString`, `formatNumber`, `formatCurrency`, `formatDate`.

## Client → Agent

```json
{"version": "v0.9", "action": {"name": "doIt", "surfaceId": "meter-1", "sourceComponentId": "submit",
  "timestamp": "2026-11-15T18:00:00Z", "context": {"id": "…"}}}
```

Im Sample schickt die Web-Shell das als `TurnInput` `{type: 'action', action, dataModel?}` ans Gateway.

## Katalog-Aushandlung

Der Client meldet `{"v0.9": {"supportedCatalogIds": [...]}}`. Der Orchestrator nimmt den ersten Treffer aus
`CATALOG_PREFERENCE` (Marken-Katalog vor Basiskatalog), sonst `null` → nur Text.

## Unterschiede zu 1.0 (nicht verwenden, nur zur Einordnung)

1.0 nutzt `"version": "1.0"`, `{"@path": …}`/`{"@call": …}`, `@checks` und Function-RPC-Nachrichten.
Eine Migration betrifft vor allem `services/agents/src/ui.ts` und die `v0_9`-Importe.
