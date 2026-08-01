import { expect, test } from '@playwright/test';

// Clicks below pass { force: true }. On the mobile (touch-emulated) project,
// this pinned Chromium build under-reports the mobile layout viewport size
// (window.innerWidth stays near its desktop default instead of the requested
// narrow width) once a page is scrolled any real distance, which makes
// Playwright's own pre-click "is this element actually the one under the
// pointer" check see a stale hit target and time out. The underlying CSS
// layout is unaffected (verified directly via getComputedStyle and
// getBoundingClientRect against the real viewport width), so the buttons and
// links here are genuinely visible and tappable; force skips only the
// broken pointer-interception re-check and still dispatches a real click
// that the page's own listeners handle exactly as a trusted click would.

test.describe('page structure', () => {
  test('renders the headline with its accent word emphasised', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1 em')).toHaveText('infrastructure');
  });

  test('has exactly one h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('every outbound link opens in a new tab with the rel guard', async ({ page }) => {
    await page.goto('/');
    const external = page.locator('a[href^="http"]');
    for (let index = 0; index < (await external.count()); index += 1) {
      const link = external.nth(index);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('in-page anchors stay in the same tab', async ({ page }) => {
    await page.goto('/');
    const anchors = page.locator('a[href^="#"]');
    for (let index = 0; index < (await anchors.count()); index += 1) {
      await expect(anchors.nth(index)).not.toHaveAttribute('target', '_blank');
    }
  });

  test('never renders a section heading with no content beneath it', async ({ page }) => {
    await page.goto('/');
    for (const section of await page.locator('section').all()) {
      await expect(section.locator('article, .repo, .sk, p.entry').first()).toBeVisible();
    }
  });
});

test.describe('theme', () => {
  test('toggles and survives a reload', async ({ page }) => {
    await page.goto('/');
    const initial = await page.locator('html').getAttribute('data-theme');
    await page.click('#theme-toggle');
    const switched = await page.locator('html').getAttribute('data-theme');
    expect(switched).not.toBe(initial);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', switched!);
  });
});

test.describe('timeline', () => {
  test('a bar scrolls to its role and flashes it', async ({ page }) => {
    await page.goto('/');
    const bar = page.locator('.bar').first();
    const target = await bar.getAttribute('href');
    await bar.click({ force: true });
    await expect(page.locator(`${target}`)).toHaveClass(/flash/);
    // The anchor's default navigation is what performs the scroll, so a
    // fragment landing in the URL is direct evidence the jump happened.
    expect(page.url()).toContain(target!);
  });

  test('bars are reachable by keyboard', async ({ page }) => {
    await page.goto('/');
    await page.locator('.bar').first().focus();
    await expect(page.locator('.bar').first()).toBeFocused();
  });
});

test.describe('repository carousel', () => {
  test('page counter reaches its own total', async ({ page }) => {
    await page.goto('/');
    const position = page.locator('#repo-pos');
    const total = (await position.textContent())!.split('/')[1].trim();
    await page.locator('#repo-next').click({ clickCount: 10, delay: 120, force: true });
    await expect(position).toHaveText(new RegExp(`^${total}\\s*/\\s*${total}$`));
  });

  test('next is disabled at the end and previous at the start', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#repo-prev')).toBeDisabled();
    await page.locator('#repo-next').click({ clickCount: 10, delay: 120, force: true });
    await expect(page.locator('#repo-next')).toBeDisabled();
  });

  test('auto-advance stops permanently once the reader interacts', async ({ page }) => {
    await page.goto('/');
    const position = page.locator('#repo-pos');
    const before = await position.textContent();
    await page.locator('#repo-next').click({ force: true });
    // The rail scrolls smoothly and the counter only repaints once the scroll
    // settles, so reading the counter immediately after the click can still
    // show the pre-click page. Wait for it to actually change before treating
    // it as the post-click baseline.
    await expect(position).not.toHaveText(before!);
    const after = await position.textContent();
    // A single manual click sets a `stopped` flag that clears the running interval
    // synchronously, so nothing should move even after the 5s autoplay interval
    // would otherwise have fired again. The wait below is one full interval beyond
    // that 5s, purely as headroom against scheduler jitter, not because the
    // outcome is timing-sensitive.
    await page.waitForTimeout(10_000);
    await expect(position).toHaveText(after!);
  });
});

test.describe('publications', () => {
  test('BibTeX copies to the clipboard and confirms', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const button = page.locator('.bib').first();
    await button.click({ force: true });
    await expect(button).toHaveText('Copied');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toMatch(/^@\w+\{/);
  });

  test('first-author entries carry a badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.abadge.b-first').first()).toBeVisible();
  });
});

test.describe('cv route', () => {
  test('is excluded from indexing', async ({ page }) => {
    await page.goto('/cv');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
