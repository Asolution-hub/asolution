import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing, borderRadius } from '../styles/tokens';
import { AttendaLogo } from '../components/AttendaLogo';

// Scene 8: Closing (65-70s, frames 1950-2100)
// Shows: Attenda logo, tagline, CTA

export const Scene8Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame;

  // Logo animation
  const logoDelay = 10;
  const logoProgress = spring({
    frame: localFrame - logoDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1]);

  // Tagline animation
  const taglineDelay = 40;
  const taglineProgress = spring({
    frame: localFrame - taglineDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineProgress, [0, 1], [20, 0]);

  // CTA animation
  const ctaDelay = 70;
  const ctaProgress = spring({
    frame: localFrame - ctaDelay,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const ctaScale = interpolate(ctaProgress, [0, 1], [0.9, 1]);
  const ctaOpacity = interpolate(ctaProgress, [0, 1], [0, 1]);

  // Website URL animation
  const urlDelay = 100;
  const urlProgress = spring({
    frame: localFrame - urlDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const urlOpacity = interpolate(urlProgress, [0, 1], [0, 1]);

  // Subtle pulse on CTA
  const ctaPulse = interpolate(
    Math.sin((localFrame - ctaDelay) * 0.1),
    [-1, 1],
    [1, 1.02]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 40%),
                       radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 40%)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: spacing.xl,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.lg,
          }}
        >
          {/* Large logo icon */}
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: borderRadius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="8" width="40" height="36" rx="6" fill="white" />
              <rect x="4" y="8" width="40" height="12" rx="6" fill="rgba(255,255,255,0.8)" />
              <rect x="12" y="4" width="4" height="10" rx="2" fill="rgba(255,255,255,0.8)" />
              <rect x="32" y="4" width="4" height="10" rx="2" fill="rgba(255,255,255,0.8)" />
              <path
                d="M16 28L22 34L34 22"
                stroke={colors.primary}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.extrabold,
              fontSize: 72,
              color: 'white',
              letterSpacing: '-0.03em',
            }}
          >
            Attenda
          </span>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: 'center',
          marginBottom: spacing['2xl'],
        }}
      >
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.semibold,
            fontSize: fontSizes['2xl'],
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: spacing.sm,
          }}
        >
          Protect your calendar. Reduce no-shows.
        </div>
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.medium,
            fontSize: fontSizes.lg,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          Card authorized, not charged. Only you decide when to charge.
        </div>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale * ctaPulse})`,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            color: colors.primary,
            padding: `${spacing.lg}px ${spacing['2xl']}px`,
            borderRadius: borderRadius.lg,
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: fontSizes.xl,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          Start Free Trial
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke={colors.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Website URL */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          opacity: urlOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.semibold,
            fontSize: fontSizes.lg,
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.05em',
          }}
        >
          attenda.app
        </div>
      </div>

      {/* Trust badges */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          display: 'flex',
          gap: spacing.xl,
          opacity: urlOpacity,
        }}
      >
        {['Stripe Secure', 'GDPR Compliant', '99.9% Uptime'].map((badge) => (
          <div
            key={badge}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: fonts.inter,
              fontWeight: fontWeights.medium,
              fontSize: 13,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12L10 17L20 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {badge}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
