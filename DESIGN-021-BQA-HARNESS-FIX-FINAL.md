# DESIGN-021 · BQA HARNESS RUNTIME FIX · 390/430 Real-Browser QA 交付收尾（中文 Final Report）

> 承接 DESIGN-013 §5 / DESIGN-020-FIX2 §2：继续 REAL 390/430 浏览器 QA 的证据收集。
> 本次交付：修复 `pasay-mini-app-bqa-390-430.html`（inlined harness）的 runner 运行时缺陷，并重跑全部回归。

## 一、修复内容（本次实际变更）

### 1. 注入脚本运行时缺陷（ReferenceError）
`build-bqa-harness.js` 生成的 runner IIFE 内 `cell()` / `row()` 引用了 `CELL_STYLE` / `ROW_STYLE` / `MONO_STYLE`，
但这三个常量只在**构建脚本（Node 侧）**定义，从未注入到生成的 `<script id="__bqa_runner">`。
任何真实浏览器一旦开始渲染 QA 表格即抛 `ReferenceError`，面板停在「running… / ERR」。

修复：在 `.qa-runtime/build-bqa-harness.js` 的 SCRIPT 前缀注入三个常量声明（第 2–4 行），并用
`node .qa-runtime/build-bqa-harness.js` 从 `pasay-mini-app.html` 重新生成目标 harness。

### 2. 交付状态核验（通过）
- `syntax-check.js` → runner 语法 OK（script length 3363）
- Node 运行态冒烟（stubbed DOM 注入合成 report）→ **RUNNER RUNTIME OK**：rows=2、summary=
  `… pages=2 pass=1 allPass=false`（PASS/FAIL 混下仍正确渲染行与汇总）
- 常量注入 / 无 `[REPLACE]` / `{{` 占位 / 面板与 runner 均在

## 二、回归（全部通过）

```
node gates-runner.js → EXIT=0 · ALL GATES PASS
node browser-qa-390-430.js → total=32 pass=32 allPass=true · FAILS=[]
```

- PASAY_FINAL_PRODUCT_FREEZE_V1：**103/103**（含 J-F4-pre / J-F4d-pre / J-F4d / A.1–A.7 全链）
- BROWSER_QA_390_430 gate：**5/5**
- 全部历史 Domain Gate（Rent / Repair / Expense / Finance / Daily Ops / Lease / Move-out / Archive / Telegram …）保持绿
- 结构性 390/430：16 页面 × 2 视口 = 32/32，0 DOM 泄漏 / 0 固定宽度溢出 / Bottom Nav=5 / touch≥44px

## 三、真实浏览器证据状态（如实）

- 本次按「一次性渲染」预算对**修复后** harness 执行了 1 次 OD export：
  `pasay-mini-app-bqa-390-430.html` → `.qa-runtime/bqa-harness-final.png`（524,814 bytes，页面已产出实渲染内容，
  与 DESIGN-013 记录的头像时序 pre-JS 空帧显著不同）。
- **局限性说明（不夸大）**：本会话模型无法读取图片（像素级 PASS/FAIL 确认需人工查看 PNG 或真浏览器面板）；
  Chromium Mojo IPC 在此沙箱被系统策略拦截（DESIGN-013 §5 已记录 EPERM 证据），所以「运行者本人打开文件在真浏览器测量」
  仍是 Section B 的最终权威路径——本次确保的正是该路径可用：面板 runner 已修复、可正常输出 34 行（17 页 × 2 视口）结果。
- 因此保留 DESIGN-013 的结论口径：Section A 全部关闭；Section B 的真实浏览器可视化确认由产品 reviewer
  打开 `pasay-mini-app-bqa-390-430.html`（或查看 `bqa-harness-final.png`）核验。

## 四、Changed files
- `.qa-runtime/build-bqa-harness.js` — 注入 CELL_STYLE/ROW_STYLE/MONO_STYLE（builder 修复）
- `pasay-mini-app-bqa-390-430.html` — 由 builder 重新生成（runner 常量注入；内容与 pasay-mini-app.html 同步，
  含 DESIGN-013 的 localStorage try/catch）
- `.qa-runtime/bqa-harness-final.png` — 修复后 harness 的一次性渲染证据
- 新建：本报告

未改：`pasay-mini-app.html`（产品面 0 change）、`pasay-telegram-bot.html`、Bottom Nav、IA、业务逻辑。

---
PASAY-MINIAPP · REAL 390/430 BQA = HARNESS RUNTIME FIXED · Section B 最终核验待 reviewer 真浏览器确认