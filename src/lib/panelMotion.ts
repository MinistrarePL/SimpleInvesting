/** Shared motion for slide-in overlays (backdrop + drawer). */
export const SLIDE_PANEL_EASE_CLASS = '[transition-timing-function:cubic-bezier(0.33,1,0.68,1)]';
export const SLIDE_PANEL_DURATION_MS = 480;

export const drawerMotionClasses =
  `will-change-transform transition-transform duration-[480ms] ${SLIDE_PANEL_EASE_CLASS}`;

export const overlayMotionClasses =
  `transition-opacity duration-[480ms] ${SLIDE_PANEL_EASE_CLASS}`;
