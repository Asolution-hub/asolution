import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing } from '../styles/tokens';
import { Calendar } from '../components/Calendar';
import { fadeIn, fadeOut } from '../utils/animations';

// Scene 1: The Problem (0-6s, frames 0-180)
// Shows: Calendar with no-show marker, loss statistic

export const Scene1Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation phases
  const titleOpacity = fadeIn(frame, fps, 0, 20);
  const calendarDelay = 25;

  // Cost counter animation
  const counterStart = 60;
  const counterProgress = interpolate(frame, [counterStart, counterStart + 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lostAmount = Math.round(counterProgress * 127);

  // "No-shows cost you money" text animation
  const messageProgress = spring({
    frame: frame - 90,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const messageOpacity = interpolate(messageProgress, [0, 1], [0, 1]);
  const messageScale = interpolate(messageProgress, [0, 1], [0.9, 1]);

  // Fade out at end of scene
  const fadeOutOpacity = fadeOut(frame, fps, 160, 20);

  // Calendar events with a no-show marked
  const events = [
    { id: '1', time: '9:00', title: 'Hair Cut - Maria S.', status: 'attended' as const },
    { id: '2', time: '10:30', title: 'Color Treatment - John D.', status: 'no-show' as const, hasNoShowMarker: true },
    { id: '3', time: '14:00', title: 'Styling - Emma W.', status: 'confirmed' as const },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: 'flex',
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
          background: `radial-gradient(ellipse at 30% 20%, ${colors.primary}08 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, ${colors.danger}08 0%, transparent 50%)`,
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
            fontSize: fontSizes['4xl'],
            color: colors.text,
            letterSpacing: '-0.02em',
          }}
        >
          Your calendar looks full...
        </div>
      </div>

      {/* Calendar */}
      <div style={{ marginTop: 40 }}>
        <Calendar
          date="15"
          dayOfWeek="Tuesday"
          events={events}
          animate={true}
          delay={calendarDelay}
          showNoShowMarker={true}
        />
      </div>

      {/* Loss counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 180,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.md,
          opacity: messageOpacity,
          transform: `scale(${messageScale})`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: fontSizes['3xl'],
            color: colors.danger,
          }}
        >
          -€{lostAmount}
        </div>
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.semibold,
            fontSize: fontSizes.lg,
            color: colors.textMuted,
          }}
        >
          lost to this no-show
        </div>
      </div>
    </AbsoluteFill>
  );
};
