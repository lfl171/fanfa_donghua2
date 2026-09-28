import React from "react";
import { Composition } from "remotion";
import { HumanMemory } from "./Composition";
import { FPS, TOTAL_DURATION_SECONDS } from "./config/scene.schema";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HumanMemory"
      component={HumanMemory}
      durationInFrames={TOTAL_DURATION_SECONDS * FPS}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
