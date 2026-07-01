# ApplePie 🍎

> AppleU，成长可以快乐，把童年还给孩子。

AI 驱动的学习成长应用 — 以时间管理为入口、AI 互动游戏为引擎、线下实践为延伸。

## 🐳 Docker 部署（推荐）

目标机器仅需 Docker。支持离线部署：开发机打包 → 复制 1 个 tar 文件 → 目标机加载运行。

```bash
# 方式一：从源码构建
cp .env.docker.example .env   # 编辑 .env 填入配置
docker compose up -d

# 方式二：从镜像文件部署（离线）
bash scripts/package-images.sh           # 开发机：打包镜像
docker load -i applepie-images.tar       # 目标机：加载镜像
docker compose up -d                     # 目标机：启动
```

详细说明见 [docs/Docker本地部署指南.md](docs/Docker本地部署指南.md)

### 服务组成（2 个容器）

| 服务 | 说明 | 端口 |
|------|------|------|
| `app` | Next.js 16 应用 | 3000 |
| `postgres` | PostgreSQL 16 数据库 | 5432（内部） |

### 外部依赖

| 服务 | 用途 |
|------|------|
| DeepSeek API | AI 文本（游戏编剧、课表解析） |
| 豆包 API | AI 视觉 + 图片生成 |
| 小米 MiMo API | TTS 语音（可选） |

---

## 🛠 本地开发

```bash
# 环境要求: Node.js >= 22, pnpm 9.x

pnpm install
npx prisma generate
pnpm dev
```

开发时需要本地 PostgreSQL。推荐用 Docker 快速启动：

```bash
docker run -d --name applepie-dev-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=applepie \
  -p 5432:5432 \
  postgres:16-alpine
```

然后配置 `.env.local`（参考 `.env.example`）。
