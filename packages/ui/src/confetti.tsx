'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface ConfettiOptions {
  /** Number of confetti particles (default: 150) */
  particleCount?: number;
  /** Animation duration in milliseconds (default: 4000) */
  duration?: number;
  /** Array of colors for confetti (default: festive colors) */
  colors?: string[];
  /** Spread angle in degrees (default: 70) */
  spread?: number;
  /** Starting y position as percentage (default: 50) */
  startY?: number;
  /** Gravity effect (default: 1) */
  gravity?: number;
}

export interface ConfettiProps extends ConfettiOptions {
  /** Whether confetti is currently active */
  active: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional className for the container */
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  shape: 'rect' | 'circle';
  opacity: number;
}

const DEFAULT_COLORS = [
  '#FFD700', // Gold
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Pale Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Lemon
  '#BB8FCE', // Lavender
];

const DEFAULT_OPTIONS: Required<ConfettiOptions> = {
  particleCount: 150,
  duration: 4000,
  colors: DEFAULT_COLORS,
  spread: 70,
  startY: 50,
  gravity: 1,
};

/**
 * Confetti animation component for celebration states.
 *
 * Uses canvas for performant particle animation.
 * Automatically respects prefers-reduced-motion media query.
 *
 * @example
 * ```tsx
 * <Confetti active={hasWon} onComplete={() => console.log('done!')} />
 * ```
 */
export function Confetti({
  active,
  onComplete,
  className = '',
  particleCount = DEFAULT_OPTIONS.particleCount,
  duration = DEFAULT_OPTIONS.duration,
  colors = DEFAULT_OPTIONS.colors,
  spread = DEFAULT_OPTIONS.spread,
  startY = DEFAULT_OPTIONS.startY,
  gravity = DEFAULT_OPTIONS.gravity,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Create particles
  const createParticles = useCallback(
    (canvas: HTMLCanvasElement): Particle[] => {
      const particles: Particle[] = [];
      const centerX = canvas.width / 2;
      const centerY = (canvas.height * startY) / 100;

      for (let i = 0; i < particleCount; i++) {
        // Spread particles in a cone shape
        const angle = ((Math.random() - 0.5) * spread * Math.PI) / 180 - Math.PI / 2;
        const velocity = 8 + Math.random() * 12;

        particles.push({
          x: centerX + (Math.random() - 0.5) * 100,
          y: centerY,
          vx: Math.cos(angle) * velocity * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.sin(angle) * velocity - Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          size: 6 + Math.random() * 8,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
          opacity: 1,
        });
      }

      return particles;
    },
    [particleCount, colors, spread, startY]
  );

  // Animation loop
  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      let activeParticles = 0;

      for (const particle of particlesRef.current) {
        // Skip offscreen particles
        if (particle.y > canvas.height + 50 || particle.opacity <= 0) {
          continue;
        }

        activeParticles++;

        // Update physics
        particle.vy += 0.3 * gravity; // Gravity
        particle.vx *= 0.99; // Air resistance
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Fade out near end
        if (progress > 0.7) {
          particle.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
        }

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        if (particle.shape === 'rect') {
          ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Continue animation if particles are still active
      if (activeParticles > 0 && progress < 1) {
        animationRef.current = requestAnimationFrame(() => animate(ctx, canvas));
      } else {
        onComplete?.();
      }
    },
    [duration, gravity, onComplete]
  );

  // Start/stop animation based on active prop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (active && !prefersReducedMotion) {
      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Create particles and start animation
      particlesRef.current = createParticles(canvas);
      startTimeRef.current = Date.now();
      animate(ctx, canvas);
    } else if (active && prefersReducedMotion) {
      // For reduced motion, just call onComplete immediately
      onComplete?.();
    } else {
      // Clear canvas when not active
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = [];
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [active, prefersReducedMotion, createParticles, animate, onComplete]);

  // Handle window resize
  useEffect(() => {
    if (!active) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [active]);

  // Don't render canvas if reduced motion is preferred
  if (prefersReducedMotion && active) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
      aria-hidden="true"
      data-testid="confetti-canvas"
    />
  );
}

Confetti.displayName = 'Confetti';
