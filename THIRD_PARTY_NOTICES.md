# 第三方依赖与服务说明 / Third-party notices

本仓库自己的代码以 [MIT](LICENSE) 协议发布。下面这些依赖和服务**不随仓库分发**，由使用者自行安装或接入，各自遵循原有的协议和条款。

## 软件依赖

| 项目 | 用途 | 协议 | 说明 |
|---|---|---|---|
| [Remotion](https://github.com/remotion-dev/remotion)（`remotion`、`@remotion/cli`、`@remotion/transitions`） | 用 React 渲染视频 | [Remotion License](https://www.remotion.dev/license) | 个人和小团队免费。达到一定规模的公司**需要购买公司授权**，商用前请先确认。 |
| [React](https://github.com/facebook/react) | 模板组件 | MIT | |
| [TypeScript](https://github.com/microsoft/TypeScript) | 模板类型检查 | Apache-2.0 | |
| [FFmpeg](https://ffmpeg.org) | 转码、打码、响度统一、抽帧 | LGPL-2.1+ / GPL（取决于编译选项） | 作为外部命令调用，不链接、不分发。 |
| [NumPy](https://github.com/numpy/numpy) | 质检脚本（禁用色扫帧） | BSD-3-Clause | |
| [Pillow](https://github.com/python-pillow/Pillow) | 抽帧拼图、示例界面图 | MIT-CMU | |

## 云服务

配音、配图、配乐会调用你自己配置的服务：OpenRouter、OpenAI 兼容服务、阿里云百炼、火山引擎等。生成内容的版权归属和商用许可，以**各服务商及其上游模型的使用条款**为准。例如：
- 配音音色可能限制商用；
- 部分配乐模型会给生成内容加数字水印。

## 示例素材

- `example/art/cover.png` 由 AI 图像模型生成。
- `example/art/screen.png` 由 `example/make_mock_screen.py` 绘制，是虚构的通用界面。
- `docs/preview.jpg` 是示例成片的抽帧。

三者都不包含任何真实品牌或商标，随本仓库以 MIT 协议提供。

## 参考与致谢

流程设计参考了这些公开资料：
- Remotion 官方的 [AI 技能文档](https://www.remotion.dev/docs/ai/skills)
- HeyGen 开源的 [HyperFrames](https://github.com/heygen-com/hyperframes)

更多教程见 [reference/stack.md](reference/stack.md)。
