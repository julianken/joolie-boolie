// packages/ui/src/motion/presets.ts
// Shared spring presets for Hosted Game Night design system.
// See FINAL-DESIGN-PLAN.md Part 1 section 1.14.

/** Smooth, no bounce -- UI panels, modals, drawers */
export const springSmooth = { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 };

/** Gentle bounce -- entering cards, list items */
export const springGentle = { type: "spring" as const, stiffness: 100, damping: 15, mass: 1 };

/** High-energy bounce -- celebrations, reveals */
export const springBouncy = { type: "spring" as const, stiffness: 100, damping: 8, mass: 1 };

/** Quick and snappy -- toggles, checkboxes */
export const springSnappy = { type: "spring" as const, stiffness: 200, damping: 20, mass: 0.5 };

/** Heavy/lethargic -- large panels, page transitions */
export const springHeavy = { type: "spring" as const, stiffness: 100, damping: 15, mass: 5 };

/** Micro UI -- hover lift, button press */
export const springMicro = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 };

/** Responsive -- standard interactive transitions */
export const springResponsive = { type: "spring" as const, stiffness: 300, damping: 25, mass: 1.0 };

/** Dialog entrance */
export const springDialog = { type: "spring" as const, stiffness: 260, damping: 22, mass: 1.0 };

/** Notification entrance */
export const springNotification = { type: "spring" as const, stiffness: 350, damping: 28, mass: 0.7 };
