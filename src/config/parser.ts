import React from "react";
import { SceneConfig, validateScenes } from "./scene.schema";
import { ParticleDust } from "../components/ParticleDust";
import { PhotoReveal } from "../components/PhotoReveal";
import { PaperTransition } from "../components/PaperTransition";
import { WorldMap } from "../components/WorldMap";
import { CharacterSilhouette } from "../components/CharacterSilhouette";
import { CharacterPanel } from "../components/CharacterPanel";
import { ColorRestore } from "../components/ColorRestore";
import { GrowGrass } from "../components/GrowGrass";
import { AnimatedChart } from "../components/AnimatedChart";
import { MathFormula } from "../components/MathFormula";
import { BlankShot } from "../components/BlankShot";
import rawScenes from "./scene.json";

/** 字符串 key → 组件 注册表（JSON 驱动的核心映射） */
export const componentRegistry: Record<string, React.FC<any>> = {
  ParticleDust,
  PhotoReveal,
  PaperTransition,
  WorldMap,
  CharacterSilhouette,
  CharacterPanel,
  ColorRestore,
  GrowGrass,
  AnimatedChart,
  MathFormula,
  BlankShot,
};

/** 校验后导出的场景配置 */
export const scenes = (() => {
  const parsed = rawScenes as unknown as SceneConfig[];
  validateScenes(parsed);
  return parsed;
})();

export interface SceneTiming {
  from: number;
  durationInFrames: number;
}

/** 按 duration 累加计算每个场景的 Sequence 时间轴 */
export function computeTimings(
  configs: SceneConfig[],
  fps: number
): SceneTiming[] {
  let cursor = 0;
  return configs.map((s) => {
    const durationInFrames = Math.round(s.duration * fps);
    const timing = { from: cursor, durationInFrames };
    cursor += durationInFrames;
    return timing;
  });
}
