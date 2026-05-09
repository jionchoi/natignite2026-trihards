# UI/UX Pro Max — Design Intelligence Skill

> Adapted from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) for use in claude.ai.
> The original uses Python CLI scripts with CSV databases. This version embeds all knowledge directly so it works without a local environment.

---

## Skill Identity

```
name: ui-ux-pro-max
version: 2.1 (claude.ai adaptation)
description: >
  UI/UX design intelligence for web and mobile. Includes 50+ styles,
  161 color palettes, 57 font pairings, 161 product types with reasoning
  rules, 99 UX guidelines, and 25 chart types across 10+ stacks (React,
  Next.js, Vue, Svelte, Astro, SwiftUI, React Native, Flutter, Tailwind,
  shadcn/ui, Jetpack Compose, and HTML/CSS). Actions: plan, build,
  create, design, implement, review, fix, improve, optimize, enhance,
  refactor, check UI/UX code. Projects: website, landing page, dashboard,
  admin panel, e-commerce, SaaS, portfolio, blog, mobile app.
  Elements: button, modal, navbar, sidebar, card, table, form, chart.
  Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism,
  bento grid, dark mode, responsive, skeuomorphism, flat design.
  Topics: color systems, accessibility, animation, layout, typography,
  font pairing, spacing, interaction states, shadow, gradient.
```

---

## When to Apply This Skill

### MUST USE
- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts)
- Choosing color schemes, typography systems, spacing, or layout systems
- Reviewing UI code for UX, accessibility, or visual consistency
- Implementing navigation, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)
- Improving perceived quality, clarity, or usability of interfaces

### RECOMMENDED
- UI looks "not professional enough" but reason is unclear
- Receiving feedback on usability or experience
- Pre-launch UI quality optimization
- Aligning cross-platform design (Web / iOS / Android)
- Building design systems or reusable component libraries

### SKIP
- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work
- Non-visual scripts or automation tasks

**Decision rule:** If the task will change how a feature **looks, feels, moves, or is interacted with** — use this skill.

---

## Workflow

When given a UI/UX task, always follow this sequence:

### Step 1 — Analyze Requirements

Extract from the user's request:
- **Product type**: SaaS / e-commerce / healthcare / fintech / portfolio / social / tool / entertainment / productivity
- **Target audience**: consumer (C-end) vs enterprise, age group, usage context
- **Style keywords**: minimal, vibrant, playful, dark mode, content-first, immersive, professional, luxurious
- **Tech stack**: HTML+Tailwind / React / Next.js / Vue / Svelte / React Native / Flutter / SwiftUI / shadcn / Jetpack Compose

### Step 2 — Generate a Design System (REQUIRED)

Before writing a single line of code, synthesize a Design System recommendation block:

```
TARGET: [Product Name] — RECOMMENDED DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN:     [e.g. Hero-Centric + Social Proof]
STYLE:       [e.g. Minimalism with glassmorphism accents]
COLORS:      [Primary / Secondary / Background / Surface / Error]
TYPOGRAPHY:  [Heading font / Body font + Google Fonts import]
SPACING:     [Base unit, scale]
EFFECTS:     [Border radius, shadow, blur, transitions]
ANTI-PATTERNS TO AVOID: [List 3–5 specific pitfalls for this product type]
```

Use the lookup tables below to fill this in accurately.

### Step 3 — Supplement with Domain Deep-Dives

After generating the design system, consult the relevant domain tables below:
- **Product types** → see Product Type Database
- **Style specifics** → see Style Database
- **Color palettes** → see Color Database
- **Font pairings** → see Typography Database
- **UX rules** → see Quick Reference Checklists (§1–§10)
- **Chart types** → see Chart Database
- **Stack guidelines** → see Stack Guidelines

### Step 4 — Implement

Write code using the design system. Then run through the Pre-Delivery Checklist before finishing.

---

## Design System Generator — Lookup Tables

### Product Type Database (161 types — key entries)

| Product Type | Recommended Style | Color Vibe | Typography Vibe | Layout Pattern |
|---|---|---|---|---|
| SaaS B2B | Clean minimal, subtle shadows | Blue/Indigo primary, neutral bg | Inter + DM Sans | Dashboard-first, sidebar nav |
| SaaS B2C | Friendly minimal, rounded | Purple/Teal gradient, white bg | Plus Jakarta + Nunito | Hero → features → pricing |
| E-commerce | Clean grid, micro-animations | Brand color + white, product-first | Urbanist + Lato | Grid catalog, sticky cart |
| Healthcare | Calming minimal, high trust signals | Soft blue/green, white, clean | Source Sans + Merriweather | Simple nav, large type |
| Fintech / Banking | Dark mode capable, premium | Deep navy/slate + gold accent | IBM Plex + Inter | Dashboard, data tables |
| Crypto / Web3 | Dark mode, neon accents, glassmorphism | Dark bg + cyan/purple/green | Space Grotesk + Sora | Cards, charts, ticker |
| Portfolio | Bold, artistic, personality-forward | Monochrome or strong accent | Playfair + DM Mono | Full-bleed, scroll narrative |
| Beauty / Spa / Wellness | Soft, luxurious, emotion-driven | Blush/beige/sage/ivory | Cormorant Garamond + Lato | Hero-Centric, Social Proof |
| Fitness / Sports | Energetic, bold, high contrast | Black + neon green or orange | Bebas Neue + Barlow | Full-bleed hero, stats |
| Education | Friendly, organized, clear | Yellow/blue/green, bright | Nunito + Source Sans | Card-based, progress indicators |
| Food / Restaurant | Warm, appetizing, sensory | Deep red/terracotta/gold | Playfair + Open Sans | Full-bleed food photography |
| Travel / Tourism | Immersive, inspirational | Vibrant imagery-dominant | Poppins + Libre Baskerville | Full-bleed hero, card grid |
| Real Estate | Premium, trustworthy | Navy/charcoal + white + gold | Garamond + Inter | Property cards, map integration |
| Legal / Finance | Conservative, authoritative | Deep navy or charcoal, white | Georgia + Arial | Simple, document-style |
| Startup / Agency | Bold, modern, differentiated | Strong accent + white | Cabinet Grotesk + Inter | Scroll narrative, bento grid |
| Social Media App | Content-first, vibrant, dopamine-driven | White bg or dark bg, accent-driven | System default + readable | Feed-first, bottom nav |
| Productivity / Task | Calm, focused, minimal | Neutral grays + one accent | Inter + Geist Mono | List/board, sidebar, shortcuts |
| News / Media | Dense, scannable, editorial | Black/white + brand red | Georgia/Merriweather + Sans | Multi-column grid |
| Gaming | Immersive dark, high energy | Dark bg + vivid neons/gradients | Custom display + Rajdhani | Full-bleed, depth, particles |
| AI / ML Tool | Futuristic minimal | Dark navy or white + electric blue | Geist + Inter | Chat interface or dashboard |
| Marketplace | Trust, variety, organized | Neutral + category colors | Nunito + Inter | Grid, filters, trust badges |
| Healthcare App (Mobile) | Calming, extremely legible | Soft blue/green, high contrast text | SF Pro (iOS) / Roboto (Android) | Large tappable cards |
| Delivery / Logistics | Functional, clear, fast | Orange + dark / white + dark | Roboto + Inter | Map-centric, status tracking |
| Event / Ticketing | Exciting, visual | Dark bg + vibrant event imagery | Poppins + Manrope | Event cards, timeline |
| Non-profit / Charity | Warm, human, trustworthy | Earth tones or brand-specific | Merriweather + Source Sans | Story-first, donation CTA |

### Style Database (50+ styles — key entries)

| Style | Visual Signature | Best For | CSS Keywords | Avoid |
|---|---|---|---|---|
| **Minimalism** | Whitespace, clean lines, restraint | SaaS, Portfolio, Tools | `font-weight: 300-400`, `border-radius: 4-8px`, `gap: 32px+` | Clutter, too many typefaces, decorative elements |
| **Glassmorphism** | Frosted glass, backdrop blur, translucency | Crypto, AI, Modern SaaS | `backdrop-filter: blur(12px)`, `bg: rgba(255,255,255,0.1)`, `border: 1px solid rgba(255,255,255,0.2)` | Light backgrounds without contrast, overuse |
| **Neumorphism** | Soft extrusions, inset/outset shadows | Health, Wellness, Clean Apps | `box-shadow: 6px 6px 12px #d1d9e6, -6px -6px 12px #fff` | Dark mode, heavy content, small elements |
| **Claymorphism** | Inflated 3D, pastel, bouncy | Consumer apps, children, fun products | `border-radius: 24-40px`, `box-shadow: 0 8px 32px rgba(...)`, pastel fills | Enterprise, finance, serious contexts |
| **Brutalism** | Raw typography, grid-breaking, bold borders | Portfolio, Art, Experimental | `border: 3-5px solid black`, `font-weight: 900`, off-grid layouts | Healthcare, finance, user-trust contexts |
| **Bento Grid** | Asymmetric card grid, editorial collage | Features showcase, SaaS landing | Mixed-size cards, `grid-template-columns: repeat(auto-fill, ...)` | Overloading each cell; works best with restraint |
| **Dark Mode Premium** | Deep backgrounds, glowing accents | Fintech, Crypto, Gaming, Productivity | `bg: #0a0a0f` to `#1a1a2e`, neon/vivid accent | Low contrast text on dark, pure black (#000) backgrounds |
| **Flat Design 2.0** | Subtle shadows, color-block, material-inspired | Enterprise, Government, Dashboards | `border-radius: 4px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` | Gradients, complex effects |
| **Skeuomorphism** | Real-world texture simulation | Niche apps (audio, vintage tools) | Texture images, complex shadows | Modern SaaS, content-heavy apps |
| **Gradient-heavy** | Bold color gradients, vibrant depth | Consumer SaaS, Startup marketing | `background: linear-gradient(135deg, #6366f1, #8b5cf6)` | Text overlaid without contrast check |
| **Editorial / Magazine** | Strong typographic hierarchy, multi-column | News, Blogs, Long-form content | Variable font weights, grid columns | Heavy UI components, over-designed nav |
| **3D / Depth** | Three-dimensional elements, parallax | Gaming, Product marketing, AR/VR | `transform-style: preserve-3d`, `perspective: 1000px` | Heavy pages, accessibility (reduced-motion must be respected) |

### Color Database (palettes by product type)

| Product Type | Primary | Secondary | Background | Surface | Error | Notes |
|---|---|---|---|---|---|---|
| SaaS B2B | `#4F46E5` (Indigo-600) | `#06B6D4` (Cyan-500) | `#F8FAFC` | `#FFFFFF` | `#EF4444` | Professional, focused |
| SaaS B2C | `#7C3AED` (Violet-600) | `#10B981` (Emerald-500) | `#FAFAFA` | `#FFFFFF` | `#F43F5E` | Friendly, modern |
| Fintech Dark | `#3B82F6` (Blue-500) | `#F59E0B` (Amber-400) | `#0F172A` | `#1E293B` | `#EF4444` | Premium, trust |
| Crypto / Web3 | `#22D3EE` (Cyan-400) | `#A855F7` (Purple-500) | `#090E1A` | `#111827` | `#F87171` | Neon, dark |
| Healthcare | `#0EA5E9` (Sky-500) | `#10B981` (Emerald-500) | `#F0F9FF` | `#FFFFFF` | `#EF4444` | Calm, trust |
| E-commerce | `#F97316` (Orange-500) | `#1D4ED8` (Blue-700) | `#FFFFFF` | `#F9FAFB` | `#DC2626` | Action, urgency |
| Beauty / Spa | `#D4A5A5` (Blush) | `#A8C5A0` (Sage-green) | `#FAF7F5` | `#FFFFFF` | `#C0392B` | Luxe, soft |
| Fitness | `#22C55E` (Green-500) | `#FACC15` (Yellow-400) | `#111827` | `#1F2937` | `#EF4444` | Energy, dark |
| Education | `#3B82F6` (Blue-500) | `#FBBF24` (Amber-400) | `#FFFBEB` | `#FFFFFF` | `#DC2626` | Approachable |
| Food | `#DC2626` (Red-600) | `#D97706` (Amber-600) | `#FFF8F1` | `#FFFFFF` | `#B91C1C` | Appetite |
| Travel | `#0284C7` (Sky-600) | `#16A34A` (Green-600) | `#F0F9FF` | `#FFFFFF` | `#DC2626` | Open, adventure |
| Legal / Finance | `#1E3A5F` (Deep navy) | `#C9A84C` (Gold) | `#F8F9FA` | `#FFFFFF` | `#C0392B` | Authority |
| Startup / Agency | `#F97316` (Orange-500) | `#6366F1` (Indigo-500) | `#FFFFFF` | `#F9FAFB` | `#EF4444` | Bold, modern |
| Gaming | `#A855F7` (Purple-500) | `#22D3EE` (Cyan-400) | `#070B14` | `#0D1117` | `#F87171` | Immersive |
| Non-profit | `#059669` (Emerald-600) | `#F59E0B` (Amber-500) | `#F0FDF4` | `#FFFFFF` | `#DC2626` | Warm, human |

**Dark mode rule:** Never invert light-mode colors. Use desaturated/tonal variants. Test contrast independently.

**Semantic token naming convention:**
```css
--color-primary: ;
--color-primary-hover: ;
--color-on-primary: ;       /* text on primary bg */
--color-surface: ;
--color-surface-variant: ;
--color-on-surface: ;
--color-error: ;
--color-on-error: ;
```

### Typography Database (57 pairings — key entries)

| Vibe | Heading Font | Body Font | Google Fonts Import |
|---|---|---|---|
| Modern SaaS | Inter | Inter | `Inter:wght@300;400;500;600;700` |
| Clean Professional | Plus Jakarta Sans | DM Sans | `Plus+Jakarta+Sans` + `DM+Sans` |
| Premium / Luxury | Playfair Display | Lato | `Playfair+Display:wght@400;700` + `Lato:wght@300;400` |
| Elegant Luxury | Cormorant Garamond | Lato | `Cormorant+Garamond:wght@300;400;600` + `Lato` |
| Bold / Energetic | Bebas Neue | Barlow | `Bebas+Neue` + `Barlow:wght@400;600` |
| Geometric Modern | Space Grotesk | Sora | `Space+Grotesk:wght@400;500;700` + `Sora:wght@300;400` |
| Tech / AI | Geist Sans | Inter | CDN or `Inter` as fallback |
| Developer / Code | JetBrains Mono | Inter | `JetBrains+Mono` + `Inter` |
| Editorial / News | Merriweather | Source Sans 3 | `Merriweather:wght@400;700` + `Source+Sans+3` |
| Playful / Consumer | Nunito | Nunito | `Nunito:wght@400;600;700;800` |
| Creative / Portfolio | Cabinet Grotesk | Inter | Custom CDN + `Inter` |
| Bold / Agency | Poppins | Manrope | `Poppins:wght@600;700;800` + `Manrope:wght@400;500` |
| Futuristic | Rajdhani | Exo 2 | `Rajdhani:wght@500;600;700` + `Exo+2:wght@400;500` |
| Humanist / Accessible | Urbanist | Nunito Sans | `Urbanist:wght@400;500;700` + `Nunito+Sans` |
| Classic / Trust | Georgia (system) | Arial / system-ui | No import needed |
| IBM / Enterprise | IBM Plex Sans | IBM Plex Mono | `IBM+Plex+Sans` + `IBM+Plex+Mono` |

**Type Scale (use consistently):**
```
Display:  48-64px  / font-weight: 700-800
H1:       36-48px  / font-weight: 700
H2:       28-36px  / font-weight: 600-700
H3:       22-28px  / font-weight: 600
H4:       18-22px  / font-weight: 600
Body-lg:  18px     / line-height: 1.75 / font-weight: 400
Body:     16px     / line-height: 1.6  / font-weight: 400
Body-sm:  14px     / line-height: 1.5  / font-weight: 400
Caption:  12px     / line-height: 1.4  / font-weight: 400
```

**Never:** Use body text below 12px. Avoid more than 2 typeface families. Avoid raw hex in components — use tokens.

### Chart Type Database (25 types)

| Data Story | Chart Type | Library (Web) | Library (Mobile) | When to Use |
|---|---|---|---|---|
| Trend over time | Line chart | Recharts, Chart.js | Victory Native, MPAndroidChart | Time series, progress |
| Comparison of values | Bar / Column chart | Recharts, ApexCharts | Victory, Highcharts Mobile | Comparing categories side by side |
| Part-to-whole (≤5 slices) | Donut / Pie chart | Recharts, Chart.js | Victory | Market share, budget breakdown |
| Part-to-whole (5+ categories) | Stacked bar | Recharts | Victory Native | Replace pie; better for many categories |
| Distribution | Histogram | D3.js, ApexCharts | Custom D3 | Data spread, frequency |
| Correlation | Scatter plot | Recharts, D3 | Victory | Two-variable relationships |
| Multi-variable | Radar / Spider | Recharts, D3 | Victory | Skill profiles, product comparison |
| Funnel / Pipeline | Funnel chart | ApexCharts, Funnel.js | Custom | Conversion, sales pipeline |
| Hierarchical | Treemap | D3, Recharts | Custom | Budget allocation, file sizes |
| Geographic | Choropleth / Map | Leaflet + D3, Mapbox | React Native Maps | Regional data |
| Flow between nodes | Sankey diagram | D3-sankey | Custom | User journeys, energy flows |
| Progress | Gauge / Radial | ApexCharts, custom SVG | Victory | KPI targets, completion % |
| Timeline | Gantt / Timeline | D3, dhtmlx Gantt | Custom | Project planning, history |
| Real-time data | Streaming line / Bar | Socket.io + Recharts | Victory + WebSocket | Live metrics, monitoring |
| Ranked comparison | Horizontal bar | Recharts, Chart.js | Victory | Top 10 lists, leaderboards |
| Relationships | Network graph | D3-force, Sigma.js | Custom | Social graphs, dependencies |
| Heat density | Heatmap | D3, Cal-Heatmap | Custom | Calendar data, correlation matrix |
| Financial | Candlestick | Lightweight Charts (TradingView) | Custom | Stock prices |
| KPI summary | Stat card / Big number | Custom components | Custom | Dashboards, summary views |
| Comparison over time | Area chart | Recharts | Victory | Volume changes, stacked comparisons |
| Data table | Table with sorting | TanStack Table, AG Grid | FlashList (RN) | Raw data, sortable records |

**Chart rules:**
- Always show legend. Position near chart, not below scroll fold.
- Provide tooltip on hover (web) or tap (mobile) showing exact values.
- Use accessible color palettes — never red/green only (colorblind).
- For 1000+ data points: aggregate/sample. Offer drill-down.
- Always show empty state ("No data yet") and error state with retry.
- Respect `prefers-reduced-motion` for entrance animations.
- Provide table alternative for screen readers.

### Landing Page Structure Database

| Pattern | Best For | Section Order | CTA Strategy |
|---|---|---|---|
| Hero-Centric + Social Proof | Spa, Beauty, Consumer SaaS | Hero → Services/Features → Testimonials → CTA → Footer | Emotion-driven; CTA above fold, repeated after testimonials |
| Problem-Solution | B2B SaaS, Tools | Problem statement → Solution → Features → Proof → Pricing → CTA | Logic-driven; CTA after proof |
| Product-Led | E-commerce, Apps | Hero → Product demo / video → Social proof → Features → CTA | Show-don't-tell; CTA persistent in sticky nav |
| Trust-First | Healthcare, Legal, Finance | Credentials → Problem → Solution → Testimonials → CTA | Trust signals first; conservative CTA copy |
| Showcase Portfolio | Agency, Creative | Full-bleed hero → Work → About → Process → Contact | Visual-first; CTA = "Let's talk" |
| Freemium / Viral | Consumer apps, Tools | Hook → Feature demo → "Free forever" pricing → Social proof | Low friction CTA: "Start free — no credit card" |
| Community-Led | Open source, Non-profit | Mission → Community size → Features → Join CTA | Belonging-first; "Join X others" |
| Developer-Focused | Dev tools, APIs | Code example hero → Docs link → Features → Pricing | Code-first; "npm install" or "Open in CodeSandbox" |

---

## Rule Categories by Priority

*Follow priority order 1→10. Categories with CRITICAL/HIGH impact must be addressed before MEDIUM/LOW.*

| Priority | Category | Impact | Key Checks | Anti-Patterns |
|---|---|---|---|---|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | Min size 44×44px, 8px+ spacing, Loading feedback | Hover-only interactions, instant state changes (0ms) |
| 3 | Performance | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | Match product type, Consistency, SVG icons | Mixing flat & skeuomorphic randomly, emoji as icons |
| 5 | Layout & Responsive | HIGH | Mobile-first, Viewport meta, No horizontal scroll | Horizontal scroll, fixed px widths, disabling zoom |
| 6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, gray-on-gray, raw hex in components |
| 7 | Animation | MEDIUM | Duration 150–300ms, Motion conveys meaning | Decorative-only animation, animating width/height |
| 8 | Forms & Feedback | MEDIUM | Visible labels, Error near field, Helper text | Placeholder-only labels, errors only at top |
| 9 | Navigation Patterns | HIGH | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, broken back behavior |
| 10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors | Relying on color alone to convey data meaning |

---

## Quick Reference Checklists

### §1 Accessibility (CRITICAL)

- [ ] `color-contrast` — Minimum 4.5:1 for normal text; 3:1 for large text
- [ ] `focus-states` — Visible focus rings on all interactive elements (2–4px)
- [ ] `alt-text` — Descriptive alt text for all meaningful images
- [ ] `aria-labels` — aria-label for icon-only buttons; `accessibilityLabel` in native
- [ ] `keyboard-nav` — Tab order matches visual order; full keyboard support
- [ ] `form-labels` — `<label for="...">` on every input
- [ ] `skip-links` — "Skip to main content" link for keyboard users
- [ ] `heading-hierarchy` — Sequential h1→h6, no skipped levels
- [ ] `color-not-only` — Never convey info by color alone (add icon/text)
- [ ] `dynamic-type` — Support system text scaling; no truncation as text grows
- [ ] `reduced-motion` — Respect `prefers-reduced-motion`
- [ ] `voiceover-sr` — Logical reading order for screen readers
- [ ] `escape-routes` — Cancel/back in modals and multi-step flows
- [ ] `keyboard-shortcuts` — Don't override system a11y shortcuts

### §2 Touch & Interaction (CRITICAL)

- [ ] `touch-target-size` — Min 44×44pt (Apple) / 48×48dp (Material)
- [ ] `touch-spacing` — Minimum 8px gap between touch targets
- [ ] `hover-vs-tap` — Use click/tap for primary; don't rely on hover alone
- [ ] `loading-buttons` — Disable during async; show spinner or progress
- [ ] `error-feedback` — Clear error messages near problem
- [ ] `cursor-pointer` — `cursor: pointer` on all clickable elements (web)
- [ ] `tap-delay` — `touch-action: manipulation` to reduce 300ms delay
- [ ] `standard-gestures` — Use platform-standard gestures; don't redefine
- [ ] `press-feedback` — Visual feedback on press within 80–150ms
- [ ] `haptic-feedback` — Use haptics for confirmations (mobile)
- [ ] `safe-area-awareness` — Keep targets away from notch, gesture bar, edges
- [ ] `swipe-clarity` — Swipe actions must have clear affordance/hint
- [ ] `drag-threshold` — Use movement threshold before starting drag

### §3 Performance (HIGH)

- [ ] `image-optimization` — WebP/AVIF, responsive srcset/sizes, lazy load
- [ ] `image-dimension` — Declare width/height to prevent layout shift (CLS)
- [ ] `font-loading` — `font-display: swap` to avoid invisible text (FOIT)
- [ ] `font-preload` — Preload critical fonts only
- [ ] `critical-css` — Inline critical CSS or load early
- [ ] `lazy-loading` — `loading="lazy"` for below-fold images
- [ ] `bundle-splitting` — Split by route/feature; reduce initial TTI
- [ ] `virtualize-lists` — Virtualize lists with 50+ items
- [ ] `main-thread-budget` — Keep work under ~16ms per frame
- [ ] `progressive-loading` — Skeleton screens for >1s operations (not spinners)
- [ ] `debounce-throttle` — Debounce/throttle scroll, resize, input events
- [ ] `offline-support` — Offline state message + basic fallback (PWA/mobile)

### §4 Style Selection (HIGH)

- [ ] `style-match` — Style matches product type (see Style Database above)
- [ ] `consistency` — Same style language across ALL pages
- [ ] `no-emoji-icons` — Use SVG icons (Heroicons, Lucide, Phosphor); never emojis
- [ ] `color-palette` — Choose from product/industry palette (see Color Database)
- [ ] `effects-match-style` — Shadows, blur, radius aligned with chosen style
- [ ] `platform-adaptive` — Respect iOS HIG vs Material Design idioms
- [ ] `state-clarity` — Hover/pressed/disabled states visually distinct
- [ ] `elevation-consistent` — Consistent elevation/shadow scale
- [ ] `dark-mode-pairing` — Design light/dark variants together
- [ ] `icon-style-consistent` — One icon family/visual language throughout
- [ ] `primary-action` — One primary CTA per screen; secondary actions subordinate

### §5 Layout & Responsive (HIGH)

- [ ] `viewport-meta` — `width=device-width, initial-scale=1` (never disable zoom)
- [ ] `mobile-first` — Design mobile-first, scale up
- [ ] `breakpoint-consistency` — Use: 375 / 768 / 1024 / 1440px
- [ ] `readable-font-size` — Min 16px body on mobile (avoids iOS auto-zoom)
- [ ] `line-length-control` — Mobile 35–60 chars; desktop 60–75 chars
- [ ] `horizontal-scroll` — No horizontal scroll on mobile
- [ ] `spacing-scale` — Use 4pt/8dp incremental spacing system
- [ ] `container-width` — Consistent max-width on desktop (`max-w-6xl / 7xl`)
- [ ] `z-index-management` — Define layered z-index scale: 0/10/20/40/100/1000
- [ ] `fixed-element-offset` — Fixed nav/bottom bar must reserve padding for content
- [ ] `viewport-units` — Prefer `min-h-dvh` over `100vh` on mobile
- [ ] `orientation-support` — Layout readable in landscape

### §6 Typography & Color (MEDIUM)

- [ ] `line-height` — 1.5–1.75 for body text
- [ ] `font-pairing` — Match heading/body font personalities (see Typography DB)
- [ ] `font-scale` — Consistent type scale (12/14/16/18/24/32/48)
- [ ] `weight-hierarchy` — Bold headings (600–700), Regular body (400), Medium labels (500)
- [ ] `color-semantic` — Use semantic tokens, not raw hex in components
- [ ] `color-dark-mode` — Desaturated/tonal variants for dark mode, not inverted
- [ ] `color-accessible-pairs` — Test foreground/background pairs: 4.5:1 (AA)
- [ ] `truncation-strategy` — Prefer wrapping; use ellipsis + tooltip for overflow
- [ ] `number-tabular` — Tabular figures for data columns, prices, timers
- [ ] `whitespace-balance` — Use whitespace intentionally; avoid clutter

### §7 Animation (MEDIUM)

- [ ] `duration-timing` — 150–300ms micro-interactions; ≤400ms complex; never >500ms
- [ ] `transform-performance` — `transform`/`opacity` only; never animate width/height/top/left
- [ ] `loading-states` — Skeleton/progress when loading exceeds 300ms
- [ ] `easing` — ease-out for entering, ease-in for exiting; no linear UI transitions
- [ ] `motion-meaning` — Every animation expresses cause-effect, not just decoration
- [ ] `spring-physics` — Prefer spring/physics curves for natural feel
- [ ] `exit-faster-than-enter` — Exit ~60–70% of enter duration
- [ ] `stagger-sequence` — Stagger list entrance 30–50ms per item
- [ ] `interruptible` — All animations interruptible by user tap/gesture
- [ ] `no-blocking-animation` — UI stays interactive during animation
- [ ] `modal-motion` — Modals animate from trigger source
- [ ] `navigation-direction` — Forward = left/up; backward = right/down

### §8 Forms & Feedback (MEDIUM)

- [ ] `input-labels` — Visible label per input (never placeholder-only)
- [ ] `error-placement` — Show error below the related field
- [ ] `submit-feedback` — Loading → success/error state on submit
- [ ] `required-indicators` — Mark required fields with asterisk
- [ ] `empty-states` — Helpful message + action when no content
- [ ] `toast-dismiss` — Auto-dismiss toasts in 3–5s
- [ ] `confirmation-dialogs` — Confirm before destructive actions
- [ ] `inline-validation` — Validate on blur (not keystroke)
- [ ] `input-type-keyboard` — Use `type="email"`, `type="tel"` etc. for correct mobile keyboard
- [ ] `password-toggle` — Show/hide toggle for password fields
- [ ] `autofill-support` — Use `autocomplete` attributes
- [ ] `undo-support` — Allow undo for destructive actions
- [ ] `multi-step-progress` — Show step indicator; allow back navigation
- [ ] `error-clarity` — State cause + how to fix; not just "Invalid input"
- [ ] `focus-management` — Auto-focus first invalid field after submit error
- [ ] `destructive-emphasis` — Destructive actions use danger color; visually separated

### §9 Navigation Patterns (HIGH)

- [ ] `bottom-nav-limit` — Max 5 items; always use icon + label
- [ ] `drawer-usage` — Drawer for secondary nav, not primary actions
- [ ] `back-behavior` — Predictable, preserves scroll/state
- [ ] `deep-linking` — All key screens reachable via URL/deep link
- [ ] `nav-state-active` — Current location visually highlighted
- [ ] `modal-escape` — Clear close/dismiss affordance on all modals
- [ ] `state-preservation` — Back restores scroll position + filter state
- [ ] `adaptive-navigation` — Sidebar for ≥1024px; bottom/top nav for smaller
- [ ] `back-stack-integrity` — Never silently reset nav stack
- [ ] `navigation-consistency` — Nav placement same across all pages
- [ ] `focus-on-route-change` — Move focus to main content after page transition

### §10 Charts & Data (LOW)

- [ ] `chart-type` — Match chart type to data story (see Chart Database)
- [ ] `color-guidance` — Accessible color palettes; no red/green only
- [ ] `data-table` — Provide table alternative for screen readers
- [ ] `legend-visible` — Always show legend; position near chart
- [ ] `tooltip-on-interact` — Exact values on hover (web) or tap (mobile)
- [ ] `axis-labels` — Label axes with units; no truncated labels on mobile
- [ ] `responsive-chart` — Reflow/simplify on small screens
- [ ] `empty-data-state` — Meaningful empty state message + guidance
- [ ] `loading-chart` — Skeleton while data loads
- [ ] `large-dataset` — Aggregate 1000+ points; offer drill-down
- [ ] `touch-target-chart` — Interactive elements ≥44pt tap area

---

## Stack Implementation Guidelines

### HTML + Tailwind (default)
```html
<!-- Font loading (example: Inter + Plus Jakarta Sans) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">

<!-- Viewport meta — NEVER disable zoom -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Z-index scale (put in CSS) -->
<style>
  :root {
    --z-base: 0; --z-raised: 10; --z-dropdown: 20;
    --z-sticky: 40; --z-overlay: 100; --z-modal: 1000;
  }
</style>
```

**Tailwind spacing rhythm:** Use `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px), `gap-12` (48px). Avoid arbitrary values.

**Touch targets in Tailwind:** `min-h-[44px] min-w-[44px]` or `p-3` (12px padding + icon = ~44px).

### React / Next.js
```jsx
// Semantic color tokens via CSS variables
const theme = {
  primary: 'var(--color-primary)',
  surface: 'var(--color-surface)',
  onSurface: 'var(--color-on-surface)',
};

// Loading button pattern
const [loading, setLoading] = useState(false);
<button disabled={loading} onClick={handleSubmit}>
  {loading ? <Spinner /> : 'Submit'}
</button>

// Focus management after error
useEffect(() => {
  if (errors.length > 0) {
    document.querySelector('[data-error-field]')?.focus();
  }
}, [errors]);
```

### React Native
```jsx
// Touch targets — always meet minimum
<TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
  <Icon size={24} />  {/* Extend hit area beyond visual icon */}
</TouchableOpacity>

// Safe area compliance (critical)
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
<View style={{ paddingBottom: insets.bottom }}>

// Accessibility
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Close dialog"
  accessibilityRole="button"
>

// Reduced motion
import { AccessibilityInfo } from 'react-native';
const [reduceMotion, setReduceMotion] = useState(false);
AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
```

### Flutter
```dart
// Touch targets (minimum 48dp)
InkWell(
  onTap: () {},
  child: Padding(
    padding: EdgeInsets.all(12), // 48dp total for 24dp icon
    child: Icon(Icons.settings, size: 24),
  ),
)

// Semantic labels
Semantics(
  label: 'Close dialog',
  button: true,
  child: IconButton(icon: Icon(Icons.close), onPressed: ...),
)

// Safe area
SafeArea(child: Scaffold(...))
```

### SwiftUI
```swift
// Touch targets (44pt minimum)
Button(action: {}) {
  Image(systemName: "xmark")
    .frame(width: 44, height: 44)
}

// Accessibility
Button("Delete") { deleteItem() }
  .accessibilityLabel("Delete item")
  .accessibilityHint("Removes this item from your list")

// Dynamic Type
Text("Hello")
  .font(.body)  // Always use semantic type styles, not fixed sizes

// Reduced Motion
@Environment(\.accessibilityReduceMotion) var reduceMotion
```

### Vue / Nuxt
```vue
<template>
  <!-- Semantic HTML first -->
  <nav aria-label="Main navigation">
    <ul>
      <li v-for="item in navItems" :key="item.id">
        <RouterLink :to="item.path" :aria-current="isActive(item) ? 'page' : undefined">
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
```

### shadcn/ui
- Use `cn()` utility for conditional classes
- Always pass `className` prop for overrides
- Use `asChild` prop pattern for polymorphic components
- Prefer `<Button variant="destructive">` over custom red buttons
- Use `<Dialog>`, `<Sheet>`, `<AlertDialog>` for modals — never roll your own from a div

---

## Professional UI Rules — Common Pitfalls

### Icons & Visual Elements

| Rule | Do | Don't |
|---|---|---|
| Icon system | Use one SVG icon family (Heroicons, Lucide, Phosphor) | Mix icon families or use emojis as icons |
| Brand assets | Use official assets with correct proportions | Guess logo paths or recolor unofficially |
| Icon sizing | Define tokens: `icon-sm=16`, `icon-md=24`, `icon-lg=32` | Mix arbitrary sizes (20/24/28) randomly |
| Stroke consistency | Consistent stroke width within visual layer (1.5 or 2px) | Mix thick/thin strokes arbitrarily |
| Filled vs outline | One style per hierarchy level | Mix filled + outline at same level |
| Touch target | Minimum 44×44pt; use hitSlop/padding to extend | Small icons without expanded tap area |
| Icon contrast | 4.5:1 for small, 3:1 minimum for larger glyphs | Low-contrast icons blending into background |

### Light/Dark Mode

| Rule | Do | Don't |
|---|---|---|
| Surface readability | Clear card separation via opacity/elevation | Transparent surfaces blurring hierarchy |
| Text contrast (light) | Body text ≥4.5:1 | Low-contrast gray body text |
| Text contrast (dark) | Primary ≥4.5:1, secondary ≥3:1 on dark | Dark mode text blending into background |
| Borders/dividers | Visible in both themes | Theme-specific borders disappearing in one mode |
| Token-driven | Semantic color tokens mapped per theme | Hardcoded hex per-screen |
| Modal scrim | 40–60% black opacity to isolate foreground | Weak scrim with competing background |

### Spacing & Layout

| Rule | Do | Don't |
|---|---|---|
| Safe areas (mobile) | Respect top/bottom safe areas for headers, tab bars, CTAs | Place fixed UI under notch/status bar/gesture area |
| Spacing rhythm | 4/8dp system for padding/gaps | Random spacing with no rhythm |
| Readable measure | 35–60 chars/line mobile; 60–75 desktop | Edge-to-edge paragraphs on tablets |
| Section hierarchy | Clear vertical rhythm tiers (16/24/32/48px) | Same-level UI with inconsistent spacing |
| Adaptive gutters | Increase horizontal insets on larger widths/landscape | Same narrow gutter on all sizes |
| Scroll coexistence | Bottom insets so lists aren't behind fixed bars | Scroll content obscured by sticky headers |

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

### Visual Quality
- [ ] No emojis used as icons
- [ ] All icons from one consistent family and style
- [ ] Official brand assets used correctly
- [ ] Press states don't shift layout bounds or jitter
- [ ] Semantic theme tokens used (no ad-hoc hardcoded colors)

### Interaction
- [ ] All tappable elements have pressed feedback within 80–150ms
- [ ] Touch targets ≥44×44pt (iOS) / 48×48dp (Android)
- [ ] Micro-interaction timing 150–300ms with native-feeling easing
- [ ] Disabled states visually clear and non-interactive
- [ ] Gesture regions don't conflict (tap/drag/back-swipe)

### Light/Dark Mode
- [ ] Primary text ≥4.5:1 in both modes
- [ ] Secondary text ≥3:1 in both modes
- [ ] Borders and interaction states distinguishable in both modes
- [ ] Modal scrim 40–60% black opacity
- [ ] Both themes tested (not inferred from one)

### Layout
- [ ] Safe areas respected for headers, tab bars, bottom CTAs
- [ ] Scroll content not hidden behind fixed/sticky bars
- [ ] Verified on 375px (small phone) + landscape
- [ ] Horizontal gutters adapt by device size
- [ ] 4/8dp spacing rhythm maintained throughout
- [ ] Long-form text measure readable on large devices

### Accessibility
- [ ] Meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, clear error messages
- [ ] Color is not the only indicator of state/meaning
- [ ] Reduced motion and dynamic text size supported
- [ ] Accessibility roles/states (selected, disabled, expanded) announced correctly

---

## Example: Complete Design System Generation

**User request:** "Build a landing page for a fintech crypto wallet app."

**Step 1 — Analyze:**
- Product type: Fintech / Crypto / Web3
- Target audience: Tech-savvy adults, 20–40, mobile-primary
- Style: Dark mode, premium, trustworthy but modern
- Stack: Next.js (assumed from context)

**Step 2 — Design System:**

```
TARGET: Crypto Wallet App — RECOMMENDED DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN:     Feature-focused + Trust signals + CTA repeated
STYLE:       Dark Mode Premium + Glassmorphism accents
COLORS:
  Primary:    #22D3EE (Cyan-400)  — action, links, highlights
  Secondary:  #A855F7 (Purple-500) — gradients, accents
  Background: #090E1A             — deep dark base
  Surface:    #111827             — card backgrounds
  Error:      #F87171             — warnings, validation
  Text:       #F9FAFB / #94A3B8   — primary / secondary

TYPOGRAPHY:
  Heading:    Space Grotesk (600–700) — geometric, modern, trust
  Body:       Sora (400)              — clean, readable on dark
  Mono:       JetBrains Mono          — for addresses, hashes

SPACING:     8dp base unit; scale: 8/16/24/32/48/64px
EFFECTS:
  Border radius:  12px cards, 8px buttons, 24px hero elements
  Shadows:        0 0 40px rgba(34,211,238,0.15) for glow effects
  Glass cards:    backdrop-filter: blur(12px); bg: rgba(17,24,39,0.7)
  Transitions:    150–300ms ease-out; transform/opacity only

SECTIONS ORDER:
  1. Hero (big headline + wallet mockup + CTA)
  2. Trust signals (security badges, audit info)
  3. Features (3–4 key features as glassmorphism cards)
  4. Supported assets / chains
  5. Testimonials or user count
  6. Final CTA + App store badges
  7. Footer

ANTI-PATTERNS TO AVOID:
  ✗ Light backgrounds — breaks the premium dark aesthetic
  ✗ Sans-serif system fonts only — too generic
  ✗ Emojis as security/feature icons — use Lucide/Phosphor
  ✗ Red/green only for portfolio change indicators (colorblind)
  ✗ Missing `prefers-reduced-motion` for wallet animations
  ✗ Wallet address text in proportional font — use monospace
```

**Step 3 — Domain deep-dives needed:**
- Style: glassmorphism specifics → use glassmorphism row from Style Database
- Charts: portfolio chart → Line chart (Recharts or Lightweight Charts for price data)
- UX: `animation accessibility` → §1 + §7 rules
- Stack: Next.js → `bundle-splitting`, `image-optimization`, `font-loading` from §3

**Step 4 — Implement** using the design system above and stack guidelines.

---

## Tips for Better Results

**Query strategy:**
- Combine product + industry + tone + density: `"entertainment social vibrant content-dense"` not just `"app"`
- Try synonyms: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Use the Design System generator block first, then domain lookups for details

**Common sticking points:**

| Problem | Resolution |
|---|---|
| Style/color indecision | Re-run design system block with different keywords |
| Dark mode contrast issues | §6: `color-dark-mode` + `color-accessible-pairs` |
| Animations feel unnatural | §7: `spring-physics` + `easing` + `exit-faster-than-enter` |
| Form UX is poor | §8: `inline-validation` + `error-clarity` + `focus-management` |
| Navigation feels confusing | §9: `nav-hierarchy` + `bottom-nav-limit` + `back-behavior` |
| Layout breaks on small screens | §5: `mobile-first` + `breakpoint-consistency` |
| Performance / jank | §3: `virtualize-lists` + `main-thread-budget` + `debounce-throttle` |

**Pre-delivery validation:**
1. Run §1–§3 (CRITICAL + HIGH) as final review
2. Test on 375px + landscape orientation
3. Verify with reduced-motion enabled
4. Verify dynamic type at largest size
5. Check dark mode contrast independently
6. Confirm all touch targets ≥44pt
7. Check no content hidden behind safe areas

---

*Adapted from nextlevelbuilder/ui-ux-pro-max-skill v2.1 — MIT License*
