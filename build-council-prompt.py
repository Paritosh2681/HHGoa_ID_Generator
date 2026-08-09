# Builds council-prompt.txt for the HH Goa ID Generator review
# (reads the real source files so the prompt always matches the code)
import io, os

ROOT = r'D:\Paritosh Codes and Projects\HHGoa_ID_Generator'

def read(name):
    with io.open(os.path.join(ROOT, name), encoding='utf-8') as f:
        return f.read()

header = r"""You are reviewing a finished web app for a hackathon shortlisting task. Be a brutal, specific, senior reviewer (design + engineering). You CANNOT see rendered images — you must judge from the code and the detailed layout descriptions. Everything you flag must be actionable.

OUTPUT FORMAT (follow exactly):
1) VOTE: APPROVE | APPROVE-WITH-CHANGES | REJECT
2) BLOCKERS — bugs, crashes, or requirement violations (each: what, where in code, fix)
3) DESIGN ISSUES — things that would make it feel generic or off-brand, with concrete fixes
4) NITS — small polish items
5) VERDICT — one short paragraph

THE TASK (HH Goa 2026 shortlisting):
A web tool where someone uploads a photo and instantly gets a branded HH Goa 2026 graphic, downloadable and shareable on X. Two formats: (A) PFP frame/overlay around the photo, (B) Builder ID card with photo + name + stack + a generated 'builder class' title. Required: no login wall; near-instant generation; real downloadable image file; share flow opens pre-filled tweet containing the hashtag #FrameInGoa (if link share, link preview must show the graphic); mobile-friendly; handles JPG/PNG/HEIC and any aspect ratio (portrait, landscape, off-center).

BRAND DNA (extracted from hhgoa.com):
- Palette: deep green #0b6839 (dominant bg), yellow #fee101 (CTAs, hard offset shadows, hairlines), hot pink #ff0080 (accents/tags), cream #fffbe8 (paper cards/strips), black/white for text.
- Fonts: Imbue (condensed display serif, UPPERCASE statements) for headings; Victor Mono (monospace) for labels/body. Both self-hosted woff2.
- Motifs: brutalist hard offset shadows (e.g. 4px 4px #fee101), marquee tickers, pinned notice-board cards, animated gold gradient text, Devanagari 'गोवा' wordmark (yellow SVG), '2:47' studio mark (yellow SVG), palm trees, 'LESS NOISE. MORE SIGNAL.' slogan, #FrameInGoa tagline.
- Tone: tropical x hacker x brutalist, playful, high-contrast clashing colors.

THE APP (pure client-side HTML/CSS/JS + canvas, no backend, no build step):
- index.html — app shell: marquee ticker header, hero with gradient text, format tabs (BUILDER ID CARD / PFP FRAME), upload dropzone, fields (NAME, STACK/ROLE, auto builder class + shuffle), GENERATE/DOWNLOAD/SHARE buttons, canvas preview, og:image meta.
- styles.css — full brand token system (see BRAND-ANALYSIS.md): green bg, cream paper cards, yellow hard shadows, pink accents, marquee keyframes, glow button, brutalist typography, mobile responsive.
- app.js — logic: HEIC decode via heic2any (CDN, loaded only when a .heic file is detected), cover-crop with face-friendly bias, two canvas renderers, builder-class generator (keyword-mapped + seeded random), download via toBlob, share via Web Share API (with image file) falling back to X intent URL with caption + #FrameInGoa.

VERIFIED BY TESTING (already done, do not re-flag):
- Both formats render: ID card 1200x1500, PFP 1080x1080. Pixel analysis confirmed the beach background + header lockup + all card elements, no console errors, long names auto-shrink, captions contain #FrameInGoa.
- HEIC path uses heic2any from CDN; if the CDN is unreachable the user gets an alert suggesting JPG/PNG.

CANVAS LAYOUT DESCRIPTIONS (judge these):
ID CARD 1200x1500: full-bleed beach-sunrise photo (assets/Sun_rise.png, cover-cropped, same art the official site uses as its hero background) with a translucent green brand wash rgba(11,104,57,0.22) over the whole card, a dark top scrim (fades 0-340px) and a soft name scrim (1000-1210px) so text stays readable over the photo; dashed yellow frame inset 26px with corner pins. Header: the official HH Goa lockup asset assets/Hacker_house.png (1148x237 — "HACKER गोवा HOUSE", pixel-identical to the hhgoa.com hero image) drawn 880px wide centered near the top, with the official assets/goa_hindi.svg (yellow Devanagari गोवा wordmark with hot-pink outline; byte-identical to the site asset) overlaid dead-center on the lockup at the site's exact proportions (the site places it 153.94x151.77 on a 1162x251 lockup, centered ~46.3% down). Below: 'GOA, INDIA · 28–31 OCT 2026' in cream mono at y=290; vertical 'NO. HHG-26-XXXX' text on the right edge; photo box 560x560 centered with 8px white border, 14px 14px #fee101 hard shadow, yellow corner brackets, pink rotated tag with ID number; name in white Imbue (auto-shrink); stack in cream chip with black mono text and pink hard shadow; builder class in yellow rotated chip with black Imbue text and black shadow; bottom cream strip with 'LESS NOISE.' / 'MORE SIGNAL.', barcode, '#FRAMEINGOA'.
PFP FRAME 1080x1080: photo full-bleed cover-crop; top green bar 150px with 4px yellow underline: 2:47 mark left, 'HACKER HOUSE GOA' yellow Imbue centered, '2026' white right; bottom green bar: 'GOA, INDIA · 28–31 OCT 2026' mono + 'LESS NOISE. MORE SIGNAL.' Imbue yellow left, '#FRAMEINGOA' + गोवा right; white inner frame 5px inset 22px + yellow dashed frame 3px inset 40px.

HERE IS THE FULL SOURCE CODE. Review it line-by-line for bugs, requirement gaps, brand fidelity, and mobile issues:
"""

body = []
body.append(header)
body.append("\n" + "=" * 70 + "\nFILE: index.html\n" + "=" * 70 + "\n" + read('index.html'))
body.append("\n" + "=" * 70 + "\nFILE: styles.css\n" + "=" * 70 + "\n" + read('styles.css'))
body.append("\n" + "=" * 70 + "\nFILE: app.js\n" + "=" * 70 + "\n" + read('app.js'))
body.append("\n" + "=" * 70 + "\nFILE: serve.js\n" + "=" * 70 + "\n" + read('serve.js'))

prompt = "\n".join(body)
out = os.path.join(ROOT, '.council-prompt.txt')
with io.open(out, 'w', encoding='utf-8') as f:
    f.write(prompt)
print('prompt chars:', len(prompt))
