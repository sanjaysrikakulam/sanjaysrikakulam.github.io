import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  // The site scrolls smoothly for real visitors (src/styles/global.css sets
  // `scroll-behavior: smooth` and only relaxes it for prefers-reduced-motion).
  // Playwright's own actionability checks race that animation while an element
  // is mid-scroll into view, especially on the touch-emulated mobile project,
  // producing flaky "element is not stable" failures unrelated to the feature
  // under test. Emulating reduced motion here exercises the exact same
  // accessibility path the site already ships, so it is a legitimate test
  // setting rather than a workaround.
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'on-first-retry', reducedMotion: 'reduce' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
