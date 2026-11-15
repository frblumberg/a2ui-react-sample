---
name: new-ds-component
description: Fügt dem Marken-Katalog des A2UI-Samples eine neue Design-System-Komponente hinzu (Zod-Schema, React-Implementierung, Styles, Agenten-Helfer mit Fallback, Katalog-Export).
---

# Neue Design-System-Komponente

Argument: Name und Zweck, z. B. `/new-ds-component PriceTag – Preis mit Einheit und Hinweis`.
Vorlage: `StatusBanner` in `packages/brand-catalog/src/`.

## Schritte

1. **Vertrag** in `apis.ts`: `XyzApi = {name: 'Xyz', schema: z.object({...}).describe('…')}`.
   - Dynamische Werte mit `CommonSchemas.DynamicString` / `DynamicNumber` / `DynamicBoolean`, Aktionen mit
     `CommonSchemas.Action`, Kinder mit `CommonSchemas.ComponentId` bzw. `ChildList`.
   - Die `describe()`-Texte landen im Katalog-JSON und damit im Prompt eines LLM-Agenten: kurz sagen, wann die Komponente passt.
2. **React** in `components.tsx` über `createComponentImplementation(XyzApi, ({props}) => …)`.
   Marke nur über `useBrand()` und CSS-Variablen, nie fest verdrahtete Farben pro Marke.
3. **Styles** mit Präfix `ds-` in `apps/web-shell/src/styles.css`, nur über Tokens (`--a2ui-color-*`, `--brand-*`).
4. **Registrieren** in `catalog.ts` **und** `schema.ts` (beide Listen), Export in `index.ts`.
5. **Agenten-Helfer** in `services/agents/src/ui.ts` analog zu `statusBanner()`: Mit `BRAND_CATALOG_ID` die neue
   Komponente, sonst ein Fallback aus Basis-Komponenten.
6. `npm run catalog:export` und einen Test in `tests/agents.test.ts`, der die Komponente durch den Processor schickt.
7. Skill `verify` ausführen.

Hinweis: iOS und Android müssen dieselbe Komponente mit identischem Schema nachbauen. Schema-Änderungen sind
Breaking Changes für alle Renderer → Katalog-ID versionieren.
