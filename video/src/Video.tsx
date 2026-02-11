import React from 'react';
import { Sequence, AbsoluteFill } from 'remotion';
import { Scene1Problem } from './scenes/Scene1Problem';
import { Scene2Insight } from './scenes/Scene2Insight';
import { Scene3Connect } from './scenes/Scene3Connect';
import { Scene4Protection } from './scenes/Scene4Protection';
import { Scene5Confirmation } from './scenes/Scene5Confirmation';
import { Scene6Outcomes } from './scenes/Scene6Outcomes';
import { Scene7Value } from './scenes/Scene7Value';
import { Scene8Closing } from './scenes/Scene8Closing';
import { sceneTiming } from './styles/tokens';

// Attenda Product Explainer Video
// Duration: ~70 seconds (2100 frames at 30fps)
// Style: Apple-like, Stripe-like, premium, calm

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FAFAFA' }}>
      {/* Scene 1: The Problem (0-6s) */}
      <Sequence from={sceneTiming.scene1.start} durationInFrames={sceneTiming.scene1.end - sceneTiming.scene1.start}>
        <Scene1Problem />
      </Sequence>

      {/* Scene 2: The Insight (6-12s) */}
      <Sequence from={sceneTiming.scene2.start} durationInFrames={sceneTiming.scene2.end - sceneTiming.scene2.start}>
        <Scene2Insight />
      </Sequence>

      {/* Scene 3: Connect Attenda (12-20s) */}
      <Sequence from={sceneTiming.scene3.start} durationInFrames={sceneTiming.scene3.end - sceneTiming.scene3.start}>
        <Scene3Connect />
      </Sequence>

      {/* Scene 4: Protection Setup (20-30s) */}
      <Sequence from={sceneTiming.scene4.start} durationInFrames={sceneTiming.scene4.end - sceneTiming.scene4.start}>
        <Scene4Protection />
      </Sequence>

      {/* Scene 5: Confirmation Flow (30-40s) */}
      <Sequence from={sceneTiming.scene5.start} durationInFrames={sceneTiming.scene5.end - sceneTiming.scene5.start}>
        <Scene5Confirmation />
      </Sequence>

      {/* Scene 6: Two Outcomes (40-55s) */}
      <Sequence from={sceneTiming.scene6.start} durationInFrames={sceneTiming.scene6.end - sceneTiming.scene6.start}>
        <Scene6Outcomes />
      </Sequence>

      {/* Scene 7: Value Proposition (55-65s) */}
      <Sequence from={sceneTiming.scene7.start} durationInFrames={sceneTiming.scene7.end - sceneTiming.scene7.start}>
        <Scene7Value />
      </Sequence>

      {/* Scene 8: Closing (65-70s) */}
      <Sequence from={sceneTiming.scene8.start} durationInFrames={sceneTiming.scene8.end - sceneTiming.scene8.start}>
        <Scene8Closing />
      </Sequence>
    </AbsoluteFill>
  );
};
