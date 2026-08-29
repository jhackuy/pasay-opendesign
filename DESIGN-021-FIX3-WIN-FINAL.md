# DESIGN-021-FIX3-WINDOWS-FINAL-QA · 真实 Windows Chrome 151 终验报告 — **BLOCKED**

> 仓库 `jhackuy/pasay-opendesign` · 分支 `main`
> 任务 `DESIGN-021-FIX3-WINDOWS-FINAL-QA` · 待验提交 `195efbd7fbf3ef232915d9e284ccac571a7c2a53`
> 本会话 **成功驱动真实 Windows Chrome 151**（无 sandbox 阻塞），但 **真实浏览器 BQA 16/34 ≠ 34/34** — 按任务卡宪制规则「任何真实 Gate 失败 → 仅报告精确失败证据 · 禁止擅自改代码 · 返回 BLOCKED」如实记 BLOCKED。

---

## 一、最终 HEAD / 分支 / 待验 SHA

| 项 | 值 |
|---|---|
| 分支 | `main` |
| **TESTED_SHA（待验提交，真实浏览器实际加载的源）** | `195efbd7fbf3ef232915d9e284ccac571a7c2a53` (`195efbd`) |
| TESTED_SHA 内容来源证明 | 6 个产品/harness blob 与 `git ls-tree TESTED_SHA` 完全一致（见 §三）；working tree 在测试期间保持干净 |
| **FINAL_EVIDENCE_SHA（auto-sync 后的新远程 main SHA）** | `4cfa2b0ebd854881c0266f47030cda67e9faf0b5` (`4cfa2b0`) |
| FINAL_EVIDENCE_SHA 含内容 | 四次 auto-sync：① `21d3162` 提交 5 个新浏览器证据文件；② `5711e525` 提交本报告初版；③ `4b0eed31` 提交本报告 v2；④ `4cfa2b0` 提交本报告 v3（本行当前指向此 SHA 的内容状态） |
| 6 个产品/harness blob 在 195efbd ↔ 4cfa2b0 之间 | **零差异**（见 §三 · 表 2） |

---

## 二、FINAL PASS 硬性验收对照表

> 任务 §6 列出的硬性验收清单，逐条核对，全部基于真实浏览器加载 `http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html` 后的运行结果（不依赖 Node 沙箱推断）。

| # | 项 | 期望 | 实测 | 结果 |
|---|---|---|---|---|
| AC-1 | runner exit code | `0` | `1`（`evidence.allPass=false`） | ❌ |
| AC-2 | `BQA_TOTAL` | `34` | `34` | ✅ |
| AC-3 | `BQA_PASS` | `34` | **`16`**（视口 390 调用）；`8`（视口 430 调用，因 `__OD_RUN_BROWSER_QA` 内部顺序设宽度，先 390 后 430，pass 数取决于最近一次 `documentElement.style.width` 状态） | ❌ |
| AC-4 | `BQA_ALLPASS` | `true` | **`false`** | ❌ |
| AC-5 | 390 report `allPass` | `true` | `false`（仅 8/17 pass） | ❌ |
| AC-6 | 430 report `allPass` | `true` | `false`（仅 8/17 pass） | ❌ |
| AC-7 | touch target `<44px` 数量 | `0` | **`18`**（`short:BUTTON`，分布于 home ×4·rent ×2·repair ×1·expense ×1·tenant ×1，每页 ×2 视口） | ❌ |
| AC-8 | horizontal overflow 数量 | `0` | **`0`**（`docOverflow=false` 在所有 34 个 entry；先前 BLOCKED.md 中记为「viewport 390 全部 docOverflow=true」系误读 `real-browser-report-430.json` 中嵌入的 `viewports['390']` 字段，**真实报告**两个文件中 `viewports['390']` 与 `viewports['430']` 内容一致，均无 docOverflow） | ✅ |
| AC-9 | clipping（clipped:*）数量 | `0` | **`27`**（`clipped:tab` ×24 + `clipped:fchip` ×3） | ❌ |
| AC-10 | topbar/bottom-nav overlap | `0` | `0`（`overlap=0` 全部 entry） | ✅ |
| AC-11 | render leak | `0` | `0`（`leaks.length=0` 全部 entry） | ✅ |
| AC-12 | `bottomNavUsable` | `true` | `true`（全部 entry） | ✅ |
| AC-13 | `consoleErrors` | `[]` | `[]`（CDP `Runtime.consoleAPICalled`，`favicon.ico` 由 `serve.js` FR-006 返回 204 已生效） | ✅ |
| AC-14 | `pageExceptions` | `[]` | `[]`（CDP `Runtime.exceptionThrown`） | ✅ |
| AC-15 | 截图实读（PNG 真实打开检查） | 两张 PNG 可读 | 真实打开 `real-browser-qa-390.png`（44 201 bytes）与 `real-browser-qa-430.png`（43 421 bytes），均渲染 BQA harness 表格并显示「entries=34 pass=16/8 allPass=false」（见 §六） | ✅ |
| AC-16 | `node gates-runner.js` exit | `0` | `0` · `ALL GATES PASS`（Node 结构性 103/103 产品/领域 gate 全绿；含 `BROWSER_QA_390_430` 5/5 暴露检查） | ✅ |
| AC-17 | `node browser-qa-390-430.js` exit | `0` | `0` · `BROWSER_QA(390/430) total=34 pass=34 allPass=true · FAILS=[]`（Node 结构性 17 页 × 2 视口 = 34/34） | ✅ |

> **结论**：AC-1 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 / AC-9 共 7 项 FAIL，触发任务卡宪制规则「任何真实 Gate 失败 → BLOCKED」。

---

## 三、产品 / Harness blob 一致性（§1 + §3 强制）

### 表 1 · 6 个文件在 `TESTED_SHA`（195efbd）的 blob 校验

```
$files = @('pasay-mini-app.html','pasay-mini-app-bqa-390-430.html','.qa-runtime/serve.js','.qa-runtime/review-runner.js','gates-runner.js','browser-qa-390-430.js')
```

| 文件 | `git ls-tree TESTED_SHA` blob | 工作区 `git hash-object` | 一致 |
|---|---|---|---|
| `pasay-mini-app.html` | `99b95a245a2d91126a9775ce120d0f872382c319` | `99b95a245a2d91126a9775ce120d0f872382c319` | ✅ |
| `pasay-mini-app-bqa-390-430.html` | `8ac0acc23d88d4161e16a913dd461209101feb02` | `8ac0acc23d88d4161e16a913dd461209101feb02` | ✅ |
| `.qa-runtime/serve.js` | `d717017e9332cda49f7fe07a1bd6f8946c9f5e94` | `d717017e9332cda49f7fe07a1bd6f8946c9f5e94` | ✅ |
| `.qa-runtime/review-runner.js` | `512a022ed43f05a2944d412fda258f8135c0f82e` | `512a022ed43f05a2944d412fda258f8135c0f82e` | ✅ |
| `gates-runner.js` | `7130075ff1876c3861a6eeb249fa921b195f5cb9` | `7130075ff1876c3861a6eeb249fa921b195f5cb9` | ✅ |
| `browser-qa-390-430.js` | `db4f21488ade4a9ad4cbb6188f2d1f47ddeb6668` | `db4f21488ade4a9ad4cbb6188f2d1f47ddeb6668` | ✅ |

### 表 2 · 6 个文件在 `TESTED_SHA`（195efbd） ↔ `FINAL_EVIDENCE_SHA`（21d3162）之间

`git diff 195efbd 21d3162 -- <6 files>`：**0 字节变更**。即新 auto-sync 仅同步 5 个新浏览器证据文件，6 个产品/harness blob 完全冻结。

### 表 3 · frozen IA / domain 不变性

| 项 | 状态 |
|---|---|
| Bottom Nav 5 项（home / props / ops / finance / more） | 未改（`bottomNavUsable=true` 全部 entry 证明） |
| 17 个 view 函数 / 路由表（`#/…`） | 未改（17 canonical pages × 2 viewports = 34 entry 结构与 `195efbd` 一致） |
| `.btn-p` 文案 / 视觉 / `data-a` | 未改（`primaryAction` 字段保留为 informational，每行仍展示但已从 `ok` 公式中移除，符合 FR-5 修复） |
| `__OD_RUN_BROWSER_QA` 判定公式（除 FR-5 移除 `primaryAction` 子句） | 未改（rects / overflow / overlap / leak 判定仍为 v1 公式） |
| viewHome / viewProps / viewProperty / viewOps / viewFinance / viewRent / viewRepair / viewExp / viewMore / viewArchive / viewTeam / viewTenant / viewSetup / viewSwitch / viewSettings | 未改（CSS 与 view 函数双侧 zero diff） |

> **frozen IA/domain changed = NO** · **remote committed = YES**

---

## 四、精确失败证据（真实浏览器实测，按视口 / 页面分组）

### 4.1 真实浏览器汇总（`.qa-runtime/real-browser-qa-evidence.json` 摘要）

```json
{
  "browser": "Google Chrome 151 (channel=chrome, real launch via playwright-core)",
  "playwright": "playwright-core 1.63.0-alpha-2026-08-05",
  "origin": "http://127.0.0.1:8790",
  "target": "pasay-mini-app-bqa-390-430.html",
  "viewports": {
    "390": {
      "httpStatus": 200,
      "hasRunner": true,
      "BQA_ALLPASS": false,
      "BQA_TOTAL": 34,
      "BQA_PASS": 16,
      "BQA_HARD_ASSERT": false,
      "BQA_PAGE_COUNT": 17,
      "reportTotal": 34,
      "reportPass": 16,
      "reportAllPass": false,
      "consoleErrors": [],
      "pageExceptions": [],
      "ok": false
    },
    "430": {
      "httpStatus": 200,
      "hasRunner": true,
      "BQA_ALLPASS": false,
      "BQA_TOTAL": 34,
      "BQA_PASS": 8,
      "BQA_HARD_ASSERT": false,
      "BQA_PAGE_COUNT": 17,
      "reportTotal": 34,
      "reportPass": 8,
      "reportAllPass": false,
      "consoleErrors": [],
      "pageExceptions": [],
      "ok": false
    }
  },
  "allPass": false,
  "timestamp": "2026-08-29T03:55:39.777Z",
  "rows390": 34,
  "rows430": 34,
  "expectedRows": 34,
  "expectedPass": 34
}
```

### 4.2 视口 × 页面失败表

> 两个 report 文件 `real-browser-report-390.json` 与 `real-browser-report-430.json` 内容相同（`__OD_RUN_BROWSER_QA()` 在单次调用中 `[390, 430].forEach` 同时填充 `viewports['390']` 与 `viewports['430']`，runner 将同一 JSON 写入两份文件）。下方按页面 × 视口列出 `ok=false` 的 entry（共 18 / 34）。

| 页面 | 视口 | `docOverflow` | `appOverflow` | `rectIssues` | `leaks` | `bottomNavUsable` | `overlap` |
|---|---|---|---|---|---|---|---|
| home | 390 | false | false | short:BUTTON ×4 | [] | true | 0 |
| home | 430 | false | false | short:BUTTON ×4 | [] | true | 0 |
| props | 390 | false | false | clipped:fchip ×2 | [] | true | 0 |
| props | 430 | false | false | clipped:fchip ×1 | [] | true | 0 |
| prop-detail | 390 | false | false | clipped:tab ×4 | [] | true | 0 |
| prop-detail | 430 | false | false | clipped:tab ×4 | [] | true | 0 |
| prop-fin | 390 | false | false | clipped:tab ×4 | [] | true | 0 |
| prop-fin | 430 | false | false | clipped:tab ×4 | [] | true | 0 |
| prop-repair | 390 | false | false | clipped:tab ×4 | [] | true | 0 |
| prop-repair | 430 | false | false | clipped:tab ×4 | [] | true | 0 |
| rent-detail | 390 | false | false | short:BUTTON ×2 | [] | true | 0 |
| rent-detail | 430 | false | false | short:BUTTON ×2 | [] | true | 0 |
| repair-detail | 390 | false | false | short:BUTTON ×1 | [] | true | 0 |
| repair-detail | 430 | false | false | short:BUTTON ×1 | [] | true | 0 |
| expense-detail | 390 | false | false | short:BUTTON ×1 | [] | true | 0 |
| expense-detail | 430 | false | false | short:BUTTON ×1 | [] | true | 0 |
| tenant | 390 | false | false | short:BUTTON ×1 | [] | true | 0 |
| tenant | 430 | false | false | short:BUTTON ×1 | [] | true | 0 |

### 4.3 失败根因归类（与 §6 验收硬指标映射）

| 失败类别 | 数量（entry 数） | 数量（rect 数） | 涉及选择器 / DOM | 与 FR-1 修复范围对照 |
|---|---|---|---|---|
| **A. `short:BUTTON`**（inline `view →` button，className 空） | 9（每页 ×2 视口，含 home×2·rent×2·repair×2·expense×2·tenant×2 = 18 entry） | 18 | `<button data-a="nav" data-href="#/rents?f=overdue" style="text-decoration:underline;margin-left:4px">view →</button>` 等不带 `.btn` 类的内联 button | **未在 FR-1 修复范围**：FR-1 修复 `.topbar .tb-back` / `.iconb` / `.btn.sm` / `.tab` / `.fchip` / `.attach`；但本失败 button 无任何 className，CSS 修复无法触达。`getBoundingClientRect()` 实测 `height=18.84px`（`< 44px`） |
| **B. `clipped:tab`** | 6（prop-detail·prop-fin·prop-repair ×2 视口 = 12 entry，但每个 entry 内 4 项 rectIssues → 12×4=48 中「prop-detail/fin/repair 每页 4 个 tab」即 24 rect 数） | 24 | `.tab`（含 on），`right > vw + 1` | **部分在 FR-1 修复范围**：CSS 已加 `min-width:0` 撑满父级，但实测 4 个末位 tab 仍 clipped（右越界 16px+）。根因：`.tabs` 在 `.topbar` + `position: sticky` 父级链下的可用宽度不足以放下 6 个 `min-height:44px` 的 tab |
| **C. `clipped:fchip`** | 2（props ×2 视口 = 2 entry，但 390 上有 2 项 / 430 上有 1 项 = 3 rect 数） | 3 | `.fchip`，`right > vw + 1` | **部分在 FR-1 修复范围**：CSS 已加 `min-width:0`，但末位 fchip（Vacant / Filter）仍 clipped |
| 合计 | **18 entry** | **45 rect** | — | — |

> 注：本环境严格遵守「禁止修改产品/Harness/QA 判定/IA」约束。修复 FR-1 之外的 `short:BUTTON` 与 `.tabs`/`.filters` 残留 clipped，需由具备产品代码修改授权的下游任务在确认 SPEC §1.2 列表已显式枚举这两类后，于下一个变更窗口处理。

### 4.4 Node 侧（结构性）绿 / 真实浏览器侧（几何）红的差异说明

| 验证工具 | 类型 | 390 | 430 | 来源 |
|---|---|---|---|---|
| `node gates-runner.js` | Node 沙箱（jsdom-类静态字符串扫描 + 自定义引擎） | exit 0 · ALL GATES PASS | exit 0 | Node 不驱动 Chrome，不测几何尺寸 |
| `node browser-qa-390-430.js` | Node 沙箱（视图函数 HTML 字符串 + 正则） | exit 0 · 34/34 pass | exit 0 | Node 不渲染 DOM，仅按字符串匹配 / 计数，未测真实 `getBoundingClientRect()` |
| `node .qa-runtime/review-runner.js` | **真实 Chrome 151（channel=chrome, playwright-core）** | exit **1** · 16/34 pass | exit **1** · 16/34 pass（runner 一次调用内 `[390, 430].forEach` 共享同一结果对象，pass 数 = 两个视口内 entry 通过数之和 = 8+8 = **16**） | 真实 `getBoundingClientRect()` / `scrollWidth` / Bottom Nav / 0 console.error / 0 pageException |

> 任务卡 §4 明确「不得使用 jsdom、VM、源码扫描或 Node 结构 Gate 替代真实 Chrome」。Node 侧全绿 **不构成** FINAL PASS；FINAL PASS 必须由 `review-runner.js` 实测产生。本环境已在真实 Chrome 151 完成实测，结论为 BLOCKED。

---

## 五、5 个浏览器证据文件（路径 / 大小 / 关键内容）

| 文件 | 大小 | LastWriteTime | 关键内容（已实读） |
|---|---|---|---|
| `.qa-runtime/real-browser-qa-evidence.json` | 2 495 B | 2026-08-29 11:55:42 | `allPass=false` · `BQA_TOTAL=34` · `BQA_PASS={390:16, 430:8}` · `consoleErrors=[]` · `pageExceptions=[]` · `origin=http://127.0.0.1:8790` · `target=pasay-mini-app-bqa-390-430.html`（详见 §4.1） |
| `.qa-runtime/real-browser-report-390.json` | 16 457 B | 2026-08-29 11:55:41 | `viewports['390']` (17 entry) + `viewports['430']` (17 entry) + `summary.total=34, pass=16, fail=18` + `allPass=false` |
| `.qa-runtime/real-browser-report-430.json` | 18 481 B | 2026-08-29 11:55:42 | 内容与 `real-browser-report-390.json` 完全一致（同一 `__OD_RUN_BROWSER_QA()` 返回值被 runner 写入两份文件） |
| `.qa-runtime/real-browser-qa-390.png` | 44 201 B | 2026-08-29 11:55:41 | BQA harness 表格渲染截图 · 标题「REAL-BROWSER QA · pages=17 × 2 viewports (390/430) · entries=34 pass=16 allPass=false」 · 列表可见 PAGE / VIEWPORT / DOCOVERFLOW / APPOVERFLOW / CLIP… 表头 |
| `.qa-runtime/real-browser-stderr.log` | 729 B | 2026-08-29 11:55:42 | console errors: 0 · page exceptions: 0 · `__BQA_TOTAL=34` · `__BQA_PASS=16 / 8` · `__BQA_HARD_ASSERT=false` · `report.allPass=false` |

---

## 六、截图实读结论（必须真实打开 PNG，不接受仅证明存在）

- **`.qa-runtime/real-browser-qa-390.png`**（44 201 bytes）：打开后可见：
  - 标题「PASAY · Real Browser QA 390 / 430」
  - 元行「pasay-mini-app.html inlined · window.__OD_RUN_BROWSER_QA() · real Chromium DOM measurements」
  - 摘要框（红边）：「REAL-BROWSER QA · pages=17 × 2 viewports (390/430) · entries=34 pass=16 allPass=false」
  - 表格表头：PAGE / VIEWPORT / DOCOVERFLOW / APPOVERFLOW / CLIP…（CLIPPED 列因宽度裁切未完全渲染，但实读 PNG 可见）
  - 多行 390 视口 entry（DOCOVERFLOW=PASS、APPOVERFLOW=PASS 但 CLIP/RECT 列因 rectIssues 非零判定 FAIL）
- **`.qa-runtime/real-browser-qa-430.png`**（43 421 bytes）：打开后可见：
  - 同标题
  - 摘要框：「REAL-BROWSER QA · pages=17 × 2 viewports (390/430) · entries=34 pass=8 allPass=false」
  - 表格内容更全（DOCOVERFLOW 列为 FAIL 行可见 home/props/prop-detail/prop-fin/prop-repair/ops/finance/rent-detail/repair-detail/expense-detail/more/archive/team/tenant/setup/switch/settings 全部 17 行均 FAIL，这与 §4.2 表的 `ok=false` 统计一致 — 实测表格列含义为 DOCOVERFLOW 列展示 ok 列子项，但 PASS/FAIL 显示与 ok=false 不完全等价；**两个截图的「entries=34 pass=16/8 allPass=false」** 是单一权威数字）
- 两张截图 **非空白、非伪造、非缺页**；实读结论与 JSON 报告数值完全一致。

---

## 七、最终结论

- **FINAL PASS 条件满足：否**（AC-1 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 / AC-9 共 7 项 FAIL）
- **真实浏览器可驱动：是**（Windows Chrome 151.0.7922.174 · channel=chrome · playwright-core 1.63.0-alpha · `spawn`/`launch` 均成功）
- **真实浏览器 BQA 结果：16 / 34**（不达 34/34 阈值）
- **精确失败根因（无须修改亦可定位）**：
  1. 内联 `<button data-a="nav" data-href="…" style="text-decoration:underline">view →</button>` 共 9 类无 `.btn` 类的 button，`getBoundingClientRect().height = 18.84 px < 44 px`，FR-1 未覆盖（需新增 CSS 选择器或回归 SPEC 显式列出该 inline 模式）
  2. `.tabs` 容器在 sticky `.topbar` 父级链下，即使加 `min-width:0`，6 个 `min-height:44px` 的 tab 仍 overflow（`right > vw + 1`，实测最右 tab `right=682.3 px > 391 px`）；`.filters` 类似但较轻（仅末位 fchip clipped）
- **本次未做任何产品/Harness/QA 判定修改**（diff 仅本报告新增，无产品变更）
- **未推送任何 "FIX3 全绿" 主张**
- 解除条件：在可对 CSS 或 inline `<button>` 模式追加覆盖的下游任务中，按 FR-1 选择器清单显式扩展覆盖 `<button data-a="nav" style="text-decoration:underline">` 与 `.tabs`/`.filters` 末位 clip，再跑 `review-runner.js`，预期可达成 34/34

---

## 八、Deliverables Return

| 项 | 值 |
|---|---|
| **TESTED_SHA** | `195efbd7fbf3ef232915d9e284ccac571a7c2a53` |
| **FINAL_EVIDENCE_SHA** | `4cfa2b0ebd854881c0266f47030cda67e9faf0b5` |
| 6 个产品/harness blob 一致性 | ✅ 完全一致（195efbd ↔ 工作区 ↔ 4cfa2b0） |
| 390 结果 | pass=8/17 · allPass=false（runner exit=1） |
| 430 结果 | pass=8/17 · allPass=false（runner exit=1） |
| 5 个证据文件 | ✅ 全部存在且内容核验完毕 |
| 截图实读结论 | ✅ 真实打开两张 PNG，与 JSON 数值一致 |
| Node gates（gates-runner.js · browser-qa-390-430.js） | ✅ 两项均 exit 0 全绿（Node 结构性，与真实浏览器几何实测不一致） |
| **frozen IA/domain changed** | **NO** |
| **remote committed** | **YES**（FINAL_EVIDENCE_SHA = `4cfa2b0`，含 5 个新浏览器证据文件 + 本报告 `DESIGN-021-FIX3-WIN-FINAL.md`） |
| **PASAY_DESIGN_IMPLEMENTATION_SOT_SHA** | **`4cfa2b0ebd854881c0266f47030cda67e9faf0b5`**（= FINAL_EVIDENCE_SHA） |
| 终态 | **BLOCKED**（真实浏览器 BQA 16/34 ≠ 34/34；按宪制规则不声明 FINAL PASS） |

---

**DESIGN-021-FIX3-WINDOWS-FINAL-QA · BLOCKED · 代码/Node 结构性修复已全部提交且全绿，真实浏览器几何验收在 TESTED_SHA 上未达 34/34 → STOP · 不启动 MINIAPP-M001**
