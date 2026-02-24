import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameEndDisplay } from '../GameEndDisplay';
import type { Team } from '@/types';

// Helper to create mock teams
const createMockTeam = (
  id: string,
  name: string,
  score: number,
  tableNumber: number
): Team => ({
  id,
  name,
  score,
  tableNumber,
  roundScores: [],
});

describe('GameEndDisplay', () => {
  describe('game over header', () => {
    it('should display "Game Over" heading', () => {
      const teams = [createMockTeam('team-1', 'Winner', 50, 1)];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Game Over')).toBeInTheDocument();
    });

    it('should have bold heading text', () => {
      const teams = [createMockTeam('team-1', 'Winner', 50, 1)];

      render(<GameEndDisplay teams={teams} />);

      const heading = screen.getByText('Game Over');
      expect(heading).toHaveClass('font-bold');
      // Font sizing uses inline clamp() for audience display
      expect(heading.tagName).toBe('H1');
    });
  });

  describe('winner display', () => {
    it('should display the winner name', () => {
      const teams = [
        createMockTeam('team-1', 'Champion Team', 100, 1),
        createMockTeam('team-2', 'Second Place', 80, 2),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Champion Team')).toBeInTheDocument();
    });

    it('should display WINNER label', () => {
      const teams = [createMockTeam('team-1', 'The Champions', 100, 1)];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('WINNER')).toBeInTheDocument();
    });

    it('should display winner score', () => {
      const teams = [createMockTeam('team-1', 'Winner', 150, 1)];

      render(<GameEndDisplay teams={teams} />);

      // Score is rendered by AnimatedScore component (separate from "points" label)
      expect(screen.getByText('150')).toBeInTheDocument();
      // "points" is rendered as a visible <p> element
      const pointsElements = screen.getAllByText('points');
      expect(pointsElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display crown SVG icon (not emoji)', () => {
      const teams = [createMockTeam('team-1', 'Winner', 100, 1)];

      const { container } = render(<GameEndDisplay teams={teams} />);

      // Component uses SVG crown, not trophy emoji
      const svg = container.querySelector('svg[aria-hidden="true"]');
      expect(svg).toBeInTheDocument();
    });

    it('should highlight winner with team color styling', () => {
      const teams = [createMockTeam('team-1', 'Winner', 100, 1)];

      const { container } = render(<GameEndDisplay teams={teams} />);

      // Winner card uses inline border + box-shadow with team colors
      // Note: JSDOM drops border values containing clamp(), so we check box-shadow instead
      const winnerArticle = container.querySelector('[role="article"][aria-label*="Winner"]');
      expect(winnerArticle).toBeInTheDocument();
      expect(winnerArticle?.getAttribute('style')).toContain('box-shadow');
    });
  });

  describe('runners up (2nd and 3rd place)', () => {
    it('should display second place team', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second Place Team', 80, 2),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Second Place Team')).toBeInTheDocument();
    });

    it('should display third place team', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third Place Team', 60, 3),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Third Place Team')).toBeInTheDocument();
    });

    it('should show scores for runners up', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
      ];

      render(<GameEndDisplay teams={teams} />);

      // Scores rendered by AnimatedScore
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('should display rank labels for 2nd and 3rd', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
      ];

      render(<GameEndDisplay teams={teams} />);

      // Component uses uppercase rank labels
      expect(screen.getByText('2ND')).toBeInTheDocument();
      expect(screen.getByText('3RD')).toBeInTheDocument();
    });

    it('should style 2nd place article with aria-label', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
      ];

      const { container } = render(<GameEndDisplay teams={teams} />);

      const secondPlace = container.querySelector('[aria-label*="2nd place"]');
      expect(secondPlace).toBeInTheDocument();
    });

    it('should style 3rd place article with aria-label', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
      ];

      const { container } = render(<GameEndDisplay teams={teams} />);

      const thirdPlace = container.querySelector('[aria-label*="3rd place"]');
      expect(thirdPlace).toBeInTheDocument();
    });
  });

  describe('other participants (4th place and beyond)', () => {
    it('should display "Other Participants" header when more than 3 teams', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
        createMockTeam('team-4', 'Fourth', 40, 4),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Other Participants')).toBeInTheDocument();
    });

    it('should display 4th place team', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
        createMockTeam('team-4', 'Fourth Place Team', 40, 4),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Fourth Place Team')).toBeInTheDocument();
    });

    it('should display all teams beyond 3rd place', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
        createMockTeam('team-4', 'Fourth', 40, 4),
        createMockTeam('team-5', 'Fifth', 20, 5),
        createMockTeam('team-6', 'Sixth', 10, 6),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Fourth')).toBeInTheDocument();
      expect(screen.getByText('Fifth')).toBeInTheDocument();
      expect(screen.getByText('Sixth')).toBeInTheDocument();
    });

    it('should show rank numbers for other participants', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
        createMockTeam('team-4', 'Fourth', 40, 4),
        createMockTeam('team-5', 'Fifth', 20, 5),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('4.')).toBeInTheDocument();
      expect(screen.getByText('5.')).toBeInTheDocument();
    });

    it('should show scores for other participants', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
        createMockTeam('team-4', 'Fourth', 40, 4),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('should not show "Other Participants" when only 3 or fewer teams', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
        createMockTeam('team-3', 'Third', 60, 3),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.queryByText('Other Participants')).not.toBeInTheDocument();
    });
  });

  describe('no teams', () => {
    it('should show message when no teams', () => {
      render(<GameEndDisplay teams={[]} />);

      expect(screen.getByText('No teams participated')).toBeInTheDocument();
    });

    it('should not show winner section when no teams', () => {
      render(<GameEndDisplay teams={[]} />);

      expect(screen.queryByText('WINNER')).not.toBeInTheDocument();
    });
  });

  describe('ties handling', () => {
    it('should display tied teams correctly', () => {
      const teams = [
        createMockTeam('team-1', 'Team A', 100, 1),
        createMockTeam('team-2', 'Team B', 100, 2), // Tied for first
      ];

      render(<GameEndDisplay teams={teams} />);

      // Both teams should be displayed
      expect(screen.getByText('Team A')).toBeInTheDocument();
      expect(screen.getByText('Team B')).toBeInTheDocument();
    });

    it('should show first team as winner when tied', () => {
      const teams = [
        createMockTeam('team-1', 'First Winner', 100, 1),
        createMockTeam('team-2', 'Second Winner', 100, 2),
      ];

      render(<GameEndDisplay teams={teams} />);

      // First team in array should be shown as winner
      const winnerSection = screen.getByText('WINNER').closest('div');
      expect(winnerSection).toBeInTheDocument();
    });
  });

  describe('thank you message', () => {
    it('should display thank you message', () => {
      const teams = [createMockTeam('team-1', 'Winner', 100, 1)];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText(/Thanks for playing/)).toBeInTheDocument();
    });
  });

  describe('final standings', () => {
    it('should display complete standings in order', () => {
      const teams = [
        createMockTeam('team-1', 'Gold', 100, 1),
        createMockTeam('team-2', 'Silver', 80, 2),
        createMockTeam('team-3', 'Bronze', 60, 3),
        createMockTeam('team-4', 'Fourth', 40, 4),
      ];

      render(<GameEndDisplay teams={teams} />);

      // All teams should be visible
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Silver')).toBeInTheDocument();
      expect(screen.getByText('Bronze')).toBeInTheDocument();
      expect(screen.getByText('Fourth')).toBeInTheDocument();
    });
  });

  describe('layout and animations', () => {
    it('should use framer-motion for animations', () => {
      const teams = [createMockTeam('team-1', 'Winner', 100, 1)];

      const { container } = render(<GameEndDisplay teams={teams} />);

      // Uses motion.div with role="article" for animated cards
      const articles = container.querySelectorAll('[role="article"]');
      expect(articles.length).toBeGreaterThanOrEqual(1);
    });

    it('should fill available height', () => {
      const teams = [createMockTeam('team-1', 'Winner', 100, 1)];

      const { container } = render(<GameEndDisplay teams={teams} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('h-full');
    });

    it('should have region role with aria-label', () => {
      const teams = [createMockTeam('team-1', 'Winner', 100, 1)];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByRole('region', { name: 'Final game results' })).toBeInTheDocument();
    });
  });

  describe('single team', () => {
    it('should handle single team correctly', () => {
      const teams = [createMockTeam('team-1', 'Only Team', 50, 1)];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Only Team')).toBeInTheDocument();
      expect(screen.getByText('WINNER')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should not show runners up section with single team', () => {
      const teams = [createMockTeam('team-1', 'Only Team', 50, 1)];

      const { container } = render(<GameEndDisplay teams={teams} />);

      // No 2nd or 3rd place articles
      expect(container.querySelector('[aria-label*="2nd place"]')).not.toBeInTheDocument();
      expect(container.querySelector('[aria-label*="3rd place"]')).not.toBeInTheDocument();
    });
  });

  describe('two teams', () => {
    it('should handle two teams correctly', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Second', 80, 2),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('should show 2nd place as runner up', () => {
      const teams = [
        createMockTeam('team-1', 'First', 100, 1),
        createMockTeam('team-2', 'Runner Up', 80, 2),
      ];

      render(<GameEndDisplay teams={teams} />);

      expect(screen.getByText('Runner Up')).toBeInTheDocument();
      expect(screen.getByText('2ND')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have screen reader announcement', () => {
      const teams = [createMockTeam('team-1', 'Winner', 100, 1)];

      render(<GameEndDisplay teams={teams} />);

      const srAnnouncement = screen.getByText(/Game over\. Winner: Winner with 100 points/);
      expect(srAnnouncement).toBeInTheDocument();
      expect(srAnnouncement).toHaveClass('sr-only');
    });

    it('should have aria-labels on podium articles', () => {
      const teams = [
        createMockTeam('team-1', 'Alpha', 100, 1),
        createMockTeam('team-2', 'Beta', 80, 2),
      ];

      const { container } = render(<GameEndDisplay teams={teams} />);

      expect(container.querySelector('[aria-label*="Winner: Alpha"]')).toBeInTheDocument();
      expect(container.querySelector('[aria-label*="2nd place: Beta"]')).toBeInTheDocument();
    });
  });
});
