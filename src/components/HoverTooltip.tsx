import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Ten sam wizualnie co PreciseHoverTip przy komórkach tabeli; tylko mysz — bez dodatkowej zatrzymki tabulatora. */
export default function HoverTooltip({
  tooltip,
  className,
  children,
}: {
  tooltip: string;
  /** Na anchor (np. `inline-flex shrink-0` żeby obejąć przyciski w headerze). */
  className?: string;
  children: React.ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const reposition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    reposition();
    const id = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(id);
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  return (
    <>
      <span
        ref={anchorRef}
        className={className ?? 'inline-flex shrink-0'}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </span>
      {typeof document !== 'undefined' &&
        open &&
        coords &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[220] max-w-xs rounded-md border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-medium text-theme-text shadow-lg text-center leading-snug"
            style={{ top: coords.top, left: coords.left, transform: 'translateX(-50%)' }}
          >
            {tooltip}
          </span>,
          document.body,
        )}
    </>
  );
}
