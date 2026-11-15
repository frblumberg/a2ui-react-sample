import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog} from '@a2ui/web_core/v0_9/basic_catalog';
import {BRAND_CATALOG_ID} from '@sample/shared';
import {BrandHeader, StatusBanner} from './components';

/**
 * Marken-Katalog = Basiskatalog + eigene Design-System-Komponenten.
 * Der Client meldet diese ID in seinen Capabilities; der Agent nutzt
 * BrandHeader/StatusBanner nur, wenn er diesen Katalog ausgehandelt hat.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const brandCatalog = new Catalog<any>(
  BRAND_CATALOG_ID,
  'v0.9',
  [...basicCatalog.components.values(), BrandHeader, StatusBanner],
  [...basicCatalog.functions.values()],
);

export {basicCatalog};
