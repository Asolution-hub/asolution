import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { colors, fonts, fontWeights, borderRadius, spacing } from '../styles/tokens';

type BadgeStatus = 'confirmed' | 'attended' | 'no-show' | 'pending' | 'draft' | 'protected';

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  delay?: number;
}

const statusConfig: Record<BadgeStatus, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  confirmed: {
    color: colors.success,
    bgColor: `${colors.success}15`,
    label: 'Confirmed',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  attended: {
    color: colors.success,
    bgColor: `${colors.success}15`,
    label: 'Attended',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  'no-show': {
    color: colors.danger,
    bgColor: `${colors.danger}15`,
    label: 'No-Show',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  pending: {
    color: colors.warning,
    bgColor: `${colors.warning}15`,
    label: 'Pending',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  draft: {
    color: colors.textMuted,
    bgColor: colors.background,
    label: 'Draft',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M17.5 3.5L20.5 6.5L12 15H9V12L17.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  protected: {
    color: colors.accent,
    bgColor: `${colors.accent}15`,
    label: 'Protected',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

const sizeConfig = {
  sm: { padding: `${spacing.xs}px ${spacing.sm}px`, fontSize: 12, iconSize: 14, gap: 4 },
  md: { padding: `${spacing.sm}px ${spacing.md}px`, fontSize: 14, iconSize: 16, gap: 6 },
  lg: { padding: `${spacing.md}px ${spacing.lg}px`, fontSize: 16, iconSize: 20, gap: 8 },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  animate = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 150 } })
    : 1;

  const scale = interpolate(progress, [0, 1], [0, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
        padding: sizeStyles.padding,
        backgroundColor: config.bgColor,
        color: config.color,
        borderRadius: borderRadius.full,
        fontFamily: fonts.inter,
        fontWeight: fontWeights.semibold,
        fontSize: sizeStyles.fontSize,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {config.icon}
      {config.label}
    </div>
  );
};

// Large status indicator for outcomes
interface LargeStatusIndicatorProps {
  status: 'attended' | 'no-show';
  animate?: boolean;
  delay?: number;
}

export const LargeStatusIndicator: React.FC<LargeStatusIndicatorProps> = ({
  status,
  animate = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 100 } })
    : 1;

  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  const isAttended = status === 'attended';
  const color = isAttended ? colors.success : colors.danger;
  const bgColor = isAttended ? `${colors.success}15` : `${colors.danger}15`;
  const label = isAttended ? 'Attended' : 'No-Show';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.md,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: borderRadius.full,
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 10px 40px ${color}30`,
        }}
      >
        {isAttended ? (
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path d="M5 12L10 17L20 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div
        style={{
          fontFamily: fonts.inter,
          fontWeight: fontWeights.bold,
          fontSize: 28,
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
};
