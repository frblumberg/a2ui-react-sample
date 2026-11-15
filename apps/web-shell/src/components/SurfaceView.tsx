import {A2uiSurface, type ReactCatalogComponent} from '@a2ui/react/v0_9';
import type {MessageProcessor} from '@a2ui/web_core/v0_9';

/** Rendert eine vom Agenten erzeugte Surface mit unseren Katalog-Komponenten. */
export function SurfaceView({processor, surfaceId}: {processor: MessageProcessor<ReactCatalogComponent>; surfaceId: string}) {
  const surface = processor.getSurface(surfaceId);
  if (!surface) return null;
  return (
    <div className="surface" data-surface-id={surfaceId}>
      <A2uiSurface surface={surface} />
    </div>
  );
}
