"""把 script.json + 配音 变成模板能直接渲染的 src/episode.json：
- 量每段配音时长，镜头长度 = 配音 + 少量留白（不够 min 的按 min）
- 切点吸附到音乐节拍（--bpm），转场卡点
- 把配音、关键画面、录屏复制进 public/ep/

用法: python3 plan.py script.json vo_dir template_dir [--bpm 122] [--music music.mp3]
"""
import argparse, json, math, os, shutil, subprocess

ap = argparse.ArgumentParser()
ap.add_argument('script'); ap.add_argument('vo'); ap.add_argument('proj')
ap.add_argument('--bpm', type=float, default=122); ap.add_argument('--music')
a = ap.parse_args()
FPS, VO_AT, PAD, XF, KIT = 30, 4, 10, 8, 90  # 与 Episode.tsx 保持一致
MIN = {'cover': 120, 'title': 105, 'flow': 165, 'screen': 150, 'cards': 130, 'points': 150, 'close': 105}
S = json.load(open(a.script)); base = os.path.dirname(os.path.abspath(a.script))
pub = os.path.join(a.proj, 'public', 'ep'); os.makedirs(pub, exist_ok=True)


def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))


def media(rel):
    """复制素材进 public/ep，返回模板里用的相对路径。"""
    dst = os.path.join(pub, os.path.basename(rel)); shutil.copyfile(os.path.join(base, rel), dst)
    return 'ep/' + os.path.basename(rel)


beat = FPS * 60 / a.bpm
start = (KIT if S.get('intro', True) else 0) - XF
out = []
for i, b in enumerate(S['beats']):
    b = dict(b)
    vlen = 0
    if b.get('vo'):
        mp3 = os.path.join(a.vo, f'b{i:02d}.mp3')
        if not os.path.exists(mp3):
            raise SystemExit(f'缺配音 {mp3}：先跑 tts.py（失败的再跑一次会补上）')
        vlen = math.ceil(dur(mp3) * FPS); shutil.copyfile(mp3, os.path.join(pub, f'b{i:02d}.mp3')); b['audio'] = f'ep/b{i:02d}.mp3'
    for k in ('art', 'clip', 'image'):
        if b.get(k):
            b[k] = media(b[k])
    need = max(MIN.get(b['type'], 90), vlen + VO_AT + PAD, b.get('min', 0))
    nxt = math.ceil((start + need - XF) / beat) * beat  # 下一个切点落在拍子上
    b['dur'] = round(nxt) - start + XF; b['vlen'] = vlen
    start += b['dur'] - XF
    out.append(b)
if a.music:
    shutil.copyfile(a.music, os.path.join(pub, 'music.mp3'))
ep = {k: v for k, v in S.items() if k != 'beats'}
ep.update(beats=out, music='ep/music.mp3' if a.music else S.get('music'), musicFrames=math.floor(dur(a.music) * FPS) if a.music else 0)
json.dump(ep, open(os.path.join(a.proj, 'src', 'episode.json'), 'w'), ensure_ascii=False, indent=1)
total = sum(b['dur'] for b in out) + (KIT if ep.get('intro', True) else 0) + (KIT if ep.get('outro', True) else 0)
print(f'{len(out)} 个镜头，约 {total / FPS:.1f} 秒 → src/episode.json')
