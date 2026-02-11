import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes, spacing, borderRadius } from '../styles/tokens';
import { DashboardFrame } from '../components/DashboardFrame';
import { EventCard } from '../components/EventCard';
import { ProtectionPanel } from '../components/ProtectionPanel';
import { fadeOut } from '../utils/animations';

// Scene 4: Protection Setup (20-30s, frames 600-900)
// Shows: Dashboard with event card, protection panel animating in

export const Scene4Protection: React.FC = () => {
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

  // Dashboard animation
  const dashboardDelay = 20;

  // Protection panel slide in
  const panelDelay = 80;
  const panelProgress = spring({
    frame: localFrame - panelDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const panelOpacity = interpolate(panelProgress, [0, 1], [0, 1]);
  const panelX = interpolate(panelProgress, [0, 1], [60, 0]);

  // "Customize per appointment" badge
  const badgeDelay = 160;
  const badgeProgress = spring({
    frame: localFrame - badgeDelay,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const badgeScale = interpolate(badgeProgress, [0, 1], [0, 1]);
  const badgeOpacity = interpolate(badgeProgress, [0, 1], [0, 1]);

  // Explanation text
  const explainDelay = 200;
  const explainProgress = spring({
    frame: localFrame - explainDelay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const explainOpacity = interpolate(explainProgress, [0, 1], [0, 1]);

  // Fade out
  const fadeOutOpacity = fadeOut(frame, fps, 280, 20);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.backgroundDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
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
          Set your protection rules
        </div>
      </div>

      {/* Dashboard with content */}
      <div style={{ marginTop: 60, transform: 'scale(0.85)' }}>
        <DashboardFrame animate={true} delay={dashboardDelay} activeTab="dashboard">
          <div
            style={{
              display: 'flex',
              gap: spacing.xl,
              alignItems: 'flex-start',
            }}
          >
            {/* Left side - Event cards */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: fontWeights.bold,
                  fontSize: fontSizes.lg,
                  color: colors.text,
                  marginBottom: spacing.lg,
                }}
              >
                Today's Appointments
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <EventCard
                  time="10:30 AM"
                  title="Color Treatment"
                  clientName="John Davidson"
                  clientEmail="john@email.com"
                  status="draft"
                  protectionFee="€30"
                  animate={true}
                  delay={dashboardDelay + 20}
                  highlighted={true}
                />
                <EventCard
                  time="2:00 PM"
                  title="Haircut"
                  clientName="Sarah Miller"
                  clientEmail="sarah@email.com"
                  status="confirmed"
                  protectionFee="€25"
                  animate={true}
                  delay={dashboardDelay + 30}
                  scale={0.95}
                />
              </div>
            </div>

            {/* Right side - Protection panel */}
            <div
              style={{
                opacity: panelOpacity,
                transform: `translateX(${panelX}px)`,
              }}
            >
              <ProtectionPanel
                fee="€30"
                gracePeriod="10 min"
                cancellationWindow="24 hours"
                animate={true}
                delay={panelDelay}
              />

              {/* Pro badge */}
              <div
                style={{
                  marginTop: spacing.md,
                  display: 'flex',
                  justifyContent: 'center',
                  transform: `scale(${badgeScale})`,
                  opacity: badgeOpacity,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: `${colors.primary}15`,
                    padding: `${spacing.sm}px ${spacing.md}px`,
                    borderRadius: borderRadius.full,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: colors.primary,
                      color: 'white',
                      padding: `2px 8px`,
                      borderRadius: borderRadius.full,
                      fontFamily: fonts.inter,
                      fontWeight: fontWeights.bold,
                      fontSize: 11,
                    }}
                  >
                    PRO
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.inter,
                      fontWeight: fontWeights.medium,
                      fontSize: 13,
                      color: colors.primary,
                    }}
                  >
                    Customize per appointment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DashboardFrame>
      </div>

      {/* Bottom explanation */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: explainOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.semibold,
            fontSize: fontSizes.md,
            color: colors.textMuted,
          }}
        >
          Fee • Grace period • Cancellation window
        </div>
      </div>
    </AbsoluteFill>
  );
};
