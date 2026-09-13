# GlennEdley.com

Static Astro site for GitHub and Cloudflare Pages, including the MondayMotivator archive.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: 22 or newer

## Adding a MondayMotivator

Add a JSON entry to `src/entries/mondaymotivator`. Use an existing entry as the template. The `date` value determines its original publication date and year archive. Set `primaryFactor` to `belief`, `programming-the-mind`, `mental-posture` or `focus`; add `secondaryFactor` only for a genuine overlap. Running the build creates the individual page, updates the year and factor archives, and updates the sitemap.

## WordPress migration

The imported archive was generated from the supplied WordPress exports using `scripts/import-wordpress.mjs`. The raw exports are intentionally not bundled; pass their paths with `--old` and `--new` if you rerun the import. See `MIGRATION-REPORT.md` before deployment and use `factor-classification-review.csv` to review or filter factor labels. Do not remove the old Spike posts until the new pages have been checked and the redirects in `spike-redirects.csv` are ready to install.
