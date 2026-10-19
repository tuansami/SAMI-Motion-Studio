#!/bin/sh
# One-command build: sh build.sh [1080x1920|1920x1080]  → out/SAMI_SA16_dataviz-van-dong_v1_<ratio>.mp4
mkdir -p "$(cd "$(dirname "$0")" && pwd)/out"
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/lemo-opuscar}; export LIB
SIZE=${1:-1080x1920}; case $SIZE in 1080x1920) R=9x16 ;; 1920x1080) R=16x9 ;; *) R=$SIZE ;; esac
cd "$LIB"
node core/render/events.mjs "$HERE" --size "$SIZE"
node core/render/readcheck.mjs "$HERE" --size "$SIZE" --step 0.1 > "$HERE/out/readcheck_$R.txt"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-3} --size "$SIZE" --out "$HERE/out/video_$R.mp4"
"$LIB/.venv/bin/python" "$HERE/audio_src/score.py" "$HERE" "mix_$R.wav"
sh core/render/mux.sh "$HERE/out/video_$R.mp4" "$HERE/out/mix_$R.wav" "$HERE/out/SAMI_SA16_dataviz-van-dong_v1_$R.mp4" 30 1
