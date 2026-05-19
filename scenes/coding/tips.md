# Coding 场景使用指南

## 推荐插件

| 插件 | 用途 | 安装方式 |
|------|------|---------|
| **Obsidian Git** | 自动同步 vault 到 Git 仓库 | 社区插件搜索 "Obsidian Git" |
| **Excalidraw** | 手绘架构图、流程图、白板 | 社区插件搜索 "Excalidraw" |
| **Kanban** | 看板式项目任务管理 | 社区插件搜索 "Kanban" |
| **Templater** | 项目笔记/会议纪要模板 | 社区插件搜索 "Templater" |
| **Calendar** | 日历视图追踪开发日志 | 社区插件搜索 "Calendar" |
| **Homepage** | 设置首页入口，快速导航 | 社区插件搜索 "Homepage" |

### Obsidian Git 配置建议

1. 设置自动备份间隔（建议 10-30 分钟）
2. 提交消息格式：`vault backup: {{date}}`
3. 排除 `.obsidian/workspace.json` 避免冲突

---

## 推荐工作流

### 项目文档驱动开发

```
/go coding
/um 项目名 → 分析项目笔记完整性
           → 检查 README、API docs、changelog 是否过时
           → 建议需要更新的文档

编码过程中：
  遇到设计决策 → /um 架构 → 生成 Mermaid 架构图
  开完会议 → /um 会议 → 创建会议纪要 + action items
  完成功能 → /aha → 自动生成 dev log
```

### 语音输入 + AI 整理（移动端）

```
手机端：
  讯飞输入法语音 → 坚果 Markdown → 坚果云同步到 vault

电脑端：
  /um → AI 自动发现 Inbox 新文件
     → 优化口述内容（去口语、去语气词）
     → 打标签、归档到对应项目笔记
```

### 飞书/云端发布

```
本地写完文档 → /um 发布
            → AI 检查 markdown 格式兼容性
            → 调整飞书不支持的语法（callout 嵌套列表等）
            → 通过飞书 CLI 推送到知识库
```

---

## 最佳实践

### 项目笔记命名规范

```
Projects/
├── {Project Name}/
│   ├── {Project Name}.md          ← 项目主页（status + goals + architecture）
│   ├── Dev Log.md                 ← 开发日志（按日期追加）
│   ├── Architecture.md            ← 架构文档 + Mermaid 图
│   ├── Meetings/                  ← 会议纪要
│   └── Decisions/                 ← 架构决策记录（ADR）
```

### 架构决策记录（ADR）模板

```markdown
---
status: accepted
date: 2026-05-19
tags: [decision, project-name]
---

## 决策：选择 X 而非 Y

### 背景
为什么需要做这个决策

### 方案对比
| 维度 | 方案 A | 方案 B |
|------|--------|--------|

### 决策
选择了什么，为什么

### 后果
这个决策带来什么影响
```

### 可视化三选一

| 需求 | 工具 | 输出格式 |
|------|------|---------|
| 正式结构图（流程/时序/类图）| Mermaid | 嵌入 md 代码块 |
| 可拖拽编辑的白板 | Canvas | `.canvas` 文件 |
| 手绘风格/演示分享 | Excalidraw | `.excalidraw` 文件 |

### 避免常见陷阱

- ❌ 代码改了文档没更新 → ✅ `/aha` 自动检测代码变更对应文档缺失
- ❌ 会议 action items 丢失 → ✅ 会议纪要用 `- [ ] @owner: due` 追踪
- ❌ 架构决策只在脑子里 → ✅ 每个重要决策写一篇 ADR
- ❌ Git commit 不写日志 → ✅ `/aha dev-log` 从 git history 自动生成
