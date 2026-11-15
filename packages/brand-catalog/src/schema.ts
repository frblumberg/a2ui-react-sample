import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog} from '@a2ui/web_core/v0_9/basic_catalog';
import {BRAND_CATALOG_ID} from '@sample/shared';
import {BrandHeaderApi, StatusBannerApi} from './apis';

/**
 * Schema-only-Variante des Marken-Katalogs (ohne React) – für Server,
 * Katalog-Registry und den System-Prompt eines LLM-Agenten.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const brandCatalogSchema = new Catalog<any>(
  BRAND_CATALOG_ID,
  'v0.9',
  [...basicCatalog.components.values(), BrandHeaderApi, StatusBannerApi],
  [...basicCatalog.functions.values()],
);
