/**
 * Trivia-specific Motion animation presets.
 *
 * All Motion library animations must check useReducedMotion() and pass
 * `transition={{ duration: 0 }}` and empty animate when reduced motion is on.
 * The global CSS rule handles CSS animations; this file handles Motion ones.
 *
 * See FINAL-DESIGN-PLAN.md Part 6 section 6.3 and Part 9 section 9.7.
 */

/** Hero question entrance: quick overshoot slide-up */
export const springQuestionReveal = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 20,
  mass: 0.5,
};

/** Answer option reveal: mid-weight spring for color transitions */
export const springAnswerReveal = {
  type: 'spring' as const,
  stiffness: 150,
  damping: 18,
  mass: 0.8,
};

/** Score rolling counter animation */
export const springScoreRoll = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 15,
  mass: 1,
};

/** Scene-to-scene transition: heavier spring for larger panels */
export const springSceneTransition = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 20,
  mass: 1.2,
};

/** Winner / podium card entrance: bouncy reveal */
export const springPodium = {
  type: 'spring' as const,
  stiffness: 140,
  damping: 16,
  mass: 0.9,
};

/**
 * Motion variants for question hero entrance.
 * Usage: <motion.div variants={questionReveal} initial="hidden" animate="visible" />
 */
export const questionReveal = {
  hidden:  { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1 },
};

/**
 * Stagger container for answer options.
 * Usage: <motion.div variants={answerOptionStagger} initial="hidden" animate="visible" />
 */
export const answerOptionStagger = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

/** Individual answer option entrance variant */
export const answerOption = {
  hidden:  { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1 },
};

/**
 * Stagger container for scoreboard rows.
 * Usage: <motion.div variants={scoreboardRowStagger} initial="hidden" animate="visible" />
 */
export const scoreboardRowStagger = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

/** Individual scoreboard row entrance variant */
export const scoreboardRow = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0 },
};

/** Round transition overlay container */
export const roundTransitionContainer = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.4,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4 },
  },
};

/** Individual child in round transition overlay */
export const roundTransitionChild = {
  hidden:  { opacity: 0, y: 40, scale: 0.92 },
  visible: { opacity: 1, y: 0,  scale: 1 },
};

/** Winner card dramatic entrance */
export const winnerCard = {
  hidden:  { opacity: 0, scale: 0.85, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springPodium,
  },
};

/** 2nd / 3rd place flanking cards */
export const podiumCard = {
  hidden:  { opacity: 0, scale: 0.9, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springAnswerReveal,
  },
};
