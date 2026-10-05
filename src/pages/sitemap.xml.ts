import type { APIRoute } from 'astro';
import { posts, years } from '../data/posts';
import { factors } from '../data/factors';

const site = 'https://glennedley.com';
const paths = [
  '/',
  '/the-next-move/',
  '/now/',
  '/writing/',
  '/email/',
  '/mondaymotivator/',
  '/four-factors/',
  ...factors.map((factor) => `/mondaymotivator/factor/${factor.slug}/`),
  ...years.map((year) => `/mondaymotivator/${year}/`),
  ...posts.map((post) => `/mondaymotivator/${post.year}/${post.slug}/`),
];

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export const GET: APIRoute = () => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
