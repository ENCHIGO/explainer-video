"""画一张通用的「对话框里已填好提示词」界面图，给示例的 screen 镜头用（真实项目请换成自己的录屏）。"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

FONTS = ['/System/Library/Fonts/Hiragino Sans GB.ttc', '/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 'C:/Windows/Fonts/msyh.ttc']
font = next((f for f in FONTS if os.path.exists(f)), None)
F = lambda s: ImageFont.truetype(font, s) if font else ImageFont.load_default()
W, H = 1920, 1050
im = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 260, H], fill=(246, 248, 249))
for i, t in enumerate(['＋ 新任务', '我的工作', '搜索历史', '技能中心']):
    d.text((28, 110 + i * 46), t, font=F(22), fill=(40, 50, 56))
d.rounded_rectangle([736, 360, 1444, 600], 18, outline=(214, 226, 230), width=2, fill=(255, 255, 255))
text = ('联网检索并整理一份研判简报。方向：{一句话，如铜价走势}；时间：{如近3个月}；'
        '问题：{一句话或“无”}。每条带日期、来源和链接；价格只摘原文不预测；检索不到写“未检索到”。')
x, y, line = 756, 380, ''
for ch in text:
    if d.textlength(line + ch, font=F(24)) > 668:
        d.text((x, y), line, font=F(24), fill=(30, 36, 40)); y += 36; line = ''
    line += ch
d.text((x, y), line, font=F(24), fill=(30, 36, 40))
d.line([756, 548, 1424, 548], fill=(232, 238, 240), width=2)
d.ellipse([1392, 556, 1426, 590], fill=(11, 201, 194))
d.text((760, 558), '＋', font=F(24), fill=(90, 100, 108))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art', 'screen.png')
im.save(out); print('saved', out)
