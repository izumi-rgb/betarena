# HTTPS Setup Guide for BetArena

## Prerequisites
- Domain name pointing to your VPS IP
- Nginx installed on VPS
- Port 80 and 443 open in firewall

## Step 1: Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

## Step 2: Configure Nginx

Create `/etc/nginx/sites-available/betarena`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/betarena /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Step 3: Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically modify the Nginx config for HTTPS.

## Step 4: Auto-Renewal

Certbot sets up auto-renewal by default. Verify:
```bash
sudo certbot renew --dry-run
```

## Step 5: Update Environment

Set these in your `.env`:
```
COOKIE_SECURE=true
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_WS_URL=https://your-domain.com
```

## Restore Procedure (for backups)

```bash
gunzip < /backups/betarena-YYYYMMDD-HHMMSS.sql.gz | psql -U betarena betarena
```
