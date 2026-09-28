// scene.json 的 TypeScript 类型定义 + 轻量运行时校验
// 这是 "AI 生成 JSON → Remotion 自动渲染" 的契约层

export type CameraMove =
  | "slow zoom"
  | "zoom out"
  | "left pan"
  | "right pan"
  | "tilt up"
  | "static";

export type AnimationKind =
  | "photo reveal"
  | "paper unfold"
  | "ink spread"
  | "light transition"
  | "network"
  | "parallax"
  | "color restore"
  | "grow"
  | "panel grid";

export type MusicTag =
  | "silence"
  | "orchestra emotional"
  | "orchestra tense"
  | "orchestra hopeful";

export type Palette = "cold" | "transition" | "warm";

export interface SceneLayer {
  type: "image" | "text" | "particles" | "map" | "component";
  /** public/ 下的相对路径，如 "assets/act1_street.png" */
  src?: string;
  text?: { main: string; sub?: string };
  /** 组件注册表 key，如 "PhotoReveal" */
  component?: string;
  /** 2.5D 视差深度 0(远)-1(近)，默认 1 */
  depth?: number;
  /** 幕内延迟帧 */
  delayFrames?: number;
  /** 组件特定参数 */
  params?: Record<string, number | string | boolean>;
}

export interface SceneConfig {
  scene: string;
  act: 1 | 2 | 3 | 4 | 5;
  title: { zh: string; en?: string };
  /** 秒 */
  duration: number;
  palette: Palette;
  camera: CameraMove[];
  animation: AnimationKind[];
  layers: SceneLayer[];
  music: MusicTag;
  /** 幕内节拍帧，驱动光效脉冲 */
  beatMarkers?: number[];
}

export const TOTAL_DURATION_SECONDS = 180;
export const FPS = 30;

/** 轻量校验：必填字段 + 总时长。失败抛错，让 Studio/渲染尽早暴露配置问题 */
export function validateScenes(scenes: SceneConfig[]): void {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error("scene.json 必须是非空数组");
  }
  for (const s of scenes) {
    if (!s.scene || typeof s.duration !== "number" || s.duration <= 0) {
      throw new Error(`场景缺少 scene 或 duration 非法: ${JSON.stringify(s)}`);
    }
    if (!s.title?.zh) {
      throw new Error(`场景 ${s.scene} 缺少 title.zh`);
    }
    if (!Array.isArray(s.layers)) {
      throw new Error(`场景 ${s.scene} 缺少 layers 数组`);
    }
  }
  const total = scenes.reduce((sum, s) => sum + s.duration, 0);
  if (total !== TOTAL_DURATION_SECONDS) {
    throw new Error(
      `五幕总时长应为 ${TOTAL_DURATION_SECONDS}s，当前为 ${total}s`
    );
  }
}
