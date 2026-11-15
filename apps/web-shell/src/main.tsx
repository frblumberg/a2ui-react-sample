import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {injectBasicCatalogStyles} from '@a2ui/web_core/v0_9/basic_catalog';
import {App} from './App';
import './styles.css';

// Basis-Styles der A2UI-Komponenten; Marken-Tokens überschreiben die CSS-Variablen.
injectBasicCatalogStyles();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
