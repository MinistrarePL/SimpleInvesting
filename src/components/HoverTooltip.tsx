import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShowHoverPortalTooltips } from '../lib/pointerPreference';

/** Hover + portal nad body; na touch / mobile tylko `children` (bez portalu — unikamy „zacinania”). */
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
  const showPortal = useShowHoverPortalTooltips();
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
    if (!showPortal || !open) {
      setCoords(null);
      return;
    }
    reposition();
    const id = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(id);
  }, [showPortal, open, reposition]);

  useEffect(() => {
    if (!showPortal || !open) return;
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [showPortal, open, reposition]);

  if (!showPortal) {
    return <span className={className ?? 'inline-flex shrink-0'}>{children}</span>;
  }

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
