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
  if ($('link[rel="icon"][href="/favicon.svg?v=glasses-20261113"][type="image/svg+xml"]').length !== 1 || $('link[rel="icon"][href="/favicon.ico?v=glasses-20261113"]').length !== 1) problems.push(`${label}: missing glasses favicon or ICO fallback`);
  if ($('link[rel="apple-touch-icon"][href="/apple-touch-icon.png?v=glasses-20261113"]').length !== 1 || $('link[rel="manifest"][href="/site.webmanifest?v=glasses-20261113"]').length !== 1) problems.push(`${label}: missing platform icons`);
  if (/\[\/?vc_|open\.php|unsubscribe\.php|mail\/unsubscribe/i.test(html)) problems.push(`${label}: unresolved WordPress or email-system markup`);
  $('a[href^="/"]').each((_, anchor) => {
    const href = $(anchor).attr('href');
    if (href && !routeExists(href)) problems.push(`${label}: broken internal link ${href}`);
  });
}

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const pngSizes = { 'favicon-16x16.png': 16, 'favicon-32x32.png': 32, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 };
for (const [filename, size] of Object.entries(pngSizes)) {
  const data = fs.readFileSync(path.join(dist, filename));
  if (data.subarray(1, 4).toString() !== 'PNG' || data.readUInt32BE(16) !== size || data.readUInt32BE(20) !== size) problems.push(`${filename}: invalid PNG dimensions`);
}
const ico = fs.readFileSync(path.join(dist, 'favicon.ico'));
const icoSizes = Array.from({ length: ico.readUInt16LE(4) }, (_, index) => ico[6 + index * 16] || 256);
if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1 || [16, 32, 48, 64, 128, 256].some(size => !icoSizes.includes(size))) problems.push('favicon.ico: missing required image sizes');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'site.webmanifest'), 'utf8'));
for (const icon of manifest.icons) if (!routeExists(icon.src)) problems.push(`site.webmanifest: missing ${icon.src}`);
const faviconSvg = fs.readFileSync(path.join(dist, 'favicon.svg'), 'utf8');
if (!faviconSvg.includes('fill="#0b3d91"') || !faviconSvg.includes('fill="#fff"') || !faviconSvg.includes('viewBox="0 0 64 64"')) problems.push('favicon.svg: expected white glasses on deep blue');
const sitemapUrls = [...sitemap.matchAll(/<loc>/g)].length;
if (sitemapUrls !== 738) problems.push(`sitemap.xml: expected 738 URLs, found ${sitemapUrls}`);
if (htmlFiles.length !== 739) problems.push(`dist: expected 739 HTML pages, found ${htmlFiles.length}`);

// The thank-you page is a provider-controlled success destination, not a
// searchable landing page. A successful build does not prove a live signup.
const thankYou = cheerio.load(fs.readFileSync(path.join(dist, 'thank-you/index.html'), 'utf8'));
if (thankYou('meta[name="robots"]').attr('content') !== 'noindex, follow') problems.push('thank-you: missing noindex');
if (sitemap.includes('/thank-you/')) problems.push('sitemap.xml: thank-you page must not be indexed');
if (thankYou('.newsletter-signup, .newsletter-footer').length) problems.push('thank-you: should not prompt readers to sign up again');

for (const relative of ['index.html', 'mondaymotivator/index.html']) {
  const $ = cheerio.load(fs.readFileSync(path.join(dist, relative), 'utf8'));
  const form = $('form.newsletter-signup');
  if (form.length !== 1) { problems.push(`${relative}: expected one signup form`); continue; }
  const action = new URL(form.attr('action'));
  if (action.origin !== 'https://spike.us7.list-manage.com' || action.pathname !== '/subscribe/post' || action.searchParams.get('u') !== '42df7d456e8d986bbd949314a' || action.searchParams.get('id') !== 'aa2e9c1ec2' || action.searchParams.get('f_id') !== '005390e3f0') problems.push(`${relative}: Mailchimp action changed`);
  if (form.attr('method') !== 'post' || form.attr('target') !== '_self') problems.push(`${relative}: expected same-tab POST`);
  if (form.find('input[type="email"][name="EMAIL"][required]').length !== 1) problems.push(`${relative}: missing required email field`);
  if (form.find('input[type="hidden"][name="tags"]').attr('value') !== '6691322') problems.push(`${relative}: signup tag changed`);
  if (form.find('input[name="b_42df7d456e8d986bbd949314a_aa2e9c1ec2"]').attr('tabindex') !== '-1') problems.push(`${relative}: missing anti-bot field`);
  if (form.find('button[type="submit"]').length !== 1) problems.push(`${relative}: missing submit button`);
  if ($('script[src="https://s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js"]').length !== 1 || $('script[src^="/newsletter-success.js"]').length !== 1) problems.push(`${relative}: missing official validation or success-only adapter`);
}

// Dedicated project pages keep their verified external purchase destinations,
// shared author credits and locally bundled artwork.
const projectChecks = [
  { route: 'the-swearing-project', purchase: 'https://glennedley.gumroad.com/l/biyirv', chapters: 5 },
  { route: 'light-your-own-fire', purchase: 'https://glennedley.gumroad.com/l/lyof', chapters: 6 },
];
for (const { route, purchase, chapters } of projectChecks) {
  const $ = cheerio.load(fs.readFileSync(path.join(dist, route, 'index.html'), 'utf8'));
  if ($(`a[href="${purchase}"]`).length !== 2) problems.push(`${route}: expected two verified purchase links`);
  if ($('.project-chapters li').length !== chapters) problems.push(`${route}: chapter list changed`);
  if (!sitemap.includes(`https://glennedley.com/${route}/`)) problems.push(`${route}: missing sitemap entry`);
  $('img').each((_, image) => {
    const src = $(image).attr('src');
    if (!src?.startsWith('/images/projects/') || !routeExists(src)) problems.push(`${route}: image must exist locally: ${src}`);
    if (!$(image).attr('alt') || !$(image).attr('width') || !$(image).attr('height')) problems.push(`${route}: image missing alt or dimensions`);
  });
}
const book = cheerio.load(fs.readFileSync(path.join(dist, 'light-your-own-fire/index.html'), 'utf8'));
if (book('main').find('img').length !== 3) problems.push('light-your-own-fire: cover and two author images must be preserved');
if (!book('main').text().includes('Allison Roe MBE') || !book('main').text().includes('Charles Donoghue')) problems.push('light-your-own-fire: missing author or endorsement attribution');
if (book('a[href="https://a.co/d/0bWr7192"]').length !== 2) problems.push('light-your-own-fire: Amazon destination changed');
// Writing was intentionally retired; confirm compatible redirects instead.
const redirects = fs.readFileSync(path.join(dist, '_redirects'), 'utf8');
for (const entry of ['/writing/ /mondaymotivator/ 301', '/subscribe/ /mondaymotivator/ 301', '/the-next-move/ /your-next-move/ 301']) {
  if (!redirects.includes(entry)) problems.push(`missing approved redirect: ${entry}`);
}


if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Validated ${htmlFiles.length} HTML pages, ${sitemapUrls} sitemap URLs and all internal links.`);
