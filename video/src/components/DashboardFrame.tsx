import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { colors, fonts, fontWeights, borderRadius, spacing } from '../styles/tokens';
import { AttendaLogo } from './AttendaLogo';

interface DashboardFrameProps {
  children: React.ReactNode;
  animate?: boolean;
  delay?: number;
  showSidebar?: boolean;
  activeTab?: 'dashboard' | 'calendar' | 'settings';
}

export const DashboardFrame: React.FC<DashboardFrameProps> = ({
  children,
  animate = true,
  delay = 0,
  showSidebar = true,
  activeTab = 'dashboard',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.95, 1]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▣' },
    { id: 'calendar', label: 'Calendar', icon: '◫' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ];

  return (
    <div
      style={{
        width: 1400,
        height: 850,
        backgroundColor: colors.backgroundDark,
        borderRadius: borderRadius.xl,
        boxShadow: `0 40px 100px ${colors.shadowHeavy}`,
        overflow: 'hidden',
        opacity,
        transform: `scale(${scale})`,
        display: 'flex',
      }}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div
          style={{
            width: 240,
            backgroundColor: colors.card,
            borderRight: `1px solid ${colors.border}`,
            padding: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: spacing.xl }}>
            <AttendaLogo size="sm" animate={animate} delay={delay + 10} />
          </div>

          {/* Navigation */}
          <div style={{ flex: 1 }}>
            {sidebarItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: borderRadius.md,
                  marginBottom: spacing.xs,
                  backgroundColor: activeTab === item.id ? `${colors.primary}10` : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: activeTab === item.id ? colors.primary : colors.textMuted,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontFamily: fonts.inter,
                    fontWeight: activeTab === item.id ? fontWeights.semibold : fontWeights.medium,
                    fontSize: 14,
                    color: activeTab === item.id ? colors.primary : colors.textMuted,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Pro badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.md,
              backgroundColor: `${colors.primary}10`,
              borderRadius: borderRadius.md,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: colors.primary,
                borderRadius: borderRadius.full,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: fontWeights.bold,
                fontSize: 14,
              }}
            >
              P
            </div>
            <div>
              <div
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: fontWeights.semibold,
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                Pro Plan
              </div>
              <div
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: fontWeights.regular,
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                Unlimited protection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: spacing.xl,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};
