# ApplePie Docker 本地部署指南

> 2 个容器、1 个 tar 文件、0 个外部依赖（AI API 除外）。

## 前提条件

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose（目标机器仅需 Docker）

## 快速开始

### 方式一：从源码构建

```bash
cd applepie

# 1. 配置环境变量
cp .env.docker.example .env
# 编辑 .env 填入配置（详见文件内注释）

# 2. 启动
docker compose up -d

# 3. 访问
open http://localhost:3000
```

### 方式二：从镜像文件部署（离线）

**开发机上：**

```bash
cd applepie

# 1. 构建并打包镜像
bash scripts/package-images.sh
# 生成 applepie-images.tar（~400MB）
```

**将以下文件复制到目标机器：**
```
applepie-images.tar       ← 镜像文件（唯一的大文件）
docker-compose.yml        ← 服务编排
.env.docker.example       ← 环境变量模板
```

**目标机器上：**

```bash
# 1. 加载镜像（一次性）
docker load -i applepie-images.tar

# 2. 配置
cp .env.docker.example .env
vim .env  # 填入你的 API Keys

# 3. 启动
docker compose up -d

# 4. 访问
open http://localhost:3000
```

---

## 服务架构

```
docker compose (2 个容器)
├── postgres:16-alpine      → PostgreSQL 数据库（数据持久化到 Volume）
└── applepie-app:latest     → Next.js 16 应用（端口 3000）

外部 API（通过环境变量注入）:
  • DeepSeek      — AI 文本模型
  • 豆包 Doubao   — AI 视觉 + 图片生成
  • 小米 MiMo     — TTS 语音（可选）
```

**对比：去掉 Supabase 前后的变化**

| | 之前（Supabase 本地） | 现在（PostgreSQL） |
|------|------|------|
| 容器数量 | 8-12 个 | **2 个** |
| 镜像大小 | ~3 GB | **~400 MB** |
| 需要分发的文件 | 大量 | **1 个 tar** |
| 用户认证 | Supabase GoTrue (JWT) | 自定义 JWT (jose + bcryptjs) |
| 目标机器额外安装 | Docker + Supabase CLI | **仅 Docker** |

---

## 环境变量参考

| 变量 | 必填 | 说明 |
|------|------|------|
| `DB_USER` | 否 | 数据库用户名（默认 postgres） |
| `DB_PASSWORD` | **是** | 数据库密码 |
| `DB_NAME` | 否 | 数据库名（默认 applepie） |
| `APP_PORT` | 否 | 应用端口（默认 3000） |
| `AUTH_SECRET` | **是** | JWT 签名密钥（`openssl rand -hex 32`） |
| `TEXT_API_KEY` | **是** | DeepSeek API Key |
| `VISION_API_KEY` | **是** | 豆包视觉 API Key |
| `IMAGE_API_KEY` | **是** | 豆包图片生成 API Key |
| `TTS_*` | 否 | 语音合成（不填无配音） |
| `MOCK_IMAGE` | 否 | 跳过图片生成（`true` 省费用） |

---

## 常用命令

```bash
# 服务管理
docker compose up -d              # 启动
docker compose up -d --build      # 重新构建并启动
docker compose down               # 停止
docker compose restart app        # 仅重启应用

# 日志
docker compose logs -f app        # 应用日志（实时）
docker compose logs --tail=50     # 最近 50 行

# 数据库备份
docker exec applepie-db pg_dump -U postgres applepie > backup.sql
docker exec -i applepie-db psql -U postgres applepie < backup.sql

# ⚠️ 彻底清空数据
docker compose down -v
```

---

## 故障排查

### 端口被占用

```bash
# 修改 .env 中的 APP_PORT
APP_PORT=3001
```

### 数据库连接失败

```bash
docker compose ps postgres        # 确认容器运行
docker compose logs postgres      # 查看日志
```

### 应用启动失败

```bash
docker compose logs app | tail -50
```

### 重新构建

```bash
docker compose build --no-cache app
docker compose up -d
```
