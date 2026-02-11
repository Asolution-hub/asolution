import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, fontWeights, fontSizes } from '../styles/tokens';

interface AttendaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animate?: boolean;
  delay?: number;
}

const sizeMap = {
  sm: { icon: 32, text: fontSizes.lg, gap: 8 },
  md: { icon: 48, text: fontSizes.xl, gap: 12 },
  lg: { icon: 64, text: fontSizes['2xl'], gap: 16 },
  xl: { icon: 96, text: fontSizes['4xl'], gap: 24 },
};

export const AttendaLogo: React.FC<AttendaLogoProps> = ({
  size = 'md',
  showText = true,
  animate = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { icon: iconSize, text: textSize, gap } = sizeMap[size];

  const iconProgress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const textProgress = animate
    ? spring({ frame: frame - delay - 10, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const iconScale = interpolate(iconProgress, [0, 1], [0.5, 1]);
  const iconOpacity = interpolate(iconProgress, [0, 1], [0, 1]);
  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);
  const textTranslateX = interpolate(textProgress, [0, 1], [-20, 0]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
      }}
    >
      {/* Logo Icon - Calendar with checkmark */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          opacity: iconOpacity,
          transform: `scale(${iconScale})`,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Calendar body */}
          <rect
            x="4"
            y="8"
            width="40"
            height="36"
            rx="6"
            fill={colors.primary}
          />
          {/* Calendar top strip */}
          <rect
            x="4"
            y="8"
            width="40"
            height="12"
            rx="6"
            fill={colors.primaryDark}
          />
          {/* Calendar binding holes */}
          <rect x="12" y="4" width="4" height="10" rx="2" fill={colors.primaryDark} />
          <rect x="32" y="4" width="4" height="10" rx="2" fill={colors.primaryDark} />
          {/* Checkmark */}
          <path
            d="M16 28L22 34L34 22"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <span
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: textSize,
            color: colors.primary,
            opacity: textOpacity,
            transform: `translateX(${textTranslateX}px)`,
            letterSpacing: '-0.02em',
          }}
        >
          Attenda
        </span>
      )}
    </div>
  );
};
