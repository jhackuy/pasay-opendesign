# DESIGN-021-FIX1 · 真实浏览器 QA 收尾 — **BLOCKED（未完成）** · 中文状态报告

> 状态：**BLOCKED — 不得声明完成 / 不得 FINAL PASS**
> 硬性验收中「真实浏览器 390/430 截图 + consoleErrors/pageExceptions 实采 + 16 canonical 页 = 32/32 + FINAL PASS」
> 依赖一项**本环境无法满足**的前置条件：沙箱无法启动任何真实 Chromium/Chrome。
> 因此按要求第 7 条「全部满足后才能 FINAL PASS」不满足，正式结论为 **BLOCKED/FAIL**（证据缺失）。

---

## 一、已完成并落地（git 卫生清理）

### 1. 删除误提交的浏览器 Profile / 缓存 / 运行时文件
- HEAD 由请求基线 `c9416749c82ecbfdab48f85f5634e08435d6090e` 前进至（仓库为每 1 分钟 auto-sync，见下）**`760e3087ba2053f0a781f81f4edb6933174dd102`**（随后 auto-sync 仅追加空测试残留，最终内容态稳定）。
- 已从 git 跟踪中移除 `real-browser-prof2/`（198 个文件）及其余全部浏览器 Profile 目录：
  `edge-debug-test/`、`chromium-profile-390/`、`chrome-prof-390-2/`、`chrome-prof-390-3/`、`cdp-prof-390/`、`cdp-prof-430/`、`chrome-prof`（裸文件）。
- 一并清除历史误提交的 `Cache / Cookies / History / Login Data / LOCK / LOG / *.log` 运行时文件。
- 核对：`git ls-files` 中 Profile/`prof/.qa-runtime` 相关文件 = **0**；`.qa-runtime` 跟踪文件数由 600+ → **53**。
- **应用文件零变更**：`pasay-mini-app.html`、`pasay-mini-app-bqa-390-430.html`、`index.html`、`browser-qa-390-430.js` 在本次所有提交中均未改动（满足第 6 条）。

### 2. `.gitignore` 已具备所需规则（HEAD 已含）
提交态 `.gitignore`（`git show HEAD:.gitignore`）已包含，无需新增：
```
.qa-runtime/real-browser-prof*/
.qa-runtime/*-prof*/
.qa-runtime/*-profile-*/
.qa-runtime/*profile*/
.qa-runtime/**/*Cache*/
.qa-runtime/**/cache.db*
.qa-runtime/**/LOCK
.qa-runtime/**/LOG
.qa-runtime/**/History*
.qa-runtime/**/Cookies*
.qa-runtime/**/Login Data*
.qa-runtime/**/*.log
.qa-runtime/serve.log
.qa-runtime/serve.err.log
```
后续再运行浏览器，其 user-data-dir / Cache / LOCK / LOG 均不会再被纳入版本库。

> 说明：本仓库由 OpenDesign 后台「auto sync」守护每约 1 分钟自动提交，故 HEAD 会持续滚动；上述「内容态」已稳定达成，不受限于单个 commit 号。

---

## 二、核心项 BLOCKED：localhost:8790 + Chrome CDP 真浏览器 QA 无法执行

按要求第 3、4、5 条，需要**真实浏览器**（origin `http://127.0.0.1:8790`、`typeof window.__OD_RUN_BROWSER_QA==='function'`、`__BQA_ALLPASS===true`、16 canonical 页 × 2 = 32/32、`consoleErrors=[]`、`pageExceptions=[]`、390/430 截图展示 PASS 汇总）。
本会话对全部可用浏览器执行路径做了逐项、可复现的诊断，**全部被沙箱拦截**：

| 尝试路径 | 结果 | 关键证据 |
|---|---|---|
| `chrome --version`（最简启动） | **-36863（=0xFFFF7001 / 4294930433）** | `crash server failed to launch, self-terminating`；`OpenProcess: 拒绝访问 (0x5)` |
| Chrome 原生 `--headless=new --dump-dom`（不经 CDP） | 启动即被杀 | 同上一行启动期自终止 |
| `playwright-core.chromium.connectOverCDP`（本地 spawn + WS） | WS 连接即断 | `<ws connected>…<ws disconnected> code=1006` |
| `playwright-cli open`（daemon 会话） | EPERM | 无法写 `…ms-playwright\daemon\…\default.err` |

结论与本项目既有记录（DESIGN-013 §5，同 session 已收集「Chromium Mojo IPC 被系统策略拦截，EPERM」）一致：**该沙箱在系统策略层禁止任何 Chrome/Chromium 进程存活**（即便 `--version` 也无法退出 0）。因此「真实浏览器 CDP QA 截图」与「真实浏览器实采 consoleErrors/pageExceptions」在本环境**不可生成**。

### 3. 既有 `real-browser-qa-evidence.json` 亦不达标（非通过）
当前磁盘上的证据文件 `.qa-runtime/real-browser-qa-evidence.json`：
- 目标为 `pasay-mini-app-bqa-390-430.html`、**pages=17 → total=34**（≠ 要求的 canonical 16 → 32）；
- **`430` 视口 pass=17/34，allPass=false**（390 为 34/34）；
- 因此即使视为「真实快照」，也**不满足** `32/32 + __BQA_ALLPASS===true`。

该文件是历史尝试留下的未通过产物，**不能作为本次验收证据**；本报告将其如实标注为未通过，未做任何改写或粉饰。

---

## 三、硬性验收核对表（全部真实核对）

| 验收项 | 当前 | 结论 |
|---|---|---|
| origin = `http://127.0.0.1:8790` | 服务可达，返回 `pasay-mini-app.html`（HTTP 200，`__OD_RUN_BROWSER_QA` 与 `#app` 均在） | ✅ 服务侧满足（浏览器加载步骤被拦截） |
| `typeof window.__OD_RUN_BROWSER_QA === "function"` | 应用内存在（静态核对通过） | ✅（静态） |
| `window.__BQA_ALLPASS === true` | 需真浏览器执行后才有 | ❌ 不可生成 |
| canonical pages = 16 / total=32 / pass=32 | 需真浏览器执行后才有 | ❌ 不可生成 |
| `consoleErrors=[]` / `pageExceptions=[]` | 需真浏览器实采 | ❌ 不可生成 |
| 390/430 截图显示真实 PASS summary | 需真实渲染 | ❌ 不可生成 |
| `gates-runner.js` EXIT=0 | 未重跑（其 BROWSER 门用 Node stub 校验暴露+结构 QA，非本收尾重点） | 未变更 |
| `browser-qa-390-430.js` EXIT=0 | 历史结果写为 34/34；本次未改该脚本 | 未变更 |

> 任何一项 ❌ 存在 → 依第 5 条「任何证据缺失都必须报告 BLOCKED/FAIL」，且第 7 条「全部满足后才能 FINAL PASS」。

---

## 四、结论

- **FINAL PASS：不声明、不授予。**
- 状态：**BLOCKED**。
- 阻塞条件（已 ≥ 持续且可复现）：沙箱**无法启动任何真实 Chromium/Chrome**（`--version` 亦退出 4294930433），且 CDP WebSocket 被掐断——故「真实浏览器 390/430 截图 + 实采 consoleErrors/pageExceptions + 16 canonical/32 全绿」这组硬性证据**在本环境不可生成**。
- 已如实保留 `launch-diag.txt` 作为启动拦截证据；未伪造任何截图/JSON 通过项。

### 建议的解除路径（供 reviewer / 更高权限环境）
1. 在**非受限环境**（本机真实 Chrome/Edge 原生、或允许启动浏览器的 Runner/CI）执行第 4 条要求的 5 个证据文件：`real-browser-qa-evidence.json`、`real-browser-report-390.json`、`real-browser-report-430.json`、`real-browser-qa-390.png`、`real-browser-qa-430.png`（origin `127.0.0.1:8790`，16 canonical 页 × 390/430 = 32 项全 PASS，`__BQA_ALLPASS=true`，零 console/page 异常）。
2. 或由具备浏览器运行权限的会话重开本任务，将在 `serve.js`（端口 8790）上运行 `pasay-mini-app.html`，执行 `__OD_RUN_BROWSER_QA()` 并采集截图与异常。

## 五、Changed files（本次会话实际触碰）
- `git` 跟踪层：移除了全部 `.qa-runtime/*prof*` 浏览器 Profile/运行时文件（已进入历史）→ 交付态跟踪文件 -约 550 余个。
- `.gitignore`：HEAD 已含所需规则（无净变更）。
- `.qa-runtime/launch-diag.txt`：浏览器启动拦截诊断证据（`chrome --version` → exit 4294930433）。
- **未改**：`pasay-mini-app.html`、`pasay-mini-app-bqa-390-430.html`、`index.html`、`browser-qa-390-430.js`、`gates-runner.js`、IA、业务逻辑、设计。

---
**PASAY-MINIAPP · DESIGN-021-FIX1 = BLOCKED（git 卫生已清，真浏览器证据环境不可生成）· 不得声明完成**