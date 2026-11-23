# Checko homepage · client version 2 (runs at http://localhost:3001)

The previous version stays untouched in the parent folder and runs at http://localhost:3000.
Double-click `start-v2-localhost-3001.command` to run this one.

## What is different from version 1
- **Intro:** the same loader as version 1 (dots gather into the wordmark, develop into ink, tagline, doors open).
- **Hero slider:** unbranded products from the Industries set (engine oil, cable and switch, brake disc, tablets), each wearing a Checko-style label. The phone camera shows that label close up.
- **Colours:** black and white lead. Gold #C9962B is the single accent (replaces honey/apricot). Checko Green #4EAB47 is only for "verified". Maroon #7A1F35 is for risk and suspect states. Ivory #F7F5F0 and Sand #F3EAD6 are the warm neutrals.
- **Solutions:** the branded Havells box is replaced by an unbranded cable-and-switch product. "What is the market telling you?" now shows a live chart that draws itself, plus region bars with one flagged region (it replaces the dot grid).
- **Industries:** no scanner gate, scanning beam, "Genuine" chip or Checko logo. The product in focus is shown larger, and the copy says these are the industries Checko serves.
- Branded product photos (Servo, Havells, Red Chief, Raymond) are removed from this version.

# Checko homepage

Next.js 16 (App Router) + TypeScript + Framer Motion. One page: ink intro, hero with the live scan demo, How it works, Solutions, Industries, About, Contact (demo / samples / pricing form).

## Run

Node.js 20.9+.

```sh
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Copy `.env.example` to `.env.local` and set `LEAD_WEBHOOK_URL` so the contact form can deliver requests (see below).

## The intro (loader)

`app/intro/`:

1. Black ink dots drift across the screen.
2. Some fly together into the **checko** wordmark; the tick's dots land last and turn green.
3. The dots **develop into ink**: they spread and run together into a solid wordmark (flat, no tilt).
4. **"The fingerprint of things."** gathers underneath in dots, then turns crisp.
5. The finished screen **opens like a pair of doors** onto the site, which steps forward as the hero rises in.

About 6.5 seconds. Dots on a 2D canvas; the ink is a small WebGL layer over the wordmark (without WebGL the dots stay dots and everything else still runs). Plays once per browser session; **Skip intro** or Escape jump to the doors; never plays with reduced motion. `?intro` forces it; `?intro=debug` runs at fixed 60 fps steps for screen captures. Timings: the `T` object in `app/intro/ink-engine.js`.

## Page order

Hero → The problem (running total with dives) → Solutions (scroll-driven: the section pins and each question opens as you scroll; under 620 px tall it is a plain accordion) → Industries → About → Contact. Every section rises into place as it scrolls into view (`app/components/reveal.tsx`).

## What changed from the first build

- **Loader** replaced with the ink-drops banner described above (was a DOM-dot animation of about 10.6 s on every visit).
- **No fake numbers.** The randomly increasing "products verified today" counter is gone; the hero now states what is true ("Works with any smartphone, in any light"). If you want a live count, add an endpoint and render the real figure.
- **Real navigation and sections.** Menu items were buttons opening pop-ups; they are now links to real sections Google can crawl. "Pricing" moved into the contact form (there is no pricing content yet).
- **Lead capture.** Every button used to end at a "Visit Checko" link. "Book a demo" and "Get free sample labels" now go to a form (`app/api/lead/route.ts`) that validates the request, filters bots with a honeypot, and forwards it as JSON to `LEAD_WEBHOOK_URL` (CRM, Zapier/Make, Google Apps Script, Slack…). Until that is set the form tells visitors honestly that it is not live yet.
- **Claims softened** in the phone demo: "100% GENUINE" → "Verified: this is a genuine product", "UNIQUE 3D PATTERN DETECTED" → "3D PATTERN MATCHED".
- **Demo fixes.** The Genuine chip and product caption were hidden behind the phone; they now sit in front. The demo scales as one piece on every screen (container units), pauses when off-screen or until the intro finishes, and uses `next/image`.
- **Performance.** Fonts self-hosted with `next/font` (no Google request, no layout shift). Framer Motion loaded lean (`LazyMotion`). Section entrances are pure CSS scroll animations. The intro releases its WebGL context when done. CSS rewritten from about 115 lines of stacked overrides into one organised file.
- **SEO.** Canonical URL, Open Graph and Twitter cards with a share image (`public/assets/og.jpg`), Organization structured data, `robots.txt`, `sitemap.xml`, app icons.
- **Accessibility.** Skip link, labelled navigation, keyboard and Escape support in the mobile menu, a described demo (`role="img"`), decorative parts hidden from screen readers, focus styles, reduced-motion support throughout.
- **Security.** Next.js bumped 16.4.3 → 16.4.6 (fixes a moderate npm advisory).

## Still to confirm before launch

- **400M+ products**, **10+ industries** and the industry use cases came from the concept file and need sign-off from the Checko team.
- Set `LEAD_WEBHOOK_URL` in the hosting environment.
- `metadataBase` is `https://checko.ai`; change it in `app/content.ts` if the site lives elsewhere.

## Files

- `app/intro/` — intro loader (`ink-engine.js` WebGL scene, `intro-loader.tsx` flip and hand-off)
- `app/components/` — header, sections, scan demo, contact form
- `app/content.ts` — all copy and product data
- `app/globals.css` — styles
- `app/api/lead/route.ts` — form endpoint

