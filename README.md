# ApplePie 🍎

> **AppleU，成长可以快乐，把童年还给孩子。**

ApplePie 是一款面向中学生及其家长的 AI 驱动学习成长应用。以时间管理为入口、AI 互动游戏为引擎、线下实践为延伸，帮助学生从"被动刷题"转向"主动探索"。

## 项目文档

| 文件 | 说明 |
|------|------|
| [项目构思.MD](./项目构思.MD) | 原始项目构思与痛点分析 |
| [产品方案.md](./产品方案.md) | 产品方案 V2.0（需求基线） |
| [AI游戏引擎适配方案.md](./AI游戏引擎适配方案.md) | 基于 infiplot 引擎的适配方案 |
| [开发日志.md](./开发日志.md) | 开发日志与架构决策记录 |
| [原型/index.html](./原型/index.html) | 移动端 UI 原型 |

## 技术方向

- **AI 游戏引擎：** 参考 [infiplot](https://github.com/zonghaoyuan/infiplot) 的多智能体互动叙事架构
- **核心差异化：** 五维时间模型（学习/休息/运动/社交/探索）+ AI 发现引擎 + 实践推荐
- **商业模式：** 核心功能永久免费，实践活动/课程/跳蚤市场变现

## 🐳 快速开始（Docker）

```bash
cd applepie
cp .env.docker.example .env   # 编辑填入 API Keys
docker compose up -d          # 启动（2 个容器）
open http://localhost:3000
```

详细说明见 [applepie/README.md](applepie/README.md) 和 [Docker 本地部署指南](applepie/docs/Docker本地部署指南.md)。

## 当前阶段

✅ MVP 开发完成 → 持续迭代
