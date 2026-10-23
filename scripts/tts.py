"""给 script.json 里每个镜头的 vo 配音 → <out>/b00.mp3 …（已存在的跳过，失败的再跑一次会补上）。
用哪家接口见 providers.py 顶部说明。

用法: python3 tts.py script.json out_dir [--speed 1.15] [--emotion happy]
"""
import argparse, concurrent.futures as cf, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from providers import tts

ap = argparse.ArgumentParser()
ap.add_argument('script'); ap.add_argument('out')
ap.add_argument('--speed', type=float, default=1.15, help='语速，1.15 听起来轻快不赶')
ap.add_argument('--emotion', default='happy', help='情绪（仅 MiniMax 系音色支持）')
a = ap.parse_args()
beats = json.load(open(a.script))['beats']
os.makedirs(a.out, exist_ok=True)


def one(i):
    p = f'{a.out}/b{i:02d}.mp3'
    if os.path.exists(p) and os.path.getsize(p) > 2000:
        return f'b{i:02d} 已有'
    return f'b{i:02d} ok（{tts(beats[i]["vo"], p, a.speed, a.emotion)}）'


with cf.ThreadPoolExecutor(3) as ex:
    for f in cf.as_completed([ex.submit(one, i) for i, b in enumerate(beats) if b.get('vo')]):
        try:
            print(f.result())
        except Exception as e:  # noqa: BLE001
            print('失败（再跑一次会补上）:', e)
