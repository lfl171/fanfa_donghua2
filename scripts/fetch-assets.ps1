# 下载全部 AI 素材到 public/assets/
# 用法: powershell -ExecutionPolicy Bypass -File scripts/fetch-assets.ps1 [-Only "act1_street"]
param(
  [string]$Only = ""
)

$ErrorActionPreference = "Stop"

$assets = [ordered]@{
  "act1_newspaper"  = "1930s vintage newspaper front page, aged yellowed paper, black and white, dramatic headline layout, old photograph embedded, dark moody lighting, historical picture book illustration style"
  "act1_street"     = "1930s European street scene, black and white hand-drawn picture book illustration, cobblestone road, old buildings, father holding child hand silhouette walking away, foggy, cinematic, low saturation"
  "act2_globe"      = "vintage antique globe floating in dark space, earth showing Europe, dramatic rim light, dark navy background, oil painting texture, cinematic"
  "act2_europe_map" = "1930s map of Europe, aged parchment paper, sepia grayscale, vintage cartography, country borders, top-down flat view, dark aged edges"
  "act3_worldmap"   = "world map on dark navy background, vintage cartography style, continents in muted gray blue, flat top-down equirectangular view, subtle paper texture"
  "act3_soldier"    = "hand-drawn illustration portrait of a world war two soldier, warm muted colors, picture book style, hopeful expression, upper body, simple background"
  "act3_nurse"      = "hand-drawn illustration portrait of a 1940s nurse with red cross armband, warm muted colors, picture book style, gentle expression, upper body"
  "act3_worker"     = "hand-drawn illustration portrait of a 1940s factory worker with rolled sleeves, warm muted colors, picture book style, determined expression, upper body"
  "act3_child"      = "hand-drawn illustration portrait of a hopeful child looking up at light, warm muted colors, picture book style, upper body, soft glow"
  "act4_photo"      = "war-torn city street after battle with sunbeams breaking through clouds, ruins and hope, cinematic color photography, golden hour light rays, wide shot"
  "act5_ruins"      = "city ruins overgrown, gray rubble, early morning haze, desaturated, picture book illustration, wide shot, ground level view"
  "act5_city_dawn"  = "green city at sunrise, trees and grass covering hills, warm golden sun rising, children running on meadow silhouette, hopeful, picture book illustration, vibrant warm colors"
  "act5_final_map"  = "clean minimalist world map on white background, soft beige continents, flat design, gentle warm tones"
}

$outDir = Join-Path $PSScriptRoot "..\public\assets"
New-Item -ItemType Directory -Force $outDir | Out-Null

# "生成中"占位图的 MD5 —— 命中则说明生成未完成，不视为有效素材
$placeholderHash = "19A0B822EDB11957055E4588C2159058"
$manifest = @()

foreach ($name in $assets.Keys) {
  if ($Only -ne "" -and $name -ne $Only) { continue }
  $outFile = Join-Path $outDir "$name.png"
  $encoded = [uri]::EscapeDataString($assets[$name])
  $url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=$encoded&image_size=landscape_16_9"
  Write-Host "downloading $name ..."
  try {
    Invoke-WebRequest -Uri $url -OutFile $outFile -TimeoutSec 120
    $hash = (Get-FileHash $outFile -Algorithm MD5).Hash
    if ($hash -eq $placeholderHash) {
      Remove-Item $outFile
      Write-Host "  placeholder (still generating), skipped $name"
    } else {
      $manifest += "assets/$name.png"
      Write-Host "  ok $name.png"
    }
  } catch {
    Write-Host "  FAILED $name : $($_.Exception.Message)"
  }
}

# 写入清单：已存在的有效素材也纳入（支持单张重跑累积）
Get-ChildItem $outDir -Filter *.png | ForEach-Object {
  $rel = "assets/$($_.Name)"
  if ($manifest -notcontains $rel) { $manifest += $rel }
}
$manifest | ConvertTo-Json | Set-Content (Join-Path $outDir "manifest.json") -Encoding UTF8
Write-Host "manifest: $($manifest.Count) assets"
Write-Host "done."
