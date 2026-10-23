"""生成无文字的关键画面（封面/背景）。文字一律在视频里叠加，保证清晰准确。

用法: python3 image.py out.png "画面描述" [--style "风格描述" | --raw]
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from providers import image

STYLE = ('Bright airy cinematic photo-illustration, white and very pale teal palette, teal and mint green glowing accents, soft daylight, '
         'shallow depth of field, premium corporate tech mood, wide 3:2 composition, absolutely no text, no letters, no logos, no dark navy background.')
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('desc')
ap.add_argument('--style', default=STYLE, help='默认是浅色青绿科技风；换品牌时改这里'); ap.add_argument('--raw', action='store_true', help='不追加风格描述')
a = ap.parse_args()
print('saved', a.out, '（' + image(a.desc if a.raw else f'{a.desc}. {a.style}', a.out) + '）')
