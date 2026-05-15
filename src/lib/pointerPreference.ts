import { useEffect, useState } from 'react';

/** Tooltipi hover w portalu tylko na desktopie — na touch są problematyczne (zacinają się). Startujemy od `false`, żeby SSR === pierwszy render klienta (brak hydration mismatch). */
export function useShowHoverPortalTooltips(): boolean {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const mqW = window.matchMedia('(min-width: 768px)');
    const mqHover = window.matchMedia('(hover: hover)');
    const mqFine = window.matchMedia('(pointer: fine)');

    const sync = () => setOk(mqW.matches && mqHover.matches && mqFine.matches);
    sync();

    mqW.addEventListener('change', sync);
    mqHover.addEventListener('change', sync);
    mqFine.addEventListener('change', sync);
    return () => {
      mqW.removeEventListener('change', sync);
      mqHover.removeEventListener('change', sync);
      mqFine.removeEventListener('change', sync);
    };
  }, []);

  return ok;
}

/** Tailwind `md` — przy max-width<768px uproszczamy UI (bez hover-portali itd.). Startujemy od `false` dla spójności z SSR. */
export function useIsMdBreakpointUp(): boolean {
  const [up, setUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setUp(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return up;
}
