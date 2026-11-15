import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Zwei Design-System-Komponenten, die es im A2UI-Basiskatalog nicht gibt.
 * Das Zod-Schema ist der Vertrag mit dem Agenten – unabhängig davon, ob
 * Web (React), iOS (SwiftUI) oder Android (Compose) sie rendert.
 */

export const BrandHeaderApi = {
  name: 'BrandHeader',
  schema: z
    .object({
      title: CommonSchemas.DynamicString,
      subtitle: CommonSchemas.DynamicString.optional(),
    })
    .describe('Kopfzeile einer Karte im Look der aktuellen Marke. Titel plus optionale Unterzeile.'),
};

export const StatusBannerApi = {
  name: 'StatusBanner',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      tone: z.enum(['info', 'success', 'warning']).optional(),
    })
    .describe('Hinweis- oder Erfolgsmeldung. tone=warning nur für Fehler oder nötige Bestätigungen.'),
};
