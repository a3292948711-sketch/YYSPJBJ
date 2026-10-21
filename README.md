# 语音直播姬 · Gift Studio

网页控制的本地礼物演播台：手动投送、礼物自动投送与抖动、多种动画、礼物预设、模拟聊天，以及可导入 OBS 的透明画面。无需连接真实直播间。

## 素材与代码致谢

| 来源 | 本项目使用内容 | 仓库 / 官方页面 |
| --- | --- | --- |
| Twemoji（jdecked 维护版） | 24 个普通礼物 SVG，以及界面中复用的表情图形 | [jdecked/twemoji](https://github.com/jdecked/twemoji) |
| Google Animated Noto Emoji | 8 个 WebP 动态礼物，实际文件来自 Google Fonts CDN | [googlefonts/noto-emoji-files](https://github.com/googlefonts/noto-emoji-files) · [动画资源与许可](https://googlefonts.github.io/noto-emoji-files/) |
| BilibiliGiftDropper | `public/physics.js` 中的掉落物理类改编；原始代码留存于 `upstream/` | [kevinyu2003/BilibiliGiftDropper](https://github.com/kevinyu2003/BilibiliGiftDropper) |

Twemoji 图形和本项目所用 Animated Noto Emoji 动画按 CC BY 4.0 署名。具体版权、文件来源和修改说明见 [CREDITS.md](CREDITS.md)。控制台、本地同步服务、预设、聊天和其他出场效果另行实现。

**公开发布前须确认：** BilibiliGiftDropper 当前未见明确代码许可证，署名本身不等于获得改编再发布授权；原参考图及头像也未确认公开分发授权。当前打包保留来源材料用于追溯，不代表这些内容已获得公开发布许可。本仓库未统一声明 MIT 等开源许可证。

## 需要什么软件

| 软件 | 用途与必要性 | 官方下载 / GitHub |
| --- | --- | --- |
| Windows 10 / 11，64 位 | 双击启动脚本和配套 DroidCam 驱动的使用环境 | 本项目的免安装包面向 Windows x64 |
| Edge / Chrome 等现代浏览器 | 打开礼物控制网页，必需 | [Edge](https://www.microsoft.com/edge/download) · [Chrome](https://www.google.com/chrome/) |
| OBS Studio | 叠加摄像头、背景、礼物和聊天画面；输出画面时使用 | [官网下载](https://obsproject.com/download) · [GitHub](https://github.com/obsproject/obs-studio) |
| DroidCam Virtual Output 插件 + 配套驱动 | 可选：把 OBS 画面输出到 QQ 等软件的摄像头选项；仅在需要这种输出方式时安装 | [项目仓库](https://github.com/dev47apps/droidcam-obs-virtual-output) · [安装包](https://github.com/dev47apps/droidcam-obs-virtual-output/releases) |
| Node.js 24 LTS | 源码包运行所需；免安装包已附带，无需另装 | [官网下载](https://nodejs.org/en/download) · [GitHub](https://github.com/nodejs/node) |

本项目没有 npm 第三方依赖，不需要 `npm install`，不需要 Python。OBS、浏览器、DroidCam 插件和驱动不包含在本项目压缩包内，请从官方链接获取。

## 快速开始

### 免安装运行包

完整解压后双击 `Start.vbs`（或「启动礼物演播台.vbs」），浏览器将打开 `http://127.0.0.1:17865/`。不要在压缩包内部直接运行。关闭服务使用 `Stop.vbs`。

### GitHub 源码包

先安装 Node.js 24 LTS，然后双击 `Start.vbs`；启动器优先使用 `runtime/node.exe`，没有内置运行时则查找系统 PATH 中的 Node.js。也可在项目目录执行：

```powershell
node server.cjs --open
```

源码包不附带体积较大的 `node.exe`。用户参数保存在首次运行时生成的 `data/` 中，打包不包含个人设置和自定义预设。

## OBS → QQ 的可选输出

1. 先退出 OBS，从 [DroidCam 插件 Releases](https://github.com/dev47apps/droidcam-obs-virtual-output/releases) 同时下载并安装 **OBS Virtual Output Plugin** 和 **DroidCam Drivers**，然后重开 OBS。不要误装成手机画面输入用的 DroidCam OBS Source 插件。
2. 打开 OBS「工具 → DroidCam」，勾选 **Active**。需要随 OBS 启用时可使用 **Auto-Start When OBS Loads**。
3. 在 QQ 的摄像头选项中选择 **DroidCam Video**；麦克风继续选择实际使用的麦克风。安装驱动后请检查 OBS 和 QQ 是否自动切换到了 DroidCam Audio。
4. 这是另一套虚拟摄像头输出路径，平台兼容性需要实际测试，不承诺规避平台检测。仅将本项目叠加到 OBS 画面时，无需安装此插件。

已在本机确认 OBS 32.2.2 可加载插件 0.2.2、驱动 7.1.2 状态正常；这不等于已验证 QQ 视频显示成功。插件 0.2.2 要求 OBS 29+，并移除了实验性 9:16 选项，竖屏输出需按 [发布说明](https://github.com/dev47apps/droidcam-obs-virtual-output/releases/tag/0.2.2) 另行处理旋转或画布适配。本项目 OBS 浏览器源本身支持 1080×1920。

## GitHub 上传说明

解压源码包，将其中项目文件夹的内容上传到仓库根目录，确保 `README.md` 直接位于仓库首页。不要只把 ZIP 文件上传成源码。免安装运行包适合放到 GitHub Releases 附件中。

`.gitignore` 排除了用户配置、日志、备份、依赖目录和内置 Node 可执行文件。上传前请先处理上面的待确认授权项；不要把当前整包直接标成 MIT 项目。

---
# 礼物演播台 · Gift Studio v2

新增固定一屏布局、10 个内置礼物预设、自定义预设、空白预设、可恢复的开始/停止投送，以及 6 类共 3000 条聊天消息。详细用法见 更新说明-v2.md。


## 启动

双击 **Start.vbs**（桌面版本也提供「启动礼物演播台.vbs」）。浏览器会自动打开控制台。免安装运行包内置 Windows Node.js；源码包需先安装 Node.js，无需 Python 或 npm 依赖安装；无需账号和直播间连接，所有图片和动画已保存在本地，运行时无需联网。

控制台：http://127.0.0.1:17865/

服务在后台运行，关闭网页不会停止。双击 **Stop.vbs**（「关闭本地服务.vbs」）可退出。再次启动会保留参数、昵称和消息库，但所有自动投送默认停止，避免意外投送。

## 接入 OBS

1. 保持项目本地服务运行。
2. OBS「来源」点「＋」→「浏览器」。
3. URL 填入：`http://127.0.0.1:17865/overlay.html?layer=all`
4. 默认竖屏宽 **1080**，高 **1920**。将该浏览器源放在摄像头或视频源上方，中间区域透明。
5. 如需声音，勾选「通过 OBS 控制音频」。音频监控是否开启请根据自己的监听需求设置。
6. 不要勾选「不可见时关闭源」，可避免切换场景时断开输出。隐藏期间投送是否继续由 OBS 的源运行状态决定。

页面中「接入 OBS」可以复制三种地址：

- 装饰＋聊天＋礼物：`/overlay.html?layer=all`
- 仅透明礼物：`/overlay.html?layer=effects`
- 仅透明装饰和聊天：`/overlay.html?layer=ui`

用作 OBS 输出的地址不要带 `demo=1` 或 `role=preview`，这两项用于显示棋盘格的本地预览。切换横屏后，请手动把 OBS 浏览器源尺寸改为 **1920×1080**，再次切回竖屏则改为 **1080×1920**。

## 投送礼物

- 第一版包含 **24 种普通礼物＋8 种现成卡通动画**。左侧先选 ×1／×5／×10／×20，点击卡片立即投送。
- 「参数」编辑当前礼物；在参数面板点「投送」测试当前礼物。
- 每个礼物独立设置出场方式、大小、水平／垂直位置、时长、运动速度、自动间隔、间隔抖动及自动投送数量。掉落型额外可设置重力与弹力。
- 右侧连击：同一种礼物在有效期内叠加数量，不显示昵称。不同礼物分别展示，最多同时五条；超过时移除最早的一条。
- 掉落堆叠：顶部掉落，落地弹跳、碰撞堆积。「画面设置」可切换持续保留，否则落地后按礼物停留时间淡出。水平位置决定掉落区域中心。
- 冲屏碎裂：礼物向镜头放大，撞击后绘制碎屏裂纹并自动消失。
- 其他方式包括飘浮、升空、流星划过、庆典与中央绽放。完整动画使用 Google Noto Emoji 的现成动画，再叠加出场运动。
- 普通礼物同时出现；完整动画排队播放，最多等待 24 个。完整动画 ×5 表示按顺序播放五次，避免遮挡。连续大量投送时会限制队列和场上数量以维持性能（最多 350 个堆叠粒子）。
- 「清空礼物」移除当前画面、连击和完整动画队列；它不关闭自动投送。需要全部停止时先点「停止自动投送」，再点「清空礼物」。

## 自动投送

1. 独立投送：编辑某个礼物，开启「独立自动投送」，再点击顶部「开始自动投送」；每种礼物可同时独立运行。
2. 随机礼物池：卡片上勾选「入池」，再开启「随机礼物池」并点击顶部「开始自动投送」，随机挑选池中一种礼物。数量使用该礼物的「每次自动投送」参数。
3. 抖动按间隔上下百分比计算。例如 2 秒、30%，每次间隔随机在 1.4～2.6 秒。首次投送也等待随机间隔。
4. 两种自动模式可以同时运行。全局「单次投送」只影响手动点击。

## 聊天与装饰

「模拟聊天」中可编辑昵称库、消息库（每行一条），点击「保存消息库」。消息随机选昵称和内容，支持间隔、抖动、显示行数、暂停、发一条和清空。聊天与礼物独立，不生成送礼人信息。

装饰根据用户提供的竖屏参考图重建为 HTML/CSS，保留顶部信息、关注按钮、活动贴纸和底部交互条等视觉结构；清理参考图中的拉伸条纹和白块，左下静态聊天改为动态消息。摄像头画面由 OBS 下方的视频源提供，本项目不访问摄像头。

完整动画音效为程序合成的短音符，不依赖联网素材；普通礼物静音。控制台内嵌预览始终静音，独立 OBS 输出遵循音量设置。普通浏览器的独立输出可能因自动播放策略需要用户先点击页面，OBS 中需实际确认声音。

## 文件

- `server.cjs`：本地 HTTP 服务、独立客户端同步、自动投送与聊天调度。
- `public/`：控制台、透明输出、素材与礼物配置。
- `data/settings.json`：自动保存的参数和消息库。
- `runtime/node.exe`：内置运行时。
- `upstream/app.original.js`：原 BilibiliGiftDropper 文件，保留用于来源追溯；掉落物理类在 `public/physics.js` 中适配，修正支撑检测和时间步长。
- `CREDITS.md`、`licenses/`：素材、代码及运行时来源和授权说明。

服务仅监听本机 `127.0.0.1:17865`，不开放局域网、不请求直播平台、不上传数据。此交付不包含实际 OBS 场景配置；在 OBS 中添加浏览器源即可。
