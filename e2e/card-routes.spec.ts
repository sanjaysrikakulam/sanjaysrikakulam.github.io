import { expect, test } from '@playwright/test';

// The two business-card QR landing pages plus the vCard file they point at.
// Both pages are noindex, inherit Umami from Base, and carry a data-umami-event
// on their primary action so scans and click-throughs are both attributable.
test.describe('business-card QR routes', () => {
  test('/c/m is a noindex email landing with a tracked mailto button', async ({ page }) => {
    await page.goto('/c/m');
    await expect(page.locator('h1')).toHaveText('Dr. Sanjay Kumar Srikakulam');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const button = page.locator('a.btn');
    await expect(button).toHaveAttribute('href', 'mailto:s.srikakulam@fz-juelich.de');
    await expect(button).toHaveAttribute('data-umami-event', 'card-email');
  });

  test('/c/v is a noindex vCard landing with a tracked download button', async ({ page }) => {
    await page.goto('/c/v');
    await expect(page.locator('h1')).toHaveText('Dr. Sanjay Kumar Srikakulam');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const button = page.locator('a.btn');
    await expect(button).toHaveAttribute('href', '/contact.vcf');
    await expect(button).toHaveAttribute('download', /\.vcf$/);
    await expect(button).toHaveAttribute('data-umami-event', 'card-vcard');
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
