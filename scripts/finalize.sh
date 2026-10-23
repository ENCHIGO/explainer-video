#!/bin/bash
# 交付前统一响度到 -16 LUFS（视频流不重编码）。用法: finalize.sh in.mp4 out.mp4
set -euo pipefail
ffmpeg -v error -y -i "$1" -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k "$2"
echo "done $2"
