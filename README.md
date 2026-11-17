# GitHub Desktop 中文版

[GitHub Desktop](https://desktop.github.com/) 是 GitHub 官方开源的 [Electron](https://www.electronjs.org/) 桌面客户端，使用 [TypeScript](https://www.typescriptlang.org) 编写、[React](https://reactjs.org/) 渲染界面。

本仓库是官方 [`desktop/desktop`](https://github.com/desktop/desktop) 的 **简体中文（zh-CN）汉化分支**：界面文案已从英文硬编码改为简体中文，功能与上游保持一致。

- 本仓库：[`beyondChang/GitHubZh`](https://github.com/beyondChang/GitHubZh)
- 上游：[`desktop/desktop`](https://github.com/desktop/desktop)（`upstream` 远程，`development` 分支）

> 下图为官方英文界面截图。本分支运行时，界面、菜单、弹窗与无障碍文本均为简体中文。

<picture>
  <source
    srcset="https://user-images.githubusercontent.com/634063/202742848-63fa1488-6254-49b5-af7c-96a6b50ea8af.png"
    media="(prefers-color-scheme: dark)"
  />
  <img
    width="1072"
    src="https://user-images.githubusercontent.com/634063/202742985-bb3b3b94-8aca-404a-8d8a-fd6a6f030672.png"
    alt="GitHub Desktop 界面：查看更改并提交，两个共同作者已署名"
  />
</picture>

## 与官方版的区别

汉化改动集中在界面文案层，不改变任何业务逻辑：

- **应用界面**：欢迎页、仓库列表、更改/历史侧栏、分支面板、克隆与创建仓库对话框、差异视图、教程页等
- **设置页**：账号、集成、Git、外观、通知、提示词、Copilot、高级、辅助功能
- **菜单栏**：文件、编辑、视图、仓库、分支、帮助（含帮助下的开发测试菜单）
- **各类弹窗**：分支与标签操作、检出/重置、放弃更改、发布仓库、暂存、多提交操作（合并/变基/拣选/冲突解决）、Copilot 相关确认框
- **无障碍文本**：`aria-label`、`sr-only` 播报、屏幕阅读器提示
- **对应测试**：`app/test/unit/ui/` 中依赖界面文案的断言已同步为中文

以下内容**有意保留英文**，以保证可用性与可维护性：

- 品牌与产品名：`GitHub`、`GitHub Desktop`、`GitHub Copilot`、`GitHub Enterprise`、`Git LFS`、`Atom` 等
- 技术标识：DOM `id`/`className`、API 状态值、分支名示例、URL、占位符、模型名
- 开发诊断输出：`log.*` 日志、`throw new Error`、`assertNever` 消息

## 如何获取

**官方分发的安装包不包含本分支的汉化改动。** 要使用中文版，需要从本仓库源码自行构建（见下文）。

如果你只需要英文版，可直接使用官方安装包：

- [macOS](https://central.github.com/deployments/desktop/desktop/latest/darwin)
- [macOS (Apple silicon)](https://central.github.com/deployments/desktop/desktop/latest/darwin-arm64)
- [Windows](https://central.github.com/deployments/desktop/desktop/latest/win32)
- [Windows 全机安装](https://central.github.com/deployments/desktop/desktop/latest/win32?format=msi)

## 构建与运行

### 环境要求

- Node.js ≥ 22.12.0（推荐 [`.nvmrc`](./.nvmrc) 指定的版本）
- npm（随 Node 附带）
- Git

详细步骤见 [`docs/contributing/setup.md`](./docs/contributing/setup.md)。

### 安装依赖并构建

```bash
git clone https://github.com/beyondChang/GitHubZh.git
cd GitHubZh
npm ci          # 首次安装依赖
npm run build:dev
```

### 开发模式运行（推荐）

```bash
npm start
```

启动本地热更新服务（`http://localhost:3000`）并拉起 Electron 应用，界面为简体中文。

> 本分支对 `script/start.ts` 做了一处小改动：若打包产物 `dist/` 缺失（例如打包阶段因网络原因失败），会自动回退到 `electron + out/` 启动，开发模式仍可正常使用。若 `dist/` 存在，则行为与上游一致。

常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm ci` | 安装依赖 |
| `npm run build:dev` | 构建开发版（编译 + 打包） |
| `npm start` | 开发模式运行（热更新） |
| `npm run compile:dev` | 仅编译 TypeScript/webpack |
| `npx tsc --noEmit -p tsconfig.json` | 类型检查 |
| `npm test` | 运行单元测试 |

## 自动更新与发版

官方 GitHub Desktop 的更新源是 `central.github.com`（`script/dist-info.ts` 中的 `getUpdatesURL()`）。若不改，汉化版检测到更新后会下载**官方英文版**安装包，导致汉化全部丢失。

本分支已把 `getUpdatesURL()` 指向**本仓库自己的 Release**：

```text
https://github.com/beyondChang/GitHubZh/releases/latest/download/RELEASES
```

这样更新到的仍是本仓库的中文版。该地址在编译期注入二进制（`app/app-info.ts` 的 `__UPDATES_URL__`），写进去后无法远程更改，因此使用 GitHub 的 `latest` 稳定路径——每次发布新版本都会自动生效，无需重新构建客户端。

### 发布新版本

1. 构建并生成 Squirrel.Windows 更新包（`electron-winstaller` 产出 `RELEASES` + `*.nupkg` + `*Setup*.exe`）：

```bash
NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:7890 npm run build:dev
npm run package
```

2. 创建 Release，**必须是正式版（非预发布）**，否则 `latest` 不会指向它：
   - 上传 `RELEASES`
   - 上传 `RELEASES` 中列出的 `*.nupkg`，**文件名必须与 `RELEASES` 内记录的名字完全一致**，否则 Squirrel 下载会 404。注意 `script/package.ts` 会在 `electron-winstaller` 打包**之后**把 nupkg 重命名加上 `-x64-`，而不会同步改 `RELEASES`，上传时需按 `RELEASES` 中的原名传
   - 可选：上传 `*Setup*.exe` 供手动下载（Squirrel 更新不依赖它）

3. 递增 `app/package.json` 的版本号、补充 `changelog.json`，再提交。

### 已知限制

- **未签名**：汉化版没有 GitHub 的代码签名证书，Windows SmartScreen 可能对更新安装包告警。
- **资产不可变**：Release 资产上传后不可改名，`RELEASES` 内容与已上传资产名需持续对齐。
- 官方 `changelog.json`、遥测等仍指向 GitHub 官方地址，与安装包是否被覆盖无关。

## 同步上游

汉化改动全部位于工作树文案层，通常可与上游直接合并：

```bash
git remote add upstream https://github.com/desktop/desktop.git   # 已添加可跳过
git fetch upstream
git merge upstream/development
```

若上游改动了同一段界面文案，需重新把新增的英文翻译为中文（按上文「有意保留英文」的规则判断取舍）。

## 参与翻译

欢迎补充与修正界面文案：

1. 在 `app/src/` 下将目标英文文案改为简体中文，只改字符串内容，不改代码结构
2. 若该文案被 `app/test/unit/ui/` 的断言引用，同步更新断言
3. 保持术语一致，例如：提交、分支、仓库、拉取请求、暂存、变基、拣选、冲突、远程、账号、凭据
4. 提交信息沿用 `i18n(zh-CN): 翻译……` 风格
5. 提交前运行 `npx tsc --noEmit -p tsconfig.json` 与 `npx eslint --rulesdir ./eslint-rules <改动文件>`

相关文档：[贡献指南](./.github/CONTRIBUTING.md)、[代码风格](./docs/contributing/styleguide.md)、[工程价值观](./docs/contributing/engineering-values.md)

## 更多资源

- [desktop.github.com](https://desktop.github.com) — 官方产品页
- [入门文档](https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop) — 官方使用指南
- [文档目录](./docs/) — 开发相关文档

## 许可证

**[MIT](LICENSE)**

MIT 许可不涵盖 GitHub 的商标，包括徽标设计。GitHub 保留对所有 GitHub 商标的全部商标与版权权利。GitHub 的徽标包括例如「logos」文件夹（[logos](app/static/logos)）中文件名含 "logo" 的 Invertocat 风格化设计。

GitHub® 及其风格化版本、Invertocat 标记均为 GitHub 的商标或注册商标。使用 GitHub 徽标时，请务必遵循 GitHub [徽标使用规范](https://github.com/logos)。
