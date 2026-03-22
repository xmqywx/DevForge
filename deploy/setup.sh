#!/bin/bash
set -e
echo "=== DevForge Server Setup ==="

# Create directories
mkdir -p /data/devforge/uploads
mkdir -p /opt/devforge

# Clone and build
cd /opt
git clone https://github.com/xmqywx/DevForge.git devforge || (cd devforge && git pull)
cd devforge
npm install
npm run build

# PM2
npm install -g pm2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup

# Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/devforge
ln -sf /etc/nginx/sites-available/devforge /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "=== DevForge deployed ==="
