#!/bin/sh
# Cài môi trường cloud cho 1 phiên con của series 2610-SA (chạy 1 lần đầu phiên, ~3-5 phút).
# Trước khi chạy: gọi tool add_repo cho tuansami/mcp-sami-media (repo private) và tuansami/lemo-opuscar.
#   sh campaigns/2610-sami-agency-intro/cloud-setup.sh
set -e
CAMP="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$CAMP/../.." && pwd)"
PARENT="$(cd "$APP/.." && pwd)"
echo "APP=$APP"

# 1 · sami-media (dependency file:../MCP-sami-media của Studio)
if [ ! -d "$PARENT/MCP-sami-media/src" ]; then
  if [ -d "$PARENT/mcp-sami-media/src" ]; then ln -sfn "$PARENT/mcp-sami-media" "$PARENT/MCP-sami-media";
  else git clone --depth 1 https://github.com/tuansami/mcp-sami-media "$PARENT/MCP-sami-media"; fi
fi
(cd "$PARENT/MCP-sami-media" && npm install --no-audit --no-fund >/dev/null 2>&1) && echo "✓ sami-media"

# 2 · Studio
(cd "$APP" && npm install --no-audit --no-fund >/dev/null 2>&1) && echo "✓ Studio npm"
(cd "$APP" && node tools/lib-seed.mjs --apply >/dev/null 2>&1) && echo "✓ SAMI_Library seed"
LIBR="$PARENT/SAMI_Library"
mkdir -p "$LIBR/brands/sami"
cp "$CAMP/assets/logo-white.svg" "$LIBR/brands/sami/logo-white.svg"
cat > "$LIBR/brands/sami/brand.json" <<'EOF'
{"name":"SAMI Marketing Agency","colors":{"mint":"#08DDA4","purple":"#7667FE","navy":"#0C0628"},
 "theme":"night","logo":"",
 "tagline":"Strategy • Automation • Marketing • Intelligence",
 "contact":{"web":"sami-agency.de","whatsapp":"+49 155 60456888"},
 "cta":"Nhắn WhatsApp cho SAMI, nhận phân tích marketing miễn phí","lang":"vi"}
EOF
echo "✓ brand sami"
# Tuấn đã yêu cầu tạo video (câu nguyên văn trong README.md) → bật xuất từ Claude Code trên máy cloud này
(cd "$APP" && node server/cli-render.mjs --enable --request "Thiết kế lần lượt khoảng 15-20 video (gồm cả 2 định dạng 9x16 và 16x9), mỗi video dài từ 60 - 90 giây" >/dev/null) && echo "✓ cli-render bật"

# 3 · lemo-opuscar (style library + core render/audio tools)
if [ ! -d "$PARENT/lemo-opuscar/core" ]; then git clone --depth 1 https://github.com/tuansami/lemo-opuscar "$PARENT/lemo-opuscar"; fi
(cd "$PARENT/lemo-opuscar" && sh plugin/skills/lemo-opuscar/scripts/setup.sh deps >/dev/null 2>&1) && echo "✓ lemo-opuscar core (.venv, chromium)"
echo "Nhạc cụ sample (tuỳ chọn, cho nhạc thật hơn): cd $PARENT/lemo-opuscar && sh tools/fetch.sh instruments <freepats|karoryfer|salamander|vcsl|vsco2ce>"
echo "XONG. Đọc $CAMP/README.md"
