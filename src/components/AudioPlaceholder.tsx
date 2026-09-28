import React from "react";
import { MusicTag } from "../config/scene.schema";

/**
 * 音频挂载点（当前返回 null，仅保留节拍标记接口）。
 *
 * 启用方式：
 *   1. 将音乐文件放入 public/audio/{music}.mp3
 *      （music 取值见 scene.json 的 music 字段，如 "orchestra emotional"）
 *   2. 取消下方注释：
 *
 * import { Audio, staticFile } from "remotion";
 * if (music !== "silence") {
 *   return <Audio src={staticFile(`audio/${music}.mp3`)} />;
 * }
 */
export const AudioPlaceholder: React.FC<{
  music: MusicTag;
  beatMarkers?: number[];
}> = () => {
  return null;
};
