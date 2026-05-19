## 变更概述

简要描述做了什么，为什么。

## 变更类型

- [ ] 新场景 (scenes/)
- [ ] 命令修改 (commands/)
- [ ] Bug 修复
- [ ] 文档更新 (docs/)
- [ ] CI/测试
- [ ] 核心机制变更 (CLAUDE.md / 继承 / @file)

## 测试验证

- [ ] `./tests/run.sh` 本地通过
- [ ] 如涉及场景：已在 vault 中试跑 `/go → /um → /aha` 流程
- [ ] 如涉及继承：已用 `/go <scene> --dry-run` 验证合并结果

## Checklist

- [ ] prompts.json 和 manifest.json 格式正确
- [ ] @file 引用的文件都存在
- [ ] CLAUDE.md / docs/ 中相关描述已同步更新
- [ ] 无 breaking change（或已在描述中说明迁移方式）