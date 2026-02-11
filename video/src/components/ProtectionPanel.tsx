import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { colors, fonts, fontWeights, borderRadius, spacing } from '../styles/tokens';
import { staggerDelay } from '../utils/animations';

interface ProtectionPanelProps {
  fee?: string;
  gracePeriod?: string;
  cancellationWindow?: string;
  animate?: boolean;
  delay?: number;
  compact?: boolean;
}

export const ProtectionPanel: React.FC<ProtectionPanelProps> = ({
  fee = '€30',
  gracePeriod = '10 min',
  cancellationWindow = '24 hours',
  animate = true,
  delay = 0,
  compact = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerProgress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const containerOpacity = interpolate(containerProgress, [0, 1], [0, 1]);
  const containerScale = interpolate(containerProgress, [0, 1], [0.9, 1]);

  const settings = [
    {
      icon: '💰',
      label: 'No-show Fee',
      value: fee,
      color: colors.primary,
    },
    {
      icon: '⏱',
      label: 'Grace Period',
      value: gracePeriod,
      color: colors.accent,
    },
    {
      icon: '🕐',
      label: 'Cancellation Window',
      value: cancellationWindow,
      color: colors.warning,
    },
  ];

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          boxShadow: `0 4px 20px ${colors.shadow}`,
          opacity: containerOpacity,
          transform: `scale(${containerScale})`,
        }}
      >
        {settings.map((setting, index) => {
          const itemDelay = staggerDelay(index, delay + 10, 6);
          const itemProgress = animate
            ? spring({ frame: frame - itemDelay, fps, config: { damping: 20, stiffness: 100 } })
            : 1;
          const itemOpacity = interpolate(itemProgress, [0, 1], [0, 1]);

          return (
            <div
              key={setting.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                opacity: itemOpacity,
              }}
            >
              <span style={{ fontSize: 16 }}>{setting.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: fonts.inter,
                    fontWeight: fontWeights.medium,
                    fontSize: 11,
                    color: colors.textMuted,
                  }}
                >
                  {setting.label}
                </div>
                <div
                  style={{
                    fontFamily: fonts.inter,
                    fontWeight: fontWeights.bold,
                    fontSize: 14,
                    color: setting.color,
                  }}
                >
                  {setting.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 380,
        backgroundColor: colors.card,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        boxShadow: `0 20px 60px ${colors.shadowHeavy}`,
        opacity: containerOpacity,
        transform: `scale(${containerScale})`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.lg,
          paddingBottom: spacing.md,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            backgroundColor: `${colors.primary}15`,
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke={colors.primary}
              strokeWidth="2"
            />
            <path
              d="M12 8V12L15 15"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.bold,
              fontSize: 18,
              color: colors.text,
            }}
          >
            Protection Settings
          </div>
          <div
            style={{
              fontFamily: fonts.inter,
              fontWeight: fontWeights.regular,
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            Configure no-show rules
          </div>
        </div>
      </div>

      {/* Settings list */}
      {settings.map((setting, index) => {
        const itemDelay = staggerDelay(index, delay + 15, 10);
        const itemProgress = animate
          ? spring({ frame: frame - itemDelay, fps, config: { damping: 20, stiffness: 100 } })
          : 1;

        const itemOpacity = interpolate(itemProgress, [0, 1], [0, 1]);
        const itemTranslateX = interpolate(itemProgress, [0, 1], [-20, 0]);

        return (
          <div
            key={setting.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.md,
              backgroundColor: colors.background,
              borderRadius: borderRadius.md,
              marginBottom: spacing.sm,
              opacity: itemOpacity,
              transform: `translateX(${itemTranslateX}px)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ fontSize: 20 }}>{setting.icon}</span>
              <span
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: fontWeights.medium,
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {setting.label}
              </span>
            </div>
            <div
              style={{
                fontFamily: fonts.inter,
                fontWeight: fontWeights.bold,
                fontSize: 16,
                color: setting.color,
              }}
            >
              {setting.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
