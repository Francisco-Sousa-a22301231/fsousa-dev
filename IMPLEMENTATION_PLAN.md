# fsousa-dev — Implementation Plan
**Project:** Astro portfolio website (fsousa-dev)
**Status:** Developer-ready implementation guide
**Last updated:** 2026-03-21

---

## How to use this document

Each section below is a self-contained implementation plan. They are ordered by page flow (top → bottom), but most can be worked on independently. Dependencies between sections are called out explicitly under **Notes / Dependencies**.

Global work (button colours, motion preferences) is covered in [Plan 11 — Global Buttons & Colour Fixes](#plan-11--global-buttons--colour-fixes) and should be implemented first or alongside any section that renders buttons.

---

## Plan 1 — Loading Screen

### Goal
Replace the current percentage counter with a phrase-cycling sequence, add the FS logo spring reveal with name fade-in, add an orange progress bar, and ensure the whole sequence completes in under 2 seconds. Support `prefers-reduced-motion`.

### Files to edit
- `src/components/LoadingScreen.astro` (or `.tsx` / `.svelte` — whichever exists)
- `src/styles/global.css` (or equivalent global stylesheet) — for `@media (prefers-reduced-motion)` overrides
- Any animation utility file if one exists (e.g. `src/utils/motion.ts`)

### Exact changes

#### 1. Remove the percentage counter
- Delete any `<span>` or element that renders a `%` or numeric progress value.
- Remove the associated JavaScript that increments the counter (e.g. `setInterval` / `requestAnimationFrame` counter loop).

#### 2. Add phrase-cycling sequence
Replace the counter with a text element that cycles through two phrases:

```html
<p id="loading-phrase" aria-live="polite"></p>
```

JavaScript sequence (inline `<script>` or imported module):

```js
const phrases = [
  "Plataformas que convertem.",
  "Feito em Portugal. Visto no mundo."
];
const el = document.getElementById('loading-phrase');
let index = 0;

function showPhrase() {
  el.textContent = phrases[index];
  el.classList.add('visible');
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => {
      index++;
      if (index < phrases.length) showPhrase();
      else showLogo(); // trigger next stage
    }, 200); // fade-out gap
  }, 700); // phrase hold time
}

showPhrase();
```

Timing budget (must total < 2 000 ms):
| Stage | Duration |
|---|---|
| Phrase 1 display | 700 ms |
| Fade out + gap | 200 ms |
| Phrase 2 display | 700 ms |
| Fade out | 150 ms |
| Logo spring + name fade | 250 ms |
| **Total** | **~2 000 ms** |

#### 3. FS logo spring reveal
After `showLogo()` is called:

```js
function showLogo() {
  const logo = document.getElementById('loading-logo');
  const name = document.getElementById('loading-name');
  logo.classList.add('spring-in');
  setTimeout(() => name.classList.add('fade-in'), 100);
  setTimeout(() => hideLoader(), 250);
}
```

CSS for the spring animation:

```css
#loading-logo {
  opacity: 0;
  transform: scale(0.6);
  transition: none;
}

#loading-logo.spring-in {
  animation: springReveal 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes springReveal {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}

#loading-name {
  opacity: 0;
  transition: opacity 0.25s ease;
}

#loading-name.fade-in {
  opacity: 1;
}
```

#### 4. Orange progress bar
Add a `<div>` at the bottom of the loading screen:

```html
<div id="loading-bar"></div>
```

CSS:

```css
#loading-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 0%;
  background: #FF6B00; /* site orange */
  transition: width 1.9s linear;
  z-index: 9999;
}
```

JavaScript — start the bar immediately:

```js
requestAnimationFrame(() => {
  document.getElementById('loading-bar').style.width = '100%';
});
```

#### 5. `prefers-reduced-motion` support
In global CSS:

```css
@media (prefers-reduced-motion: reduce) {
  #loading-logo.spring-in {
    animation: none;
    opacity: 1;
    transform: scale(1);
  }
  #loading-name { transition: none; }
  #loading-bar  { transition: none; width: 100%; }
  #loading-phrase { transition: none; }
}
```

In JavaScript, wrap timed sequences in a check:

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// if reduced, skip phrase cycling and go straight to showLogo() with no animation
```

### Acceptance criteria
- [ ] No percentage counter visible anywhere during load.
- [ ] "Plataformas que convertem." appears, fades out, then "Feito em Portugal. Visto no mundo." appears.
- [ ] FS logo pops in with spring feel; name fades in below/beside it.
- [ ] Orange bar sweeps from left to right and reaches 100% as the loader exits.
- [ ] Full sequence completes in ≤ 2 000 ms on a mid-range device.
- [ ] With `prefers-reduced-motion`, all transitions are instant (no animation, just content shown).

---

## Plan 2 — Hero Section

### Goal
Update the title, headline, location badge, and description copy to be business-agnostic and match the new brand direction.

### Files to edit
- `src/sections/Hero.astro` (or `HeroSection.astro` / equivalent)
- Any CMS/content file if copy is managed separately (e.g. `src/content/hero.md` or `src/data/hero.js`)

### Exact changes

#### Title / role label
Find the element displaying the current job title (likely `<h2>` or a styled `<span>` above the main heading). Change text to:

```
Engenheiro Informático
```

#### Main headline
Find the `<h1>` (or primary heading element). Change text to:

```
Websites, apps e plataformas. Para qualquer negócio.
```

#### Location badge
Find the badge/chip that currently reads "100% Remoto". Change text and content to:

```
From Portugal 🇵🇹
```

Keep the same badge styling; just swap the copy. Remove any "remote work" icon if present and replace with the flag emoji (already inline via Unicode).

#### Description / body copy
Update any paragraph(s) below the headline to be business-agnostic. Remove references to specific industries (e.g. "clínicas", "restaurantes") and replace with language like:

```
Construo produtos digitais para empresas de qualquer sector — do MVP ao produto final.
Foco em performance, design limpo e resultados mensuráveis.
```

(Adapt length/tone to match existing layout constraints.)

### Acceptance criteria
- [ ] Job title reads "Engenheiro Informático".
- [ ] `<h1>` reads "Websites, apps e plataformas. Para qualquer negócio."
- [ ] Badge reads "From Portugal 🇵🇹" (no "100% Remoto" text anywhere in the hero).
- [ ] Description copy contains no industry-specific references.
- [ ] No visual regressions — layout, spacing, and responsive behaviour unchanged.

---

## Plan 3 — Sobre Mim (About Section)

### Goal
Rewrite the section with a new title, updated bio, a seamlessly integrated transparent profile photo, a rotating gradient ring animation around the photo, and floating skill badges.

### Files to edit
- `src/sections/About.astro` (or `SobreMim.astro`)
- `public/francisco.png` — place the transparent PNG here (developer must have this asset ready)
- `src/styles/about.css` (create if scoped styles aren't already separate)

### Exact changes

#### Section title
Change to:

```
Olá, eu sou o Francisco.
```

#### Bio copy
Replace existing bio with (adjust prose style to match site tone):

```
Cresci em Cascais, onde ainda dou aulas de skate ao fim de semana.
Durante a semana, construo aplicações web e mobile como developer full-stack —
desde a base de dados até à interface que o utilizador toca.

Acredito que bom software é simples, rápido e faz exatamente o que precisa de fazer.
Nada mais, nada menos.
```

#### Profile photo
- Place `francisco.png` (transparent background) at `public/francisco.png`.
- In markup, add an `<img>` inside a wrapper `<div class="photo-wrapper">`:

```html
<div class="photo-wrapper">
  <div class="gradient-ring"></div>
  <img src="/francisco.png" alt="Francisco Sousa" class="profile-photo" />
  <span class="badge badge-fullstack">Full-Stack</span>
  <span class="badge badge-flutter">Flutter · Astro</span>
</div>
```

#### Rotating gradient ring
The ring sits behind the photo and rotates continuously:

```css
.photo-wrapper {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gradient-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #FF6B00,
    #FFD700,
    #FF6B00,
    transparent 60%
  );
  animation: spinRing 3s linear infinite;
  z-index: 0;
}

@keyframes spinRing {
  to { transform: rotate(360deg); }
}

.profile-photo {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  z-index: 1;
  /* If dark background, photo blends naturally via transparent PNG */
}
```

#### Floating badges
```css
.badge {
  position: absolute;
  background: #FF6B00;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  z-index: 2;
  white-space: nowrap;
  animation: floatBadge 3s ease-in-out infinite;
}

.badge-fullstack {
  top: 10%;
  right: -30%;
  animation-delay: 0s;
}

.badge-flutter {
  bottom: 15%;
  left: -30%;
  animation-delay: 1.5s;
}

@keyframes floatBadge {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
```

#### `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  .gradient-ring { animation: none; }
  .badge         { animation: none; }
}
```

### Notes / Dependencies
- The profile photo asset (`public/francisco.png`) must be provided before this plan can be considered complete.
- If the site uses a circular `border-radius` mask with a background colour rather than a transparent PNG, remove the mask and rely on the PNG's transparency instead.
- Adjust badge positions (`right: -30%` etc.) to taste based on actual layout.

### Acceptance criteria
- [ ] Section title reads "Olá, eu sou o Francisco."
- [ ] Bio references Cascais, skate, full-stack dev.
- [ ] `francisco.png` renders with no white/coloured background artefacts.
- [ ] Gradient ring rotates continuously around the photo.
- [ ] "Full-Stack" and "Flutter · Astro" badges float independently.
- [ ] With `prefers-reduced-motion`, ring and badges are static.

---

## Plan 4 — Serviços (Services Section)

### Goal
Update mobile app pricing, upgrade the Basic plan's SEO offering, make all copy business-agnostic, and fix button colour/hover animation bugs. (Button colour fix is also covered globally in Plan 11 — apply whichever is implemented first.)

### Files to edit
- `src/sections/Services.astro` (or `Servicos.astro`)
- `src/components/ServiceCard.astro` (or equivalent card component)
- `src/styles/services.css` (or scoped styles in the component)

### Exact changes

#### Mobile app pricing
Find the card for "App Mobile" (or equivalent). Change the price display from the current value to:

```
a partir de €2.000
```

#### Basic plan SEO upgrade
In the Basic/starter plan card, find the SEO feature line item. Change it from whatever it currently reads to:

```
SEO completo + Google Business
```

This brings the Basic plan's SEO on par with higher-tier plans. If the higher plans also list SEO, ensure they all read the same (or upgrade the higher plans to a superset — do not downgrade them).

#### Business-agnostic descriptions
Review all card body copy. Remove any references to specific industries (e.g. "para restaurantes", "para clínicas"). Replace with neutral language describing the service deliverable and outcome. Examples:

- Before: "Ideal para pequenos negócios de restauração."
- After: "Ideal para negócios que precisam de presença online profissional."

#### Button colour fix (service cards)
See **Plan 11** for the global definition. Apply those styles to service card buttons specifically. The current bug: buttons appear with a black background and orange text, which is hard to read and visually inconsistent.

Target state: buttons inside service cards should follow the global button token (e.g. orange background, white text, or whichever variant is defined as primary in Plan 11).

In `src/styles/services.css` (or scoped):

```css
.service-card .btn {
  /* Override any locally scoped black bg */
  background-color: var(--color-primary, #FF6B00);
  color: #fff;
  border: none;
}

.service-card .btn:hover {
  background-color: var(--color-primary-dark, #e05a00);
  color: #fff;
  transform: translateY(-2px);
  transition: background-color 0.2s ease, transform 0.2s ease;
}
```

#### Hover animation bug fix
The current bug: hover animation on service card buttons is broken (likely a `transition` on a property that isn't changing, or a conflicting `animation` keyframe).

Fix:
1. Remove any `@keyframes` animation on `.service-card .btn:hover` — use CSS `transition` only.
2. Ensure there is no `transition: all` declaration overriding a specific property that short-circuits the hover.
3. Ensure no `pointer-events: none` is set on the button's child elements, which would block the hover state.

Minimal working hover:

```css
.service-card .btn {
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.service-card .btn:hover {
  background-color: var(--color-primary-dark, #e05a00);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.35);
}
```

### Acceptance criteria
- [ ] Mobile app card shows "a partir de €2.000".
- [ ] Basic plan lists "SEO completo + Google Business".
- [ ] No industry-specific copy in any service card.
- [ ] All service card buttons have consistent background colour (orange/primary, not black).
- [ ] Hovering a service card button produces a smooth lift + colour deepen effect.

---

## Plan 5 — Processo (Process Section)

### Goal
Remove all jargon from the process copy and fully redesign the section: dark background, icon-based step cards, numbered flow, a stats row, and entrance animations.

### Files to edit
- `src/sections/Process.astro` (or `Processo.astro`)
- `src/styles/process.css` (create if needed)
- Icon assets or icon library imports (e.g. Lucide, Heroicons, or inline SVGs)

### Exact changes

#### Section background
Change the section background to the site's dark colour (e.g. `#0A0A0A` or `#111`). Ensure text colours contrast sufficiently (white/light grey body text on dark bg).

#### Step cards — structure
Replace existing process list/cards with a new grid of icon-based step cards. Suggested markup:

```html
<section class="processo" id="processo">
  <h2>Como funciona</h2>
  <p class="section-subtitle">Simples, direto e sem surpresas.</p>

  <div class="steps-grid">
    <!-- Repeat for each step -->
    <div class="step-card">
      <div class="step-number">01</div>
      <div class="step-icon"><!-- SVG icon --></div>
      <h3>Conversa inicial</h3>
      <p>Percebemos o que precisas e se faz sentido trabalharmos juntos.</p>
    </div>
    <!-- 02, 03, 04... -->
  </div>

  <div class="stats-row">
    <div class="stat">
      <span class="stat-value">15 min</span>
      <span class="stat-label">chamada de diagnóstico</span>
    </div>
    <div class="stat">
      <span class="stat-value">24h</span>
      <span class="stat-label">para proposta</span>
    </div>
    <div class="stat">
      <span class="stat-value">3–5 dias</span>
      <span class="stat-label">para primeiro protótipo</span>
    </div>
  </div>
</section>
```

#### Suggested step copy (jargon-free)
| # | Title | Body |
|---|---|---|
| 01 | Conversa inicial | Percebemos o que precisas e se faz sentido trabalharmos juntos. |
| 02 | Proposta clara | Recebes um orçamento detalhado — sem letra pequena. |
| 03 | Desenvolvimento | Trabalho iterativo com updates regulares. Tu vês, tu aprova. |
| 04 | Entrega e suporte | Lançamos juntos e continuo disponível depois do go-live. |

Replace current step text with the above (or developer's equivalent that avoids words like "deploy", "sprint", "iteração", "stack", etc.)

#### Step card CSS
```css
.processo {
  background: #0F0F0F;
  padding: 80px 24px;
  color: #fff;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin: 48px 0;
}

.step-card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  padding: 32px 24px;
  position: relative;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.step-card.visible {
  opacity: 1;
  transform: translateY(0);
}

.step-number {
  font-size: 3rem;
  font-weight: 800;
  color: #FF6B00;
  opacity: 0.25;
  line-height: 1;
  margin-bottom: 12px;
}

.step-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 16px;
  color: #FF6B00;
}
```

#### Stats row CSS
```css
.stats-row {
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
  padding-top: 48px;
  border-top: 1px solid #2a2a2a;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: #FF6B00;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #888;
  margin-top: 4px;
}
```

#### Entrance animations (Intersection Observer)
```js
const stepCards = document.querySelectorAll('.step-card');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 120); // stagger
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

stepCards.forEach(card => observer.observe(card));
```

#### `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  .step-card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

### Acceptance criteria
- [ ] Section has a dark background with sufficient text contrast.
- [ ] 4 numbered step cards displayed in a responsive grid.
- [ ] Each card has an icon, number, title, and jargon-free description.
- [ ] Stats row shows "15 min / 24h / 3–5 dias" with labels.
- [ ] Cards stagger-animate in on scroll.
- [ ] With `prefers-reduced-motion`, all cards are immediately visible without animation.

---

## Plan 6 — Portfólio Section

### Goal
Fully redesign the portfolio section with rich project cards that include a browser window mockup, a phone screen mockup, a per-project metrics grid, tech stack tags, and multiple visual details per project.

### Files to edit
- `src/sections/Portfolio.astro` (or `Porfolio.astro`)
- `src/components/ProjectCard.astro` — create or heavily refactor
- `src/data/projects.js` (or `.ts`, or frontmatter in a content collection) — data source for projects
- `public/portfolio/` — directory for project screenshots/assets

### Architecture overview
Separate data from presentation:
1. `src/data/projects.js` — array of project objects
2. `src/components/ProjectCard.astro` — consumes one project object, renders the card
3. `src/sections/Portfolio.astro` — maps over projects and renders `<ProjectCard />` for each

### Project data shape
```js
// src/data/projects.js
export const projects = [
  {
    id: "project-slug",
    title: "Project Name",
    tagline: "One sentence describing the project.",
    desktopImage: "/portfolio/project-desktop.png",  // browser mockup screenshot
    mobileImage:  "/portfolio/project-mobile.png",   // phone screen screenshot
    url: "https://example.com",
    metrics: [
      { label: "PageSpeed", value: "98" },
      { label: "Plataforma", value: "Astro" },
      { label: "Lançamento", value: "2025" },
      { label: "Tipo", value: "Landing Page" },
    ],
    techStack: ["Astro", "Tailwind", "Netlify"],
    highlights: [
      "Animações CSS puras, sem bibliotecas pesadas.",
      "Score 98 no PageSpeed em mobile.",
    ],
  },
  // ... more projects
];
```

### ProjectCard markup
```html
<article class="project-card">
  <!-- Mockups -->
  <div class="mockups">
    <div class="browser-mockup">
      <div class="browser-bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="browser-url">{project.url}</span>
      </div>
      <img src={project.desktopImage} alt={`${project.title} — desktop`} loading="lazy" />
    </div>
    <div class="phone-mockup">
      <img src={project.mobileImage} alt={`${project.title} — mobile`} loading="lazy" />
    </div>
  </div>

  <!-- Info -->
  <div class="project-info">
    <h3>{project.title}</h3>
    <p class="tagline">{project.tagline}</p>

    <!-- Metrics -->
    <div class="metrics-grid">
      {project.metrics.map(m => (
        <div class="metric">
          <span class="metric-value">{m.value}</span>
          <span class="metric-label">{m.label}</span>
        </div>
      ))}
    </div>

    <!-- Highlights -->
    <ul class="highlights">
      {project.highlights.map(h => <li>{h}</li>)}
    </ul>

    <!-- Tech stack -->
    <div class="tech-stack">
      {project.techStack.map(tag => <span class="tech-tag">{tag}</span>)}
    </div>

    <a href={project.url} target="_blank" rel="noopener" class="btn btn-primary">
      Ver projecto →
    </a>
  </div>
</article>
```

### CSS
```css
.project-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  padding: 48px 0;
  border-bottom: 1px solid #1e1e1e;
}

/* Alternate layout every other card */
.project-card:nth-child(even) .mockups { order: 2; }
.project-card:nth-child(even) .project-info { order: 1; }

@media (max-width: 768px) {
  .project-card { grid-template-columns: 1fr; }
}

/* Browser mockup */
.browser-mockup {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.browser-bar {
  background: #1a1a1a;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #444;
}

.browser-url {
  font-size: 0.7rem;
  color: #666;
  margin-left: 12px;
}

.browser-mockup img {
  width: 100%;
  display: block;
}

/* Phone mockup */
.phone-mockup {
  position: absolute;
  bottom: -20px;
  right: -20px;
  width: 120px;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid #2a2a2a;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.mockups {
  position: relative;
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 24px 0;
}

.metric {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 12px 16px;
}

.metric-value {
  display: block;
  font-size: 1.4rem;
  font-weight: 800;
  color: #FF6B00;
}

.metric-label {
  font-size: 0.75rem;
  color: #888;
}

/* Tech tags */
.tech-stack { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.tech-tag {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 0.75rem;
  color: #ccc;
}

/* Highlights */
.highlights {
  list-style: none;
  padding: 0;
  margin: 16px 0;
}

.highlights li::before {
  content: "→ ";
  color: #FF6B00;
}
```

### Notes / Dependencies
- Portfolio image assets (`/public/portfolio/*.png`) must be created/sourced before the cards can render properly. Use placeholder images during development.
- If Astro content collections are in use, prefer migrating project data to a `content/projects/` collection for type safety.
- Phone mockup overlaps the browser frame — `position: absolute` on `.phone-mockup` requires `.mockups` to be `position: relative` with sufficient height.

### Acceptance criteria
- [ ] Each project card shows a browser window mockup and a phone screen mockup.
- [ ] Metrics grid renders at least 4 metrics per project (PageSpeed, platform, year, type or similar).
- [ ] Tech stack tags are displayed for each project.
- [ ] Highlights list is present per project.
- [ ] Cards alternate layout (image left/right) on desktop.
- [ ] Cards stack vertically on mobile.
- [ ] "Ver projecto →" link opens the live URL in a new tab.

---

## Plan 7 — Remove "Agência vs Francisco" Section

### Goal
Completely remove the section comparing agency work to working directly with Francisco.

### Files to edit
- `src/sections/AgenciaVsFrancisco.astro` (or equivalent filename — check for `AgenciaVs`, `Comparacao`, `VsAgencia`, etc.)
- `src/pages/index.astro` (or the main page that imports and renders sections)
- Any navigation/anchor links pointing to this section (e.g. in the header nav or footer)

### Exact changes

1. **Remove the import** from `src/pages/index.astro`:
   ```diff
   - import AgenciaVsFrancisco from '../sections/AgenciaVsFrancisco.astro';
   ```

2. **Remove the component tag** from the page template:
   ```diff
   - <AgenciaVsFrancisco />
   ```

3. **Remove any nav link** pointing to `#agencia` (or equivalent anchor). Search globally:
   ```
   grep -r "agencia" src/
   ```
   Delete or comment out any anchor `<a href="#agencia">` in the nav or footer.

4. **Delete the component file** (optional but recommended to keep the codebase clean):
   ```
   src/sections/AgenciaVsFrancisco.astro
   ```

### Acceptance criteria
- [ ] Section is not visible anywhere on the page.
- [ ] No broken anchor links remain pointing to the removed section.
- [ ] No import errors at build time.
- [ ] Page layout flows cleanly from the preceding section to the following section.

---

## Plan 8 — Reviews / Testimonials Section

### Goal
Add stagger entrance animations, an accent line on hover, a verified badge per testimonial, and improve copy and overall design.

### Files to edit
- `src/sections/Reviews.astro` (or `Testemunhos.astro` / `Testimonials.astro`)
- `src/components/TestimonialCard.astro` (create or refactor)
- `src/styles/reviews.css`

### Exact changes

#### Testimonial card markup
```html
<div class="testimonial-card" data-animate>
  <div class="card-accent"></div>
  <blockquote>
    <p>"{testimonial.quote}"</p>
  </blockquote>
  <footer class="testimonial-footer">
    <div class="testimonial-author">
      <img src={testimonial.avatar} alt={testimonial.name} />
      <div>
        <strong>{testimonial.name}</strong>
        <span>{testimonial.role}</span>
      </div>
    </div>
    <span class="verified-badge">
      <!-- Checkmark SVG or icon -->
      ✓ Verificado
    </span>
  </footer>
</div>
```

#### Hover accent line
```css
.testimonial-card {
  position: relative;
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  padding: 32px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 3px;
  background: #FF6B00;
  transition: width 0.3s ease;
}

.testimonial-card:hover .card-accent {
  width: 100%;
}

.testimonial-card:hover {
  border-color: #FF6B00;
}
```

#### Verified badge
```css
.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #FF6B00;
  border: 1px solid #FF6B00;
  border-radius: 20px;
  padding: 3px 10px;
  font-weight: 600;
}
```

#### Stagger entrance animations
Same Intersection Observer pattern as Plan 5:

```js
const cards = document.querySelectorAll('.testimonial-card[data-animate]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 100);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

cards.forEach(c => {
  c.style.opacity = '0';
  c.style.transform = 'translateY(20px)';
  c.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  observer.observe(c);
});
```

```css
.testimonial-card.visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

@media (prefers-reduced-motion: reduce) {
  .testimonial-card { opacity: 1 !important; transform: none !important; transition: none !important; }
  .card-accent { transition: none; }
}
```

#### Copy improvements
Review all testimonial quotes. Ensure they:
- Are first-person and specific (mention a concrete outcome or project).
- Are free of generic filler phrases ("muito bom trabalho", "recomendo").
- Have verified author names and roles/company names.

Example improved quote:
> "O Francisco entregou o site em 4 dias. Ficou melhor do que esperava e os clientes comentam sempre." — Maria S., proprietária de clínica estética

### Acceptance criteria
- [ ] Testimonial cards animate in with a stagger effect on scroll.
- [ ] Hovering a card reveals an orange accent line at the top and an orange border.
- [ ] Every card displays a "✓ Verificado" badge.
- [ ] Quote copy is specific, first-person, and includes the author's name and role.
- [ ] With `prefers-reduced-motion`, cards are immediately visible.

---

## Plan 9 — Contacto (Contact Section)

### Goal
Simplify the contact section: keep only the section title and the contact form. Optionally add a discreet WhatsApp link inside the form footer.

### Files to edit
- `src/sections/Contact.astro` (or `Contacto.astro`)
- `src/styles/contact.css`

### Exact changes

#### Section title
Change the section heading to:

```
Vamos trabalhar juntos.
```

#### Remove everything except the form
Delete (or comment out) all elements between the `<section>` tag and the `<form>` element, except the heading:
- Remove any "alternativa" blocks, social links, email/phone listed separately, decorative illustrations, etc.
- Keep only: `<h2>Vamos trabalhar juntos.</h2>` followed directly by the `<form>`.

#### Form structure (if rebuilding)
```html
<section class="contacto" id="contacto">
  <h2>Vamos trabalhar juntos.</h2>

  <form class="contact-form" name="contact" method="POST" data-netlify="true">
    <div class="field">
      <label for="name">Nome</label>
      <input type="text" id="name" name="name" required placeholder="O teu nome" />
    </div>
    <div class="field">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required placeholder="o.teu@email.com" />
    </div>
    <div class="field">
      <label for="message">Mensagem</label>
      <textarea id="message" name="message" rows="5" required placeholder="Conta-me o que precisas..."></textarea>
    </div>

    <button type="submit" class="btn btn-primary btn-full">Enviar mensagem →</button>

    <!-- Optional discreet WhatsApp link -->
    <p class="form-footer-note">
      Preferes falar diretamente?
      <a href="https://wa.me/351XXXXXXXXX" target="_blank" rel="noopener">WhatsApp →</a>
    </p>
  </form>
</section>
```

#### Discreet WhatsApp link styling
```css
.form-footer-note {
  text-align: center;
  font-size: 0.8rem;
  color: #666;
  margin-top: 16px;
}

.form-footer-note a {
  color: #FF6B00;
  text-decoration: none;
  font-weight: 600;
}

.form-footer-note a:hover {
  text-decoration: underline;
}
```

Replace `351XXXXXXXXX` with Francisco's actual WhatsApp number (without `+` or spaces).

### Notes / Dependencies
- If the form currently uses Netlify Forms, preserve the `data-netlify="true"` attribute and the hidden `<input type="hidden" name="form-name" value="contact" />`.
- If using a third-party form service (Formspree, etc.), preserve its configuration.
- The WhatsApp number must be supplied by Francisco before this is deployed.

### Acceptance criteria
- [ ] Section title reads "Vamos trabalhar juntos."
- [ ] Only the form (and optional WhatsApp note) are visible below the title — no other content.
- [ ] Form has name, email, and message fields, all marked required.
- [ ] Submit button uses the primary button style (orange).
- [ ] Optional WhatsApp link is present in muted styling below the submit button.
- [ ] Form submission works (not broken by the cleanup).

---

## Plan 10 — Footer

### Goal
Update the "100% Remoto" text in the footer to "From Portugal 🇵🇹".

### Files to edit
- `src/components/Footer.astro` (or `src/sections/Footer.astro`)

### Exact changes
Search for the text "100% Remoto" within the footer component and replace with:

```
From Portugal 🇵🇹
```

If it is rendered via a data variable or i18n key, update that source instead of the template directly.

### Acceptance criteria
- [ ] Footer shows "From Portugal 🇵🇹".
- [ ] "100% Remoto" does not appear anywhere in the footer.
- [ ] No layout shift or spacing changes from the text swap.

---

## Plan 11 — Global Buttons & Colour Fixes

### Goal
Establish a coherent global button system and fix the black-background + orange-text bug that currently affects service card buttons and potentially others.

### Files to edit
- `src/styles/global.css` (or `src/styles/tokens.css` / `src/styles/buttons.css`)
- Any component that overrides button colours locally (check `ServiceCard.astro`, and run a global search for `background.*black` or `color.*orange`)

### Design tokens
Define CSS custom properties at `:root` level:

```css
:root {
  --color-primary:       #FF6B00;
  --color-primary-dark:  #e05a00;
  --color-primary-light: #ff8533;
  --color-on-primary:    #ffffff;

  --color-secondary:       #1a1a1a;
  --color-on-secondary:    #ffffff;

  --btn-radius:    8px;
  --btn-padding-y: 12px;
  --btn-padding-x: 24px;
  --btn-font-size: 0.95rem;
  --btn-font-weight: 700;
  --btn-transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
```

### Global button styles
```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--btn-padding-y) var(--btn-padding-x);
  border-radius: var(--btn-radius);
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: var(--btn-transition);
  white-space: nowrap;
}

/* Primary — orange fill, white text */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 107, 0, 0.35);
}

/* Secondary — dark fill, white text */
.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-on-secondary);
  border: 1px solid #333;
}

.btn-secondary:hover {
  background-color: #252525;
  transform: translateY(-2px);
}

/* Outline — transparent, orange border */
.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

/* Full-width modifier */
.btn-full {
  width: 100%;
}

/* Disabled state */
.btn:disabled,
.btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
  .btn:hover { transform: none; box-shadow: none; }
}
```

### Fix the black + orange bug
Run a global search in `src/` for any of these patterns:

```bash
grep -r "background.*#000\|background.*black\|background-color.*#000" src/
grep -r "color.*#FF6B00\|color.*orange" src/
```

For each result inside a button context, replace the local rule with the appropriate `.btn-primary` / `.btn-secondary` / `.btn-outline` class or custom property reference. **Do not** use hardcoded colour values on buttons — use the tokens above.

### Fix hover animation bug — specific steps
The most common causes of broken hover transitions:

1. **`transition: all`** — Replace with explicit properties:
   ```css
   /* Bad */  transition: all 0.3s;
   /* Good */ transition: background-color 0.2s ease, transform 0.2s ease;
   ```

2. **Keyframe animation on hover** — If a `@keyframes` animation is being set in a `:hover` rule, remove it and use `transition` instead.

3. **Child element intercepting pointer events** — Add `pointer-events: none` to `.btn > *` (icons, spans inside the button) to ensure hover is always registered on the button itself:
   ```css
   .btn > * { pointer-events: none; }
   ```

4. **Specificity conflict** — A scoped component style may be overriding the global rule. Use browser DevTools to inspect which rule wins, then either remove the local override or increase specificity of the global rule.

### Acceptance criteria
- [ ] CSS custom properties (`--color-primary`, etc.) are defined at `:root` and used by all button variants.
- [ ] `.btn-primary` renders orange background with white text on all occurrences site-wide.
- [ ] No button anywhere on the site has a black background with orange text.
- [ ] Hovering any `.btn-primary` produces a consistent lift + darker-orange effect.
- [ ] Hovering any `.btn-secondary` produces a consistent lift + slightly lighter background.
- [ ] With `prefers-reduced-motion`, hover states change colour but do not lift or cast shadows.
- [ ] No hardcoded colour values remain on any button element.

---

## Appendix — Quick Reference

### Section → File mapping (likely)
| Section | File path (probable) |
|---|---|
| Loading Screen | `src/components/LoadingScreen.astro` |
| Hero | `src/sections/Hero.astro` |
| Sobre Mim | `src/sections/About.astro` |
| Serviços | `src/sections/Services.astro` |
| Processo | `src/sections/Process.astro` |
| Portfólio | `src/sections/Portfolio.astro` |
| Agência vs Francisco | `src/sections/AgenciaVsFrancisco.astro` |
| Reviews | `src/sections/Reviews.astro` |
| Contacto | `src/sections/Contact.astro` |
| Footer | `src/components/Footer.astro` |

> **Note:** Actual filenames may differ. Run `find src/ -name "*.astro"` to map them before starting.

### Shared animation pattern
Plans 5 and 8 both use the Intersection Observer stagger pattern. Consider extracting it into a shared utility:

```js
// src/utils/animateOnScroll.js
export function staggerReveal(selector, delay = 100) {
  const els = document.querySelectorAll(selector);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    els.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => observer.observe(el));
}
```

Import and call in each section that needs it.

### Implementation order recommendation
1. **Plan 11** (global buttons) — fixes cascading colour bugs before per-section work
2. **Plan 7** (remove Agência section) — safe deletion, no risk
3. **Plan 2** (Hero copy) — quick win
4. **Plan 10** (Footer) — single line change
5. **Plan 4** (Services) — depends on Plan 11 being done first
6. **Plan 1** (Loading Screen) — standalone, test in isolation
7. **Plan 3** (About) — needs photo asset
8. **Plan 5** (Processo) — full redesign
9. **Plan 8** (Reviews) — moderate effort
10. **Plan 9** (Contact) — cleanup + form check
11. **Plan 6** (Portfolio) — most effort; needs all project assets

---

*Generated 2026-03-21. Covers all 11 planned changes to fsousa-dev (Astro).*
