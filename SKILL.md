---
name: explainer-video
description: 用代码批量做讲解/培训/场景教程视频：写分镜 JSON → AI 配音（OpenRouter/OpenAI 兼容/阿里云百炼/火山引擎）→ AI 配乐/配图 → 录屏推近 → Remotion 模板渲染 → 质检 → 交付。用户要做产品讲解、操作教程、培训短片、视频合集，或说「做个视频」「出一集」「配个音」「把这份文档做成视频」时使用。
---

# 讲解视频制作流程

一句话：**内容写成 JSON，画面交给模板，声音交给 API，质量交给脚本检查**。整套流程不需要剪辑软件，改一句话重渲一集只要两三分钟。

## 准备（第一次用）

- **工具**：Node 18+、ffmpeg、Python 3（需要 `pip install numpy pillow`）。
- **建工程**：`cp -R template my-video && cd my-video && npm install`。
- **密钥**：配音、配图、配乐至少接一家。把 `.env.example` 复制成 `.env`，填上你有的那家即可。
  - 选哪家用 `VIDEO_TTS` / `VIDEO_IMAGE` / `VIDEO_MUSIC` 指定；不指定时，哪家有密钥就用哪家。
  - 各家怎么填，见 `scripts/providers.py` 顶部说明。
- **品牌**：改 `template/src/brand.json`，包括名称、一句话标语、配色，以及可选的 logo 和字幕头像（图片放进 `template/public/`）。片头片尾会按品牌自动生成。
- **授权**：Remotion 对一定规模以上的公司要求购买商业授权，商用前请先确认。

| 接入方式 | 配音 | 配图 | 配乐 |
|---|---|---|---|
| OpenRouter | ✅ MiniMax 等 | ✅ GPT-Image 等 | ✅ Lyria |
| OpenAI 兼容（OpenAI、腾讯云、自建 new-api/one-api 网关……） | ✅ `/audio/speech` | ✅ `/images/generations` | ✅（网关支持音频模型时） |
| 阿里云百炼 DashScope | ✅ Qwen-TTS | ✅ Qwen-Image | — |
| 火山引擎（方舟 / 豆包语音） | ✅ 豆包语音 | ✅ Seedream | — |
| 不接 | — | 自己找图 | 自带免版权音乐，传给 `plan.py --music` |

## 六步流程

### 1. 写分镜 `script.json`（最重要的一步）

格式照 `example/script.json`。每个镜头写一个 `type`、画面字段和一句 `vo`（配音原文，同时用作字幕；想让字幕和配音不同，另写 `caption`）。

| type | 用途 | 主要字段 |
|---|---|---|
| `cover` | 一集的封面 | eyebrow, title, subtitle, art, items[[主, 副]] |
| `title` | 小节/场景开场 | num, tag, title, line（逐字弹出的一句话）, art |
| `flow` | 三栏流程：你提供 → 品牌来做 → 你拿到 | left[], mid[], right[], labels? |
| `screen` | 录屏或截图，先看全貌再推近 | clip 或 image, clipSize[w,h], focus[x,y,放大倍数], from(秒), clipSeconds, tip |
| `cards` | 成果卡片，附一条注意事项 | cards[], note, cardLabel? |
| `points` | 要点宫格，随配音依次点亮 | title, items[[大字, 小字]] |
| `close` | 收尾回顾 | title, items[], art |

写配音的规矩（这些都是真实反馈「官腔重、节奏慢」之后改出来的）：
- **口语化**：多用问句和感叹句。比如写「行业消息满网飞，真假难辨？」，而不是「行业动态散在各类网站，来源可信度不一」。
- **句子短**：每句 15–35 个字。一个镜头只说一件事。
- **注意事项照写，但语气轻**：比如「定稿还得你来！」「只提疑点，不下结论」。
- **一个场景四个镜头就够**：`title` → `flow` → `screen` → `cards`。不要再单独拆「难点」「注意」镜头，那样会拖慢节奏。

### 2. 配音

```bash
python3 scripts/tts.py script.json vo/            # 默认 1.15 倍速、happy 情绪
```

- **换声音**：用 `VIDEO_TTS_VOICE` 指定。先给每个候选声音生成同一句话，合成一个带编号的视频来试听，再挑。
- **挑声音要靠听或靠量**（语速、音高起伏），不要按声音的名字猜。
- **网络会偶尔断**：失败的镜头再跑一次同样的命令就会补上，已有的会跳过。

### 3. 配乐、配图

```bash
python3 scripts/music.py "Upbeat bright corporate pop, 122 BPM, four-on-the-floor kick, claps on 2 and 4, marimba and pluck synth, no vocals, no slow intro, steady groove, about 2 minutes" music.mp3
python3 scripts/image.py art/cover.png "a glass boardroom overlooking a city skyline, holographic charts"
```

- **配图里不出字**：文字一律由模板叠加，保证清晰准确。
- **默认画风**：脚本默认附加浅色青绿科技风的描述。换品牌时用 `--style` 改风格，或用 `--raw` 不加。
- **视频生成模型**（Seedance、Veo 等）很贵，只在片头片尾这类一次性素材上考虑。模板自带的代码片头已经够用。

### 4. 录屏（需要真实操作画面时）

- **清晰度**：用 Retina/HiDPI 的 2 倍分辨率录。`screen` 镜头会推近 2 倍左右，1 倍录的画面推近后会糊。
- **录前准备**：先把要展示的内容准备好，比如提示词已经输进输入框但先不发送，这样不消耗额度。
- **打码**：侧边栏历史、用户名等隐私信息要模糊掉（坐标按需调整）：
  ```bash
  ffmpeg -i in.mov -filter_complex "split[m][s];[s]crop=510:1310:0:790,boxblur=28:3[b];[m][b]overlay=0:790,fps=30,format=yuv420p" -crf 16 out.mp4
  ```
- **focus 坐标**：按画面原始尺寸（`clipSize`）计。先截一帧看清楚要推近的区域在哪。
- **没有录屏也行**：用 `image` 放一张截图，示例里就是这么做的。

### 5. 生成时间线并渲染

```bash
python3 scripts/plan.py script.json vo/ my-video --bpm 122 --music music.mp3
cd my-video && npx remotion studio                # 浏览器里预览
npx remotion render Episode out/episode.mp4 --crf=14 --x264-preset=slow
```

`plan.py` 会做三件事：
- **算镜头长度**：按每段配音的时长算，配音一说完就切。
- **切点卡拍**：`--bpm` 要和音乐一致。
- **复制素材**：把配音、图片、录屏复制进 `public/ep/`，生成 `src/episode.json`。

模板已经处理好以下效果，一般不用改：
- 进新小节时从右侧滑入，其他镜头快速淡入淡出。
- 有人声时音乐压到一半，节奏不断；音乐会无缝循环。
- 字幕条、品牌片头片尾。

### 6. 质检和交付

```bash
python3 scripts/qa.py out/episode.mp4 --sheet sheet.jpg    # 禁用色扫帧 + 响度 + 抽帧拼图
scripts/finalize.sh out/episode.mp4 final.mp4             # 响度统一到 -16 LUFS，适合手机外放
```

- **必须自己看拼图**：确认文字没被遮挡、没有空白镜头，再交付。
- **`qa.py` 的禁用色**：默认禁止深蓝底，可以改成你们被否掉的颜色。
- **交付顺序**：先私发给需求方确认，对方点头后再发群。不要把返工过程发到群里。

## 成本参考（按 2026 年 10 月的 OpenRouter 价格）

- 一套 11 集的配音（约 6000 字）：不到 1 美元。
- 一首约 2 分钟的配乐：几毛钱。
- 一张配图：约 0.1–0.2 美元。
- 重渲染不花钱。

更多细节见 `reference/pitfalls.md`（踩过的坑）和 `reference/stack.md`（业内常用技术栈）。
