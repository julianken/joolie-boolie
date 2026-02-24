import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudienceScoreboard } from '../AudienceScoreboard';
import type { Team, TeamId } from '@/types';

// Helper to create mock teams
const createMockTeam = (
  id: string,
  name: string,
  score: number,
  tableNumber: number
): Team => ({
  id: id as TeamId,
  name,
  score,
  tableNumber,
  roundScores: [],
});

describe('AudienceScoreboard', () => {
  const defaultProps = {
    teams: [],
    currentRound: 0,
    totalRounds: 3,
  };

  describe('rendering', () => {
    it('should show round complete message', () => {
      render(<AudienceScoreboard {...defaultProps} currentRound={0} />);

      expect(screen.getByText('Round 1 Complete!')).toBeInTheDocument();
    });

    it('should show remaining rounds count', () => {
      render(
        <AudienceScoreboard {...defaultProps} currentRound={0} totalRounds={3} />
      );

      expect(screen.getByText('2 rounds remaining')).toBeInTheDocument();
    });

    it('should show singular "round" when 1 remaining', () => {
      render(
        <AudienceScoreboard {...defaultProps} currentRound={1} totalRounds={3} />
      );

      expect(screen.getByText('1 round remaining')).toBeInTheDocument();
    });

    it('should show "No teams yet" when empty', () => {
      render(<AudienceScoreboard {...defaultProps} />);

      expect(screen.getByText('No teams yet')).toBeInTheDocument();
    });
  });

  describe('final round', () => {
    it('should show "Final Round Complete!" for last round', () => {
      render(
        <AudienceScoreboard {...defaultProps} currentRound={2} totalRounds={3} />
      );

      expect(screen.getByText('Final Round Complete!')).toBeInTheDocument();
    });

    it('should show "Final Standings" for last round', () => {
      render(
        <AudienceScoreboard {...defaultProps} currentRound={2} totalRounds={3} />
      );

      expect(screen.getByText('Final Standings')).toBeInTheDocument();
    });

    it('should not show "Next round starting soon" on final round', () => {
      render(
        <AudienceScoreboard {...defaultProps} currentRound={2} totalRounds={3} />
      );

      expect(
        screen.queryByText('Next round starting soon...')
      ).not.toBeInTheDocument();
    });
  });

  describe('team display', () => {
    it('should render all team names', () => {
      const teams = [
        createMockTeam('team-1', 'Alpha', 30, 1),
        createMockTeam('team-2', 'Beta', 20, 2),
        createMockTeam('team-3', 'Gamma', 10, 3),
      ];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma')).toBeInTheDocument();
    });

    it('should render all team scores', () => {
      const teams = [
        createMockTeam('team-1', 'Alpha', 30, 1),
        createMockTeam('team-2', 'Beta', 20, 2),
      ];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  describe('ranking and sorting', () => {
    it('should display teams in order passed (assumes pre-sorted)', () => {
      const teams = [
        createMockTeam('team-1', 'First', 50, 1),
        createMockTeam('team-2', 'Second', 40, 2),
        createMockTeam('team-3', 'Third', 30, 3),
      ];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      const teamNames = screen.getAllByText(/^(First|Second|Third)$/);
      expect(teamNames[0]).toHaveTextContent('First');
      expect(teamNames[1]).toHaveTextContent('Second');
      expect(teamNames[2]).toHaveTextContent('Third');
    });
  });

  describe('medal badges for top 3', () => {
    it('should show 1st medal for first place', () => {
      const teams = [createMockTeam('team-1', 'Winner', 50, 1)];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      expect(screen.getByText('1st')).toBeInTheDocument();
    });

    it('should show 2nd medal for second place', () => {
      const teams = [
        createMockTeam('team-1', 'First', 50, 1),
        createMockTeam('team-2', 'Second', 40, 2),
      ];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      expect(screen.getByText('2nd')).toBeInTheDocument();
    });

    it('should show 3rd medal for third place', () => {
      const teams = [
        createMockTeam('team-1', 'First', 50, 1),
        createMockTeam('team-2', 'Second', 40, 2),
        createMockTeam('team-3', 'Third', 30, 3),
      ];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      expect(screen.getByText('3rd')).toBeInTheDocument();
    });

    it('should show numeric rank for 4th place and beyond', () => {
      const teams = [
        createMockTeam('team-1', 'First', 50, 1),
        createMockTeam('team-2', 'Second', 40, 2),
        createMockTeam('team-3', 'Third', 30, 3),
        createMockTeam('team-4', 'Fourth', 20, 4),
      ];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should style top 3 medals with team color backgrounds', () => {
      const teams = [
        createMockTeam('team-1', 'First', 50, 1),
        createMockTeam('team-2', 'Second', 40, 2),
        createMockTeam('team-3', 'Third', 30, 3),
      ];

      const { container } = render(
        <AudienceScoreboard {...defaultProps} teams={teams} />
      );

      // Top 3 rank badges use inline background styles from getTeamColor()
      const rankBadges = container.querySelectorAll('.rounded-full.font-bold');
      expect(rankBadges.length).toBe(3);
    });
  });

  describe('large, readable fonts', () => {
    it('should have bold header text', () => {
      render(<AudienceScoreboard {...defaultProps} />);

      const header = screen.getByText('Round 1 Complete!');
      expect(header).toHaveClass('font-bold');
      expect(header.tagName).toBe('H2');
    });

    it('should have semibold team name text', () => {
      const teams = [createMockTeam('team-1', 'Big Team', 50, 1)];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      const teamName = screen.getByText('Big Team');
      expect(teamName).toHaveClass('font-semibold');
    });

    it('should have bold score text', () => {
      const teams = [createMockTeam('team-1', 'Team', 100, 1)];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      const score = screen.getByText('100');
      expect(score).toHaveClass('font-bold');
    });
  });

  describe('next round indicator', () => {
    it('should show next round message when not final round', () => {
      const teams = [createMockTeam('team-1', 'Team', 50, 1)];

      render(
        <AudienceScoreboard
          {...defaultProps}
          teams={teams}
          currentRound={0}
          totalRounds={3}
        />
      );

      expect(screen.getByText('Next round starting soon...')).toBeInTheDocument();
    });

    it('should have pulsing animation on next round message', () => {
      const teams = [createMockTeam('team-1', 'Team', 50, 1)];

      render(
        <AudienceScoreboard
          {...defaultProps}
          teams={teams}
          currentRound={0}
          totalRounds={3}
        />
      );

      const nextRoundMessage = screen.getByText('Next round starting soon...');
      expect(nextRoundMessage).toHaveClass('motion-safe:animate-pulse');
    });
  });

  describe('layout', () => {
    it('should use framer-motion for row animations', () => {
      const teams = [createMockTeam('team-1', 'Team', 50, 1)];
      const { container } = render(
        <AudienceScoreboard {...defaultProps} teams={teams} />
      );

      // motion.div renders with role="list"
      const list = container.querySelector('[role="list"]');
      expect(list).toBeInTheDocument();
    });

    it('should fill available height', () => {
      const { container } = render(<AudienceScoreboard {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('h-full');
    });

    it('should be centered', () => {
      const { container } = render(<AudienceScoreboard {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('items-center');
    });
  });

  describe('team standings list', () => {
    it('should have role="list" with aria-label', () => {
      const teams = [createMockTeam('team-1', 'Team', 50, 1)];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      const list = screen.getByRole('list', { name: 'Team standings' });
      expect(list).toBeInTheDocument();
    });

    it('should have role="listitem" for each team', () => {
      const teams = [
        createMockTeam('team-1', 'First', 50, 1),
        createMockTeam('team-2', 'Second', 40, 2),
      ];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should have aria-label on each team row', () => {
      const teams = [createMockTeam('team-1', 'Alpha', 50, 1)];

      render(<AudienceScoreboard {...defaultProps} teams={teams} />);

      const item = screen.getByRole('listitem');
      expect(item).toHaveAttribute('aria-label', '1st place: Alpha, 50 points');
    });
  });

  describe('smooth updates', () => {
    it('should update scores when props change', () => {
      const initialTeams = [createMockTeam('team-1', 'Team', 10, 1)];

      const { rerender } = render(
        <AudienceScoreboard {...defaultProps} teams={initialTeams} />
      );

      expect(screen.getByText('10')).toBeInTheDocument();

      const updatedTeams = [createMockTeam('team-1', 'Team', 25, 1)];
      rerender(<AudienceScoreboard {...defaultProps} teams={updatedTeams} />);

      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should update rankings when order changes', () => {
      const initialTeams = [
        createMockTeam('team-1', 'Alpha', 50, 1),
        createMockTeam('team-2', 'Beta', 40, 2),
      ];

      const { rerender } = render(
        <AudienceScoreboard {...defaultProps} teams={initialTeams} />
      );

      // Initially Alpha is first
      let teamNames = screen.getAllByText(/^(Alpha|Beta)$/);
      expect(teamNames[0]).toHaveTextContent('Alpha');

      // Update with Beta now first
      const updatedTeams = [
        createMockTeam('team-2', 'Beta', 60, 2),
        createMockTeam('team-1', 'Alpha', 50, 1),
      ];
      rerender(<AudienceScoreboard {...defaultProps} teams={updatedTeams} />);

      teamNames = screen.getAllByText(/^(Alpha|Beta)$/);
      expect(teamNames[0]).toHaveTextContent('Beta');
    });
  });
});
