# HH Goa — Brand & Design Analysis

> Deep-dive of https://hhgoa.com/ (Hacker House Goa 2026) — extracted from the live site (DOM, computed styles, CSS, assets).
> Use this as the source of truth for the ID Generator's visual language.

---

## 1. Brand Identity

- **Event:** Hacker House Goa 2026 · GOA, INDIA · **28–31 OCT 2026**
- **Mantra:** *"Less Noise. More Signal."*
- **Community handle:** "247 builders" (24/7 builders — the residency)
- **Design studio credit:** "2:47 PM STUDIO" (hand-drawn "2:47" logo mark `2-47.svg`)
- **Bilingual identity:** English "Hacker house" wordmark + Devanagari **"गोवा"** (`goa_hindi.svg`) side by side
- **Vibe:** Tropical × Hacker × Brutalist. Green jungle green base, yellow high-vis accents, pink pop, monospace labels, huge condensed display type, hard offset shadows, pinned-paper notice boards, video hero.

---

## 2. Color System (exact tokens from the site)

| Token | Hex | Usage |
|---|---|---|
| `--background` / `--primary` / `--card` | **#0b6839** | Dominant deep emerald green — page bg, cards, borders, scrollbar track |
| `--secondary` / `--ring` / `--muted-foreground` | **#fee101** | Yellow — CTAs, focus rings, selection, scrollbar thumb, hard shadows, highlights |
| `--accent` | **#ff0080** | Hot pink — hover states, small accent details, chart accent |
| `--card-foreground` / `--foreground` | **#ffffff** | Primary text |
| off-white (brand-offwhite) | **#fffbe8** | Paper/card color (notice-board cards), soft secondary text |
| `--secondary-foreground` | **#000000** | Text on yellow (e.g. yellow buttons) |
| `--destructive` | #dc2626 / #e40014 | Errors only (rare) |
| `--radius` | 10px | Default rounding (cards 6px, md 8px) |

**Shadcn-style CSS variable block (verbatim from site):**
```css
--background:#0b6839; --foreground:#fff; --card:#0b6839; --card-foreground:#fff;
--popover:#0b6839; --popover-foreground:#fff; --primary:#0b6839; --primary-foreground:#fff;
--secondary:#fee101; --secondary-foreground:#000; --muted:#0b6839; --muted-foreground:#fee101;
--accent:#ff0080; --accent-foreground:#fff; --destructive:#dc2626; --border:#0b6839;
--input:#0b6839; --ring:#fee101; --radius:.625rem;
--chart-1:#0b6839; --chart-2:#fee101; --chart-3:#ff0080; --chart-4:#fff;
--sidebar:#0b6839; --sidebar-primary:#fee101; --sidebar-primary-foreground:#000;
--sidebar-accent:#ff0080; --sidebar-accent-foreground:#fff; --sidebar-border:#0b6839; --sidebar-ring:#fee101
```

**Micro-details:**
- `::selection` → black text on yellow (#fee101)
- Scrollbar → yellow `#fee101` thumb, green `#0b6839` track (8px)
- `:focus-visible` → `outline: 2px solid #fee101`

---

## 3. Typography

| Role | Font | Details |
|---|---|---|
| Display / headings | **Imbue** | Variable font (400–800), condensed high-contrast serif. Usually UPPERCASE or Capitalize. `line-height` ~0.95–1.1 |
| Body / UI / labels | **Victor Mono** | Variable monospace (100–700). Labels/buttons UPPERCASE, tight letter-spacing (e.g. 16.69px on 33.38px, 0.08–0.1em) |

**Sizes (responsive clamps from CSS):**
- Hero: `clamp(3rem, 12vw, 8rem)`, lh .95 (HUGE)
- Section heading: `clamp(2rem, 6vw, 4rem)`, lh 1.1
- Card heading: `clamp(1.5rem, 4vw, 2.5rem)`
- Small labels: 9–17px monospace, uppercase, often letter-spaced

Both fonts are **self-hosted** on the site — Latin subsets already downloaded to `fonts/` (`imbue-latin.woff2`, `victor-mono-latin.woff2`).

---

## 4. Signature Effects & Motifs

1. **Brutalist hard shadows** — `.brutalist-shadow { box-shadow: 4px 4px #fee101 }` (yellow hard offset); also hard black shadows: `3px 3px 0`, `4px 5px 0`, `6px 8px 0`, `8px 10px 0 rgba(0,0,0,.25)`
2. **Animated gold gradient text** — `.gradient-text`: `linear-gradient(135deg,#fee101,#fffbe8,#fee101)` 200% bg-size, `gradientShift` keyframes 4s infinite (background-position 0%→100%)
3. **Marquee tickers** — `@keyframes marquee` 30s linear infinite, translateX 0→-50% ("CHECK HYPE" ticker)
4. **CTA glow** — `.cta-button-glow`: yellow glow pulse (0 0 18px 4px #fee1014d / 0 0 40px 8px #fee1011a), 3s ease-in-out infinite; hover scale(1.06), active scale(.98) (fast-cta)
5. **Float** — 6s ease-in-out: translateY(0) rotate(-2deg) → translateY(-15px) rotate(2deg)
6. **Pinned paper notice board** — cream `#fffbe8` cards (padding 28px 24px, radius 6px) on green, "PINNED UP" eyebrow, pinned-card composition
7. **Glass** — `.glass-effect` backdrop blur(12px)
8. **Pulse glow / bounce subtle / fadeInUp / spin** — supporting animations
9. **Hand-drawn SVG accents** — "2:47" studio mark, Devanagari गोवा
10. **Illustration assets** — green sun-rise graphic (`Sun_rise.png`), palm-tree silhouettes (`footer_trees.png`), yellow "Hacker house" wordmark (`Hacker_house.png`), B&W hacker photo (`hackers.png`)
11. **Video hero** — `Prehype.mp4` behind huge Imbue type
12. **Radius language** — sharp/brutalist (rounded-none) mixed with 6px cards, 10px default, full-circle buttons

---

## 5. Page Structure & Components (for reference)

1. **Top marquee bar** — "CHECK HYPE" ticker
2. **Nav** — "2:47" mark, APPLY button (yellow glow) → Devfolio
3. **Hero** — video bg, giant Imbue headline, "Hacker house" yellow wordmark + गोवा, date "GOA, INDIA · 28–31 OCT 2026"
4. **Stats strip** — `0+ / 0 / 0+ / $0K+` → REGISTRATIONS 2024, PROJECTS, HACKERS, BOUNTIES 2026
5. **Inside the Room** — "4 Days. One Rhythm. Everything Intentional." — Day cards: DAY 01 GENESIS DAY / DAY 02 DAY OF TRIANGLE / DAY 03 BUILD DAY / DAY 04 LAUNCH DAY
6. **Notice Board** — "PINNED UP" / "NOTICE BOARD" — cream pinned cards (task docs)
7. **Timeline** — "THE ROADMAP" — horizontal: Registration → Open Trials → Alpha/Beta/Charlie/Delta Selections → Partner Trials → RSVP & Stake → Residency
8. **Tasks** — "BUILD THIS" / "TASKS" — Task #1: **HH Goa Frame / ID Card Generator** (with CONFIRM PARTICIPATION button)
9. **W Celeb Radar** — section w/ celebrities board
10. **FAQ** — accordion (6 questions)
11. **Footer** — "Less Noise. More Signal." + palm trees, "2:47 PM STUDIO", socials (@247PMSTUDIO, @TWOFOURTYSEVENPM, email), © 2026 HH-GOA, BRAND KIT, TERMS

---

## 6. Copy / Voice

- Terse, punchy, all-caps labels; manifesto-style statements
- "Inside the Room: 4 Days. One Rhythm. Everything Intentional."
- "Where it all begins" / "The world watches" / "Heads down. Ship or ship" / "Problem. Solution. Market."
- FAQ, timeline, tasks all in short declarative lines

---

## 7. Files already pulled

| File | Source |
|---|---|
| `fonts/imbue-latin.woff2` | Imbue variable (400–800) latin subset |
| `fonts/victor-mono-latin.woff2` | Victor Mono variable (100–700) latin subset |
| `assets/Sun_rise.png` | green sun graphic (1440×1438) |
| `assets/Hacker_house.png` | yellow wordmark (1148×237) |
| `assets/goa_hindi.svg` | Devanagari गोवा |
| `assets/2-47.svg` | hand-drawn 2:47 mark |
| `assets/footer_trees.png` | palm silhouettes (1440×887) |
| `assets/hackers.png` | hacker photo (1440×804) |
| `site.css` | full compiled CSS (design tokens, keyframes) |
