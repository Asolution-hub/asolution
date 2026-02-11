import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing, borderRadius } from '../styles/tokens';
import { AttendaLogo } from '../components/AttendaLogo';
import { fadeOut } from '../utils/animations';

// Scene 3: Connect Attenda (12-20s, frames 360-600)
// Shows: Attenda logo, connection animation, "Connected" checkmark

export const Scene3Connect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame;

  // Logo animation
  const logoProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);
  const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1]);

  // "Attenda connects to your calendar" text
  const textDelay = 30;
  const textProgress = spring({
    frame: localFrame - textDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);

  // Connection animation
  const connectDelay = 60;
  const connectProgress = spring({
    frame: localFrame - connectDelay,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Calendar icon animation
  const calendarProgress = spring({
    frame: localFrame - connectDelay - 20,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  // Connection line animation
  const lineProgress = interpolate(localFrame, [connectDelay + 30, connectDelay + 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Checkmark animation
  const checkDelay = connectDelay + 80;
  const checkProgress = spring({
    frame: localFrame - checkDelay,
    fps,
    config: { damping: 10, stiffness: 150 },
  });
  const checkScale = interpolate(checkProgress, [0, 1], [0, 1]);
  const checkOpacity = interpolate(checkProgress, [0, 1], [0, 1]);

  // "Connected" text
  const connectedTextDelay = checkDelay + 20;
  const connectedProgress = spring({
    frame: localFrame - connectedTextDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const connectedOpacity = interpolate(connectedProgress, [0, 1], [0, 1]);
  const connectedY = interpolate(connectedProgress, [0, 1], [20, 0]);

  // Fade out
  const fadeOutOpacity = fadeOut(frame, fps, 220, 20);

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
          background: `radial-gradient(ellipse at 50% 50%, ${colors.primary}08 0%, transparent 60%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          textAlign: 'center',
          opacity: textOpacity,
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
          Connect your calendar in seconds
        </div>
      </div>

      {/* Connection visualization */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['3xl'],
          marginTop: 40,
        }}
      >
        {/* Attenda Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              backgroundColor: colors.card,
              borderRadius: borderRadius.xl,
              boxShadow: `0 20px 60px ${colors.shadowHeavy}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${colors.primary}20`,
            }}
          >
            <AttendaLogo size="lg" showText={false} animate={false} />
          </div>
        </div>

        {/* Connection line */}
        <div
          style={{
            width: 200,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: borderRadius.full,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${lineProgress * 100}%`,
              backgroundColor: colors.primary,
              borderRadius: borderRadius.full,
            }}
          />
          {/* Animated dots */}
          {lineProgress > 0 && lineProgress < 1 && (
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: `${lineProgress * 100}%`,
                transform: 'translateX(-50%)',
                width: 20,
                height: 20,
                backgroundColor: colors.primary,
                borderRadius: borderRadius.full,
                boxShadow: `0 0 20px ${colors.primary}`,
              }}
            />
          )}
        </div>

        {/* Google Calendar icon */}
        <div
          style={{
            opacity: interpolate(calendarProgress, [0, 1], [0, 1]),
            transform: `scale(${interpolate(calendarProgress, [0, 1], [0.8, 1])})`,
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              backgroundColor: colors.card,
              borderRadius: borderRadius.xl,
              boxShadow: `0 20px 60px ${colors.shadowHeavy}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${colors.border}`,
            }}
          >
            {/* Google Calendar-style icon */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect x="8" y="16" width="64" height="56" rx="8" fill="#4285F4" />
              <rect x="8" y="16" width="64" height="16" rx="8" fill="#1A73E8" />
              <rect x="16" y="8" width="8" height="16" rx="4" fill="#1A73E8" />
              <rect x="56" y="8" width="8" height="16" rx="4" fill="#1A73E8" />
              {/* Calendar grid */}
              <rect x="16" y="40" width="12" height="10" rx="2" fill="white" opacity="0.9" />
              <rect x="34" y="40" width="12" height="10" rx="2" fill="white" opacity="0.9" />
              <rect x="52" y="40" width="12" height="10" rx="2" fill="white" opacity="0.9" />
              <rect x="16" y="56" width="12" height="10" rx="2" fill="white" opacity="0.9" />
              <rect x="34" y="56" width="12" height="10" rx="2" fill="white" opacity="0.9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Connected checkmark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          marginTop: 20,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            backgroundColor: colors.success,
            borderRadius: borderRadius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${checkScale})`,
            opacity: checkOpacity,
            boxShadow: `0 10px 40px ${colors.success}40`,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12L10 17L20 7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Connected text */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          opacity: connectedOpacity,
          transform: `translateY(${connectedY}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            backgroundColor: `${colors.success}15`,
            padding: `${spacing.md}px ${spacing.xl}px`,
            borderRadius: borderRadius.full,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12L10 17L20 7"
              stroke={colors.success}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.bold,
              fontSize: fontSizes.xl,
              color: colors.success,
            }}
          >
            Connected to Google Calendar
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
