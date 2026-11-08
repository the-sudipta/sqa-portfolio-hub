import { test, expect, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Checks every link on the hub page: local files must exist, external links must answer with a non-error status.
// SITE_URL can point to the live site (CI after deploy); by default the local index.html is opened.

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = process.env.SITE_URL;
// Sites that block automated requests even for valid pages; they are only checked for a well-formed URL.
const BOT_BLOCKED = ['linkedin.com'];

async function collectLinks(page: import('@playwright/test').Page): Promise<string[]> {
  await page.goto(SITE_URL ?? `file://${path.join(ROOT, 'index.html').replace(/\\/g, '/')}`);
  const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
  return [...new Set(hrefs)];
}

async function statusOf(request: APIRequestContext, url: string): Promise<number> {
  const head = await request.head(url, { maxRedirects: 5, timeout: 20_000 }).catch(() => null);
  if (head && head.status() < 400) return head.status();
  const get = await request.get(url, { maxRedirects: 5, timeout: 20_000 });
  return get.status();
}

test('every link on the hub page works', async ({ page, request }) => {
  const links = await collectLinks(page);
  expect(links.length).toBeGreaterThan(10);
  const broken: string[] = [];
  for (const href of links) {
    if (href.startsWith('#')) {
      if ((await page.locator(href).count()) === 0) broken.push(`${href} (missing anchor)`);
    } else if (href.startsWith('mailto:')) {
      if (!/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(href)) broken.push(`${href} (bad email)`);
    } else if (!/^https?:/.test(href)) {
      if (!SITE_URL && !fs.existsSync(path.join(ROOT, href))) broken.push(`${href} (file not found)`);
    } else if (!BOT_BLOCKED.some((domain) => href.includes(domain))) {
      const status = await statusOf(request, href);
      if (status >= 400) broken.push(`${href} (HTTP ${status})`);
    }
  }
  expect(broken, `Broken links:\n${broken.join('\n')}`).toEqual([]);
});

test('theme toggle switches between light and dark', async ({ page }) => {
  await page.goto(SITE_URL ?? `file://${path.join(ROOT, 'index.html').replace(/\\/g, '/')}`);
  const toggle = page.locator('[data-theme-toggle]');
  const before = await page.locator('html').getAttribute('data-theme');
  await toggle.click();
  const after = await page.locator('html').getAttribute('data-theme');
  expect(after).not.toBe(before);
  expect(['light', 'dark']).toContain(after);
});

test('page fits a 375 px phone without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(SITE_URL ?? `file://${path.join(ROOT, 'index.html').replace(/\\/g, '/')}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
