import { interpolate, spring, Easing } from 'remotion';

// Spring configuration for smooth, premium animations
export const springConfig = {
  damping: 20,
  stiffness: 100,
  mass: 1,
};

export const springConfigFast = {
  damping: 25,
  stiffness: 200,
  mass: 0.5,
};

export const springConfigSlow = {
  damping: 15,
  stiffness: 60,
  mass: 1.5,
};

// Fade in animation
export function fadeIn(
  frame: number,
  fps: number,
  delay: number = 0,
  duration: number = 20
): number {
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// Fade out animation
export function fadeOut(
  frame: number,
  fps: number,
  startFrame: number,
  duration: number = 20
): number {
  return interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// Slide in from bottom
export function slideInFromBottom(
  frame: number,
  fps: number,
  delay: number = 0
): number {
  return spring({
    frame: frame - delay,
    fps,
    config: springConfig,
  });
}

// Slide in from right
export function slideInFromRight(
  frame: number,
  fps: number,
  delay: number = 0
): number {
  return spring({
    frame: frame - delay,
    fps,
    config: springConfig,
  });
}

// Slide in from left
export function slideInFromLeft(
  frame: number,
  fps: number,
  delay: number = 0
): number {
  return spring({
    frame: frame - delay,
    fps,
    config: springConfig,
  });
}

// Scale in animation
export function scaleIn(
  frame: number,
  fps: number,
  delay: number = 0
): number {
  return spring({
    frame: frame - delay,
    fps,
    config: springConfigFast,
  });
}

// Pop in effect (scale from 0.8 to 1)
export function popIn(
  frame: number,
  fps: number,
  delay: number = 0
): number {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfig,
  });
  return interpolate(progress, [0, 1], [0.8, 1]);
}

// Bounce in effect
export function bounceIn(
  frame: number,
  fps: number,
  delay: number = 0
): number {
  return spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 10,
      stiffness: 150,
      mass: 0.5,
    },
  });
}

// Typewriter effect - returns number of characters to show
export function typewriter(
  frame: number,
  totalChars: number,
  delay: number = 0,
  speed: number = 2 // chars per frame
): number {
  const adjustedFrame = Math.max(0, frame - delay);
  return Math.min(Math.floor(adjustedFrame * speed), totalChars);
}

// Eased progress (0 to 1)
export function easedProgress(
  frame: number,
  startFrame: number,
  duration: number,
  easing: (t: number) => number = Easing.out(Easing.cubic)
): number {
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
}

// Pulse effect
export function pulse(
  frame: number,
  fps: number,
  frequency: number = 2 // pulses per second
): number {
  const period = fps / frequency;
  const progress = (frame % period) / period;
  return 0.95 + 0.05 * Math.sin(progress * Math.PI * 2);
}

// Shake effect (for attention)
export function shake(
  frame: number,
  fps: number,
  intensity: number = 5,
  frequency: number = 10
): { x: number; y: number } {
  const period = fps / frequency;
  const progress = (frame % period) / period;
  return {
    x: Math.sin(progress * Math.PI * 4) * intensity,
    y: Math.cos(progress * Math.PI * 4) * intensity * 0.5,
  };
}

// Cross-fade helper (returns opacity for element A)
export function crossFade(
  frame: number,
  transitionStart: number,
  transitionDuration: number = 15
): { opacityA: number; opacityB: number } {
  const progress = interpolate(
    frame,
    [transitionStart, transitionStart + transitionDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return {
    opacityA: 1 - progress,
    opacityB: progress,
  };
}

// Stagger delay calculator for multiple items
export function staggerDelay(
  index: number,
  baseDelay: number = 0,
  staggerAmount: number = 5
): number {
  return baseDelay + index * staggerAmount;
}
