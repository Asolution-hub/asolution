import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing, borderRadius } from '../styles/tokens';
import { EventCard } from '../components/EventCard';
import { fadeIn, fadeOut } from '../utils/animations';

// Scene 2: The Insight (6-12s, frames 180-360)
// Shows: Zoom into event, highlight the contact info

export const Scene2Insight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame; // Already at 0 when scene starts

  // Title animation
  const titleProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  // Card zoom animation
  const cardDelay = 20;
  const cardProgress = spring({
    frame: localFrame - cardDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const cardScale = interpolate(cardProgress, [0, 1], [0.8, 1]);
  const cardOpacity = interpolate(cardProgress, [0, 1], [0, 1]);

  // Contact highlight animation
  const highlightDelay = 60;
  const highlightProgress = spring({
    frame: localFrame - highlightDelay,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const showContactHighlight = localFrame > highlightDelay;

  // Insight text animation
  const insightDelay = 90;
  const insightProgress = spring({
    frame: localFrame - insightDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const insightOpacity = interpolate(insightProgress, [0, 1], [0, 1]);
  const insightY = interpolate(insightProgress, [0, 1], [20, 0]);

  // Arrow animation
  const arrowProgress = spring({
    frame: localFrame - highlightDelay - 10,
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const arrowOpacity = interpolate(arrowProgress, [0, 1], [0, 1]);
  const arrowX = interpolate(arrowProgress, [0, 1], [-20, 0]);

  // Fade out
  const fadeOutOpacity = fadeOut(frame, fps, 160, 20);

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
          background: `radial-gradient(ellipse at 50% 30%, ${colors.primary}10 0%, transparent 60%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
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
          But you have their contact
        </div>
      </div>

      {/* Event card with contact highlight */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['2xl'],
          marginTop: 20,
        }}
      >
        <div
          style={{
            transform: `scale(${cardScale})`,
            opacity: cardOpacity,
          }}
        >
          <EventCard
            time="10:30 AM"
            title="Color Treatment"
            clientName="John Davidson"
            clientEmail="john.davidson@email.com"
            status="pending"
            protectionFee="€30"
            animate={false}
            highlighted={showContactHighlight}
            showContactHighlight={showContactHighlight}
            scale={1.1}
          />
        </div>

        {/* Arrow pointing to email */}
        <div
          style={{
            opacity: arrowOpacity,
            transform: `translateX(${arrowX}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path
              d="M10 30H45M45 30L30 15M45 30L30 45"
              stroke={colors.primary}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              padding: `${spacing.sm}px ${spacing.lg}px`,
              borderRadius: borderRadius.full,
              fontFamily: fonts.inter,
              fontWeight: fontWeights.bold,
              fontSize: 18,
            }}
          >
            Contact found!
          </div>
        </div>
      </div>

      {/* Insight text */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: insightOpacity,
          transform: `translateY(${insightY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.semibold,
            fontSize: fontSizes.xl,
            color: colors.primary,
          }}
        >
          Everything you need to protect your booking
        </div>
      </div>
    </AbsoluteFill>
  );
};
