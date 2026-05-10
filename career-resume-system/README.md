# CareerCompass AI - 智能职业规划与简历制作平台

## 项目概述

**英文名称**: CareerCompass AI - Intelligent Career Planning & Resume Assistant

**核心定位**: 帮助大学生跨越求职迷茫、设计最能体现个人优势和符合职业规划的优质简历。

**目标用户**: 大学生、应届毕业生、求职转型者

---

## 文档清单

### 架构与设计文档

| 文档     | 路径                             | 说明                 |
| ------ | ------------------------------ | ------------------ |
| 系统架构设计 | docs/01-system-architecture.md | 整体架构、技术选型、部署架构     |
| 技术设计方案 | docs/02-technical-design.md    | 详细技术设计、数据库设计、API设计 |
| 软件开发方案 | docs/03-development-plan.md    | 开发计划、里程碑、团队分工      |
| 功能规格说明 | docs/04-functional-specs.md    | 详细功能规格、用户故事        |

### 部署与运维文档

| 文档     | 路径                          | 说明           |
| ------ | --------------------------- | ------------ |
| 平台部署手册 | docs/05-deployment-guide.md | 生产环境部署、配置、运维 |

### 用户文档

| 文档   | 路径                     | 说明       |
| ---- | ---------------------- | -------- |
| 用户手册 | docs/06-user-manual.md | 终端用户操作指南 |

### 演示材料

| 文档      | 路径                                | 说明        |
| ------- | --------------------------------- | --------- |
| 平台介绍PPT | presentations/platform-intro.html | 商业演示、产品介绍 |

---

## 项目结构

```
career-resume-system/
├── README.md                 # 项目总览（本文件）
├── docs/                     # 技术文档
│   ├── 01-system-architecture.md
│   ├── 02-technical-design.md
│   ├── 03-development-plan.md
│   ├── 04-functional-specs.md
│   ├── 05-deployment-guide.md
│   └── 06-user-manual.md
├── src/                      # 源代码目录（待开发）
├── deploy/                   # 部署配置
├── assets/                   # 静态资源、图片
└── presentations/            # 演示文档
    └── platform-intro.html   # 平台介绍PPT（HTML格式）
```

---

## 技术栈概述

### 后端

- **框架**: Spring Boot 3.x / Node.js + Express（微服务架构）
- **数据库**: PostgreSQL + Redis + Elasticsearch
- **AI引擎**: Python + LangChain + OpenAI API / 国产大模型

### 前端

- **Web**: Vue 3 / React 18 + TypeScript
- **移动端**: React Native / Flutter
- **管理后台**: Ant Design Pro / Element Plus

### DevOps

- **容器化**: Docker + Kubernetes
- **CI/CD**: GitLab CI / GitHub Actions
- **监控**: Prometheus + Grafana + ELK

---

## 商业定位

### 商业模式

1. **免费增值 (Freemium)**: 基础功能免费，高级功能订阅
2. **企业服务**: 高校/培训机构批量授权
3. **增值服务**: 一对一职业咨询、简历精修

### 差异化优势

1. **AI+职业科学**: 不只是模板填充，而是基于职业心理学和人才测评的智能推荐
2. **全流程陪伴**: 从职业探索 → 能力提升 → 简历制作 → 面试辅导
3. **数据驱动**: 持续追踪求职效果，优化推荐算法

---

## 里程碑规划

| 阶段   | 时间   | 目标              |
| ---- | ---- | --------------- |
| MVP  | 3个月  | 核心功能上线，支持基础简历制作 |
| V1.0 | 6个月  | 完整功能发布，AI助手上线   |
| V2.0 | 12个月 | 企业版发布，开放API     |

---

*文档版本: v1.0*  
*创建时间: 2025年*  
*维护团队: CareerCompass AI 产品团队*
