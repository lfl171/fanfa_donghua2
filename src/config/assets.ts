import manifest from "../../public/assets/manifest.json";

/** 构建期素材清单：只有真实下载成功的图片才会渲染 <Img>，否则直接走程序化降级 */
const available = new Set(manifest as string[]);

export function hasAsset(src: string): boolean {
  return available.has(src);
}

/** 按素材名给降级渐变配色（无图时也保持每幕的色彩叙事） */
export function fallbackFor(src: string): [string, string] {
  if (src.includes("newspaper")) return ["#d8cdb4", "#b8a888"]; // 旧报纸
  if (src.includes("street")) return ["#46536a", "#1a2230"]; // 战前街道：灰蓝
  if (src.includes("globe")) return ["#16233c", "#050810"]; // 宇宙地球
  if (src.includes("europe_map")) return ["#c9b892", "#7a6a48"]; // 羊皮纸欧洲
  if (src.includes("worldmap")) return ["#1c2634", "#0a0f1e"]; // 深色世界图
  if (src.includes("soldier")) return ["#4a4238", "#26221c"];
  if (src.includes("nurse")) return ["#4a3a3a", "#261e1e"];
  if (src.includes("worker")) return ["#3a4048", "#1e222a"];
  if (src.includes("child")) return ["#4a4438", "#262219"];
  if (src.includes("act4")) return ["#c8a86a", "#7a5c34"]; // 黎明金色
  if (src.includes("ruins")) return ["#555552", "#26262a"]; // 废墟灰
  if (src.includes("city_dawn")) return ["#f5c76a", "#8ab06a"]; // 日出绿城
  if (src.includes("final_map")) return ["#f5efe0", "#e4dbc4"]; // 白底地图
  return ["#1a2332", "#0a0f1e"];
}
