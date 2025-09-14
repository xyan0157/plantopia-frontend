# Cloudflare Tunnel 设置指南

## 概述
使用 Cloudflare Tunnel 将 HTTP 后端服务暴露为 HTTPS，解决混合内容阻止问题。

## 架构
```
用户浏览器 --[HTTPS]--> Cloudflare --[Tunnel]--> GCP VM (HTTP:80)
```

## 设置步骤

### 1. 创建 Cloudflare 账号（如果没有）
访问 https://www.cloudflare.com 注册免费账号

### 2. 在 GCP VM 上安装 Cloudflare Tunnel

SSH 到你的 GCP VM：
```bash
ssh kevin@34.70.141.84
```

安装 cloudflared：
```bash
# 下载并安装 cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### 3. 登录 Cloudflare
```bash
cloudflared tunnel login
```
这会打开浏览器，让你登录并授权。

### 4. 创建 Tunnel
```bash
# 创建一个名为 plantopia 的 tunnel
cloudflared tunnel create plantopia
```

这会生成一个 tunnel ID 和凭证文件。

### 5. 配置 Tunnel

创建配置文件 `~/.cloudflared/config.yml`：
```yaml
url: http://localhost:80
tunnel: <你的-tunnel-id>
credentials-file: /home/kevin/.cloudflared/<tunnel-id>.json
```

### 6. 创建 DNS 路由

```bash
# 这会给你一个类似 plantopia.username.workers.dev 的域名
cloudflared tunnel route dns plantopia plantopia
```

或者如果你有自己的域名在 Cloudflare：
```bash
cloudflared tunnel route dns plantopia plantopia.yourdomain.com
```

### 7. 运行 Tunnel

测试运行：
```bash
cloudflared tunnel run plantopia
```

### 8. 设置为系统服务（持久化运行）

```bash
# 安装为系统服务
sudo cloudflared service install

# 启动服务
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# 检查状态
sudo systemctl status cloudflared
```

### 9. 获取你的 HTTPS URL

运行后你会得到一个 HTTPS URL，类似：
- `https://plantopia-<random>.trycloudflare.com` （临时 URL）
- `https://plantopia.username.workers.dev` （永久 URL）
- `https://plantopia.yourdomain.com` （如果使用自定义域名）

## 更新前端配置

### 方式 1：直接使用 Cloudflare URL（推荐）

修改 `.env.production`：
```bash
VITE_API_URL=https://plantopia.username.workers.dev
```

修改 `src/services/api.ts`：
```typescript
function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000'
}
```

### 方式 2：保留动态检测（兼容开发）

```typescript
function getApiUrl(): string {
  // 生产环境使用 Cloudflare HTTPS URL
  if (import.meta.env.PROD) {
    return 'https://plantopia.username.workers.dev'
  }
  // 开发环境使用本地
  return 'http://localhost:8000'
}
```

## 优势

1. **完全免费** - Cloudflare 免费层足够使用
2. **自动 HTTPS** - 无需配置证书
3. **全球 CDN** - 自动加速
4. **DDoS 保护** - Cloudflare 自动防护
5. **简单维护** - 一次设置，永久使用

## 清理步骤

设置 Cloudflare Tunnel 后，可以：

1. 删除所有 Vercel API 代理文件：
```bash
rm -rf api/
```

2. 简化 `vercel.json`：
```json
{
  "buildCommand": "npm run build-prod",
  "outputDirectory": "dist",
  "framework": "vue"
}
```

3. 更新 API 服务直接使用 HTTPS URL

## 快速设置命令（一键脚本）

在 GCP VM 上创建并运行此脚本：

```bash
#!/bin/bash
# setup_cloudflare_tunnel.sh

# 安装 cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 登录（需要手动在浏览器中授权）
cloudflared tunnel login

# 创建 tunnel
cloudflared tunnel create plantopia

# 获取 tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep plantopia | awk '{print $1}')

# 创建配置
cat > ~/.cloudflared/config.yml << EOF
url: http://localhost:80
tunnel: $TUNNEL_ID
credentials-file: /home/$USER/.cloudflared/$TUNNEL_ID.json
EOF

# 安装并启动服务
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

echo "Tunnel setup complete!"
echo "Your tunnel ID is: $TUNNEL_ID"
cloudflared tunnel info plantopia
```

## 故障排除

### 查看 Tunnel 状态
```bash
cloudflared tunnel list
cloudflared tunnel info plantopia
```

### 查看日志
```bash
sudo journalctl -u cloudflared -f
```

### 重启服务
```bash
sudo systemctl restart cloudflared
```

### 删除 Tunnel（如需要）
```bash
cloudflared tunnel delete plantopia
```

## 总结

Cloudflare Tunnel 是解决 HTTPS/HTTP 混合内容问题的最佳方案：
- ✅ 免费
- ✅ 简单设置
- ✅ 自动 HTTPS
- ✅ 无需维护证书
- ✅ 全球加速
- ✅ 安全可靠

设置完成后，你的后端会通过 HTTPS 暴露，前端可以直接调用，无需任何代理或 workaround。