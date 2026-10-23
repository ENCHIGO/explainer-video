"""成片质检：禁用色扫帧 + 响度 + 抽帧拼图（看图比看文件名靠谱）。

用法: python3 qa.py video.mp4 [--sheet sheet.jpg] [--every 6]
禁用色默认是被否掉的「深蓝」(r<50,g<60,b 明显高)，超过 0.5% 画面的帧会列出秒数。
"""
import argparse, subprocess
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('--sheet'); ap.add_argument('--every', type=float, default=6)
a = ap.parse_args()
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.video, '-vf', 'fps=2,scale=480:270', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 270, 480, 3).astype(int)
r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
bad = (((r < 50) & (g < 60) & (b > g + 12) & (b > r + 20) & (b < 130)).mean(axis=(1, 2)) > 0.005).nonzero()[0]
print('禁用色:', '通过' if len(bad) == 0 else f'{len(bad)} 帧命中，秒数 {[x / 2 for x in bad[:10]]}')
loud = subprocess.run(['ffmpeg', '-nostats', '-i', a.video, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
print('响度:', [l.strip() for l in loud.splitlines() if l.strip().startswith('I:')][-1:], '（发群/手机看建议 -16 LUFS，用 finalize.sh）')
if a.sheet:
    step = int(a.every * 2); picks = fr[::step][:24].astype(np.uint8)
    cols = 4; rows = (len(picks) + cols - 1) // cols; sheet = Image.new('RGB', (480 * cols, 270 * rows), 'white')
    for i, p in enumerate(picks):
        sheet.paste(Image.fromarray(p), ((i % cols) * 480, (i // cols) * 270))
    sheet.save(a.sheet, quality=85); print('抽帧拼图:', a.sheet)
