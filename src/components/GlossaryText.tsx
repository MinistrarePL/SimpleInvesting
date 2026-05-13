import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getGlossaryDefinition, tokenizeWithGlossary, type GlossarySegment } from '../lib/glossary';

export interface GlossaryTextProps {
  text: string;
  lang: 'pl' | 'en';
}

const POPOVER_MAX_W = 280;
const POPOVER_MARGIN = 8;

export default function GlossaryText({ text, lang }: GlossaryTextProps) {
  const segments = useMemo(() => tokenizeWithGlossary(text), [text]);
  const [openSegmentIndex, setOpenSegmentIndex] = useState<number | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const baseId = useId().replace(/:/g, '');
  const popoverDomId = `${baseId}-popover`;

  const activeTermSeg =
    openSegmentIndex != null
      ? segments.find(
          (s): s is Extract<GlossarySegment, { kind: 'term' }> =>
            s.kind === 'term' && s.segmentIndex === openSegmentIndex
        )
      : undefined;
  const activeDef = activeTermSeg ? getGlossaryDefinition(activeTermSeg.termKey, lang) : null;
  const activeDescId = openSegmentIndex != null ? `${baseId}-def-${openSegmentIndex}` : undefined;

  const updatePosition = useCallback(() => {
    const btn = anchorRef.current;
    if (!btn || openSegmentIndex === null) {
      setPopoverPos(null);
      return;
    }
    const rect = btn.getBoundingClientRect();
    const popH = popoverRef.current?.offsetHeight ?? 140;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceAbove >= spaceBelow && spaceAbove > popH + POPOVER_MARGIN;

    let top = placeAbove ? rect.top - popH - POPOVER_MARGIN : rect.bottom + POPOVER_MARGIN;
    top = Math.max(POPOVER_MARGIN, Math.min(top, window.innerHeight - popH - POPOVER_MARGIN));

    const centerX = rect.left + rect.width / 2;
    let left = centerX - POPOVER_MAX_W / 2;
    left = Math.max(POPOVER_MARGIN, Math.min(left, window.innerWidth - POPOVER_MAX_W - POPOVER_MARGIN));

    setPopoverPos({ top, left });
  }, [openSegmentIndex]);

  useLayoutEffect(() => {
    if (openSegmentIndex === null || !activeDef) {
      setPopoverPos(null);
      return;
    }
    updatePosition();
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [updatePosition, openSegmentIndex, activeDef, lang, text]);

  useEffect(() => {
    if (openSegmentIndex === null) return;

    const onScrollOrResize = () => updatePosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [openSegmentIndex, updatePosition]);

  useEffect(() => {
    if (openSegmentIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpenSegmentIndex(null);
      anchorRef.current?.focus();
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [openSegmentIndex]);

  useEffect(() => {
    if (openSegmentIndex === null) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (anchorRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpenSegmentIndex(null);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [openSegmentIndex]);

  const portal =
    typeof document !== 'undefined' && openSegmentIndex != null && activeDef && popoverPos
      ? createPortal(
          <div
            ref={popoverRef}
            id={popoverDomId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${baseId}-title-${openSegmentIndex}`}
            aria-describedby={activeDescId}
            className="fixed z-[150] max-w-[280px] rounded-lg border border-theme-border bg-theme-surface p-3 shadow-xl"
            style={{
              top: popoverPos.top,
              left: popoverPos.left,
              width: POPOVER_MAX_W,
              maxHeight: 'min(40vh, 220px)',
              overflowY: 'auto',
            }}
          >
            <div id={`${baseId}-title-${openSegmentIndex}`} className="font-semibold text-theme-text text-sm">
              {activeDef.label}
            </div>
            <p id={activeDescId} className="mt-1 text-sm text-theme-text-muted leading-snug">
              {activeDef.definition}
            </p>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <React.Fragment key={`t-${i}`}>{seg.value}</React.Fragment>;
        }

        const isOpen = openSegmentIndex === seg.segmentIndex;
        const def = getGlossaryDefinition(seg.termKey, lang);
        if (!def) {
          return <React.Fragment key={`t-${i}`}>{seg.value}</React.Fragment>;
        }

        return (
          <button
            key={`term-${seg.segmentIndex}-${i}`}
            type="button"
            ref={isOpen ? anchorRef : undefined}
            className="text-theme-primary underline decoration-dotted underline-offset-2 hover:opacity-80 bg-transparent border-0 p-0 cursor-pointer font-inherit text-inherit inline"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-controls={isOpen ? popoverDomId : undefined}
            onClick={() => setOpenSegmentIndex((prev) => (prev === seg.segmentIndex ? null : seg.segmentIndex))}
          >
            {seg.value}
          </button>
        );
      })}
      {portal}
    </>
  );
}
