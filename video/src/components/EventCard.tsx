import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { colors, fonts, fontWeights, borderRadius, spacing } from '../styles/tokens';

interface EventCardProps {
  time: string;
  title: string;
  clientName?: string;
  clientEmail?: string;
  status?: 'draft' | 'pending' | 'confirmed' | 'attended' | 'no-show';
  protectionFee?: string;
  animate?: boolean;
  delay?: number;
  highlighted?: boolean;
  showContactHighlight?: boolean;
  scale?: number;
}

export const EventCard: React.FC<EventCardProps> = ({
  time,
  title,
  clientName,
  clientEmail,
  status = 'draft',
  protectionFee,
  animate = true,
  delay = 0,
  highlighted = false,
  showContactHighlight = false,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);
  const cardScale = interpolate(progress, [0, 1], [0.9, 1]) * scale;

  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return { color: colors.success, label: 'Confirmed', icon: '✓' };
      case 'attended':
        return { color: colors.success, label: 'Attended', icon: '✓' };
      case 'no-show':
        return { color: colors.danger, label: 'No-Show', icon: '✕' };
      case 'pending':
        return { color: colors.warning, label: 'Pending', icon: '○' };
      case 'draft':
      default:
        return { color: colors.textMuted, label: 'Draft', icon: '◐' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div
      style={{
        width: 420,
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        boxShadow: highlighted
          ? `0 12px 40px ${colors.shadowHeavy}, 0 0 0 3px ${colors.primary}`
          : `0 8px 30px ${colors.shadow}`,
        padding: spacing.lg,
        opacity,
        transform: `translateY(${translateY}px) scale(${cardScale})`,
        border: `1px solid ${highlighted ? colors.primary : colors.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.md,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.bold,
              fontSize: 20,
              color: colors.text,
              marginBottom: spacing.xs,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.medium,
              fontSize: 16,
              color: colors.textMuted,
            }}
          >
            {time}
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: `${statusConfig.color}15`,
            color: statusConfig.color,
            padding: `${spacing.xs}px ${spacing.sm}px`,
            borderRadius: borderRadius.full,
            fontFamily: fonts.inter,
            fontWeight: fontWeights.semibold,
            fontSize: 13,
          }}
        >
          <span>{statusConfig.icon}</span>
          {statusConfig.label}
        </div>
      </div>

      {/* Client info */}
      {(clientName || clientEmail) && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: showContactHighlight ? `${colors.primary}10` : colors.background,
            borderRadius: borderRadius.md,
            marginBottom: spacing.md,
            border: showContactHighlight ? `2px solid ${colors.primary}` : 'none',
          }}
        >
          {clientName && (
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.medium,
                fontSize: 15,
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              {clientName}
            </div>
          )}
          {clientEmail && (
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.regular,
                fontSize: 14,
                color: showContactHighlight ? colors.primary : colors.textMuted,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M2 7L12 13L22 7" stroke="currentColor" strokeWidth="2" />
              </svg>
              {clientEmail}
            </div>
          )}
        </div>
      )}

      {/* Protection fee */}
      {protectionFee && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.sm,
            backgroundColor: `${colors.accent}10`,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.accent}30`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.medium,
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            Protection Fee
          </div>
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.bold,
              fontSize: 16,
              color: colors.accent,
            }}
          >
            {protectionFee}
          </div>
        </div>
      )}
    </div>
  );
};
