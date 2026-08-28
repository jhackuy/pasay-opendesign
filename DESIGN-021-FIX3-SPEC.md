# DESIGN-021-FIX3 · SPEC · 真实浏览器 390/430 BQA 全绿补丁规范

> **Spec 阶段专用文档** — 不进入 plan/tasks/implement，不修改产品/Harness/QA 脚本。
> 目标：从基线 **0 / 34** 推进到 Windows Chrome 151 (http://127.0.0.1:8790) 实测 **34 / 34 + __BQA_ALLPASS=true + consoleErrors=[ ] + pageExceptions=[ ]**。
> 本文档为基于当前失败证据（DESIGN-021-FIX1-BLOCKED §三、.qa-runtime/REVIEW-RESULT.md、.qa-runtime/real-browser-report-{390,430}.json、.qa-runtime/real-browser-qa-evidence.json）**重新制定的新规范**，**不**恢复 / 重建 Issue #20 已丢失的旧补丁。

| | |
|---|---|
| 契约 ID | PASAY-FIX3-SPEC-001 |
| Spec 路径 | `./DESIGN-021-FIX3-SPEC.md` |
| 分支 | `main` |
| HEAD (基线) | `96c5fb5630fb401709976f372a10e8742dd501e5` (`96c5fb5`) |
| 阶段 | **specify**（本阶段唯一允许产出） |
| 下游阶段 | **禁止**进入 plan / tasks / implement |

---

## 1. Background & 失败现状

### 1.1 已确证的硬证据（来自真实浏览器）

- 浏览器：Google Chrome 151 (channel=chrome, real launch, playwright-core 1.63.0-alpha-2026-08-05)
- 源：`http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html`
- 视口：390×900 与 430×900（deviceScaleFactor=1, isMobile=false）
- 17 canonical pages × 2 viewports = 34 entries → 实测 **`BQA_PASS=0 / 34`**（双视口同）

### 1.2 失败根因分类（与 REVIEW-RESULT.md 一致）

| 类别 | 触发类 | 当前 CSS | 命中 page 数 | 命中 entry 数 |
|---|---|---|---|---|
| **A. Touch 目标 < 44×44 CSS px** | `.topbar .tb-back` | `36 × 36` | 16 / 17 | ≥ 32 / 34 |
| | `.iconb` | `38 × 38` | 17 / 17 | 34 / 34 |
| | `.btn.sm` / `.btn.btn-s.sm` / `.btn.btn-g.sm` | `34 × auto` | 4 / 17 | ≥ 4 / 34 |
| | `.tab` / `.tab.on` | `padding 7×12` ≈ 30–34 高 | 3 / 17 | ≥ 14 / 34 |
| | `.fchip` / `.fchip.on` | `height: 30` | 2 / 17 | ≥ 9 / 34 |
| | `.attach` | `padding 8×11` ≈ 32 高 | 0 / 17 | 0 / 34 |
| **B. Tab / fchip 横向裁切** | `.tabs` 子项 `.tab` | padding+gap 总宽 > 视口 - 32 | 3 / 17 | 12 / 34 |
| | `.filters` 子项 `.fchip` | padding+gap 总宽 > 视口 - 32 | 1 / 17 | 2 / 34 |
| **C. 横向溢出** | `documentElement.scrollWidth > vw` 或 `app.scrollWidth > clientWidth` | — | 0 / 17 | 0 / 34 ✅ |
| **D. 控制台错误** | `GET /favicon.ico → 404` (每次 1 条) | serve.js 未处理 | 全局 | 全局 |
| **E. 页面未捕获异常** | `pageExceptions` | — | 0 | 0 ✅ |

> 注：A 与 B 同时触发时 BQA 仅记录其一（rects 数组 push 顺序由 querySelectorAll 决定）；实际修复后两类都必须独立达成 0。

### 1.3 已明确禁止的改动

- IA（信息架构）/ Bottom Nav 5 项 / 业务状态机 / 路由表（`#/…`）/ 文案（中英文）
- 新增任何虚假 CTA（不得为了通过 primaryAction 检查而给无主操作的页面"挂"按钮）
- 现有 `primaryAction`（`.btn-p` / `.btn.btn-p`）的视觉、语义、行为不变；如页面原本无主操作，**不得补造**
- `pasay-mini-app.html` 中 view 函数（`viewHome / viewProps / viewProperty / viewOps / viewFinance / viewRent / viewRepair / viewExp / viewMore / viewArchive / viewTeam / viewTenant / viewSetup / viewSwitch / viewSettings`）**不进入修改范围**

---

## 2. Goal & Non-Goals

### 2.1 Goal（必须达成）

1. Windows Chrome 151 → `http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html` 实测：
   - `window.__BQA_ALLPASS === true`
   - `window.__BQA_TOTAL === 34` 且 `window.__BQA_PASS === 34`
   - `report.summary.total === 34` 且 `report.summary.pass === 34`
   - `consoleErrors === []`
   - `pageExceptions === []`
   - 双视口（390 / 430）均满足
2. 所有真实交互目标 `getBoundingClientRect()` 在两视口下都满足 `height ≥ 44 && width ≥ 44 && right ≤ vw + 1 && left ≥ -1`
3. `document.documentElement.scrollWidth ≤ vw` 且 `app.scrollWidth ≤ app.clientWidth + 1`
4. `.tab` / `.fchip` 在水平滚动容器内必须可滚动到完整视图（无右侧裁切，即 QA gate 中的 `clipped:*` 必须为 0）

### 2.2 Non-Goals（明确不做）

- 不改 IA、不改 Bottom Nav 5 项、不改路由、不改文案、不改业务逻辑、不改 view 函数渲染输出
- 不新增 CTA、不修改 `.btn-p` 的现有语义
- 不修改 Node 侧的 `gates-runner.js` 与 `browser-qa-390-430.js` 的判定逻辑（仅允许维护 / 重生成其依赖的 harness 产物）
- 不修改 `__OD_RUN_BROWSER_QA` 内部对 **rect 几何 / overflow / bottomNavUsable** 的判定公式
- 不重启 / 不重构 `.qa-runtime/serve.js` 之外的运行时
- **不声明 FINAL PASS** 除非 §6 Acceptance 全绿 + 在真实 Chrome 151 双视口实测产生新证据

---

## 3. Scope of Change

按用户授权："不得修改产品、Harness、QA 脚本" 解读如下（与 §6 待澄清项关联）：

| 文件 | 是否可改 | 改什么 |
|---|---|---|
| `pasay-mini-app.html`（CSS 区块） | ✅ **仅 CSS 选择器 / 尺寸** | §4.1 触摸目标尺寸；§4.2 滚动容器修复；不触碰 `<script>` 块；不触碰 view 函数；不触碰 `.btn-p` 文案 |
| `pasay-mini-app.html`（JS 区块） | ❌ 不改 | 视函数 / `__OD_RUN_BROWSER_QA` / `__OD_GATE_*` 全部冻结 |
| `pasay-mini-app-bqa-390-430.html` | ✅ 仅由 build-bqa-harness.js 重生成 | 与 `pasay-mini-app.html` 内容态同步；不手工编辑 |
| `.qa-runtime/build-bqa-harness.js` | ❌ 不改（已知 §A.7 注入的 CELL/ROW/MONO_STYLE 必须保留） | — |
| `.qa-runtime/serve.js` | ✅ 仅 favicon 路由 | §4.3 加 `/favicon.ico` → 204 No Content（不返回 404） |
| `.qa-runtime/gates-runner.js` / `browser-qa-390-430.js` | ❌ 不改 | — |
| `.qa-runtime/real-browser-qa-*.{json,png}` / `real-browser-report-*.json` | ✅ 重跑后覆盖 | 新证据替换旧证据 |
| `DESIGN-021-FIX3-SPEC.md`（本文） | ✅ 持续维护 | 本阶段唯一产出 |

---

## 4. Functional Requirements

> **强制约束**：所有"实际交互目标" = 拥有 `click` / `data-a` / `href` / `tabindex` / `role=button` 之一的元素；纯展示元素（`.chip` / `.tag` / `.dot` / `.progress` 内条 / `.tl-i::before` 等）不在 44×44 范围内。

### 4.1 FR-1 · Touch 目标尺寸（≥ 44×44 CSS px）

| 选择器 | 当前尺寸 | 目标 | 实现要求 |
|---|---|---|---|
| `.topbar .tb-back` | `width: 36px; height: 36px` | **44 × 44** | `width: 44px; height: 44px`；图标 `svg` 居中保持（grid place-items: center 已存在，无需改） |
| `.iconb` | `width: 38px; height: 38px` | **44 × 44** | `width: 44px; height: 44px` |
| `.btn.sm` | `height: 34px; padding: 0 12px; font-size: 13px; border-radius: 9px` | **高 ≥ 44** | `min-height: 44px; padding: 0 14px; font-size: 13px`；宽度由内容决定（不变）；边框半径保持 9px |
| `.tab` / `.tab.on` | `padding: 7px 12px;` ≈ 30–34 高 | **高 ≥ 44** | `min-height: 44px; padding: 0 14px;` 内部文字 `display: flex; align-items: center` 或直接靠 padding 居中 |
| `.fchip` / `.fchip.on` | `height: 30px; padding: 0 12px` | **高 ≥ 44** | `min-height: 44px; padding: 0 14px`；`flex-shrink: 0` 保持 |
| `.attach` | `padding: 8px 11px` | **高 ≥ 44** | `min-height: 44px; padding: 10px 14px`；`svg { width: 16px; height: 16px }` 微调（可选） |

**实现要点**：
- **优先使用 `min-height` 而非 `height`**，避免破坏现有 inline / 横向滚动容器的视觉密度；`.tab` / `.fchip` / `.btn.sm` 在内容超长时仍可扩展
- 不允许通过外层 `padding-bottom` / `margin` 顶替（QA 用 `getBoundingClientRect` 测真实高度，transform / pseudo-element 不可见不算）
- 不修改 `box-sizing`（已是 `border-box`，见源码全局）

### 4.2 FR-2 · Tab / fchip 横向裁切修复

QA 中 "clipped:tab / clipped:fchip" 表示 `right > vw + 1`。根因：`.tabs` / `.filters` 容器为 `overflow-x: auto` 但容器宽度被父级（如 `.topbar` 后续 sticky 布局）挤压，最末几项虽可滚动，但 QA 在 `getBoundingClientRect` 时取的是未滚动前的位置，触发 `right > vw`。

修复策略（满足"零裁切"）：

1. **`.tabs` 容器**：确保 `display: flex; flex-wrap: nowrap; min-width: 0;` 并允许自身占满父级宽度（`width: 100%`）；其 `padding: 8px 16px` 不变；最后一项 `padding-right` 由容器内边距承担
2. **`.tab` 单项**：保持 `flex-shrink: 0`，宽度随内容；不再触发 `right > vw`（因容器不再被挤压）
3. **`.filters` 容器**：同上；`overflow-x: auto` 保留以支持横向滑动
4. **校验**：当 `.tab` / `.fchip` 容器宽度足够放下全部项目时，`overflow-x` 自然为 none，所有项 `right ≤ vw`；当容器宽度不足时，QA 需在脚本侧说明（见 §6 待澄清项 #2）

> 注：prop-detail / prop-fin / prop-repair 的 tabs 数量为 4–6，390 视口实际可放下，问题是父级宽度被挤压；本规范要求通过 CSS 修复该挤压，不得通过缩减 tab 文案或数量达成。

### 4.3 FR-3 · `/favicon.ico` 在 QA server 返回 204

`serve.js` 当前 `GET /favicon.ico → 404`，每次加载产生 1 条 console error，违反 `consoleErrors === []`。

修改 `.qa-runtime/serve.js`：

```js
// 在静态文件服务（fs.createReadStream 等）之前增加
if (req.url === '/favicon.ico' || req.url === '/favicon.ico?v=*') {
  res.writeHead(204, { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' });
  res.end();
  return;
}
```

要求：
- 仅作用于 `/favicon.ico` 自身（其他 404 仍由 fs 路径返回 404）
- 204 No Content 状态码 + 短缓存，避免浏览器反复请求
- 不影响 `pasay-mini-app.html` 内任何引用

### 4.4 FR-4 · 既有 `.btn-p`（primaryAction）保持不变

- 现有所有 `<button class="btn btn-p …">` 不改文案、不改 `data-a`、不改视觉
- 现有所有页面中**已自然存在**的 primaryAction 仍需被 QA 检为 true
- **不得**为 `primaryAction=false` 的页面（home / props / ops / finance / more / archive / setup / switch / settings）新增主操作按钮
- **不得**为这些页面修改 view 函数或挂 `<button class="btn btn-p">`

### 4.5 FR-5 · 与既有 QA gate 的语义兼容

`window.__OD_RUN_BROWSER_QA` 在 `pasay-mini-app.html` 第 13690 行的 `ok` 公式：
```
leaks.length === 0 && !docOverflow && !appOverflow && rects.length === 0 && bottomNavUsable && primaryAction && overlap === 0
```
**本规范严格不动该公式**。若 §4.1–4.4 全部生效后仍有页面 `primaryAction=false`，须通过 §6 待澄清项 #1 决定如何在不破坏 §2.2 Non-Goals 的前提下达成 34/34。

---

## 5. Out of Scope（明确不做）

- 视函数重写、IA 调整、新页面、新模块
- Telegram Bot / Design System / Theme 切换相关文件（`pasay-telegram-bot.html`、`pasay-design-system.html`、`pasay-theme-before-after-board.html`）
- 任何与 Performance / Accessibility 其它 WCAG 维度（颜色对比、focus 顺序、ARIA）相关的扩展（仅满足"触摸 ≥ 44"这一条）
- 任何对 `gates-runner.js` / `browser-qa-390-430.js` 的语义改动（这两脚本的 PASS 在 Node 沙箱内已绿；不可为"看起来更绿"而调整判定）
- 任何对 `.qa-runtime/build-bqa-harness.js` 的改动（其内容与 §A.7 注入修复一致，不得重写）

---

## 6. Acceptance Criteria（硬性验收）

### 6.1 必达项（任意一条 FAIL 即视为 SPEC 未达成）

| # | 项 | 验证方式 |
|---|---|---|
| AC-1 | `http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html` 在真实 Chrome 151 加载无脚本错误 | `window.__OD_RUN_BROWSER_QA` 不抛异常 |
| AC-2 | `window.__BQA_ALLPASS === true` | 两视口均 true |
| AC-3 | `window.__BQA_TOTAL === 34` && `window.__BQA_PASS === 34` | 两视口均满足 |
| AC-4 | `report.summary.total === 34` && `report.summary.pass === 34` && `report.allPass === true` | 由 harness 渲染于 `#__bqa_sum` |
| AC-5 | 所有 17 canonical pages × 2 viewports = 34 entries `ok === true` | `report.viewports['390'/'430'][i].ok === true` |
| AC-6 | `consoleErrors === []` | CDP `Runtime.consoleAPICalled`（无 `console.error`） |
| AC-7 | `pageExceptions === []` | CDP `Runtime.exceptionThrown`（无 `uncaught`） |
| AC-8 | 所有 `.btn / .nav-i / .iconb / button` 在两视口 `getBoundingClientRect().height ≥ 44 && width ≥ 44` | QA rects 数组为 `[]` |
| AC-9 | 所有 `.btn / .nav-i / .iconb / button` `rect.left ≥ -1 && rect.right ≤ vw + 1` | QA rects 数组无 `clipped:*` |
| AC-10 | `document.documentElement.scrollWidth ≤ vw` && `app.scrollWidth ≤ app.clientWidth + 1` | `docOverflow=false && appOverflow=false` |
| AC-11 | `/favicon.ico` 响应码 = 204 | `curl -I http://127.0.0.1:8790/favicon.ico` 返回 `204 No Content` |
| AC-12 | 既有 `.btn-p` 文案 / `data-a` / 视觉未变 | `git diff` 仅 CSS；view 函数零变更 |
| AC-13 | 17 canonical page 列表未变 | `window.__BQA_PAGE_COUNT === 17` |
| AC-14 | 未新增 CTA | 17 个 view 函数 + 全部 `data-a` 字面值与基线 `git diff` 一致（仅 CSS） |

### 6.2 禁止项回归（任意一条 FAIL 即视为破坏 IA / Nav / 业务）

- Bottom Nav 仍为 5 项（home / props / ops / finance / more 或同等顺序）
- 路由表（hash → view 函数映射）零变更
- view 函数渲染字符串对比基线 `96c5fb5`：除由 CSS 引发的视觉差异外，HTML 字符串内容零变化（QA 中 `leaks` 仍为 0）
- `.btn-p` 文案、`.qa`（quick action）4 项内容与顺序不变

---

## 7. Verification Procedure（不属本阶段，仅规范要求）

> 本阶段不执行下列步骤；列出仅为下游 implement 阶段约束。

1. 修复 `pasay-mini-app.html` CSS（§4.1, §4.2）
2. 修改 `.qa-runtime/serve.js`（§4.3）
3. `node .qa-runtime/build-bqa-harness.js` 重生成 `pasay-mini-app-bqa-390-430.html`
4. `node .qa-runtime/serve.js` 启动 8790 端口
5. 真实 Chrome 151 + playwright-core 经 `http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html` 加载
6. `window.__OD_RUN_BROWSER_QA()` 在两视口运行
7. 读取 `window.__BQA_ALLPASS / __BQA_TOTAL / __BQA_PASS / __BQA_PAGE_COUNT` 与 `window.__BQA_VERIFY`
8. 采集 CDP `console.error` 与 `Runtime.exceptionThrown`
9. 写入新证据至 `.qa-runtime/real-browser-qa-evidence.json`、`.qa-runtime/real-browser-report-{390,430}.json`、`.qa-runtime/real-browser-qa-{390,430}.png`
10. 全部 AC 满足 → 写 `DESIGN-021-FIX3-FINAL.md`（非本阶段产出）

---

## 8. Items to Clarify（待澄清）

下列项需用户在进入 plan/tasks/implement 前明确；本规范不擅自决断。

| # | 问题 | 选项 | 默认建议 |
|---|---|---|---|
| **C-1** | "不得修改产品"是否包含 `pasay-mini-app.html` 中 `window.__OD_RUN_BROWSER_QA` 这段嵌入的 QA gate JS？该 gate 在 line 13690 把 `primaryAction` 计入 `ok`。若 §4 严格执行后仍剩 9 页缺主操作（home/props/ops/finance/more/archive/setup/switch/settings），34/34 在不修改该 gate 的前提下无法达成 | (a) 视 `__OD_RUN_BROWSER_QA` 为产品一部分，**禁止修改**——则规范需配套给出可选策略如：① 让 build-bqa-harness.js 在 sum 计算时忽略 `primaryAction` 但保留每行 `Primary` 列；② 接受 §2.2 中"自然无 primaryAction 不得因此失败"= 在 harness 侧定义 allPass 公式时不计 primaryAction；(b) 视 `__OD_RUN_BROWSER_QA` 为 QA 基础设施，**允许**修改 `ok` 公式使其将 `primaryAction` 视为 informational-only | **(a-①)**：保持产品 JS 零变更；harness sum 公式去掉 primaryAction 列的 allPass 权重（仍展示列）。这是最不侵入产品的方案 |
| **C-2** | QA gate 的 `rects` 数组对 `overflow-x: auto` 容器内末端项的 "未滚动位置" 触发 `right > vw`，被视为裁切。若 `.tabs` / `.filters` 因视口宽度实际放不下全部 tab/fchip，CSS 修复是否要求 (a) 把容器宽度撑到能放下全部项（可能挤压 `.topbar` 标题区），还是 (b) 接受 `overflow-x: auto` 即合规，QA 应改判定 | (a) 容器始终能放下全部项；(b) `overflow-x: auto` 容器内末端项不算裁切（仅当 `scrollLeft` 可滚到该位置） | **(b)**：当前 17 页 tabs 数量在 390 视口实际可放下，根因是父级宽度挤压，不是滚动条本身——本规范 §4.2 已通过修复挤压消除裁切。若用户坚持 (b)，需授权 QA 改 `rects` 判定 |
| **C-3** | `.btn.sm` 提升到 `min-height: 44px` 后，在 `.appr-bar`（批准/拒绝双按钮并列）等横向布局中，按钮视觉密度明显变高（高度从 34→44 ≈ +29%）。该变更是否会被视觉评审视为"破坏 UI 节奏" | (a) 接受视觉变化；(b) 改用 `min-height: 44px` + 保持原 `font-size` / `padding` 不变但允许按钮变高 | **(b)** 已写在 §4.1：仅 `min-height` 与 `padding: 0 14px` 变化，不改 `font-size: 13px` 与 `border-radius: 9px` |
| **C-4** | `pasay-mini-app.html` 与 `pasay-mini-app-bqa-390-430.html` 是否需要由 build 工具确保 byte-level 同步（harness 内嵌 mini-app 副本） | (a) 仅 CSS 修改后两者人工同步；(b) 继续由 build-bqa-harness.js 在 §4.1 修复后重生成 | **(b)**：与既有 §A.7 注入修复一致 |
| **C-5** | 沙箱内 Chrome 是否在 implement 阶段可启动（DESIGN-013 §5、DESIGN-021-FIX1 §二均记 EPERM） | 若沙箱仍无法启动真实 Chrome，本规范的 §6 Acceptance 无法在本机落地，需由具备浏览器权限的环境执行 | 列出，不在本规范决断 |

---

## 9. Risk Register

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `.tabs` 容器宽度修复引入新溢出（标题被挤压） | 中 | 中 | §4.2 通过 `min-width: 0` + 容器占满父级处理；如仍挤压，需调 `.tabs` padding |
| `.btn.sm` 高度提升影响 `appr-bar` 双按钮布局 | 低 | 低 | 容器 flex / gap 已留 8px；按钮高度变化不影响 flex-wrap |
| `serve.js` favicon 204 修改引入静态文件路径冲突 | 低 | 低 | 仅匹配字面 `/favicon.ico` 与 `/favicon.ico?v=*` |
| 重生成 harness 时 `CELL/ROW/MONO_STYLE` 注入缺失（DESIGN-021-BQA-HARNESS-FIX-FINAL §一记） | 低 | 高 | 严格保留 `.qa-runtime/build-bqa-harness.js` 第 2–4 行注入；不重写 |
| 实施后仍有 ≥ 1 页 rectIssues / primaryAction 不达标 | 中 | 高 | 见 §8 C-1，依赖用户裁决 |
| 沙箱无法启动真实 Chrome 151 | 高（DESIGN-021-FIX1 已记） | 高 | 见 §8 C-5；本规范不决断 |

---

## 10. STOP（spec 阶段终止）

- 不进入 plan 阶段
- 不进入 tasks 阶段
- 不进入 implement 阶段
- 不修改任何产品 / Harness / QA 脚本
- 不提交、不推送、不创建 PR
- 本阶段唯一产出：本规范文件

---

## 11. Deliverables Return（按用户 §任务收尾要求）

| 项 | 值 |
|---|---|
| Spec 路径 | `./DESIGN-021-FIX3-SPEC.md` |
| 分支 | `main` |
| HEAD (基线) | `96c5fb5630fb401709976f372a10e8742dd501e5` (`96c5fb5`) |
| Acceptance 条目 | §6.1 共 14 项（AC-1 … AC-14）+ §6.2 禁止项 4 条 |
| 待澄清项 | §8 共 5 项（C-1 … C-5），其中 C-1 / C-5 为阻塞 implement 的关键项 |

---

**PASAY-FIX3-SPEC · SPECIFY PHASE COMPLETE · STOP · 不进入 PLAN/TASKS/IMPLEMENT**
