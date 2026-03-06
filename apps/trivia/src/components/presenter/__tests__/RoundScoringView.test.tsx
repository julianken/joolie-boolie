import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RoundScoringView } from '../RoundScoringView';
import { useGameStore } from '@/stores/game-store';
import { resetGameStore } from '@/test/helpers/store';

// Mock uuid for predictable values
const mockUuidCounter = vi.hoisted(() => ({ value: 0 }));
vi.mock('uuid', () => ({
  v4: vi.fn(() => `mock-uuid-${++mockUuidCounter.value}`),
}));

describe('RoundScoringView', () => {
  beforeEach(() => {
    resetGameStore();
    mockUuidCounter.value = 0;
  });

  function setupRoundScoringState() {
    const store = useGameStore.getState();
    store.addTeam('Alpha');
    store.addTeam('Bravo');
    store.addTeam('Charlie');
    store.startGame();

    // Give teams some scores
    const teams = useGameStore.getState().teams;
    store.adjustTeamScore(teams[0].id, 5); // Alpha: 5
    store.adjustTeamScore(teams[1].id, 10); // Bravo: 10
    store.adjustTeamScore(teams[2].id, 3); // Charlie: 3

    // Set round_scoring scene
    useGameStore.setState({
      status: 'between_rounds',
      audienceScene: 'round_scoring',
    });
  }

  it('renders standings with team names and scores', () => {
    setupRoundScoringState();
    render(<RoundScoringView />);

    // Check header
    expect(screen.getByText('Round 1 Scoring')).toBeInTheDocument();
    expect(screen.getByText('Round 1 of 3')).toBeInTheDocument();

    // Check standings section
    const standingsSection = screen.getByRole('region', { name: 'Current standings' });
    expect(standingsSection).toBeInTheDocument();

    // Check team names are present
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders team rankings in sorted order', () => {
    setupRoundScoringState();
    render(<RoundScoringView />);

    const rankings = screen.getByRole('list', { name: 'Team rankings' });
    const items = within(rankings).getAllByRole('listitem');

    // Bravo (10) should be first, Alpha (5) second, Charlie (3) third
    expect(items[0]).toHaveTextContent('Bravo');
    expect(items[0]).toHaveTextContent('10');
    expect(items[1]).toHaveTextContent('Alpha');
    expect(items[1]).toHaveTextContent('5');
    expect(items[2]).toHaveTextContent('Charlie');
    expect(items[2]).toHaveTextContent('3');
  });

  it('renders questions with correct answers', () => {
    setupRoundScoringState();
    render(<RoundScoringView />);

    // Check questions section exists
    const questionsSection = screen.getByRole('region', { name: /Round 1 questions and answers/i });
    expect(questionsSection).toBeInTheDocument();

    // Check that question text is rendered
    const questionsList = screen.getByRole('list', { name: 'Questions with correct answers' });
    const questionItems = within(questionsList).getAllByRole('listitem');

    // Default sample questions have 5 per round
    expect(questionItems.length).toBeGreaterThan(0);

    // Each question should have an "Answer:" label
    const answerLabels = screen.getAllByText('Answer:');
    expect(answerLabels.length).toBe(questionItems.length);
  });

  it('shows empty state when no questions exist', () => {
    setupRoundScoringState();
    useGameStore.setState({ questions: [] });

    render(<RoundScoringView />);

    expect(screen.getByText('No questions in this round.')).toBeInTheDocument();
  });

  it('renders correct round number for later rounds', () => {
    setupRoundScoringState();
    useGameStore.setState({ currentRound: 2 });

    render(<RoundScoringView />);

    expect(screen.getByText('Round 3 Scoring')).toBeInTheDocument();
    expect(screen.getByText('Round 3 of 3')).toBeInTheDocument();
  });
});
