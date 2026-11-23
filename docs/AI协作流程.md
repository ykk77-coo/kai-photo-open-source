# 摄影网站提示词模板

找到手头要做的事，复制对应一段发给 AI。还没开始时，用[首页提示词](../README.md#复制即用)。

## 改稿

> 保留【我已选定的部分】，把【我想改的部分】改成【想看到的样子】。比如保留项目索引，把专题改成一张图接一段文字，手机沿用这个顺序。用同一组照片改出能打开的版本，给我具体的复查入口。

三种可以直接加进改稿提示词的做法，按需要选用。

- **横竖封面**　给桌面和手机各选一张合适画幅的照片，检查标题是否盖住主体。
- **索引接图文**　首页直接选项目，专题里按我给的顺序交替排照片和短文。
- **点开看全图**　列表支持扫看，单图保留原画幅，关闭回到刚才的图。

[看 KAI 成品里的取舍与实现](制作方法.md)

## 接入已有网站

> 把摄影页接入我的现有网站【工程目录或框架】，入口放在【例如 /photos/】。沿用现有导航、路径和照片 ID。先给本地预览，验证导航、图片和单图直达，并告诉我哪些文件需要部署。发布目标和公开素材由我确认。

## 验收与交付

> 按我选定的结构，在桌面和手机走一遍主要浏览路径。核对照片比例、文字遮挡、链接和返回位置，先修实际发现的问题。交付时告诉我怎么打开、下一次怎么换图和调顺序，列清实测结果和待查项。

如果 AI 给你单文件 HTML，把代码保存为 `index.html` 后双击打开。Windows 记事本另存时选「所有文件」和 UTF-8；本机选图用来试排版，重新打开时需要再选。

## 在编程助手中加载 Skill

克隆仓库或[下载 ZIP](https://github.com/ykk77-coo/kai-photo-open-source/archive/refs/heads/main.zip)并解压，用 **Codex、Gemini CLI 或 DeepSeek Harness 打开仓库根目录**。三者共用 [`.agents/skills/` 里的入口](../.agents/skills/ai-photography-site/SKILL.md)。调用后描述你的照片和想法。

| 平台 | 开始方式 |
| --- | --- |
| Codex | 发送 `$ai-photography-site`，接着描述你的照片与目标。 [官方说明](https://learn.chatgpt.com/docs/build-skills) |
| Gemini CLI | 信任当前项目后，用 `/skills list` 查看，再发送「请用 ai-photography-site 帮我做摄影网站」。提示激活时确认即可。 [官方说明](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/using-agent-skills.md) |
| DeepSeek Harness | 选仓库根目录做工作区，在输入框输入 `/ai-photography-site` 并选中该 Skill，再补上自己的需求。 [官方目录说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.zh.md#本地发现优先级) |
| Gemini 网页版 | 账号有 Skills 页面时，选择「创建 → 上传」，选解压后的 [完整 Skill 文件夹](../skills/ai-photography-site)，创建后从聊天的技能列表选用。 [官方上传说明](https://support.google.com/gemini/answer/18977944) |

**用在已有网站项目里**　把下载后的 [完整 `ai-photography-site/` 文件夹](../skills/ai-photography-site)复制到你的网站项目的 `.agents/skills/`，确认文件位于 `.agents/skills/ai-photography-site/SKILL.md`，再从项目打开编程助手。用 Claude Code 时，放到 `.claude/skills/`，调用 `/ai-photography-site`。 [Claude Code 官方说明](https://code.claude.com/docs/en/skills)

**只用聊天**　上传或粘贴 [完整 `SKILL.md`](../skills/ai-photography-site/SKILL.md)，也可以直接用[首页提示词](../README.md#复制即用)。联网、文件操作和多 Agent 分工按当前会话的能力启用。
