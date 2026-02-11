import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { colors, fonts, fontWeights, borderRadius, spacing } from '../styles/tokens';
import { staggerDelay } from '../utils/animations';

interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  status?: 'confirmed' | 'pending' | 'no-show' | 'attended';
  hasNoShowMarker?: boolean;
}

interface CalendarProps {
  date?: string;
  dayOfWeek?: string;
  events: CalendarEvent[];
  animate?: boolean;
  delay?: number;
  highlightEventId?: string;
  showNoShowMarker?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  date = '15',
  dayOfWeek = 'Tuesday',
  events,
  animate = true,
  delay = 0,
  highlightEventId,
  showNoShowMarker = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerProgress = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } })
    : 1;

  const containerOpacity = interpolate(containerProgress, [0, 1], [0, 1]);
  const containerScale = interpolate(containerProgress, [0, 1], [0.95, 1]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'no-show':
        return colors.danger;
      case 'attended':
        return colors.success;
      case 'pending':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  return (
    <div
      style={{
        width: 500,
        backgroundColor: colors.card,
        borderRadius: borderRadius.xl,
        boxShadow: `0 20px 60px ${colors.shadowHeavy}`,
        overflow: 'hidden',
        opacity: containerOpacity,
        transform: `scale(${containerScale})`,
      }}
    >
      {/* Calendar Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          padding: spacing.lg,
          color: 'white',
        }}
      >
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.medium,
            fontSize: 16,
            opacity: 0.9,
          }}
        >
          {dayOfWeek}
        </div>
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: fontWeights.bold,
            fontSize: 48,
            lineHeight: 1,
            marginTop: spacing.xs,
          }}
        >
          {date}
        </div>
      </div>

      {/* Events List */}
      <div style={{ padding: spacing.md }}>
        {events.map((event, index) => {
          const eventDelay = staggerDelay(index, delay + 15, 8);
          const eventProgress = animate
            ? spring({ frame: frame - eventDelay, fps, config: { damping: 20, stiffness: 100 } })
            : 1;

          const eventOpacity = interpolate(eventProgress, [0, 1], [0, 1]);
          const eventTranslateY = interpolate(eventProgress, [0, 1], [20, 0]);

          const isHighlighted = highlightEventId === event.id;
          const showMarker = showNoShowMarker && event.hasNoShowMarker;

          return (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
                backgroundColor: isHighlighted ? colors.backgroundDark : colors.background,
                borderRadius: borderRadius.md,
                opacity: eventOpacity,
                transform: `translateY(${eventTranslateY}px)`,
                border: isHighlighted ? `2px solid ${colors.primary}` : '2px solid transparent',
                position: 'relative',
              }}
            >
              {/* Time */}
              <div
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: fontWeights.semibold,
                  fontSize: 14,
                  color: colors.textMuted,
                  width: 60,
                  flexShrink: 0,
                }}
              >
                {event.time}
              </div>

              {/* Status indicator */}
              <div
                style={{
                  width: 4,
                  height: 40,
                  backgroundColor: getStatusColor(event.status),
                  borderRadius: borderRadius.full,
                  flexShrink: 0,
                }}
              />

              {/* Event title */}
              <div
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: fontWeights.medium,
                  fontSize: 16,
                  color: colors.text,
                  flex: 1,
                }}
              >
                {event.title}
              </div>

              {/* No-show marker */}
              {showMarker && (
                <NoShowMarker frame={frame} fps={fps} delay={eventDelay + 20} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface NoShowMarkerProps {
  frame: number;
  fps: number;
  delay: number;
}

const NoShowMarker: React.FC<NoShowMarkerProps> = ({ frame, fps, delay }) => {
  const progress = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 150 } });
  const scale = interpolate(progress, [0, 1], [0, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.danger,
        color: 'white',
        padding: `${spacing.xs}px ${spacing.sm}px`,
        borderRadius: borderRadius.full,
        fontFamily: fonts.inter,
        fontWeight: fontWeights.semibold,
        fontSize: 12,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 6L6 18M6 6L18 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      NO-SHOW
    </div>
  );
};
