import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { computeTimings, scenes } from "./config/parser";
import { Act1PeaceBefore } from "./scenes/Act1PeaceBefore";
import { Act2DarknessSpreads } from "./scenes/Act2DarknessSpreads";
import { Act3UnitedResistance } from "./scenes/Act3UnitedResistance";
import { Act4DawnAppears } from "./scenes/Act4DawnAppears";
import { Act5NewWorld } from "./scenes/Act5NewWorld";

/** act 序号 → 场景组件 */
const actComponents: Record<number, React.FC<any>> = {
  1: Act1PeaceBefore,
  2: Act2DarknessSpreads,
  3: Act3UnitedResistance,
  4: Act4DawnAppears,
  5: Act5NewWorld,
};

/**
 * JSON 驱动的总编排：
 * scene.json 的每个场景 → computeTimings 算出 from/duration → <Sequence> 自动编排。
 * 修改 scene.json 即可调整整部影片，无需改动组件代码。
 */
export const HumanMemory: React.FC = () => {
  const { fps } = useVideoConfig();
  const timings = computeTimings(scenes, fps);

  return (
    <>
      {scenes.map((config, i) => {
        const Act = actComponents[config.act];
        if (!Act) return null;
        return (
          <Sequence
            key={config.scene}
            from={timings[i].from}
            durationInFrames={timings[i].durationInFrames}
            premountFor={fps}
          >
            <Act config={config} />
          </Sequence>
        );
      })}
    </>
  );
};
