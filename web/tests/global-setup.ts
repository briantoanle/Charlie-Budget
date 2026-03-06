import { chromium, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STORAGE_STATE_PATH = path.resolve(__dirname, '../.auth/user.json');
const ENV_LOCAL_PATH = path.resolve(__dirname, '../.env.local');

function loadEnvFromLocalFile() {
  if (!fs.existsSync(ENV_LOCAL_PATH)) return;

  const content = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export default async function globalSetup(config: FullConfig) {
  loadEnvFromLocalFile();

  const email = process.env.E2E_SUPABASE_EMAIL;
  const password = process.env.E2E_SUPABASE_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing E2E_SUPABASE_EMAIL or E2E_SUPABASE_PASSWORD. Set them in your local env before running Playwright.'
    );
  }

  const project = config.projects[0];
  const baseURL = project?.use?.baseURL;

  if (typeof baseURL !== 'string') {
    throw new Error('Playwright baseURL is not configured.');
  }

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  await Promise.all([
    page.waitForURL(/\/dashboard(?:\?.*)?$/),
    page.click('button[type="submit"]'),
  ]);

  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
