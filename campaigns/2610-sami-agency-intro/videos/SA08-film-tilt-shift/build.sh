#!/bin/sh
# SA08: sh build.sh 1080x1920  (hoặc 1920x1080). LIB = thư viện lemo-opuscar.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/lemo-opuscar}
SIZE=${1:-1080x1920}
case $SIZE in 1080x1920) TAG=9x16 ;; 1920x1080) TAG=16x9 ;; *) TAG=$SIZE ;; esac
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --size "$SIZE"
node core/render/events.mjs "$HERE" --size "$SIZE"
python3 "$HERE/audio_src/score.py" "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size "$SIZE" --out "$HERE/out/video_$TAG.mp4"
sh core/render/mux.sh "$HERE/out/video_$TAG.mp4" "$HERE/out/mix.wav" "$HERE/out/SAMI_SA08_pho-tilt-shift_v1_$TAG.mp4" 30 1
