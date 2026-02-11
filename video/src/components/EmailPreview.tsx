import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { colors, fonts, fontWeights, borderRadius, spacing } from '../styles/tokens';

interface EmailPreviewProps {
  businessName?: string;
  clientName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  fee?: string;
  animate?: boolean;
  delay?: number;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  businessName = 'Premium Salon',
  clientName = 'Sarah',
  appointmentDate = 'Tuesday, Jan 15',
  appointmentTime = '2:00 PM',
  fee = '€30',
  animate = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [60, 0]);
  const scale = interpolate(progress, [0, 1], [0.95, 1]);

  return (
    <div
      style={{
        width: 480,
        backgroundColor: colors.card,
        borderRadius: borderRadius.xl,
        boxShadow: `0 20px 60px ${colors.shadowHeavy}`,
        overflow: 'hidden',
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
      }}
    >
      {/* Email header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          padding: spacing.lg,
          color: 'white',
        }}
      >
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
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="2" />
              <path d="M2 7L12 13L22 7" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: fonts.inter, fontWeight: fontWeights.semibold, fontSize: 16 }}>
              {businessName}
            </div>
            <div style={{ fontFamily: fonts.inter, fontWeight: fontWeights.regular, fontSize: 12, opacity: 0.8 }}>
              Booking Confirmation
            </div>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div style={{ padding: spacing.lg }}>
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.regular,
            fontSize: 15,
            color: colors.text,
            lineHeight: 1.6,
            marginBottom: spacing.lg,
          }}
        >
          Hi {clientName}, please confirm your appointment:
        </div>

        {/* Appointment details card */}
        <div
          style={{
            backgroundColor: colors.background,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke={colors.primary} strokeWidth="2" />
              <line x1="3" y1="10" x2="21" y2="10" stroke={colors.primary} strokeWidth="2" />
              <line x1="8" y1="2" x2="8" y2="6" stroke={colors.primary} strokeWidth="2" />
              <line x1="16" y1="2" x2="16" y2="6" stroke={colors.primary} strokeWidth="2" />
            </svg>
            <span
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.semibold,
                fontSize: 15,
                color: colors.text,
              }}
            >
              {appointmentDate}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth="2" />
              <path d="M12 6V12L16 14" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.semibold,
                fontSize: 15,
                color: colors.text,
              }}
            >
              {appointmentTime}
            </span>
          </div>
        </div>

        {/* Protection notice */}
        <div
          style={{
            backgroundColor: `${colors.accent}10`,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            border: `1px solid ${colors.accent}30`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.medium,
              fontSize: 13,
              color: colors.accent,
              marginBottom: spacing.xs,
            }}
          >
            No-show protection
          </div>
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.regular,
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            A {fee} fee applies if you don't show up. Your card will be authorized (not charged).
          </div>
        </div>

        {/* CTA Button */}
        <div
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            padding: `${spacing.md}px ${spacing.lg}px`,
            borderRadius: borderRadius.md,
            textAlign: 'center' as const,
            fontFamily: fonts.inter,
            fontWeight: fontWeights.semibold,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Confirm My Booking →
        </div>
      </div>
    </div>
  );
};
