import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing, borderRadius } from '../styles/tokens';
import { LargeStatusIndicator } from '../components/StatusBadge';
import { fadeOut } from '../utils/animations';

// Scene 6: Two Outcomes (40-55s, frames 1200-1650)
// Shows: Split screen - Attended (green, no charge) vs No-Show (red, fee charged)

export const Scene6Outcomes: React.FC = () => {
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

  // Split animation - line grows from center
  const splitDelay = 30;
  const splitProgress = spring({
    frame: localFrame - splitDelay,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const splitHeight = interpolate(splitProgress, [0, 1], [0, 600]);

  // Left side (Attended) animation
  const leftDelay = 60;
  const leftProgress = spring({
    frame: localFrame - leftDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const leftOpacity = interpolate(leftProgress, [0, 1], [0, 1]);
  const leftX = interpolate(leftProgress, [0, 1], [-40, 0]);

  // Right side (No-Show) animation
  const rightDelay = 90;
  const rightProgress = spring({
    frame: localFrame - rightDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const rightOpacity = interpolate(rightProgress, [0, 1], [0, 1]);
  const rightX = interpolate(rightProgress, [0, 1], [40, 0]);

  // "You decide" animation
  const decideDelay = 200;
  const decideProgress = spring({
    frame: localFrame - decideDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const decideOpacity = interpolate(decideProgress, [0, 1], [0, 1]);

  // Result details animation
  const detailsDelay = 150;
  const detailsProgress = spring({
    frame: localFrame - detailsDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const detailsOpacity = interpolate(detailsProgress, [0, 1], [0, 1]);

  // Key point animation
  const keyPointDelay = 280;
  const keyPointProgress = spring({
    frame: localFrame - keyPointDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const keyPointOpacity = interpolate(keyPointProgress, [0, 1], [0, 1]);
  const keyPointY = interpolate(keyPointProgress, [0, 1], [20, 0]);

  // Fade out
  const fadeOutOpacity = fadeOut(frame, fps, 430, 20);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity: fadeOutOpacity,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          zIndex: 10,
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
          After the appointment...
        </div>
      </div>

      {/* Split container */}
      <div
        style={{
          display: 'flex',
          height: '100%',
          paddingTop: 140,
        }}
      >
        {/* Left side - Attended */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${colors.success}08`,
            opacity: leftOpacity,
            transform: `translateX(${leftX}px)`,
            paddingBottom: 100,
          }}
        >
          <LargeStatusIndicator status="attended" animate={true} delay={leftDelay + 20} />

          <div
            style={{
              marginTop: spacing.xl,
              opacity: detailsOpacity,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.bold,
                fontSize: fontSizes.xl,
                color: colors.success,
                marginBottom: spacing.md,
              }}
            >
              Customer showed up!
            </div>
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.medium,
                fontSize: fontSizes.md,
                color: colors.textMuted,
                marginBottom: spacing.lg,
              }}
            >
              Authorization released
            </div>

            {/* Result card */}
            <div
              style={{
                backgroundColor: colors.card,
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                boxShadow: `0 10px 40px ${colors.shadow}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: `${colors.success}15`,
                  borderRadius: borderRadius.full,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke={colors.success} strokeWidth="2" />
                  <path d="M2 10H22" stroke={colors.success} strokeWidth="2" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: fonts.inter, fontWeight: fontWeights.semibold, fontSize: 16, color: colors.text }}>
                  No charge
                </div>
                <div style={{ fontFamily: fonts.inter, fontWeight: fontWeights.regular, fontSize: 14, color: colors.textMuted }}>
                  Card was only authorized
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center divider */}
        <div
          style={{
            width: 4,
            backgroundColor: colors.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 4,
              height: splitHeight,
              backgroundColor: colors.primary,
              borderRadius: borderRadius.full,
            }}
          />
          <div
            style={{
              position: 'absolute',
              backgroundColor: colors.card,
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: borderRadius.full,
              border: `2px solid ${colors.primary}`,
              fontFamily: fonts.inter,
              fontWeight: fontWeights.bold,
              fontSize: 14,
              color: colors.primary,
              opacity: decideOpacity,
              zIndex: 10,
            }}
          >
            OR
          </div>
        </div>

        {/* Right side - No-Show */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${colors.danger}08`,
            opacity: rightOpacity,
            transform: `translateX(${rightX}px)`,
            paddingBottom: 100,
          }}
        >
          <LargeStatusIndicator status="no-show" animate={true} delay={rightDelay + 20} />

          <div
            style={{
              marginTop: spacing.xl,
              opacity: detailsOpacity,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.bold,
                fontSize: fontSizes.xl,
                color: colors.danger,
                marginBottom: spacing.md,
              }}
            >
              Customer didn't show
            </div>
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.medium,
                fontSize: fontSizes.md,
                color: colors.textMuted,
                marginBottom: spacing.lg,
              }}
            >
              You mark as no-show
            </div>

            {/* Result card */}
            <div
              style={{
                backgroundColor: colors.card,
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                boxShadow: `0 10px 40px ${colors.shadow}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: `${colors.danger}15`,
                  borderRadius: borderRadius.full,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke={colors.danger} strokeWidth="2" />
                  <path d="M2 10H22" stroke={colors.danger} strokeWidth="2" />
                  <path d="M6 14H10" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: fonts.inter, fontWeight: fontWeights.bold, fontSize: 20, color: colors.danger }}>
                  €30 charged
                </div>
                <div style={{ fontFamily: fonts.inter, fontWeight: fontWeights.regular, fontSize: 14, color: colors.textMuted }}>
                  Protection fee captured
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key point at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: keyPointOpacity,
          transform: `translateY(${keyPointY}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            padding: `${spacing.md}px ${spacing.xl}px`,
            borderRadius: borderRadius.full,
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: fontSizes.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            boxShadow: `0 10px 40px ${colors.primary}40`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Only you can trigger a charge — never automatic
        </div>
      </div>
    </AbsoluteFill>
  );
};
