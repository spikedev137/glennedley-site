import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

const htmlFiles = filesBelow(dist).filter((file) => file.endsWith('.html'));
const problems = [];
const routeExists = (href) => {
  const clean = href.split(/[?#]/)[0];
  if (clean === '/') return fs.existsSync(path.join(dist, 'index.html'));
  const relative = clean.replace(/^\//, '');
  return fs.existsSync(path.join(dist, relative)) || fs.existsSync(path.join(dist, relative, 'index.html'));
};

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const $ = cheerio.load(html);
  const label = path.relative(dist, file);
  if ($('title').length !== 1 || !$('title').text().trim()) problems.push(`${label}: missing or repeated title`);
  if ($('h1').length !== 1) problems.push(`${label}: expected one h1, found ${$('h1').length}`);
  if ($('link[rel="canonical"]').length !== 1) problems.push(`${label}: missing canonical URL`);
  if (/\[\/?vc_|open\.php|unsubscribe\.php|mail\/unsubscribe/i.test(html)) problems.push(`${label}: unresolved WordPress or email-system markup`);
  $('a[href^="/"]').each((_, anchor) => {
    const href = $(anchor).attr('href');
    if (href && !routeExists(href)) problems.push(`${label}: broken internal link ${href}`);
  });
}

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>/g)].length;
if (sitemapUrls !== 734) problems.push(`sitemap.xml: expected 734 URLs, found ${sitemapUrls}`);
if (htmlFiles.length !== 734) problems.push(`dist: expected 734 HTML pages, found ${htmlFiles.length}`);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Validated ${htmlFiles.length} HTML pages, ${sitemapUrls} sitemap URLs and all internal links.`);
