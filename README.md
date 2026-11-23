# 用 AI 做自己的摄影网站

有一组照片就能开始。告诉 AI 你拍了什么、想让谁来看、希望对方怎样看。你可以决定首页从哪里开始、照片怎么排、哪些交互值得加。

## 现在开始

1. 打开 [`SKILL.md`](skills/ai-photography-site/SKILL.md)，把文件上传给 AI，或点 GitHub 的 **Raw**，复制全文发给 AI。
2. 在同一段对话发送下面的开场提示词，填上照片和偏好。第一轮可以只描述照片。
3. 跟着[五课教程](docs/AI协作流程.md)做出本地预览。已有网站时，最后一课教你接入。

### 开场提示词

> 我第一次做摄影网站。我拍了【题材、张数、横竖比例】，想给【谁】看，希望他们【打开后做什么】。我喜欢【一张截图或几个词】，想避免【不喜欢的做法，可留空】。请按摄影网站 Skill 分轮帮我做。能联网就找真实参考，有多 Agent 就分工研究和选片。先帮我比较布局、浏览顺序和手机排法。我可以混合方案、提出自己的做法。方向确定后给我一版能在电脑打开的网页。

## KAI 的真实摄影案例

![薄云下的一束微光照亮远处山峰，前景是连绵的暗色山坡](docs/figures/kai-four-sisters.webp)

《微光与四姐妹》 · 摄影 KAI。这个横幅用作桌面首页封面。手机首页选了另一张竖幅，让山峰和前景都能保留。 [看真实网站](https://ykk77-coo.github.io/kai-guangyin/) · [看三张实拍与排版取舍](docs/制作方法.md)

- **试试 Lumen 示例**　想复用 Lumen 的布局时，进入 [`lumen/`](lumen) 运行 `python tools/serve.py`。[打开本地示例](http://127.0.0.1:8000/index.html) · [换图、检查与导出](docs/使用指南.md)
- **让编程助手加载 Skill**　[Codex 和 Claude Code 的放置位置](docs/AI协作流程.md#在编程助手中加载-skill)
- **复查结果**　[检查 AI 的交付](skills/ai-photography-site/evals/scenarios.md) · [模板自动检查](docs/使用指南.md#维护者复核)

代码、教程、Skill 和 Lumen 示例采用 [MIT](LICENSE)。随附字体保留 OFL。KAI 摄影作品是案例展示图，版权由摄影者保留。 [摄影作品说明](docs/制作方法.md#摄影作品说明) · [字体许可](lumen/THIRD_PARTY_NOTICES.md)
