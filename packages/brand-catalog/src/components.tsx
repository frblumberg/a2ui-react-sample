import {createComponentImplementation} from '@a2ui/react/v0_9';
import {BrandHeaderApi, StatusBannerApi} from './apis';
import {useBrand} from './brands';

/**
 * React-Implementierungen der Design-System-Komponenten.
 * Der Vertrag mit dem Agenten (Schema) liegt in ./apis.ts.
 */

export const BrandHeader = createComponentImplementation(BrandHeaderApi, ({props}) => {
  const brand = useBrand();
  return (
    <div className="ds-brand-header">
      <span className="ds-brand-header__mark" aria-hidden="true" />
      <div>
        <div className="ds-brand-header__eyebrow">{brand.name}</div>
        <div className="ds-brand-header__title">{props.title}</div>
        {props.subtitle ? <div className="ds-brand-header__subtitle">{props.subtitle}</div> : null}
      </div>
    </div>
  );
});

const ICON: Record<string, string> = {info: 'ℹ', success: '✓', warning: '!'};

export const StatusBanner = createComponentImplementation(StatusBannerApi, ({props}) => {
  const tone = props.tone ?? 'info';
  return (
    <div className={`ds-status ds-status--${tone}`} role={tone === 'warning' ? 'alert' : 'status'}>
      <span className="ds-status__icon" aria-hidden="true">{ICON[tone]}</span>
      <span>{props.text}</span>
    </div>
  );
});
