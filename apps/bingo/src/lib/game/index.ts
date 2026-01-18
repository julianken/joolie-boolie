// Ball deck functions
export {
  fisherYatesShuffle,
  getColumnForNumber,
  createBall,
  generateAllBalls,
  createDeck,
  drawBall,
  undoDraw,
  getBallsByColumn,
  getRemainingCount,
  getDrawnCount,
} from './ball-deck';

// State machine
export {
  type GameAction,
  canTransition,
  getNextStatus,
  transition,
  getValidActions,
  canCallBall as canCallBallStatus,
  canPause as canPauseStatus,
  canResume as canResumeStatus,
  canStart as canStartStatus,
  isGameActive,
} from './state-machine';

// Game engine (pure state transition functions)
export {
  DEFAULT_AUTO_CALL_SPEED,
  MIN_AUTO_CALL_SPEED,
  MAX_AUTO_CALL_SPEED,
  createInitialState,
  startGame,
  callNextBall,
  undoLastCall,
  pauseGame,
  resumeGame,
  endGame,
  resetGame,
  setPattern,
  setAutoCallEnabled,
  setAutoCallSpeed,
  setAudioEnabled,
  // Selectors
  getBallsRemaining,
  getBallsCalled,
  canUndoCall,
  canCallBall,
  canStartGame,
  canPauseGame,
  canResumeGame,
  getRecentBalls,
  isBallCalled,
} from './engine';

// Patterns (re-export from patterns module)
export {
  patternRegistry,
  createPattern,
  initializePatterns,
  allPatterns,
  // Pattern categories
  linePatterns,
  cornerPatterns,
  framePatterns,
  shapePatterns,
  letterPatterns,
  coveragePatterns,
  comboPatterns,
  // Validators
  cell,
  row,
  column,
  diagonalDown,
  diagonalUp,
  combineCells,
  isFreeSpace,
  validateCells,
} from './patterns';
