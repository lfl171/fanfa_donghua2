import React from "react";
import { Img, staticFile } from "remotion";
import { fallbackFor, hasAsset } from "../config/assets";

/**
 * AI 素材图片包装器：
 * - 素材在 manifest.json 中（fetch-assets.ps1 下载成功）→ 渲染 <Img>
 * - 否则直接渲染主题化程序化渐变 + 纹理，保证无素材时视频完整可看。
 * 构建期判定，无 404、无闪烁、渲染确定。
 */
export const AssetImage: React.FC<{
  src: string;
  style?: React.CSSProperties;
  /** 覆盖默认降级配色 */
  fallbackColors?: [string, string];
}> = ({ src, style, fallbackColors }) => {
  if (!hasAsset(src)) {
    const [c0, c1] = fallbackColors ?? fallbackFor(src);
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, ${c0} 0%, ${c1} 100%)`,
          ...style,
        }}
      >
        {/* 程序化纹理：横向细纹 + 暗角，模拟旧胶片 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style,
      }}
    />
  );
};
