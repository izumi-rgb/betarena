# BetArena — AWS EC2 VPS Setup

Guide to launch an EC2 instance and deploy BetArena with Docker.

---

## Part 1: Finish launching the instance (AWS Console)

You’re already on **Launch an instance** with **Ubuntu 24.04 LTS** and **t3.small**. Complete these steps:

### 1. Name and tags (optional)

- **Name:** e.g. `betarena-prod` or `betarena-vps`.

### 2. Key pair (required)

- **Key pair name:** Choose **Create new key pair**.
  - Name: e.g. `betarena-ec2`.
  - Type: **RSA**.
  - Format: **.pem** (for `ssh -i`).
- Download the `.pem` file and store it somewhere safe (e.g. `~/.ssh/betarena-ec2.pem`).
- **Do not skip this** — you need the key to SSH into the instance.

### 3. Network and security

- **Auto-assign public IP:** Leave **Enable** (you already have this).
- **Firewall (security group):**
  - Create new security group (e.g. `launch-wizard-2` is fine).
  - **Allow SSH** from your IP only if possible (recommended). If you need “from anywhere” for now, you can restrict it later.
  - **Allow HTTP (80)** from `0.0.0.0/0` so the web app is reachable.
  - **Allow HTTPS (443)** from `0.0.0.0/0` if you’ll use SSL later.
  - Optional: allow **3000** and **4000** from `0.0.0.0/0` for direct access to Next.js and API during setup (you can remove after putting Nginx in front).

### 4. Storage

- Default **8 GiB** gp3 is enough to start. Increase if you expect a lot of data.

### 5. Launch

- Click **Launch instance**.
- Wait until the instance state is **Running**, then note the **Public IPv4 address** (e.g. `16.170.227.62`).

---

## Part 2: First connection (your machine)

```bash
# Fix key permissions (required by SSH)
chmod 400 ~/.ssh/betarena-ec2.pem

# Connect (replace with your instance public IP and key path)
ssh -i ~/.ssh/betarena-ec2.pem ubuntu@16.170.227.62
```

Example: `ssh -i ~/.ssh/betarena-ec2.pem ubuntu@13.49.123.45`

---

## Part 3: Prepare the server (Ubuntu 24.04)

Run these on the EC2 instance (as `ubuntu`).

### Install Docker and Docker Compose

```bash
# Update and install prerequisites
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker’s official GPG key and repo
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow your user to run Docker without sudo
sudo usermod -aG docker ubuntu
```

Log out and log back in (or run `newgrp docker`) so `docker` works without `sudo`.

### Install Git (if not present)

```bash
sudo apt-get install -y git
```

---

## Part 4: Deploy BetArena

### 1. Clone the repo

```bash
cd ~
git clone https://github.com/ctr6780-ship-it/betarena.git
cd betarena
```


### 2. Environment file

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `NODE_ENV=production`
- `DB_PASSWORD` — strong password for Postgres (Docker will use it)
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — e.g. `openssl rand -base64 64`
- `ADMIN_SEED_PASSWORD` — password for the seeded admin user
- `CORS_ORIGIN` — your frontend URL, e.g. `http://<PUBLIC_IP>:3000` or `https://yourdomain.com`
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` — must be the URL the **browser** uses to reach the API. If you open the app at `http://<PUBLIC_IP>:3000`, set both to `http://<PUBLIC_IP>:4000`. With Nginx on 80, use `http://<PUBLIC_IP>/api` (or your domain) if you proxy `/api` to the API; otherwise keep `http://<PUBLIC_IP>:4000`.

For **Docker**, the API service overrides `DB_HOST=postgres` and `REDIS_HOST=redis`; the root `.env` is used for other variables (JWT, CORS, etc.). Ensure the **api** service can read that `.env` (the existing `docker-compose.yml` uses `env_file: .env` at repo root; if your compose expects it in another place, copy or symlink accordingly).

### 3. Point the frontend at the API (important)

The default `docker-compose.yml` sets `NEXT_PUBLIC_*` to `http://api:4000`, which only works when the browser talks to the same host (e.g. Nginx). If you open the app at `http://<PUBLIC_IP>:3000`, the browser must use the **public** API URL.

**Option A — override file (recommended):**  
Copy the example override and set your server’s public IP:

```bash
cp docs/deploy/docker-compose.vps.example.yml docker-compose.override.yml
# Edit docker-compose.override.yml and replace YOUR_PUBLIC_IP with your EC2 public IP (e.g. 13.49.x.x)
```

**Option B — env vars:**  
When running `docker compose up`, set:

```bash
NEXT_PUBLIC_API_URL=http://<PUBLIC_IP>:4000 NEXT_PUBLIC_WS_URL=http://<PUBLIC_IP>:4000 docker compose up -d --build
```

(Replace `<PUBLIC_IP>` with your instance’s public IP.)

### 4. Start stack and run migrations

```bash
docker compose up -d --build
docker compose exec api npm run migrate
docker compose exec api npm run seed
```

### 5. Open ports (if not already)

If you didn’t open 3000/4000 in the security group:

- **Option A:** In AWS Security Group, add inbound rules: **3000** and **4000**, source `0.0.0.0/0` (for testing).
- **Option B:** Put Nginx (or Caddy) on the server, listen on 80/443, and proxy to `localhost:3000` (web) and `localhost:4000` (API). Then you only need 80 and 443 open.

### 6. Access the app

- **Web:** `http://<PUBLIC_IP>:3000`
- **API:** `http://<PUBLIC_IP>:4000`

Use the admin credentials from your seed (e.g. the user created by `npm run seed` with `ADMIN_SEED_PASSWORD`).

---

## Part 6: Nginx reverse proxy

Nginx serves as the public-facing reverse proxy with rate limiting, security headers, and WebSocket support.

```bash
sudo apt-get install -y nginx
```

Copy the production-ready config from the repo:

```bash
sudo cp nginx/betarena.conf /etc/nginx/sites-available/betarena
# Edit server_name if using a domain:
# sudo nano /etc/nginx/sites-available/betarena
sudo ln -sf /etc/nginx/sites-available/betarena /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

The config includes:
- Rate limiting (30 req/s API, 5 req/min login)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- WebSocket upgrade for Socket.IO
- Gzip compression
- Health check bypass (no rate limit)

For HTTPS, see `docs/deploy/HTTPS_SETUP.md`.

---

## Part 7: Backups

Install the daily PostgreSQL backup cron:

```bash
sudo ./scripts/setup-backup-cron.sh
```

This creates:
- Daily backups at 3:00 AM to `/backups/`
- 30-day retention (older backups auto-deleted)
- Log at `/var/log/betarena-backup.log`

To restore from backup:
```bash
gunzip < /backups/betarena-YYYYMMDD-HHMMSS.sql.gz | docker compose exec -T postgres psql -U betarena betarena
```

---

## Part 8: Health monitoring

Run the health check script manually or via cron:

```bash
./scripts/health-check.sh http://localhost
```

For uptime monitoring, set up a cron that alerts on failure:

```bash
# Check every 5 minutes, email on failure
*/5 * * * * /home/ubuntu/betarena/scripts/health-check.sh http://localhost >> /var/log/betarena-health.log 2>&1 || echo "BetArena DOWN" | mail -s "ALERT: BetArena health check failed" admin@yourdomain.com
```

Or use a free uptime service (UptimeRobot, Freshping) pointing at `https://yourdomain.com/api/health`.

---

## Quick reference

| Step              | Where        | Action |
|-------------------|-------------|--------|
| Key pair          | AWS Console | Create + download `.pem` |
| Security group    | AWS Console | SSH (22), HTTP (80), optionally 3000/4000 |
| Launch            | AWS Console | Launch instance, note Public IP |
| First login       | Your machine| `ssh -i key.pem ubuntu@<IP>` |
| Docker            | EC2         | Install Docker + Compose, add `ubuntu` to `docker` group |
| Deploy            | EC2         | Clone repo, `.env`, `docker compose up -d`, migrate, seed |
| Access            | Browser     | `http://<IP>:3000` or `http://<IP>` with Nginx |

---

## Troubleshooting

- **Can’t SSH:** Check security group allows your IP (or 0.0.0.0/0) on port 22; key permissions `chmod 400`.
- **Can’t open 3000/4000:** Add inbound rules for 3000 and 4000 (or use Nginx on 80 and proxy).
- **API CORS errors:** Set `CORS_ORIGIN` in `.env` to the exact URL the browser uses (including port).
- **Web can’t reach API:** Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to the public URL of the API (e.g. `http://<IP>:4000` or your domain).
