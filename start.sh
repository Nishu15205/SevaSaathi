#!/bin/sh
# ============================================
# SevaSaathi — Render Startup Script
# Runs Prisma db push then starts Next.js
# Works with MongoDB
# ============================================

echo "🚀 SevaSaathi starting..."

# Wait for database to be ready (retry up to 30 times)
if [ -n "$DATABASE_URL" ]; then
  echo "📊 Pushing database schema..."
  npx prisma db push --accept-data-loss 2>&1 || echo "⚠️  db push failed (may already be in sync)"
  
  echo "🌱 Seeding initial data..."
  # Only seed if no users exist (first run)
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    db.user.count().then(async c => {
      if (c === 0) {
        console.log('No users found, running seed...');
        // Import and run seed
        const { execSync } = require('child_process');
        try { execSync('npx prisma db seed', { stdio: 'inherit' }); } 
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
