# 业内用 AI 写代码做视频的常见技术栈（2026）

**本 skill 的选择**：Claude 写分镜和代码，Remotion 渲染，配音、配图、配乐可接多家（OpenRouter、OpenAI 兼容、阿里云百炼、火山引擎），ffmpeg 后期。

| 环节 | 常见选择 | 说明 |
|---|---|---|
| 画面/动画 | **Remotion**（React 写视频） | 组件化、数据驱动，适合一个模板批量出多集。官方提供 Claude Code 技能：在工程里执行 `npx remotion skills add`。 |
| | **HyperFrames**（HeyGen 开源，HTML + GSAP） | 适合标题、排版和动效。Claude Code 技能：`npx skills add heygen-com/hyperframes`。Apache-2.0 授权，渲染不收费。 |
| 数学/示意动画 | Manim | 适合公式和原理图解。 |
| 3D 镜头 | Blender（用 Python 脚本） | 适合 3D 片头和屏幕翻转等镜头。成本高，按需使用。 |
| 配音 | MiniMax speech、Qwen-TTS、豆包语音、OpenAI TTS、ElevenLabs | 中文推荐 MiniMax 或豆包，音色多，可以调语速和情绪。 |
| 配乐 | Google Lyria、Suno | 描述里写清 BPM、乐器、情绪和 no vocals。 |
| 配图 | GPT-Image、Midjourney、Seedream | 图里不出字。 |
| 视频生成 | Seedance、Veo、Kling | 很贵，只用在片头片尾这类一次性素材上，生成后反复复用。 |
| 后期 | ffmpeg | 拼接、打码、响度统一、抽帧检查。 |

## 网上可以直接看的资料

- Remotion 官方 AI 技能文档：https://www.remotion.dev/docs/ai/skills
- Tella：How to Use Remotion Agent Skills With Claude Code — https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code
- OpenReplay：Making videos with Claude Code + Remotion — https://blog.openreplay.com/making-videos-claude-code-remotion/
- 中文实战（抖音年度金曲 Top10）：https://www.heyuan110.com/posts/ai/2026-01-26-claude-code-remotion-video/
- HyperFrames 仓库：https://github.com/heygen-com/hyperframes
