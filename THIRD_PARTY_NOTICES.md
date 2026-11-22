# 第三方内容与许可

## 模板代码与原创图形

我们编写的代码和 `assets/demo/` 中的 SVG 占位图按根目录 MIT 许可证提供。代码来自 KAI 摄影网站项目的本地实现；示例文字与图形专为模板重新制作。KAI 的摄影作品、个人故事、EXIF 清单、照片衍生文件与历史对照材料不包含在此仓库中。

制作手册、`docs/figures/` 中的 SVG 图解和 `examples/` 中的原创小样也按 MIT 提供。`examples/persistent-audio/lumen-tone.wav` 是本项目用 146.83、220.00、293.66 Hz 三个正弦波叠加合成的 12 秒示例音源。

## Hanken Grotesk

`assets/hanken.woff2` 为 Hanken Grotesk 的网页字体文件，采用 SIL Open Font License 1.1。完整许可与原版权信息见 `assets/Hanken-OFL.txt`，该许可独立于本项目 MIT，不应删除。

官方许可文本来源：<https://github.com/google/fonts/blob/main/ofl/hankengrotesk/OFL.txt>。

系统字体 Georgia、宋体等仅通过 CSS 字体名引用，没有随仓库分发字体文件。未分发 Goldenbook 字体。

## 地图

默认 `assets/china-map.js` 由 `tools/map.py` 生成，是原创地区索引示意图，没有使用第三方地理边界。地区名称和六位代码用于功能标识，图块布局不表达地理位置。

KAI 原网站曾使用 DataV.GeoAtlas 的边界数据，但尚未确认其适合本开源仓库再分发，因此不包含相应 GeoJSON、SVG 边界或旧数据文件。使用者自行接入的数据必须保留其来源与许可说明，并自行核实使用条件。

## 视觉参考

KAI 网站早期在布局与交互方向上参考了 Ethan W Photography（<https://ethanwong.photography/>）及 Apple 的公开网页。此处为设计来源说明，不表示获得了对方素材或设计的授权。

本模板不分发参考站照片、参考站源码或未确认许可的字体；致谢不是许可替代。新增第三方素材时，应先确认可分发条件并在此补充。

## 工具依赖

happy-dom 为开发测试依赖，通过 npm 安装，不作为网站运行时或源码副本捆绑。Pillow 为可选照片处理依赖，通过 Python 包管理安装。依赖的许可与版权信息以各安装包所附文件为准。
