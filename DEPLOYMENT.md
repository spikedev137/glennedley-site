# Preview and deployment

## Recommended first deployment

Publish this repository to a separate GitHub branch and create a Cloudflare Pages preview before replacing the live site.

Cloudflare Pages settings:

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 22 or newer

The three existing public URLs ending in `.html` are preserved by redirects in `public/_redirects`.

## Verification

Run locally before committing:

```bash
npm install
npm run build
npm test
```

The automated check verifies every generated HTML page, canonical tag, first-level heading, internal link and sitemap URL. Review the Four Factors landing page, all four factor archives and a sample of article labels before publishing.

## Production sequence

1. Review the Cloudflare preview, especially the examples listed in `MIGRATION-REPORT.md` and low-confidence labels in `factor-classification-review.csv`.
2. Decide whether the six ambiguous Glenn's Blog posts belong in the archive.
3. Migrate or remove the remote images listed in `media-urls.txt`; HTTP images may be blocked on the HTTPS site.
4. Deploy GlennEdley.com.
5. Confirm the new archive URLs respond successfully.
6. Import the one-to-one URL map from `spike-redirects.csv` into Spike's redirection system.
7. Remove the old MondayMotivator posts and archive links from Spike without deleting media still used by the new site.
8. Submit `https://glennedley.com/sitemap.xml` in Google Search Console.
