# 素材与代码来源

## Twemoji

24 个普通礼物 SVG 及装饰使用的相同图形来自 https://github.com/jdecked/twemoji ，路径 `assets/svg/<Unicode>.svg`。

Artwork: Copyright Twitter, Inc. and other contributors; jdecked/twemoji contributors. Graphics licensed under **Creative Commons Attribution 4.0 International**: https://creativecommons.org/licenses/by/4.0/ 。保留了原始 SVG，动画、位置、缩放等由本项目运行时控制。完整图形许可见 `licenses/TWEMOJI-GRAPHICS.txt`。

## Google Noto Emoji

8 个 WebP 动画来自 Google Fonts Emoji CDN，源目录 https://googlefonts.github.io/noto-emoji-files/ 。

Animated Noto Emoji by Google, licensed under **CC BY 4.0**: https://creativecommons.org/licenses/by/4.0/ 。本地保存原始动画，播放时叠加运动、标签、星星等出场效果。

源文件 URL 模式：`https://fonts.gstatic.com/s/e/notoemoji/latest/<Unicode>/512.webp`

对应 Unicode：火箭 `1f680`、礼炮 `1f389`、彩纸球 `1f38a`、礼盒 `1f381`、闪亮爱心 `1f496`、火焰 `1f525`、钻石 `1f48e`、皇冠 `1f451`。

## BilibiliGiftDropper

原项目：https://github.com/kevinyu2003/BilibiliGiftDropper

本地保留原始 `app.js`，`public/physics.js` 从其中 `GiftParticle` 物理类适配。移除了平台连接依赖、头像和昵称路径；绑定到独立画布，修正上方礼物支撑方向检测及帧率相关移动。本项目控制台、同步服务、自动调度、聊天及多种动画另行实现。

获取时原仓库未标明代码许可证；因此本交付作为用户本地项目使用，不声称原代码采用 MIT 或其他开放许可证。若计划公开发布改编代码，需要先确认上游授权。

## 直播间参考

`public/assets/live-reference.png` 是用户提供的原始参考图，原文件未改写。装饰通过 HTML/CSS 参照重建，并在圆形头像区域以 CSS 裁切引用原图。未将原图中的损坏区域直接作为 OBS 背景。

## 音效和运行时

短音效由 Web Audio 合成，无外部采样素材。

内置 Node.js 运行时来源为本机 Codex 的 Node.js 可执行文件。Node.js 及其第三方许可见 `licenses/NODE-LICENSE.txt`。

## 外部软件（独立安装，不包含在项目内）

- OBS Studio：[官方网站](https://obsproject.com/download)、[obsproject/obs-studio](https://github.com/obsproject/obs-studio)。用于画面合成和输出。
- DroidCam Virtual Output：[dev47apps/droidcam-obs-virtual-output](https://github.com/dev47apps/droidcam-obs-virtual-output)、[官方 Releases](https://github.com/dev47apps/droidcam-obs-virtual-output/releases)。可选的 OBS 输出插件，必须同时安装配套驱动，不属于本项目素材或内置依赖。
- Node.js：[官方网站](https://nodejs.org/)、[nodejs/node](https://github.com/nodejs/node)。源码包需自行安装；免安装包附带 Windows x64 运行时及原许可。
- Animated Noto Emoji 官方资源仓库：[googlefonts/noto-emoji-files](https://github.com/googlefonts/noto-emoji-files)。本项目使用的是该资源站提供的动画，并非字体文件；不要将字体仓库的 OFL 授权误用于这些动画。

## 本次打包说明（2026-10-21）

源码包与免安装包均排除 data/settings.json 和 data/presets.json，不分发用户个人参数。原项目目录中的个人文件不受影响。原始参考图仅能说明设计输入来源，不能据此认定拥有图中人物、头像、品牌元素的再分发授权。

BilibiliGiftDropper 改编代码和原始参考图的公开发布授权仍待确认。保留署名和来源不替代授权；在处理前，本包不应被描述为授权齐全的开源发行版。
