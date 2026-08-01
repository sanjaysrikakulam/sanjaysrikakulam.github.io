import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

// astro emits directory routes as <route>/index.html, so a bare path match
// has to be a file, not the directory that also happens to exist on disk.
const isFile = (candidate) => existsSync(candidate) && statSync(candidate).isFile();

const ROOT = 'dist';
const OUT = 'public/Sanjay_Srikakulam_CV.pdf';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

function serve() {
  const server = createServer(async (request, response) => {
    const path = request.url === '/' ? '/index.html' : request.url.split('?')[0];
    const candidates = [
      join(ROOT, path),
      join(ROOT, path, 'index.html'),
      `${join(ROOT, path)}.html`,
    ];
    const file = candidates.find(isFile);
    if (!file) {
      response.writeHead(404).end('not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const server = await serve();
const { port } = server.address();
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/cv`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await mkdir('public', { recursive: true });
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate:
      '<div style="width:100%;font-size:8pt;color:#777;text-align:center;padding:0 15mm">' +
      '<span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' },
  });
  console.log(`Wrote ${OUT}`);
} finally {
  await browser.close();
  server.close();
}
