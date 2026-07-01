#!/bin/bash
# 小书童部署脚本

echo "===== 小书童后端服务部署 ====="

# 创建临时部署目录
DEPLOY_DIR="/tmp/xiaoshutong-deploy"
mkdir -p $DEPLOY_DIR

# 备份现有服务
echo "1. 备份现有服务..."
if [ -d "/www/xiaoshutong/server" ]; then
  cp /www/xiaoshutong/server/.env $DEPLOY_DIR/.env.backup 2>/dev/null || true
fi

# 上传并解压新版本
echo "2. 解压新版本..."
cd $DEPLOY_DIR
unzip -o server-v3.zip -d . 2>/dev/null || unzip -o server.zip -d . 2>/dev/null || true

# 恢复环境变量配置
if [ -f "$DEPLOY_DIR/.env.backup" ]; then
  echo "3. 恢复环境变量配置..."
  cp $DEPLOY_DIR/.env.backup /www/xiaoshutong/server/.env
fi

# 安装依赖
echo "4. 安装依赖..."
cd /www/xiaoshutong/server
npm install --production

# 重启服务
echo "5. 重启服务..."
pm2 restart xiaoshutong-server || pm2 start index.js --name xiaoshutong-server

# 查看状态
echo "6. 查看服务状态..."
pm2 status

# 清理
rm -rf $DEPLOY_DIR

echo "===== 部署完成 ====="