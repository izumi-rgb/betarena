#!/bin/bash
# Run this on the EC2 instance after SSH in (Part 4 deploy).
# Usage: curl -sSL <raw-url> | bash   OR   copy-paste these commands.

set -e
PUBLIC_IP="${PUBLIC_IP:-16.170.227.62}"

echo "=== BetArena Part 4 deploy (IP: $PUBLIC_IP) ==="

# Clone
cd ~
if [ ! -d betarena ]; then
  git clone https://github.com/ctr6780-ship-it/betarena.git
fi
cd betarena

# Env
if [ ! -f .env ]; then
  cp .env.example .env
  # Generate secrets
  sed -i "s/your_jwt_secret_here/$(openssl rand -base64 48)/" .env
  sed -i "s/your_refresh_secret_here/$(openssl rand -base64 48)/" .env
  sed -i "s/your_db_password_here/betarena_$(openssl rand -hex 12)/" .env
  sed -i "s/change_this_before_running_seeds/betarena_admin_$(openssl rand -hex 8)/" .env
  sed -i "s|http://localhost:3000|http://${PUBLIC_IP}:3000|" .env
  sed -i "s|NODE_ENV=development|NODE_ENV=production|" .env
fi

# Override for public API URL
cp -n docs/deploy/docker-compose.vps.example.yml docker-compose.override.yml 2>/dev/null || true
sed -i "s/YOUR_PUBLIC_IP/$PUBLIC_IP/g" docker-compose.override.yml

# Docker (assume Docker already installed per Part 3)
docker compose up -d --build
sleep 5
docker compose exec -T api npm run migrate
docker compose exec -T api npm run seed

echo "=== Done. Web: http://${PUBLIC_IP}:3000  API: http://${PUBLIC_IP}:4000 ==="
echo "Admin login: use ADMIN_SEED_PASSWORD from .env (or check seed output)."
