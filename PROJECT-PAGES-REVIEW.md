# Project pages: local review

Prepared 6 November 2026. These files are local review work only. Nothing has been published, and DNS, live sites and redirect files are unchanged.

## Completed

- Added `/the-swearing-project/` from the live Swearing Project landing-page copy: the ute story, Magic Pause, five contents points, 30-day experiment and daily tracker, reader-fit list and original Gumroad destination.
- Added `/light-your-own-fire/`: original purpose and memorial copy, six contents points, reader-fit list, both attributed endorsements, book cover, both author portraits, author summaries, original Gumroad and Amazon destinations.
- Corrected `Alison Rowe` to `Allison Roe MBE` on Writing, consistent with the live book site.
- Linked Home, Writing and the footer to the dedicated pages and added both routes to the sitemap.
- Local image references, descriptive alt text and explicit image dimensions on the book page. No archive media was changed by this work.
- Added regression checks for purchase destinations, local project artwork, author/endorsement credit, chapter lists, sitemap inclusion and the spelling correction.

## Sources and editorial handling

Sources inspected in the live browser on 6 November 2026:

- https://theswearingproject.com
- https://lightyourownfire.com/
- https://lightyourownfire.com/about

Purchase links retained exactly:

- The Swearing Project: https://glennedley.gumroad.com/l/biyirv
- Light Your Own Fire PDF: https://glennedley.gumroad.com/l/lyof
- Light Your Own Fire Amazon: https://a.co/d/0bWr7192

The source Swearing page displays `$12` and the book page `$5`, but neither landing page names the currency. The local review directs readers to the stores for the current price and currency, rather than guessing. Checkout/payment/delivery was not tested and no purchase was made.

Most landing-page wording is preserved, with small punctuation adjustments and updated navigation. The author biographies are shortened, and Charles's biography uses past tense to align with the source site's memorial introduction. Existing testimonials retain the quoted wording and speaker attribution. No new testimonials, clinical claims, sales results or commercial commitments were invented.

## Images and rights review

All three images were copied unchanged from the existing Light Your Own Fire site and visually inspected locally. The Swearing Project source page contains no image elements.

| Local file | Source image filename | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `public/images/projects/light-your-own-fire-cover.jpg` | `lyof-cover-2026.jpg` | 1000 × 1491 | d6de51b3c19c16e641350a26c4a0442c764810bad1cb07d29a4be5acc791560b |
| `public/images/projects/charles-donoghue.jpg` | `charles.jpg` | 164 × 246 | f289a5c9be411f1555fa4569dff0ccb7eae9068acd19c1ea89b654827fc57db6 |
| `public/images/projects/glenn-edley.jpg` | `glenn-portrait.jpg` | 1944 × 1295 | f5c27efdef9115448834dff0860292af4f0ef420a0a8ef4a1e4d39c4a4c573f8 |

Keep the co-author credit to Charles Donoghue and both endorsement attributions. Existing public use does not by itself prove the underlying cover-art/photography licences, co-author/estate rights or endorsement permissions for a new domain. Confirm these before publication; no licence grant or rights transfer has been assumed. Charles's portrait is low-resolution and should remain small unless a higher-resolution authorised original is supplied.

## Notes from an Email Marketer: blocked

No page or placeholder was created and the item must remain unticked in the migration tracker. Targeted Drive and Space searches found no manuscript, approved page copy or public destination for this title. A saved Book Development Framework refers to it as a candidate book: lessons from decades of doing email marketing, likely short observations/principles. That is insufficient to present a finished book or make a public offer.

Next input: the intended source manuscript/page or an approved brief confirming its current status, reader, description and next action. Do not substitute another email resource and label it as this book.

## Verification

- `ASTRO_TELEMETRY_DISABLED=1 XDG_CONFIG_HOME=/tmp/glennedley-astro-config npm run build`: passed, 0 errors, 0 warnings, 0 hints; 741 generated HTML pages.
- `npm test`: passed, 741 HTML pages, 740 sitemap URLs and all internal links validated, including the new project regression checks.
- Images: all three files exist locally, decode and have the specified dimensions. Pixels inspected.
- Redirect file: unchanged by this work. No `/swearing-project/` alias was added.
- Desktop/mobile rendered UI checks: not completed. Local Chromium cannot create its required socket (`Operation not permitted`), including the permitted escalated attempt. The existing cloud browser could not reach the local preview (`ERR_CONNECTION_REFUSED`). This is an environment limitation, not a verified UI defect.
- The prepared viewport/navigation test lives in `../project-pages-qa/check-project-pages.cjs` and can run in a browser-capable environment with the local Astro preview on port 4321. It covers 1440, 768, 390 and 320-pixel widths, image loading, horizontal overflow, Home/Writing navigation, breadcrumb and Back/Forward.

## Before marking launch-ready

1. Review the two pages' final copy and visual layout on mobile and desktop.
2. Confirm image, co-author/estate and endorsement permissions for migration.
3. Confirm live store prices/currency, purchase destinations and product delivery manually or through an approved test.
4. Resolve the Notes from an Email Marketer source and build its page if still required.
5. Complete the separate signup and archive-media checks, then obtain launch approval. Do not change domains, DNS or redirects as part of this local review.
