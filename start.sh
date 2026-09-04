#!/bin/sh
# ============================================
# SevaSaathi — Render Startup Script
# Runs Prisma db push then starts Next.js
# Works with MongoDB (replica set required)
# ============================================

echo "🚀 SevaSaathi starting..."

# Use LOCAL prisma binary (not npx which downloads latest v7)
PRISMA_CLI="./node_modules/.bin/prisma"

if [ -n "$DATABASE_URL" ]; then
  echo "📊 Pushing database schema..."
  $PRISMA_CLI db push --accept-data-loss 2>&1 || echo "⚠️  db push failed (may already be in sync)"
  
  echo "🌱 Seeding initial data..."
  # Only seed if no users exist (first run)
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    db.user.count().then(async c => {
      if (c === 0) {
        console.log('No users found, running seed...');
        const { execSync } = require('child_process');
        try { execSync('./node_modules/.bin/prisma db seed', { stdio: 'inherit' }); } 
        catch(e) { console.log('Seed attempted'); }
      } else {
        console.log('Database already has ' + c + ' users, skipping seed');
      }
      await db.\$disconnect();
    }).catch(e => console.log('DB check error:', e.message));
  " 2>&1 || true
else
  echo "⚠️  DATABASE_URL not set — database features will not work"
fi

echo "🌐 Starting Next.js server..."
exec node server.js
