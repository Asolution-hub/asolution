import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing, borderRadius } from '../styles/tokens';
import { fadeOut, staggerDelay } from '../utils/animations';

// Scene 7: Value Proposition (55-65s, frames 1650-1950)
// Shows: Starter → Pro transition, plan features

interface PlanCardProps {
  plan: 'starter' | 'pro';
  price: string;
  features: string[];
  highlighted?: boolean;
  animate?: boolean;
  delay?: number;
  frame: number;
  fps: number;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  price,
  features,
  highlighted = false,
  animate = true,
  delay = 0,
  frame,
  fps,
}) => {
  const progress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.9, 1]);
  const y = interpolate(progress, [0, 1], [30, 0]);

  const isPro = plan === 'pro';

  return (
    <div
      style={{
        width: 380,
        backgroundColor: colors.card,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        boxShadow: highlighted
          ? `0 30px 80px ${colors.primary}30`
          : `0 20px 60px ${colors.shadow}`,
        border: highlighted
          ? `3px solid ${colors.primary}`
          : `1px solid ${colors.border}`,
        opacity,
        transform: `translateY(${y}px) scale(${scale}) ${highlighted ? 'scale(1.05)' : ''}`,
        position: 'relative',
      }}
    >
      {/* Popular badge */}
      {highlighted && (
        <div
          style={{
            position: 'absolute',
            top: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.primary,
            color: 'white',
            padding: `${spacing.xs}px ${spacing.lg}px`,
            borderRadius: borderRadius.full,
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: 13,
          }}
        >
          MOST POPULAR
        </div>
      )}

      {/* Plan name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            backgroundColor: isPro ? colors.primary : colors.backgroundDark,
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isPro ? 'white' : colors.textMuted,
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: 16,
          }}
        >
          {isPro ? 'P' : 'S'}
        </div>
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: fontSizes.xl,
            color: colors.text,
          }}
        >
          {isPro ? 'Pro' : 'Starter'}
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: spacing.lg }}>
        <span
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.extrabold,
            fontSize: fontSizes['3xl'],
            color: isPro ? colors.primary : colors.text,
          }}
        >
          {price}
        </span>
        <span
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.regular,
            fontSize: fontSizes.md,
            color: colors.textMuted,
            marginLeft: spacing.xs,
          }}
        >
          {isPro ? '/month' : ''}
        </span>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {features.map((feature, index) => {
          const featureDelay = staggerDelay(index, delay + 20, 5);
          const featureProgress = animate
            ? spring({ frame: frame - featureDelay, fps, config: { damping: 20, stiffness: 100 } })
            : 1;
          const featureOpacity = interpolate(featureProgress, [0, 1], [0, 1]);

          return (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                opacity: featureOpacity,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12L10 17L20 7"
                  stroke={isPro ? colors.primary : colors.success}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: fontWeights.medium,
                  fontSize: 15,
                  color: colors.text,
                }}
              >
                {feature}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA Button */}
      <div
        style={{
          marginTop: spacing.xl,
          backgroundColor: isPro ? colors.primary : colors.backgroundDark,
          color: isPro ? 'white' : colors.text,
          padding: `${spacing.md}px ${spacing.lg}px`,
          borderRadius: borderRadius.md,
          textAlign: 'center' as const,
          fontFamily: fonts.inter,
          fontWeight: fontWeights.semibold,
          fontSize: 15,
        }}
      >
        {isPro ? 'Start Free Trial' : 'Get Started Free'}
      </div>
    </div>
  );
};

export const Scene7Value: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame;

  // Title animation
  const titleProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // Starter features
  const starterFeatures = [
    '30 protected appointments/month',
    'Email confirmations',
    'Basic protection rules',
    'Google Calendar sync',
  ];

  // Pro features
  const proFeatures = [
    'Unlimited appointments',
    'Email + SMS confirmations',
    'Per-appointment rules',
    'Auto-resend reminders',
    'Priority support',
  ];

  // Value proposition text
  const valueDelay = 180;
  const valueProgress = spring({
    frame: localFrame - valueDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const valueOpacity = interpolate(valueProgress, [0, 1], [0, 1]);
  const valueY = interpolate(valueProgress, [0, 1], [20, 0]);

  // Fade out
  const fadeOutOpacity = fadeOut(frame, fps, 280, 20);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOutOpacity,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 60% 40%, ${colors.primary}10 0%, transparent 60%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.extrabold,
            fontSize: fontSizes['3xl'],
            color: colors.text,
            letterSpacing: '-0.02em',
          }}
        >
          Choose your plan
        </div>
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.medium,
            fontSize: fontSizes.lg,
            color: colors.textMuted,
            marginTop: spacing.sm,
          }}
        >
          Start free, upgrade when you grow
        </div>
      </div>

      {/* Plan cards */}
      <div
        style={{
          display: 'flex',
          gap: spacing.xl,
          marginTop: 60,
        }}
      >
        <PlanCard
          plan="starter"
          price="Free"
          features={starterFeatures}
          animate={true}
          delay={30}
          frame={localFrame}
          fps={fps}
        />
        <PlanCard
          plan="pro"
          price="€39"
          features={proFeatures}
          highlighted={true}
          animate={true}
          delay={50}
          frame={localFrame}
          fps={fps}
        />
      </div>

      {/* Value proposition */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: valueOpacity,
          transform: `translateY(${valueY}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.lg,
            backgroundColor: `${colors.success}15`,
            padding: `${spacing.md}px ${spacing.xl}px`,
            borderRadius: borderRadius.full,
            border: `1px solid ${colors.success}30`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={colors.success} strokeWidth="2" />
            <path d="M8 12L11 15L16 9" stroke={colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <span
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.bold,
                fontSize: fontSizes.lg,
                color: colors.success,
              }}
            >
              One no-show fee pays for 1+ month of Pro
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
