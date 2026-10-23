"""生成约 2 分钟纯音乐。描述要写清：BPM、鼓点、主奏乐器、情绪、no vocals、no slow intro、steady groove。
不想生成也行：任何免版权音乐直接传给 plan.py --music。

用法: python3 music.py "英文风格描述" out.mp3
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from providers import music

print('saved', sys.argv[2], '（' + music(sys.argv[1], sys.argv[2]) + '）')
