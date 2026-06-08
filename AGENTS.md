# Harness Model Dev Protocol

## 三 Agent 开发架构

```
Planner ──sprint contract──► Generator ──► Evaluator
   ▲                                           │
   └─────────── feedback / next sprint ◄───────┘
```

### Roles

| Agent         | 职责                                                          |
| ------------- | ------------------------------------------------------------- |
| **Planner**   | 拆解需求 → 制定 sprint contract → 生成验收标准                |
| **Generator** | 按 contract 实现功能，输出可运行代码                          |
| **Evaluator** | 根据所属层级用 Vitest/Jest (底层) 或 Playwright/CE (UI层) 验收；通过则推进，失败则反馈 |

### Sprint Contract（每轮必须包含）

```
## Sprint #{n}
goal:        # 本轮要实现的单一功能
impl:        # Generator 的实现方案（技术路径）
criteria:    # 可测试的成功标准（底层模块使用 Vitest/Jest 断言；UI层使用 Playwright/CE 断言）
layer:       # 涉及的依赖层（见下，支持跨层垂直切片或单层横向推进）
blocked_by:  # 依赖的前序 sprint（无则 none）
```

### Evaluator 工具规则

- **底层逻辑验收 (types ~ runtime)** → 单元测试 / 集成测试 (如 `Vitest` / `Jest`)
- **UI/交互验收 (ui 层及垂直切片)** → Playwright (`tests/e2e/`)
- **扩展/浏览器状态验收** → Chrome Extension (`tools/ce-validator/`)
- 每条 criteria 对应一条自动化断言；无法自动化的须注明手动步骤

---

## 依赖层级（不可逆向依赖）

```
types → config → repo → service → runtime → ui
```

- 上层可引用下层，下层禁止引用上层
- 跨层调用须经由接口（interface / adapter）隔离

---

## 仓库目录结构

```
harness_model/
├── AGENTS.md / AGENTS.md      # Dev protocol（内容同步）
├── README.md                  # 流程总览 & 快速上手
├── user-guide.md              # 给用户的详细工作流指南
│
├── .Codex/
│   ├── skills/                # 可复用 skill 定义 (SKILL.md × N)
│   └── settings.json          # 项目级 Codex 配置
│
├── docs/                      # 项目文档（PRD、IA、视觉方案）
│   └── {project}/             # 按项目归档
│
├── projects/                  # 用本流程实验性开发的项目
│   └── {project-name}/        # 独立项目目录
│       ├── src/               # 按依赖层分包
│       └── tests/e2e/         # Playwright 测试
│
└── tools/
    └── ce-validator/          # Chrome Extension 验收工具
```

- src/ 子目录严格对应依赖层级：`types → config → repo → service → runtime → ui`
- UI 页面：capture(捕获) / processing(处理预览) / gallery(长廊) / detail(拼贴详情) / prompt(灵感扭蛋)
- 视觉规范见 `docs/harbor_journal-visual-scheme-2026-04-19.md`

> **Note**: `AGENTS.md` 是 `AGENTS.md` 的副本。Codex 读取 `AGENTS.md`；Kimi 读取 `AGENTS.md`。修改 `AGENTS.md` 后需手动同步到 `AGENTS.md`（或使用 `protocol-updater` / `claudemd-updater` skill）。

---

## 开发循环 & Worktree 守则

1. 每次对话只执行**一个 sprint**；Evaluator 未通过 → 禁止进入下一 sprint
2. 依赖层违规 → Planner 拒绝 contract，打回重写
3. 所有 worktree 操作统一用 `/sprint-worktree` skill（setup / validate / merge / clean / status）
4. 流程：`setup`（新建 worktree）→ 实现 → `merge` → `clean` → 下一 sprint
5. 禁止用 `EnterWorktree`/`ExitWorktree` 管 sprint worktree（它们管 `.Codex/worktrees/`）
6. Worktree 健康检查由 Stop hook 自动运行；也可随时 `/sprint-worktree status`

## 技术栈硬约束（微信小程序）

> **硬性规则**：本仓库是一个**微信小程序**项目，所有指令、文件修改、架构设计与测试验收，必须严格围绕微信小程序开发逻辑制定。

1. **框架限定**：必须使用微信小程序原生技术栈 —— `WXML` / `WXSS` / `JavaScript` / `JSON`。禁止引入 React、Vue、Angular 等 Web 前端框架，禁止直接使用 DOM/BOM 浏览器 API。
2. **目录与规范**：以 `miniprogram/` 为业务代码根目录，严格遵循微信小程序官方目录结构（`pages/`、`components/`、`app.js`、`app.json`、`app.wxss`、`sitemap.json` 等）。新增页面必须在 `app.json` 中注册。
3. **API 与组件**：所有网络请求、媒体操作、数据存储、UI 交互必须使用微信小程序原生 API（`wx.*`）和原生组件。禁止编写浏览器端 `window` / `document` 相关代码。
4. **测试与验收**：UI/交互验收以微信开发者工具或小程序模拟环境（如 `miniprogram-simulate`）为准，不套用 Playwright、Puppeteer 等浏览器端 E2E 工具；底层逻辑测试优先使用 Node.js 环境可用的轻量断言库。
5. **Sprint 校验**：Planner 在制定 contract、Generator 在输出代码前，必须自检是否符合上述微信小程序规范；Evaluator 在验收时需额外检查是否存在浏览器端或非小程序技术栈的违规代码。

---

## 其他
当用户做出不太合理，欠佳的选择/判断时，果断地提醒用户，并主动解释原因，提出更好的方案