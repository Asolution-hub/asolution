import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing, borderRadius } from '../styles/tokens';
import { EventCard } from '../components/EventCard';
import { EmailPreview } from '../components/EmailPreview';
import { fadeOut } from '../utils/animations';

// Scene 5: Confirmation Flow (30-40s, frames 900-1200)
// Shows: Send button click → Email preview slides in

export const Scene5Confirmation: React.FC = () => {
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

  // Event card animation
  const cardDelay = 20;

  // Send button highlight
  const buttonHighlightDelay = 60;
  const buttonPulse = interpolate(
    localFrame,
    [buttonHighlightDelay, buttonHighlightDelay + 15, buttonHighlightDelay + 30],
    [1, 1.1, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Button click effect
  const clickFrame = 90;
  const isClicked = localFrame >= clickFrame;
  const clickProgress = spring({
    frame: localFrame - clickFrame,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  // Email slide in
  const emailDelay = clickFrame + 20;
  const emailProgress = spring({
    frame: localFrame - emailDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const emailOpacity = interpolate(emailProgress, [0, 1], [0, 1]);
  const emailX = interpolate(emailProgress, [0, 1], [100, 0]);

  // "Sent" checkmark
  const sentDelay = emailDelay + 40;
  const sentProgress = spring({
    frame: localFrame - sentDelay,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const sentScale = interpolate(sentProgress, [0, 1], [0, 1]);

  // Card authorization note
  const noteDelay = sentDelay + 30;
  const noteProgress = spring({
    frame: localFrame - noteDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const noteOpacity = interpolate(noteProgress, [0, 1], [0, 1]);
  const noteY = interpolate(noteProgress, [0, 1], [20, 0]);

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
          background: `radial-gradient(ellipse at 30% 50%, ${colors.primary}08 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 50%, ${colors.accent}08 0%, transparent 50%)`,
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
          Send confirmation to your client
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['3xl'],
          marginTop: 40,
        }}
      >
        {/* Event card with send button */}
        <div style={{ position: 'relative' }}>
          <EventCard
            time="10:30 AM"
            title="Color Treatment"
            clientName="John Davidson"
            clientEmail="john@email.com"
            status={isClicked ? 'pending' : 'draft'}
            protectionFee="€30"
            animate={true}
            delay={cardDelay}
          />

          {/* Send button */}
          <div
            style={{
              position: 'absolute',
              bottom: -60,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: isClicked ? colors.success : colors.primary,
                color: 'white',
                padding: `${spacing.md}px ${spacing.xl}px`,
                borderRadius: borderRadius.md,
                fontFamily: fonts.inter,
                fontWeight: fontWeights.semibold,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                transform: `scale(${isClicked ? interpolate(clickProgress, [0, 0.5, 1], [1, 0.95, 1]) : buttonPulse})`,
                boxShadow: isClicked
                  ? `0 4px 20px ${colors.success}40`
                  : `0 4px 20px ${colors.primary}40`,
                transition: 'background-color 0.2s',
              }}
            >
              {isClicked ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sent!
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Send Confirmation
                </>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        {isClicked && (
          <div
            style={{
              opacity: emailOpacity,
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
          </div>
        )}

        {/* Email preview */}
        <div
          style={{
            opacity: emailOpacity,
            transform: `translateX(${emailX}px)`,
          }}
        >
          <EmailPreview
            businessName="Premium Salon"
            clientName="John"
            appointmentDate="Tuesday, Jan 15"
            appointmentTime="10:30 AM"
            fee="€30"
            animate={false}
          />
        </div>
      </div>

      {/* Authorization note */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: noteOpacity,
          transform: `translateY(${noteY}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: `${colors.accent}15`,
            padding: `${spacing.md}px ${spacing.xl}px`,
            borderRadius: borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            border: `1px solid ${colors.accent}30`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke={colors.accent} strokeWidth="2" />
            <path d="M2 10H22" stroke={colors.accent} strokeWidth="2" />
            <path d="M6 14H10" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.semibold,
                fontSize: 15,
                color: colors.text,
              }}
            >
              Card authorized, not charged
            </div>
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.regular,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              Supports Apple Pay & Google Pay
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
