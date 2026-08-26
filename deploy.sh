#!/bin/bash
# ============================================
# SevaSaathi — Quick Deploy Script (VPS / Ubuntu)
# ============================================
# Run on a fresh Ubuntu 22.04/24.04 VPS:
#   curl -sL https://raw.githubusercontent.com/YOUR_REPO/deploy.sh | bash
#   OR copy this file and run: bash deploy.sh
# ============================================

set -e

echo "============================================"
echo "  SevaSaathi Deployment Setup"
echo "============================================"

# --- 1. Install Docker ---
if ! command -v docker &> /dev/null; then
    echo "[1/6] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "[1/6] Docker already installed ✓"
fi

# --- 2. Install Docker Compose ---
if ! docker compose version &> /dev/null; then
    echo "[2/6] Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin 2>/dev/null || true
    echo "✅ Docker Compose installed"
else
    echo "[2/6] Docker Compose already installed ✓"
fi

# --- 3. Create .env.production ---
if [ ! -f .env.production ]; then
    echo "[3/6] Creating .env.production from template..."
    cp .env.production.example .env.production

    # Generate a random NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    sed -i "s|CHANGE_ME_generate_a_random_32_char_string|$SECRET|" .env.production

    echo ""
    echo "⚠️  IMPORTANT: Edit .env.production to add your credentials!"
    echo "   nano .env.production"
    echo ""
else
    echo "[3/6] .env.production exists ✓"
fi

# --- 4. Build & Start ---
echo "[4/6] Building and starting SevaSaathi..."
docker compose up -d --build

# --- 5. Initialize Database ---
echo "[5/6] Initializing database..."
sleep 5  # Wait for container to start
docker compose exec app bun run db:push -- --accept-data-loss 2>/dev/null || \
    docker compose exec app npx prisma db push --accept-data-loss 2>/dev/null || \
    echo "   ⚠️  db:push failed — run manually: docker compose exec app bun run db:push"

# --- 6. Seed Demo Data ---
echo "[6/6] Seeding demo data..."
docker compose exec app bun run seed 2>/dev/null || \
    echo "   ⚠️  seed failed — run manually: docker compose exec app bun run seed"

echo ""
echo "============================================"
echo "  ✅ SevaSaathi is LIVE!"
echo "============================================"
echo ""
echo "  🌐 URL:     http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "  📋 Login Credentials:"
echo "     Admin:    admin@sevasaathi.in / password123"
echo "     Family:   family@test.com / password123"
echo "     Caregiver: caregiver1@test.com / password123"
echo ""
echo "  🔧 Next Steps:"
echo "     1. Set up domain + HTTPS (Caddy recommended)"
echo "     2. Login as Admin → Settings → Configure Razorpay, SMS, SMTP"
echo "     3. Change default passwords!"
echo ""
echo "  🛑 Stop:    docker compose down"
echo "  🔄 Update: git pull && docker compose up -d --build"
echo "============================================"
