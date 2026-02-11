import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { videoConfig } from './styles/tokens';

// Root component that registers all compositions
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Video"
        component={Video}
        durationInFrames={videoConfig.durationInFrames}
        fps={videoConfig.fps}
        width={videoConfig.width}
        height={videoConfig.height}
      />
    </>
  );
};
