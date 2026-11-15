import {createContext, useContext} from 'react';

/**
 * Marken-Tokens. Im echten Projekt kämen diese Werte aus dem
 * Multi-Brand Design System (z. B. als generierte Token-Datei).
 *
 * Entscheidung im Sample: EIN Katalog für alle Marken, die Marke wird
 * ausschließlich über Tokens (CSS-Variablen) gesetzt. Der Agent weiß
 * nicht, welche Marke der Client gerade zeigt.
 */
export interface Brand {
  id: string;
  name: string;
  claim: string;
  tokens: Record<string, string>;
}

export const brands: Record<string, Brand> = {
  enbw: {
    id: 'enbw',
    name: 'EnBW',
    claim: 'Energie auf bequeme Weise.',
    tokens: {
      '--a2ui-color-primary': '#005ca9',
      '--a2ui-color-primary-hover': '#004d8c',
      '--a2ui-color-primary-dark': '#003b70',
      '--a2ui-color-primary-light': '#eaf3fa',
      '--a2ui-color-on-primary': '#ffffff',
      '--a2ui-color-secondary': '#f28c28',
      '--a2ui-color-on-secondary': '#1b2631',
      '--a2ui-color-surface': '#ffffff',
      '--a2ui-color-on-surface': '#182b3a',
      '--a2ui-color-background': '#f4f7fa',
      '--a2ui-color-on-background': '#182b3a',
      '--a2ui-color-border': '#d5e0ea',
      '--a2ui-border-radius': '8px',
      '--brand-accent': '#f28c28',
      '--brand-name': '"EnBW"',
      '--brand-mark-background': 'linear-gradient(135deg, #005ca9 0 68%, #f28c28 68%)',
      '--brand-mark-radius': '4px',
      '--brand-font': '"Avenir Next", "Segoe UI", sans-serif',
    },
  },
  yello: {
    id: 'yello',
    name: 'Yello',
    claim: 'Mehr als Strom: gute Energie.',
    tokens: {
      '--a2ui-color-primary': '#f7d600',
      '--a2ui-color-primary-hover': '#e8c800',
      '--a2ui-color-primary-dark': '#181818',
      '--a2ui-color-primary-light': '#fff6b8',
      '--a2ui-color-on-primary': '#181818',
      '--a2ui-color-secondary': '#181818',
      '--a2ui-color-on-secondary': '#ffe800',
      '--a2ui-color-surface': '#ffffff',
      '--a2ui-color-on-surface': '#181818',
      '--a2ui-color-background': '#fffdf0',
      '--a2ui-color-on-background': '#181818',
      '--a2ui-color-border': '#e3dca7',
      '--a2ui-border-radius': '18px',
      '--brand-accent': '#181818',
      '--brand-name': '"Yello"',
      '--brand-mark-background': '#ffe800',
      '--brand-mark-radius': '50%',
      '--brand-font': '"Avenir Next", "Trebuchet MS", sans-serif',
    },
  },
};

export const BrandContext = createContext<Brand>(brands.enbw);
export const useBrand = () => useContext(BrandContext);
