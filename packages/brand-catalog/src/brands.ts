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
  'marke-a': {
    id: 'marke-a',
    name: 'Marke A',
    claim: 'Energie, einfach erledigt.',
    tokens: {
      '--a2ui-color-primary': '#0a7f5a',
      '--a2ui-color-primary-hover': '#086a4b',
      '--a2ui-color-primary-dark': '#065a40',
      '--a2ui-color-primary-light': '#e3f4ec',
      '--a2ui-color-on-primary': '#ffffff',
      '--a2ui-color-secondary': '#f2c94c',
      '--a2ui-color-on-secondary': '#1d1d1f',
      '--a2ui-color-surface': '#ffffff',
      '--a2ui-color-on-surface': '#1b2a24',
      '--a2ui-color-background': '#f6faf8',
      '--a2ui-color-on-background': '#1b2a24',
      '--a2ui-color-border': '#cfe3da',
      '--a2ui-border-radius': '14px',
      '--brand-accent': '#f2c94c',
      '--brand-font': '"Segoe UI", system-ui, sans-serif',
    },
  },
  'marke-b': {
    id: 'marke-b',
    name: 'Marke B',
    claim: 'Dein Stadtwerk. Digital.',
    tokens: {
      '--a2ui-color-primary': '#1f4fd1',
      '--a2ui-color-primary-hover': '#1a42b0',
      '--a2ui-color-primary-dark': '#163793',
      '--a2ui-color-primary-light': '#e6edff',
      '--a2ui-color-on-primary': '#ffffff',
      '--a2ui-color-secondary': '#ff7a45',
      '--a2ui-color-on-secondary': '#ffffff',
      '--a2ui-color-surface': '#ffffff',
      '--a2ui-color-on-surface': '#15203a',
      '--a2ui-color-background': '#f5f7fc',
      '--a2ui-color-on-background': '#15203a',
      '--a2ui-color-border': '#d5ddf2',
      '--a2ui-border-radius': '6px',
      '--brand-accent': '#ff7a45',
      '--brand-font': 'Georgia, "Times New Roman", serif',
    },
  },
};

export const BrandContext = createContext<Brand>(brands['marke-a']);
export const useBrand = () => useContext(BrandContext);
