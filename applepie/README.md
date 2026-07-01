# ApplePie 🍎

> AppleU，成长可以快乐，把童年还给孩子。

AI 驱动的学习成长应用 — 以时间管理为入口、AI 互动游戏为引擎、线下实践为延伸。

---

## 🐳 Docker 部署（推荐）

**目标机器仅需 Docker**，不需要 Node.js、pnpm、PostgreSQL、Supabase。

### 服务架构

```
docker compose (2 个容器)
├── postgres:16-alpine    → 数据库（数据持久化到 Volume）
└── applepie-app:latest   → Next.js 16 应用（端口 3000）
```

---

### 方式一：从源码构建运行

适合有源代码的机器。

```bash
cd applepie

# 1. 配置环境变量
cp .env.docker.example .env
vim .env   # 填入 API Keys（见下方配置说明）

# 2. 构建并启动
docker compose up -d

# 3. 访问
open http://localhost:3000
```

---

### 方式二：打包镜像 → 离线分发 → 运行

适合分发到没有源码、没有网络的机器。**只需复制 1 个 tar 文件。**

#### 第一步：开发机上打包

```bash
cd applepie

# 1. 构建应用镜像
docker compose build app

# 2. 拉取 PostgreSQL 镜像
docker pull postgres:16-alpine

# 3. 两个镜像打包为一个文件
docker save -o applepie-images.tar \
  applepie-app:latest \
  postgres:16-alpine

# 4. 查看打包结果（约 350-450 MB）
ls -lh applepie-images.tar
```

也可以用一键脚本：

```bash
bash scripts/package-images.sh
```

#### 第二步：复制到目标机器

将以下 3 个文件复制到目标机器的同一目录下：

```
applepie-images.tar        ← 镜像文件（~400MB，唯一的大文件）
docker-compose.yml         ← 服务编排文件
.env.docker.example        ← 环境变量模板
```

#### 第三步：目标机器上加载运行

```bash
# 1. 加载镜像到本地 Docker（一次性）
docker load -i applepie-images.tar

# 2. 配置环境变量
cp .env.docker.example .env
vim .env   # 填入你的 API Keys

# 3. 启动
docker compose up -d

# 4. 访问
open http://localhost:3000
```

---

### 环境变量配置

编辑 `.env` 文件：

```ini
# ---- 必填 ----
DB_PASSWORD=自行设置密码                    # 数据库密码
AUTH_SECRET=至少32位随机字符串               # 用于 JWT 签名，生成方式: openssl rand -hex 32
TEXT_API_KEY=sk-your-deepseek-key           # DeepSeek API Key
VISION_API_KEY=your-doubao-key              # 豆包视觉 API Key
IMAGE_API_KEY=your-doubao-key               # 豆包图片生成 API Key

# ---- 可选 ----
MOCK_IMAGE=true                             # 跳过 AI 图片生成，用占位图（省费用）
TTS_BASE_URL=                               # 不填则无角色配音
```

> 详细变量说明见 `.env.docker.example` 文件内注释。

---

### 常用命令

```bash
# 服务管理
docker compose up -d              # 启动（后台运行）
docker compose up -d --build      # 重新构建并启动
docker compose down               # 停止
docker compose restart app        # 重启应用

# 查看日志
docker compose logs -f app        # 应用日志（实时滚动）
docker compose logs --tail=50     # 最近 50 行

# 数据库备份
docker exec applepie-db pg_dump -U postgres applepie > backup.sql

# 数据库恢复
docker exec -i applepie-db psql -U postgres applepie < backup.sql

# ⚠️ 彻底清空所有数据（不可恢复！）
docker compose down -v
```

### 升级应用

```bash
# 1. 备份数据库
docker exec applepie-db pg_dump -U postgres applepie > backup.sql

# 2. 更新源码 / 重新打包镜像
docker compose build --no-cache app

# 3. 重启
docker compose up -d
```

---

## 🛠 本地开发

```bash
# 环境要求: Node.js >= 22, pnpm 9.x

cd applepie
pnpm install
npx prisma generate
```

### 启动开发数据库

```bash
docker run -d --name applepie-dev-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=applepie \
  -p 5432:5432 \
  -v applepie-dev-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 配置 .env.local

```bash
cp .env.example .env.local
# 编辑 .env.local，填入 DATABASE_URL 和 API Keys
```

### 初始化数据库

```bash
npx prisma db push          # 同步 Schema 到数据库
npx tsx prisma/seed.ts      # 导入种子数据（知识点等）
```

### 启动开发服务器

```bash
pnpm dev
# → http://localhost:3000
```

---

## 📋 技术栈

| 层 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 语言 | TypeScript |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 认证 | 自定义 JWT（jose + bcryptjs） |
| AI 文本 | DeepSeek v4-pro |
| AI 视觉 | 豆包 Doubao Seed 2.0 |
| AI 图片 | 豆包 Seedream 5.0 |
| TTS | 小米 MiMo v2.5（可选） |
| 样式 | Tailwind CSS 4 |
| 部署 | Docker + docker-compose |
