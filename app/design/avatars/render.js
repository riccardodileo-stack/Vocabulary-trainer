// Renders every SVG of a folder to a 384x384 PNG: node render.js <svg folder> <png folder>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = process.argv[2], out = process.argv[3]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 384, height: 384 }, deviceScaleFactor: 1 });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
  for (const f of files) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8').replace('width="200" height="200"', 'width="384" height="384"');
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.locator('svg').screenshot({ path: path.join(out, f.replace('.svg', '.png')), omitBackground: true });
  }
  await b.close();
})();
