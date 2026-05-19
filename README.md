# persona

> 个人 AI 工作人格的版本管理系统。

你不是在管理工具，你是在蒸馏自己——把"我在不同场景下怎么思考、怎么行动"变成可复用、可切换、可分享的人格切片。

## 安装

```bash
git clone https://github.com/xinhai/persona.git
cd persona
./install.sh
```

安装脚本会：
1. 检测 `~/.claude/commands/` 下是否有同名命令（冲突时交互式询问）
2. 创建 symlink 到 `commands/*.md`
3. 写入 `~/.claude/persona.json` 全局配置

## 五个命令

| 命令 | 情绪 | 行为 |
|------|------|------|
| `/um` | 困惑 | 发散 — 外化混乱，发现方向（自动感知 vault 变更） |
| `/aha` | 顿悟 | 收敛 — 汇总进度，提炼清晰（基于变更范围） |
| `/go` | 切换 | 切换场景，进入不同工作人格 |
| `/distill` | 沉淀 | 精炼画像，越用越懂你 |
| `/new` | 创造 | 引导式创建新场景 |

你不需要记住命令名——只需要感知当下状态：脑子比笔记多？`/um`。笔记比脑子多？`/aha`。想换个模式？`/go`。想创建新场景？`/new`。

## 场景

场景 = 工作人格包。每个场景定义了你在某个角色下怎么思考、行动。

**内置场景：**
- `daily` — 日常笔记管理（日记、知识库、vault 整理）
- `coding` — 编码文档（项目笔记、开发日志、会议纪要）
- `patent-writing` — 专利撰写（权利要求、说明书、附图）

**切换：**
```
/go daily
/go coding
/go patent-writing
```

## 越用越懂你

使用过程中 AI 积累你的偏好（`_memory`），定期 `/distill` 精炼为画像（`_profile`）。

```
使用 → AI 输出 → 你纠正 → 存入 _memory → /distill → 精炼 _profile → 下次更懂你
```

完全透明——打开 `prompts.json` 就能看到 AI 记住了什么关于你的一切。可编辑、可删除、可重写。

## 自定义场景

最快方式——用 `/new` 引导式创建：

```
/new
→ 场景名称？ my-research
→ 一句话描述？ 文献调研与综述撰写
→ 继承已有场景？ n
→ 需要哪些 skills？ 1,2,5
→ 你的使用习惯？ 我喜欢先大量收集，再分主题整理...
→ ✓ 场景 my-research 已创建！
```

或手动创建 `{vault}/.persona/scenes/` 下的目录：

```
{vault}/.persona/scenes/my-research/
├── manifest.json    ← 依赖声明
└── prompts.json     ← 提示词 + _actions
```

支持 `_extends` 继承已有场景，只写 delta。用 `/go my-research --dry-run` 调试合并结果。

## 设计哲学

- **知行合一** — 你的"知"（怎么用工具）直接变成 AI 的"行"（替你执行）
- **双钻石模型** — 知识工作只有发散和收敛两种状态
- **场景即人格** — 不是工具变了，是你的工作模式变了
- **组合技封装** — 单个 skill 是招式，scene 是连招

## License

MIT
