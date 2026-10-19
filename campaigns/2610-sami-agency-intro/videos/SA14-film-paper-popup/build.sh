#!/bin/sh
# SA14: sh build.sh 1080x1920  (hoặc 1920x1080). LIB = thư viện lemo-opuscar.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/lemo-opuscar}
SIZE=${1:-1080x1920}
case $SIZE in 1080x1920) TAG=9x16 ;; 1920x1080) TAG=16x9 ;; *) TAG=$SIZE ;; esac
cd "$LIB"
[ -e node_modules/playwright-core ] || { mkdir -p node_modules; ln -s /opt/node-tools/node_modules/playwright-core node_modules/playwright-core; }
node core/render/readcheck.mjs "$HERE" --size "$SIZE" --q 'rc=1' --step 0.1
node core/render/events.mjs "$HERE" --size "$SIZE" --q 'rc=1'
python3 "$HERE/audio_src/score.py" "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-3} --size "$SIZE" --out "$HERE/out/video_$TAG.mp4"
sh core/render/mux.sh "$HERE/out/video_$TAG.mp4" "$HERE/out/mix.wav" "$HERE/out/SAMI_SA14_paper-popup_v1_$TAG.mp4" 30 1
