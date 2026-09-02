import { test, expect, Page } from '@playwright/test';

const OVERLAY = '[data-intro-overlay]';
const HOME = '/';

/**
 * The overlay mounts after hydration, so a bare toHaveCount(0) passes
 * instantly on a cold load. Require it to appear before requiring it to go.
 */
async function playsAndClears(page: Page) {
  await expect(page.locator(OVERLAY)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(OVERLAY)).toHaveCount(0, { timeout: 12_000 });
}

/** Asserts the intro never armed itself on this load. */
async function neverArms(page: Page) {
  await page.waitForTimeout(700);
  await expect(page.locator(OVERLAY)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-intro'))).toBe(
    false,
  );
}

test.describe('storefront intro preloader', () => {
  test('first visit plays, locks scroll, then removes itself from the DOM', async ({
    page,
  }) => {
    await page.goto(HOME);

    const overlay = page.locator(OVERLAY);
    await expect(overlay).toBeVisible({ timeout: 10_000 });

    // Scoped to the overlay: the hero eyebrow carries the same phrase.
    await expect(overlay.getByText('Curated Digital Goods', { exact: true })).toBeVisible();
    await expect(overlay.locator('[data-intro-wordmark]')).toBeVisible();
    await expect(page.locator('[data-intro-ring]')).toHaveCount(3);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await expect(overlay).toHaveCount(0, { timeout: 12_000 });

    // Scroll restored, curtain lifted, page accepts wheel input again.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(
      await page.evaluate(() => document.documentElement.hasAttribute('data-intro')),
    ).toBe(false);

    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('intro completes within roughly 2 to 3 seconds', async ({ page }) => {
    await page.addInitScript(() => {
      window.__introStart = performance.now();
      window.addEventListener('atelier:intro-exit', () => {
        window.__introExit = performance.now() - window.__introStart;
      });
    });

    await page.goto(HOME);
    await playsAndClears(page);

    const elapsed = await page.evaluate(() => window.__introExit ?? -1);
    expect(elapsed).toBeGreaterThan(1400);
    expect(elapsed).toBeLessThan(3600);
  });

  test('overlay does not intercept clicks after exit', async ({ page }) => {
    await page.goto(HOME);
    await playsAndClears(page);

    await page.getByRole('link', { name: 'Jelajahi Koleksi' }).click();
    await expect(page).toHaveURL(/\/products/);
  });

  test('hero entrance resolves to fully visible with styles cleared', async ({ page }) => {
    await page.goto(HOME);
    await playsAndClears(page);

    const hero = page.locator('[data-hero-enter]').first();
    await expect(hero).toBeVisible();
    await expect
      .poll(async () => hero.evaluate((el) => getComputedStyle(el).opacity), {
        timeout: 6000,
      })
      .toBe('1');

    // clearProps must leave no leftover inline transform or opacity.
    const leftover = await hero.evaluate((el) => el.getAttribute('style') ?? '');
    expect(leftover).not.toContain('opacity');

    // Every tagged hero block ends visible, not just the first. Polled because
    // the stagger means later blocks are still mid-tween when the first lands.
    const count = await page.locator('[data-hero-enter]').count();
    expect(count).toBe(6);
    for (let i = 0; i < count; i += 1) {
      const block = page.locator('[data-hero-enter]').nth(i);
      await expect
        .poll(async () => block.evaluate((el) => getComputedStyle(el).opacity), {
          timeout: 5000,
        })
        .toBe('1');
    }
  });

  test('repeat visit in the same session skips the intro', async ({ page }) => {
    await page.goto(HOME);
    await playsAndClears(page);

    await page.goto(HOME);
    await neverArms(page);

    // Hero must still be visible on the no-intro path.
    const op = await page
      .locator('[data-hero-enter]')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(op).toBe('1');
  });

  test('?intro=1 forces a replay', async ({ page }) => {
    await page.goto(HOME);
    await playsAndClears(page);

    await page.goto(`${HOME}?intro=1`);
    await playsAndClears(page);
  });

  test('reduced motion skips the overlay and leaves the hero visible', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(HOME);
    await page.waitForTimeout(1000);

    await expect(page.locator(OVERLAY)).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(
      await page.evaluate(() => document.documentElement.hasAttribute('data-intro')),
    ).toBe(false);

    const op = await page
      .locator('[data-hero-enter]')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(op).toBe('1');
    await ctx.close();
  });

  test('excluded routes never arm the intro', async ({ browser }) => {
    for (const route of ['/products', '/checkout', '/track-order', '/admin/login', '/faq']) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(route);
      await neverArms(page);
      await ctx.close();
    }
  });

  test('mobile viewport plays and clears without horizontal overflow', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(HOME);

    const wordmark = page.locator('[data-intro-wordmark]');
    await expect(wordmark).toBeVisible({ timeout: 10_000 });

    const box = await wordmark.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(390);

    await expect(page.locator(OVERLAY)).toHaveCount(0, { timeout: 12_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await ctx.close();
  });

  test('no console errors during the intro', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(HOME);
    await playsAndClears(page);
    await page.waitForTimeout(1000);

    expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
  });
});

declare global {
  interface Window {
    __introStart: number;
    __introExit?: number;
  }
}
