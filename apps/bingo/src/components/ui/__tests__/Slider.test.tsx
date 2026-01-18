import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from '../Slider';

describe('Slider', () => {
  const defaultProps = {
    value: 10,
    onChange: vi.fn(),
    min: 5,
    max: 30,
    label: 'Test Slider',
  };

  it('renders with label', () => {
    render(<Slider {...defaultProps} />);
    expect(screen.getByText('Test Slider')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<Slider {...defaultProps} value={15} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays value with unit', () => {
    render(<Slider {...defaultProps} value={15} unit="s" />);
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<Slider {...defaultProps} onChange={handleChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '20' } });
    expect(handleChange).toHaveBeenCalledWith(20);
  });

  it('respects min value', () => {
    render(<Slider {...defaultProps} min={5} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '5');
  });

  it('respects max value', () => {
    render(<Slider {...defaultProps} max={30} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('max', '30');
  });

  it('respects step value', () => {
    render(<Slider {...defaultProps} step={5} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('uses default step of 1', () => {
    render(<Slider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '1');
  });

  it('handles disabled state', () => {
    render(<Slider {...defaultProps} disabled />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });

  it('applies disabled styling to label', () => {
    render(<Slider {...defaultProps} disabled />);
    const label = screen.getByText('Test Slider');
    expect(label.className).toContain('opacity-50');
  });

  it('has correct value attribute', () => {
    render(<Slider {...defaultProps} value={15} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('15');
  });

  it('associates label with slider via htmlFor', () => {
    render(<Slider {...defaultProps} />);
    const label = screen.getByText('Test Slider');
    const slider = screen.getByRole('slider');
    expect(label).toHaveAttribute('for', slider.id);
  });
});
