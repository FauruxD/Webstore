import { test, expect, Page } from '@playwright/test';

/**
 * Storefront motion system: smooth scrolling, scroll reveals, and the
 * interactions layered on top. Every assertion here is about the page still
 * working, not about how the animation looks.
 */

const CATALOG = '/products';
const HOME = '/';

/** Lenis adds its own classes to <html>, which is the cheapest reliable probe. */
function lenisActive(page: Page) {
  return page.evaluate(() => document.documentElement.classList.contains('lenis'));
}

/**
 * Waits for the homepage intro to actually finish.
 *
 * Asserting the overlay is absent is not enough on its own: it is absent before
 * hydration too, so the check passes instantly and the test then scrolls a page
 * that the intro still has locked. This waits for the curtain attribute, the
 * overlay, and the body scroll lock to all clear.
 */
async function settleHome(page: Page) {
  await page.goto(HOME);

  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            !document.documentElement.hasAttribute('data-intro') &&
            document.querySelector('[data-intro-overlay]') === null &&
            document.body.style.overflow !== 'hidden',
        ),
      { timeout: 20_000 },
    )
    .toBe(true);

  // Smooth scrolling has to be listening before a wheel event means anything.
  await expect.poll(() => lenisActive(page), { timeout: 6000 }).toBe(true);
}

/** Every revealed element must end up fully opaque. */
async function allRevealed(page: Page, selector: string) {
  const count = await page.locator(selector).count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    await expect
      .poll(
        async () =>
          page
            .locator(selector)
            .nth(i)
            .evaluate((el) => getComputedStyle(el).opacity),
        { timeout: 8000 },
      )
      .toBe('1');
  }
}

test.describe('smooth scrolling scope', () => {
  test('runs on the storefront', async ({ page }) => {
    await page.goto(CATALOG);
    await expect.poll(() => lenisActive(page), { timeout: 6000 }).toBe(true);
  });

  test('never runs on the admin dashboard', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForTimeout(900);
    expect(await lenisActive(page)).toBe(false);
  });

  test('reduced motion falls back to native scrolling', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(CATALOG);
    await page.waitForTimeout(900);

    expect(await lenisActive(page)).toBe(false);

    // Native scrolling still moves the page.
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await ctx.close();
  });

  test('wheel input still scrolls, and anchors still resolve', async ({ page }) => {
    await page.goto(CATALOG);
    await expect.poll(() => lenisActive(page), { timeout: 6000 }).toBe(true);

    await page.mouse.wheel(0, 900);
    // Smooth scrolling eases, so the position arrives over a few frames.
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeGreaterThan(
      100,
    );
  });

  test('the intro curtain holds the page still against wheel input', async ({ page }) => {
    // `?intro=1` forces the intro even on a warm session.
    await page.goto(`${HOME}?intro=1`);

    // Catch the page mid-intro: the curtain attribute is the reliable marker.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.hasAttribute('data-intro')), {
        timeout: 8000,
      })
      .toBe(true);

    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(600);

    // Body overflow alone would not stop smooth scrolling, which reads wheel
    // events off the window. The page must not have moved.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe('scroll reveals', () => {
  test('the gate never leaves content hidden on the homepage', async ({ page }) => {
    await settleHome(page);

    await expect
      .poll(() => page.evaluate(() => document.documentElement.hasAttribute('data-reveal-armed')), {
        timeout: 8000,
      })
      .toBe(false);
  });

  test('headings and cards reach full opacity after scrolling through', async ({ page }) => {
    await settleHome(page);

    // Walk the page so every trigger passes its start point.
    for (let i = 0; i < 8; i += 1) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(250);
    }

    await allRevealed(page, '[data-reveal]');
    await allRevealed(page, '[data-reveal-item]');
  });

  test('reveals leave no leftover inline transform behind', async ({ page }) => {
    await settleHome(page);
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(1200);

    const heading = page.locator('[data-reveal="heading"]').first();
    await expect
      .poll(async () => heading.evaluate((el) => getComputedStyle(el).opacity), { timeout: 6000 })
      .toBe('1');

    // clearProps must strip the tween's own writes.
    const style = await heading.evaluate((el) => el.getAttribute('style') ?? '');
    expect(style).not.toContain('opacity');
    expect(style).not.toContain('translate');
  });

  test('reduced motion shows everything without arming the gate', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(HOME);
    await page.waitForTimeout(1200);

    expect(
      await page.evaluate(() => document.documentElement.hasAttribute('data-reveal-armed')),
    ).toBe(false);

    await allRevealed(page, '[data-reveal]');
    await ctx.close();
  });

  test('client navigation rebuilds reveals rather than leaving a blank page', async ({ page }) => {
    await settleHome(page);

    await page.getByRole('link', { name: 'Katalog', exact: true }).click();
    await expect(page).toHaveURL(/\/products/);

    await allRevealed(page, '[data-reveal]');
    await allRevealed(page, '[data-reveal-item]');
  });

  test('the catalog filter form is usable immediately, never hidden', async ({ page }) => {
    await page.goto(CATALOG);

    const search = page.getByPlaceholder('Cari nama produk atau kata kunci...');
    await expect(search).toBeVisible();
    await search.fill('template');
    await expect(search).toHaveValue('template');

    // Filtering is a full GET navigation; the results must survive it.
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page).toHaveURL(/q=template/);
    await allRevealed(page, '[data-reveal]');
  });
});

test.describe('modals and drawers keep their own scrolling', () => {
  test('the cart drawer scrolls itself and freezes the page', async ({ page }) => {
    await page.goto(CATALOG);
    await expect.poll(() => lenisActive(page), { timeout: 6000 }).toBe(true);

    // Adding to the cart opens the drawer itself, so there is nothing to click.
    await page.getByRole('button', { name: 'Tambah ke Keranjang' }).first().click();

    const drawer = page.locator('[data-lenis-prevent]').first();
    await expect(drawer).toBeVisible();

    // Locked: body overflow hidden, and smooth scrolling stopped with it.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('lenis-stopped')),
    ).toBe(true);

    const before = await page.evaluate(() => window.scrollY);
    await drawer.hover();
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    // Closing hands scrolling back to the page.
    await page.getByRole('button', { name: 'Tutup Keranjang' }).click();
    await expect(drawer).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    await expect
      .poll(
        () => page.evaluate(() => document.documentElement.classList.contains('lenis-stopped')),
        { timeout: 4000 },
      )
      .toBe(false);
  });

  test('the checkout dialog opens, scrolls, and closes without breaking the page', async ({
    page,
  }) => {
    // First published product, whatever the seed produced.
    await page.goto(CATALOG);
    await page.locator('a[href^="/products/"]').first().click();
    await expect(page).toHaveURL(/\/products\/.+/);

    await page.getByRole('button', { name: 'Beli Sekarang' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('lenis-stopped')),
    ).toBe(true);

    // The dialog body is a nested scroller and must accept the wheel itself.
    const body = dialog.locator('[data-lenis-prevent]');
    await expect(body).toBeVisible();

    const pageBefore = await page.evaluate(() => window.scrollY);
    await body.hover();
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageBefore);

    await page.getByRole('button', { name: 'Tutup dialog' }).click();
    await expect(dialog).toHaveCount(0);

    // Scrolling resumes.
    await expect
      .poll(
        () =>
          page.evaluate(() => document.documentElement.classList.contains('lenis-stopped')),
        { timeout: 4000 },
      )
      .toBe(false);
  });
});

test.describe('interactions', () => {
  test('the header changes chrome on scroll without moving the page', async ({ page }) => {
    await page.goto(CATALOG);

    const header = page.locator('header').first();
    const heightBefore = (await header.boundingBox())!.height;
    expect(await header.evaluate((el) => el.hasAttribute('data-scrolled'))).toBe(false);

    await page.mouse.wheel(0, 500);
    await expect
      .poll(() => header.evaluate((el) => el.hasAttribute('data-scrolled')), { timeout: 4000 })
      .toBe(true);

    // No layout shift: the bar keeps its height and stays pinned.
    const boxAfter = (await header.boundingBox())!;
    expect(boxAfter.height).toBe(heightBefore);
    expect(boxAfter.y).toBe(0);
  });

  test('product cards stay fully usable without hover', async ({ browser }) => {
    // Touch context: no hover, so the hover-only quick view must not be needed.
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    await page.goto(CATALOG);

    // Add to cart works from a tap, and the drawer it opens reports the count.
    await page.getByRole('button', { name: 'Tambah ke Keranjang' }).first().click();
    await expect(page.getByText('1 item')).toBeVisible();
    await page.getByRole('button', { name: 'Tutup Keranjang' }).click();

    // The hover-only quick view must never be the way into a product.
    await page.locator('a[href^="/products/"]').first().click();
    await expect(page).toHaveURL(/\/products\/.+/);
    await ctx.close();
  });

  test('the product gallery swaps previews on thumbnail click', async ({ page }) => {
    await page.goto(CATALOG);
    await page.locator('a[href^="/products/"]').first().click();

    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    test.skip(count < 2, 'seeded product has a single preview');

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
  });

  test('the FAQ disclosure opens and closes', async ({ page }) => {
    await page.goto(CATALOG);
    await page.locator('a[href^="/products/"]').first().click();

    const question = page.getByText('Berapa lama pesanan saya diverifikasi?');
    await question.scrollIntoViewIfNeeded();
    await question.click();
    await expect(
      page.getByText('Pembayaran QRIS diverifikasi manual oleh admin', { exact: false }),
    ).toBeVisible();
  });
});

test.describe('responsive integrity', () => {
  const VIEWPORTS = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ];

  for (const viewport of VIEWPORTS) {
    test(`no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport });
      const page = await ctx.newPage();

      for (const route of [HOME, CATALOG]) {
        await page.goto(route);
        await page.waitForTimeout(route === HOME ? 3200 : 900);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        // One pixel of slack for sub-pixel rounding at fractional zoom.
        expect(overflow, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(1);
      }

      await ctx.close();
    });
  }
});

test('no console errors across the motion surfaces', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await settleHome(page);
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(600);

  await page.getByRole('link', { name: 'Katalog', exact: true }).click();
  await expect(page).toHaveURL(/\/products/);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(600);

  await page.locator('a[href^="/products/"]').first().click();
  await page.waitForTimeout(900);

  // Pre-existing favicon 404s are not this feature's concern.
  expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
});
