import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));

const oldExport = path.resolve(args.old || path.join(root, 'imports', 'glenns-blog.xml'));
const newExport = path.resolve(args.new || path.join(root, 'imports', 'mondaymotivator.xml'));
const outputDir = path.join(root, 'src', 'entries', 'mondaymotivator');

for (const required of [oldExport, newExport]) {
  if (!fs.existsSync(required)) throw new Error(`Missing WordPress export: ${required}`);
}

function decodeXml(value = '') {
  return value
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function tag(block, name, prefix = '(?:wp:)?') {
  const match = block.match(new RegExp(`<${prefix}${name}[^>]*>([\\s\\S]*?)<\\/${prefix}${name}>`));
  return decodeXml(match?.[1]?.trim() || '');
}

function categories(block) {
  return [...block.matchAll(/<category domain="([^"]*)" nicename="([^"]*)">([\s\S]*?)<\/category>/g)]
    .map((match) => ({ domain: match[1], slug: match[2], name: decodeXml(match[3]) }));
}

function parseExport(file) {
  const xml = fs.readFileSync(file, 'utf8');
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const block = match[1];
    return {
      id: tag(block, 'post_id'),
      title: tag(block, 'title', ''),
      dateTime: tag(block, 'post_date'),
      slug: tag(block, 'post_name'),
      status: tag(block, 'status'),
      type: tag(block, 'post_type'),
      oldUrl: tag(block, 'link', ''),
      html: tag(block, 'encoded', 'content:'),
      attachmentUrl: tag(block, 'attachment_url'),
      categories: categories(block),
      raw: block,
    };
  });
}

function hasMondayCategory(post) {
  return post.categories.some((category) => /monday[\s-]*motivator/i.test(`${category.slug} ${category.name}`));
}

function isClearlyMonday(post) {
  return hasMondayCategory(post) || /monday\s*motivator|mondaymotivator|yourmondaymotivator/i.test(`${post.title} ${post.raw}`);
}

function textLength($, element) {
  return $(element).text().replace(/\s+/g, ' ').trim().length;
}

function expandWordPressShortcodes(rawHtml, attachmentUrls, missingAttachmentIds) {
  return (rawHtml || '')
    .replace(/%%[^%]*First(?:[ _])?Name%%|\*\|FNAME\|\*/gi, '')
    .replace(/\[vc_single_image\b([^\]]*)\]/gi, (_, attributes) => {
      const id = attributes.match(/\bimage=["']?(\d+)/i)?.[1];
      const src = id ? attachmentUrls.get(id) : '';
      if (!src) {
        if (id) missingAttachmentIds.add(id);
        return '';
      }
      return `<img src="${src}" alt="" loading="lazy">`;
    })
    .replace(/\[\/?(?:vc_[a-z0-9_-]+|et_pb_[a-z0-9_-]+|fusion_[a-z0-9_-]+)\b[^\]]*\]/gi, '')
    .replace(/\[\/?caption\b[^\]]*\]/gi, '');
}

function normaliseTopLevelBlocks(fragment) {
  const blockTags = new Set(['address', 'article', 'aside', 'blockquote', 'div', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'ol', 'p', 'pre', 'section', 'ul']);
  const nodes = fragment.root().contents().toArray();
  const output = [];
  let inline = '';

  const flush = () => {
    const cleaned = inline.replace(/\s+/g, ' ').trim();
    if (cleaned) output.push(`<p>${cleaned}</p>`);
    inline = '';
  };

  for (const node of nodes) {
    if (node.type === 'text') {
      const parts = (node.data || '').split(/\n\s*\n/);
      parts.forEach((part, index) => {
        const normalised = part.replace(/\s*\n\s*/g, ' ').trim();
        const needsSpace = inline && normalised && !/^[,.;:!?%)\]}”’]/.test(normalised) && !/\s$/.test(inline);
        inline += `${needsSpace ? ' ' : ''}${normalised}`;
        if (index < parts.length - 1) flush();
      });
      continue;
    }
    const tagName = node.type === 'tag' ? node.name.toLowerCase() : '';
    const markup = fragment.html(node);
    if (blockTags.has(tagName)) {
      flush();
      output.push(markup);
    } else {
      inline += markup;
    }
  }
  flush();
  return output.join('\n');
}

function selectArticleHtml(rawHtml, sourceType, attachmentUrls, missingAttachmentIds) {
  const expandedHtml = expandWordPressShortcodes(rawHtml, attachmentUrls, missingAttachmentIds);
  const $ = cheerio.load(expandedHtml, null, false);
  $('script, style, meta, title, link, form, input, iframe, noscript').remove();
  $('img').each((_, image) => {
    const el = $(image);
    const src = el.attr('src') || '';
    const width = Number(el.attr('width') || 0);
    const height = Number(el.attr('height') || 0);
    if (/\/open\.php|tracking|spacer|beacon/i.test(src) || (width > 0 && width <= 2) || (height > 0 && height <= 2)) el.remove();
  });

  let selected = $.root();
  if (sourceType === 'glenns-blog' && $('table').length >= 2) {
    const boilerplate = /view with images|unsubscribe|join me on|contact me|facebook\s+subscribe\s+twitter/i;
    const candidates = $('td, article, main, div').toArray()
      .map((element) => {
        const el = $(element);
        const length = textLength($, element);
        const links = el.find('a').toArray().reduce((sum, link) => sum + textLength($, link), 0);
        const paragraphs = el.find('p').length;
        const tables = el.find('table').length;
        const text = el.text().replace(/\s+/g, ' ').trim();
        const score = length - (links * 1.8) + (paragraphs * 18) - (tables * 55) - (boilerplate.test(text) ? 180 : 0);
        return { element, length, paragraphs, score };
      })
      .filter((candidate) => candidate.length >= 180 && candidate.paragraphs >= 2)
      .sort((a, b) => b.score - a.score);
    if (candidates[0]) selected = $(candidates[0].element);
  }

  const fragment = cheerio.load(selected.html() || rawHtml || '', null, false);
  fragment('script, style, meta, title, link, form, input, iframe, noscript').remove();
  fragment('a').each((_, anchor) => {
    const el = fragment(anchor);
    const href = el.attr('href') || '';
    if (/myspikemail\.com\/mail\/(link|unsubscribe)|\/unsubscribe|mailto:glenn@mondaymotivator|^(?:file:)?\/{2,3}(?:users|home)\//i.test(href)) {
      el.replaceWith(el.contents());
    } else if (/^https?:\/\//i.test(href)) {
      el.attr('target', '_blank').attr('rel', 'noopener');
    }
  });
  fragment('img').each((_, image) => {
    const el = fragment(image);
    const src = el.attr('src') || '';
    const width = Number(el.attr('width') || 0);
    const height = Number(el.attr('height') || 0);
    if (/\/open\.php|tracking|spacer|beacon|stripe\.png|dottedline/i.test(src) || (width > 0 && width <= 2) || (height > 0 && height <= 2)) el.remove();
    else {
      el.removeAttr('style').removeAttr('width').removeAttr('height').removeAttr('border').attr('loading', 'lazy');
    }
  });
  fragment('h1').each((_, heading) => {
    const el = fragment(heading);
    el.replaceWith(`<h2>${el.html() || ''}</h2>`);
  });

  fragment('table, tbody, thead, tfoot, tr, td').each((_, element) => {
    fragment(element).replaceWith(fragment(element).contents());
  });
  fragment('*').each((_, element) => {
    const el = fragment(element);
    for (const attribute of ['style', 'align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'valign', 'width', 'height', 'class', 'id']) el.removeAttr(attribute);
  });
  fragment('p, div').each((_, element) => {
    const el = fragment(element);
    const text = el.text().replace(/\s+/g, ' ').trim();
    if (!text && el.find('img').length === 0) el.remove();
    else if (/^(?:hi|hey|hello|good morning)[,!. ]*$/i.test(text)) el.remove();
    else if (/^(view with images|website|contact me|unsubscribe|facebook|subscribe|twitter|join me on|loading comments)[\s|.]*$/i.test(text)) el.remove();
  });

  let cleaned = normaliseTopLevelBlocks(fragment)
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();

  if (!/<(?:p|ul|ol|blockquote|h[1-6]|img)\b/i.test(cleaned)) {
    const text = fragment.text().replace(/\s+/g, ' ').trim();
    cleaned = text ? `<p>${text}</p>` : '';
  }
  return cleaned;
}

function plainText(htmlValue) {
  const $ = cheerio.load(htmlValue || '', null, false);
  return $.text().replace(/\s+/g, ' ').trim();
}

function safeSlug(value, fallback) {
  const cleaned = (value || fallback)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)
    .replace(/-$/g, '');
  return cleaned || `edition-${fallback}`;
}

const factorTerms = {
  belief: [
    ['belief', 8], ['believe', 6], ['self belief', 10], ['confidence', 7], ['self image', 8],
    ['self esteem', 8], ['courage', 6], ['fear', 4], ['doubt', 4], ['possible', 3],
    ['impossible', 4], ['potential', 4], ['expectation', 5], ['dream', 3], ['worthy', 5],
  ],
  'programming-the-mind': [
    ['programming', 10], ['program your mind', 10], ['reprogram', 10], ['self talk', 8],
    ['affirmation', 8], ['thought', 4], ['thinking', 4], ['mindset', 7], ['mind', 3],
    ['brain', 5], ['words', 3], ['habit', 5], ['conditioning', 7], ['imagination', 5],
    ['learning', 3], ['memory', 4], ['input', 3],
  ],
  'mental-posture': [
    ['mental posture', 12], ['attitude', 7], ['respond', 5], ['response', 5], ['react', 5],
    ['resilience', 7], ['gratitude', 6], ['comparison', 7], ['compare', 6], ['perspective', 6],
    ['criticism', 4], ['optimism', 6], ['stress', 4], ['worry', 4], ['anger', 4],
    ['happiness', 4], ['forgiveness', 5], ['kindness', 4], ['adversity', 6], ['accept', 4],
    ['responsibility', 4],
  ],
  focus: [
    ['focus', 9], ['attention', 6], ['goal', 6], ['plan', 4], ['action', 5],
    ['discipline', 6], ['consistency', 6], ['priority', 6], ['time', 2], ['procrastination', 7],
    ['distraction', 7], ['decision', 4], ['effort', 4], ['progress', 5], ['process', 4],
    ['finish', 4], ['start', 3], ['purpose', 6], ['concentrate', 7],
  ],
};

function termScore(text, terms, multiplier = 1) {
  const normalised = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  return terms.reduce((score, [term, weight]) => {
    const needle = ` ${term} `;
    const hits = Math.min(3, normalised.split(needle).length - 1);
    return score + hits * weight * multiplier;
  }, 0);
}

function classifyFactor(title, body) {
  const scores = Object.entries(factorTerms).map(([slug, terms]) => ({
    slug,
    score: termScore(title, terms, 3) + termScore(body, terms),
  })).sort((a, b) => b.score - a.score);
  const [first, second] = scores;
  const primaryFactor = first.score ? first.slug : 'mental-posture';
  const margin = first.score - second.score;
  const factorConfidence = first.score >= 18 && margin >= 8 ? 'high' : first.score >= 9 && margin >= 3 ? 'medium' : 'low';
  const secondaryFactor = second.score >= 10 && second.score >= first.score * 0.65 ? second.slug : undefined;
  return { primaryFactor, ...(secondaryFactor ? { secondaryFactor } : {}), factorConfidence };
}

const parsedOldExport = parseExport(oldExport);
const parsedNewExport = parseExport(newExport);
const attachmentUrls = new Map([...parsedOldExport, ...parsedNewExport]
  .filter((post) => post.type === 'attachment' && post.id && post.attachmentUrl)
  .map((post) => [post.id, post.attachmentUrl]));
const missingAttachmentIds = new Set();

const oldPosts = parsedOldExport
  .filter((post) => post.status === 'publish' && post.type === 'glenns-blog');
const newPosts = parsedNewExport
  .filter((post) => post.status === 'publish' && post.type === 'post' && hasMondayCategory(post));
const ambiguous = oldPosts.filter((post) => !isClearlyMonday(post));
const selected = [...oldPosts.filter(isClearlyMonday), ...newPosts];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const slugCounts = new Map();
const converted = selected.map((post) => {
  const date = post.dateTime.slice(0, 10);
  const year = Number(date.slice(0, 4));
  const baseSlug = safeSlug(post.slug, post.id);
  const key = `${year}/${baseSlug}`;
  const count = (slugCounts.get(key) || 0) + 1;
  slugCounts.set(key, count);
  const slug = count === 1 ? baseSlug : `${baseSlug}-${post.id}`;
  const cleanedHtml = selectArticleHtml(post.html, post.type, attachmentUrls, missingAttachmentIds);
  const text = plainText(cleanedHtml);
  const factorClassification = classifyFactor(plainText(post.title), text);
  return {
    id: post.id,
    title: plainText(post.title) || `MondayMotivator ${date}`,
    date,
    year,
    slug,
    oldUrl: post.oldUrl,
    html: cleanedHtml,
    excerpt: text.length > 157 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}…` : text,
    sourceType: post.type,
    ...factorClassification,
    sourceTextLength: plainText(post.html).length,
    cleanedTextLength: text.length,
  };
});

for (const post of converted) {
  const filename = `${post.date}-${post.slug}-${post.id}.json`;
  const stored = { ...post };
  delete stored.sourceTextLength;
  delete stored.cleanedTextLength;
  fs.writeFileSync(path.join(outputDir, filename), `${JSON.stringify(stored, null, 2)}\n`);
}

const normalizedTitles = new Map();
for (const post of converted) {
  const key = post.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const entries = normalizedTitles.get(key) || [];
  entries.push(post);
  normalizedTitles.set(key, entries);
}
const duplicateGroups = [...normalizedTitles.values()].filter((group) => group.length > 1);
const lowContent = converted.filter((post) => post.cleanedTextLength < 120);
const heavilyReduced = converted.filter((post) => post.sourceTextLength > 500 && post.cleanedTextLength / post.sourceTextLength < 0.16);
const media = [...new Set(converted.flatMap((post) => [...post.html.matchAll(/<img[^>]+src=["']([^"']+)/gi)].map((match) => match[1])))].sort();
const insecureMedia = media.filter((url) => url.startsWith('http://'));
const factorCounts = Object.keys(factorTerms).map((slug) => ({
  slug,
  primary: converted.filter((post) => post.primaryFactor === slug).length,
  secondary: converted.filter((post) => post.secondaryFactor === slug).length,
}));
const lowConfidenceFactors = converted.filter((post) => post.factorConfidence === 'low');

const csv = [
  ['old_url', 'new_url', 'post_id', 'date', 'title'],
  ...converted.map((post) => [post.oldUrl, `https://glennedley.com/mondaymotivator/${post.year}/${post.slug}/`, post.id, post.date, post.title]),
].map((row) => row.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(root, 'spike-redirects.csv'), `${csv}\n`);
fs.writeFileSync(path.join(root, 'media-urls.txt'), `${media.join('\n')}\n`);

const factorReviewCsv = [
  ['date', 'title', 'primary_factor', 'secondary_factor', 'confidence', 'post_id', 'new_url'],
  ...converted.map((post) => [post.date, post.title, post.primaryFactor, post.secondaryFactor || '', post.factorConfidence, post.id, `https://glennedley.com/mondaymotivator/${post.year}/${post.slug}/`]),
].map((row) => row.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(root, 'factor-classification-review.csv'), `${factorReviewCsv}\n`);

const report = `# MondayMotivator migration report

Generated from the supplied WordPress exports.

## Import summary

- Definite published MondayMotivators imported: **${converted.length}**
- Old Glenn's Blog entries imported: **${converted.filter((post) => post.sourceType === 'glenns-blog').length}**
- New category entries imported: **${converted.filter((post) => post.sourceType === 'post').length}**
- Date range: **${converted.map((post) => post.date).sort()[0]} to ${converted.map((post) => post.date).sort().at(-1)}**
- Ambiguous Glenn's Blog entries held back for review: **${ambiguous.length}**
- Repeated-title groups requiring review: **${duplicateGroups.length}**
- Entries with less than 120 characters after cleaning: **${lowContent.length}**
- Entries heavily reduced by template cleaning: **${heavilyReduced.length}**
- Remaining remote image URLs: **${media.length}**
- Remote image URLs still using HTTP: **${insecureMedia.length}**
- Image shortcode IDs not resolved from the supplied exports: **${missingAttachmentIds.size}**

## Four Factors classification

Every imported article has a primary factor. A secondary factor is included only when the scoring is close enough to show a meaningful overlap. These labels are editorial starting points and can be changed directly in the article JSON.

${factorCounts.map((factor) => `- **${factor.slug}**: ${factor.primary} primary; ${factor.secondary} secondary`).join('\n')}
- Low-confidence primary assignments to review: **${lowConfidenceFactors.length}**

### Low-confidence assignments

${lowConfidenceFactors.map((post) => `- ${post.date} — ${post.title} → ${post.primaryFactor}${post.secondaryFactor ? ` / ${post.secondaryFactor}` : ''} (ID ${post.id})`).join('\n')}

## Ambiguous Glenn's Blog entries held back

${ambiguous.map((post) => `- ${post.dateTime.slice(0, 10)} — ${post.title} (WordPress ID ${post.id})`).join('\n')}

## Repeated titles

${duplicateGroups.map((group) => `- **${group[0].title}** — ${group.map((post) => `${post.date} (ID ${post.id})`).join('; ')}`).join('\n')}

## Automated-cleaning review

### Very short entries

${lowContent.length ? lowContent.map((post) => `- ${post.date} — ${post.title} (ID ${post.id}; ${post.cleanedTextLength} characters)`).join('\n') : '- None'}

### Heavily reduced entries

${heavilyReduced.length ? heavilyReduced.map((post) => `- ${post.date} — ${post.title} (ID ${post.id}; ${post.sourceTextLength} → ${post.cleanedTextLength} characters)`).join('\n') : '- None'}

### Unresolved image shortcode IDs

${missingAttachmentIds.size ? `- ${[...missingAttachmentIds].sort((a, b) => Number(a) - Number(b)).join(', ')}` : '- None'}

## Before deployment

1. Review the ambiguous, duplicate, very-short and heavily-reduced lists.
2. Check representative pages from every design era.
3. Copy any wanted remote images into the repository and update their URLs.
4. Publish the GlennEdley.com archive before installing the Spike redirects.
5. Install redirects one-to-one; do not redirect every old post to the archive homepage.
`;
fs.writeFileSync(path.join(root, 'MIGRATION-REPORT.md'), report);

console.log(`Imported ${converted.length} MondayMotivators.`);
console.log(`Held back ${ambiguous.length} ambiguous Glenn's Blog entries.`);
console.log(`Wrote ${duplicateGroups.length} repeated-title groups and ${lowContent.length} short entries to MIGRATION-REPORT.md.`);
