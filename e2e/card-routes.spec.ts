import { expect, test } from '@playwright/test';

// The business-card QR points at a single hub, /c, which fires all three contact
// actions directly (one tap each): email, website, save-contact. The hub is
// noindex, inherits Umami from Base (its pageview records the scan), and each
// action carries a data-umami-event for the click-through. /contact.vcf is the
// file the save-contact action downloads.
test.describe('business-card QR routes', () => {
  test('/c is a noindex contact hub with three tracked actions', async ({ page }) => {
    await page.goto('/c');
    await expect(page.locator('h1')).toHaveText('Dr. Sanjay Kumar Srikakulam');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    // Email, the primary action, is a prefilled mailto (percent-encoded, no `+`).
    const email = page.locator('a[data-a="email"]');
    await expect(email).toHaveAttribute(
      'href',
      /^mailto:s\.srikakulam@fz-juelich\.de\?subject=[^+]+&body=/,
    );
    await expect(email).toHaveAttribute('data-umami-event', 'card-email');

    // Website goes to the home page.
    const website = page.locator('a[data-a="website"]');
    await expect(website).toHaveAttribute('href', '/');
    await expect(website).toHaveAttribute('data-umami-event', 'card-website');

    // Save contact downloads the vCard with a friendly filename.
    const save = page.locator('a[data-a="save"]');
    await expect(save).toHaveAttribute('href', '/contact.vcf');
    await expect(save).toHaveAttribute('download', /\.vcf$/);
    await expect(save).toHaveAttribute('data-umami-event', 'card-vcard');
  });

  test('the retired /c/m and /c/v landing routes are gone', async ({ page }) => {
    expect((await page.goto('/c/m'))?.status()).toBe(404);
    expect((await page.goto('/c/v'))?.status()).toBe(404);
  });

  test('/contact.vcf returns the profile as a vCard', async ({ request }) => {
    const response = await request.get('/contact.vcf');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('BEGIN:VCARD');
    expect(body).toContain('FN:Dr. Sanjay Kumar Srikakulam');
    expect(body).toContain('END:VCARD');
  });
});
