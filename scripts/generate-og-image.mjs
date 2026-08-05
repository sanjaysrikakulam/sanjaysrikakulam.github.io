import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import * as yaml from 'js-yaml';

const OUT = 'public/og-image.png';
const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Colours are read from the stylesheet rather than repeated here, so the share
 * card cannot drift away from the site it represents.
 */
function tokens() {
  const css = readFileSync('src/styles/global.css', 'utf8');
  const themeStart = css.indexOf('@theme');
  const block = css.slice(themeStart, css.indexOf('}', themeStart));
  const read = (name) => block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  return {
    bg: read('color-bg'),
    surface: read('color-surface'),
    ink: read('color-ink'),
    ink2: read('color-ink-2'),
    ink3: read('color-ink-3'),
    line: read('color-line'),
    accent: read('color-accent'),
    accentSoft: read('color-accent-soft'),
  };
}

const site = yaml.load(readFileSync('data/site.yml', 'utf8'), { schema: yaml.CORE_SCHEMA });
const t = tokens();
const { headline, headline_accent: accentWord, name } = site.profile;
const before = headline.slice(0, headline.indexOf(accentWord));
const after = headline.slice(headline.indexOf(accentWord) + accentWord.length);

const markup = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    background: ${t.bg};
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 76px 80px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative; overflow: hidden;
  }
  body::after {
    content: ''; position: absolute; top: -260px; right: -200px;
    width: 720px; height: 720px; border-radius: 50%;
    background: radial-gradient(circle, ${t.accentSoft} 0%, transparent 70%);
  }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace; font-size: 19px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${t.accent};
  }
  h1 {
    font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 74px;
    line-height: 1.08; letter-spacing: -0.02em; color: ${t.ink};
    max-width: 20ch; position: relative;
  }
  h1 em { font-style: italic; color: ${t.accent}; }
  .foot {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-top: 1px solid ${t.line}; padding-top: 26px; position: relative;
  }
  .who { font-size: 25px; font-weight: 600; color: ${t.ink}; }
  .url { font-family: 'JetBrains Mono', monospace; font-size: 19px; color: ${t.ink3}; }
</style></head>
<body>
  <p class="eyebrow">${name}</p>
  <h1>${before}<em>${accentWord}</em>${after}</h1>
  <div class="foot">
    <span class="who">Bioinformatics, research infrastructure, AI</span>
    <span class="url">sanjay.srikakulam.de</span>
  </div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await page.setContent(markup, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync('public', { recursive: true });
  await page.screenshot({ path: OUT });
  console.log(`Wrote ${OUT} at ${WIDTH}x${HEIGHT}`);
} finally {
  await browser.close();
}
