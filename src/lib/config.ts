/**
 * System Config Service
 * 
 * Reads credentials/settings from DB (system_configs table) first,
 * falls back to env vars. This allows credentials to be updated
 * from the admin UI without code changes.
 */

import { db } from './db';

// In-memory cache (invalidated on write)
let configCache: Record<string, Record<string, string>> | null = null;

/**
 * Get a config value by section and key.
 * DB first, then env fallback.
 */
export async function getConfig(section: string, key: string): Promise<string | null> {
  const cache = await loadConfig();
  if (cache[section]?.[key]) return cache[section][key];
  return null;
}

/**
 * Get a config value, with env var as fallback.
 */
export async function getConfigWithFallback(section: string, key: string, envKey: string): Promise<string | null> {
  const dbVal = await getConfig(section, key);
  if (dbVal) return dbVal;
  return process.env[envKey] || null;
}

/**
 * Set a config value in DB.
 */
export async function setConfig(section: string, key: string, value: string, label?: string, isSecret?: boolean): Promise<void> {
  await db.systemConfig.upsert({
    where: { section_key: { section, key } },
    update: { value, label: label || key, isSecret: isSecret ?? true },
    create: { section, key, value, label: label || key, isSecret: isSecret ?? true },
  });
  invalidateCache();
}

/**
 * Delete a config value from DB.
 */
export async function deleteConfig(section: string, key: string): Promise<void> {
  await db.systemConfig.delete({ where: { section_key: { section, key } } }).catch(() => {});
  invalidateCache();
}

/**
 * Get all configs grouped by section.
 */
export async function getAllConfigs(): Promise<Record<string, Record<string, { value: string; label: string; isSecret: boolean }>>> {
  const rows = await db.systemConfig.findMany({ orderBy: [{ section: 'asc' }, { key: 'asc' }] });
  const result: Record<string, Record<string, { value: string; label: string; isSecret: boolean }>> = {};
  for (const row of rows) {
    if (!result[row.section]) result[row.section] = {};
    result[row.section][row.key] = { value: row.value, label: row.label, isSecret: row.isSecret };
  }
  return result;
}

/**
 * Bulk upsert configs (used for seeding).
 */
export async function bulkUpsert(configs: { section: string; key: string; value: string; label?: string; isSecret?: boolean }[]): Promise<void> {
  for (const c of configs) {
    await db.systemConfig.upsert({
      where: { section_key: { section: c.section, key: c.key } },
      update: { value: c.value, label: c.label || c.key, isSecret: c.isSecret ?? true },
      create: { section: c.section, key: c.key, value: c.value, label: c.label || c.key, isSecret: c.isSecret ?? true },
    });
  }
  invalidateCache();
}

/**
 * Seed configs from current .env values.
 */
export async function seedConfigsFromEnv(): Promise<number> {
  const envConfigs: { section: string; key: string; envKey: string; label: string; isSecret: boolean }[] = [
    // Google OAuth
    { section: 'GOOGLE_OAUTH', key: 'CLIENT_ID', envKey: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', isSecret: false },
    { section: 'GOOGLE_OAUTH', key: 'CLIENT_SECRET', envKey: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', isSecret: true },
    // Razorpay
    { section: 'RAZORPAY', key: 'KEY_ID', envKey: 'RAZORPAY_KEY_ID', label: 'Razorpay Key ID', isSecret: false },
    { section: 'RAZORPAY', key: 'KEY_SECRET', envKey: 'RAZORPAY_KEY_SECRET', label: 'Razorpay Key Secret', isSecret: true },
    // SMTP
    { section: 'SMTP', key: 'HOST', envKey: 'SMTP_HOST', label: 'SMTP Host', isSecret: false },
    { section: 'SMTP', key: 'PORT', envKey: 'SMTP_PORT', label: 'SMTP Port', isSecret: false },
    { section: 'SMTP', key: 'USER', envKey: 'SMTP_USER', label: 'SMTP User / Email', isSecret: false },
    { section: 'SMTP', key: 'PASS', envKey: 'SMTP_PASS', label: 'SMTP Password (App Password)', isSecret: true },
    // SMS
    { section: 'SMS', key: 'FAST2SMS_API_KEY', envKey: 'FAST2SMS_API_KEY', label: 'Fast2SMS API Key', isSecret: true },
    // Brevo (Email)
    { section: 'BREVO', key: 'API_KEY', envKey: 'BREVO_API_KEY', label: 'Brevo API Key', isSecret: true },
    // Firebase (Phone Auth)
    { section: 'FIREBASE', key: 'API_KEY', envKey: 'FIREBASE_API_KEY', label: 'Firebase API Key', isSecret: false },
    { section: 'FIREBASE', key: 'AUTH_DOMAIN', envKey: 'FIREBASE_AUTH_DOMAIN', label: 'Firebase Auth Domain', isSecret: false },
    { section: 'FIREBASE', key: 'PROJECT_ID', envKey: 'FIREBASE_PROJECT_ID', label: 'Firebase Project ID', isSecret: false },
    { section: 'FIREBASE', key: 'CLIENT_EMAIL', envKey: 'FIREBASE_CLIENT_EMAIL', label: 'Firebase Admin Client Email', isSecret: true },
    { section: 'FIREBASE', key: 'PRIVATE_KEY', envKey: 'FIREBASE_PRIVATE_KEY', label: 'Firebase Admin Private Key', isSecret: true },
    // Platform
    { section: 'PLATFORM', key: 'UPI_ID', envKey: 'PLATFORM_UPI_ID', label: 'Platform UPI ID', isSecret: false },
    { section: 'PLATFORM', key: 'UPI_NAME', envKey: 'PLATFORM_UPI_NAME', label: 'Platform UPI Display Name', isSecret: false },
    // App
    { section: 'APP', key: 'NEXTAUTH_SECRET', envKey: 'NEXTAUTH_SECRET', label: 'NextAuth Secret', isSecret: true },
    { section: 'APP', key: 'NEXTAUTH_URL', envKey: 'NEXTAUTH_URL', label: 'App URL', isSecret: false },
  ];

  let seeded = 0;
  for (const c of envConfigs) {
    const envVal = process.env[c.envKey];
    if (!envVal) continue;
    // Only insert if DB doesn't already have a value
    const existing = await db.systemConfig.findUnique({ where: { section_key: { section: c.section, key: c.key } } });
    if (!existing) {
      await db.systemConfig.create({
        data: { section: c.section, key: c.key, value: envVal, label: c.label, isSecret: c.isSecret },
      });
      seeded++;
    }
  }
  invalidateCache();
  return seeded;
}

// --- Internal ---

async function loadConfig(): Promise<Record<string, Record<string, string>>> {
  if (configCache) return configCache;
  const rows = await db.systemConfig.findMany();
  const map: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    if (!map[row.section]) map[row.section] = {};
    map[row.section][row.key] = row.value;
  }
  configCache = map;
  return map;
}

function invalidateCache() {
  configCache = null;
}

// --- Convenience getters ---

export async function getGoogleClientId() { return getConfigWithFallback('GOOGLE_OAUTH', 'CLIENT_ID', 'GOOGLE_CLIENT_ID'); }
export async function getGoogleClientSecret() { return getConfigWithFallback('GOOGLE_OAUTH', 'CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'); }
export async function getRazorpayKeyId() { return getConfigWithFallback('RAZORPAY', 'KEY_ID', 'RAZORPAY_KEY_ID'); }
export async function getRazorpayKeySecret() { return getConfigWithFallback('RAZORPAY', 'KEY_SECRET', 'RAZORPAY_KEY_SECRET'); }
export async function getSmtpHost() { return getConfigWithFallback('SMTP', 'HOST', 'SMTP_HOST'); }
export async function getSmtpPort() { return getConfigWithFallback('SMTP', 'PORT', 'SMTP_PORT'); }
export async function getSmtpUser() { return getConfigWithFallback('SMTP', 'USER', 'SMTP_USER'); }
export async function getSmtpPass() { return getConfigWithFallback('SMTP', 'PASS', 'SMTP_PASS'); }
export async function getFast2SmsApiKey() { return getConfigWithFallback('SMS', 'FAST2SMS_API_KEY', 'FAST2SMS_API_KEY'); }
export async function getPlatformUpiId() { return getConfigWithFallback('PLATFORM', 'UPI_ID', 'PLATFORM_UPI_ID'); }
export async function getPlatformUpiName() { return getConfigWithFallback('PLATFORM', 'UPI_NAME', 'PLATFORM_UPI_NAME'); }
