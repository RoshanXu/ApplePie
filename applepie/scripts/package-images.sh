#!/bin/bash
# ============================================================
# ApplePie — 镜像打包脚本（开发机上运行）
#
# 用法: bash scripts/package-images.sh
# 输出: applepie-images.tar（包含 app + postgres 两个镜像）
# ============================================================
set -e

TAR_FILE="applepie-images.tar"
APP_IMAGE="applepie-app:latest"
DB_IMAGE="postgres:16-alpine"

echo "=========================================="
echo "  ApplePie — Docker 镜像打包"
echo "=========================================="

# 1. Build app image
echo ""
echo "[1/3] Building app image..."
docker compose build app
echo "  Done: $APP_IMAGE"

# 2. Pull postgres image
echo ""
echo "[2/3] Pulling PostgreSQL image..."
docker pull $DB_IMAGE
echo "  Done: $DB_IMAGE"

# 3. Export both images to a single tar file
echo ""
echo "[3/3] Exporting images to $TAR_FILE ..."
docker save -o "$TAR_FILE" "$APP_IMAGE" "$DB_IMAGE"

SIZE=$(du -h "$TAR_FILE" | cut -f1)
echo ""
echo "=========================================="
echo "  Package complete!"
echo "  File: $TAR_FILE ($SIZE)"
echo ""
echo "  将以下文件复制到目标机器:"
echo "    - $TAR_FILE"
echo "    - docker-compose.yml"
echo "    - .env.docker.example"
echo ""
echo "  目标机器操作:"
echo "    docker load -i $TAR_FILE"
echo "    cp .env.docker.example .env  # 编辑 .env 填入配置"
echo "    docker compose up -d"
echo "=========================================="
