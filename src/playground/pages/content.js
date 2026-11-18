import { esc, icon, fmtDate, toast } from "../lib.js";

// Original illustration: three nested frames = the three-level hierarchy.
const hierarchyFigure = `<svg class="pg-illus" viewBox="0 0 480 220" role="img" aria-labelledby="fig-h-t">
  <title id="fig-h-t">Diagram: a strong outer region contains a medium panel, which contains subtle records.</title>
  <!-- Paint order: fills first, then dividers, then outer frames last, so header bands never cover a frame. -->
  <rect x="8" y="8" width="464" height="204" fill="var(--tm-surface)"/>
  <rect x="8" y="8" width="464" height="30" fill="var(--tm-head-1)"/>
  <line x1="8" x2="472" y1="38" y2="38" stroke="var(--tm-line-1)" stroke-width="3"/>
  <text x="22" y="28" style="font:700 12px var(--tm-font-mono);fill:var(--tm-text)">LEVEL 1 · REGION</text>
  <rect x="28" y="54" width="250" height="140" fill="var(--tm-surface)"/>
  <rect x="28" y="54" width="250" height="24" fill="var(--tm-head-2)"/>
  <line x1="28" x2="278" y1="78" y2="78" stroke="var(--tm-line-3)"/>
  <text x="40" y="70" style="font:600 11px var(--tm-font-ui);fill:var(--tm-text)">Level 2 · Panel</text>
  ${[0, 1, 2].map((i) => `<rect x="40" y="${90 + i * 32}" width="226" height="12" fill="var(--tm-sunken)"/><text x="46" y="${99 + i * 32}" style="font:600 8.5px var(--tm-font-mono);fill:var(--tm-text-2)">B${String(218 + i).padStart(7, "0")}</text><line x1="40" x2="266" y1="${116 + i * 32}" y2="${116 + i * 32}" stroke="var(--tm-line-3)"/>`).join("")}
  <rect x="298" y="54" width="154" height="140" fill="var(--tm-surface)"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${316 + i * 32}" y="${150 - [40, 70, 55, 90][i]}" width="22" height="${[40, 70, 55, 90][i] + 30}" fill="var(--tm-chart-${i + 1})"/>`).join("")}
  <line x1="306" x2="444" y1="180.5" y2="180.5" stroke="var(--tm-chart-axis)"/>
  <rect x="28" y="54" width="250" height="140" fill="none" stroke="var(--tm-line-2)" stroke-width="1.5"/>
  <rect x="298" y="54" width="154" height="140" fill="none" stroke="var(--tm-line-2)" stroke-width="1.5"/>
  <rect x="8" y="8" width="464" height="204" fill="none" stroke="var(--tm-line-1)" stroke-width="3"/>
</svg>`;

const heroFigure = `<svg class="pg-hero-illus" viewBox="0 0 360 260" role="img" aria-labelledby="hero-t">
  <title id="hero-t">Abstract drafting-table illustration: grid paper, a ruler and a measured line chart.</title>
  <rect x="10" y="10" width="340" height="240" fill="var(--tm-inset)" stroke="var(--tm-line-1)" stroke-width="3"/>
  ${Array.from({ length: 11 }, (_, i) => `<line x1="${30 + i * 30}" x2="${30 + i * 30}" y1="10" y2="250" stroke="var(--tm-line-3)"/>`).join("")}
  ${Array.from({ length: 8 }, (_, i) => `<line x1="10" x2="350" y1="${30 + i * 30}" y2="${30 + i * 30}" stroke="var(--tm-line-3)"/>`).join("")}
  <path d="M40 200L90 170L140 182L190 120L240 132L290 70L330 84" fill="none" stroke="var(--tm-chart-1)" stroke-width="3"/>
  ${[[40, 200], [90, 170], [140, 182], [190, 120], [240, 132], [290, 70], [330, 84]].map(([x, y]) => `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="var(--tm-surface)" stroke="var(--tm-chart-1)" stroke-width="2"/>`).join("")}
  <line x1="30" x2="340" y1="95" y2="95" stroke="var(--tm-chart-threshold)" stroke-width="1.5" stroke-dasharray="6 4"/>
  <g transform="rotate(-8 180 225)"><rect x="40" y="212" width="290" height="24" fill="var(--tm-chart-5)" stroke="var(--tm-line-1)" stroke-width="2"/>
  ${Array.from({ length: 28 }, (_, i) => `<line x1="${50 + i * 10}" x2="${50 + i * 10}" y1="212" y2="${i % 5 ? 219 : 225}" stroke="var(--tm-line-1)" stroke-width="1.5"/>`).join("")}</g>
</svg>`;

export default {
  render(main, data) {
    const s = data.website;
    const [a1, a2] = s.articles;
    const article = (a, extra = "") => `<article class="pg-article" aria-labelledby="${a.id}-h">
        <h2 id="${a.id}-h" tabindex="-1">${esc(a.title)}</h2>
        <div class="tm-meta-row"><span>${esc(a.author)}</span><span><time datetime="${a.date}">${fmtDate(a.date + "T00:00:00Z")}</time></span><span>${a.readingMinutes} min read</span></div>
        ${a.paragraphs.map((p, i) => `<p${i === 0 ? ' class="tm-lead"' : ""}>${esc(p)}</p>`).join("")}
        ${extra}
      </article>`;

    main.innerHTML = `
    <div class="pg-site">
      <header class="pg-site-head">
        <a class="tm-brand" href="#/content" data-scroll="overview"><span class="tm-brand__mark" aria-hidden="true">FN</span>${esc(s.siteName)}</a>
        <nav aria-label="Site"><ul class="pg-site-nav">${s.nav.map((n) => `<li><a href="#${n.target}" data-scroll="${n.target}">${esc(n.label)}</a></li>`).join("")}</ul></nav>
        <a class="tm-btn tm-btn--sm tm-btn--outline pg-hide-sm" href="#guides" data-scroll="guides">Docs ${icon("chevronRight", "tm-icon--sm")}</a>
      </header>

      <section class="tm-hero pg-hero" id="overview" aria-labelledby="hero-h">
        <div class="pg-stack">
          <div class="tm-eyebrow">${esc(s.hero.eyebrow)}</div>
          <h1 class="tm-hero__title" id="hero-h" tabindex="-1">${esc(s.hero.title)}</h1>
          <p class="tm-hero__subtitle">${esc(s.hero.subtitle)}</p>
          <div class="tm-hero__actions">
            <a class="tm-btn tm-btn--primary tm-btn--lg" href="#guides" data-scroll="guides">${esc(s.hero.primaryAction)}</a>
            <a class="tm-btn tm-btn--outline tm-btn--lg" href="#principles" data-scroll="principles">${esc(s.hero.secondaryAction)}</a>
          </div>
        </div>
        ${heroFigure}
      </section>

      <div class="pg-reading">
        <aside class="pg-toc-wrap" aria-label="On this page">
          <div class="tm-label">On this page</div>
          <ul class="tm-toc" id="toc">${s.nav.map((n) => `<li><a href="#${n.target}" data-scroll="${n.target}">${esc(n.label)}</a></li>`).join("")}</ul>
        </aside>
        <div class="tm-prose pg-prose">
          <section id="principles" data-spy>
            ${article(
              a1,
              `<blockquote><p>${esc(s.quote.text)}</p><footer>— ${esc(s.quote.attribution)}</footer></blockquote>
               <figure>${hierarchyFigure}<figcaption>Figure 1. Hierarchy by boundary strength: one strong region, medium panels, subtle records.</figcaption></figure>
               <h3>What changes between themes</h3>
               <ul><li>Surface, text, line and status colors are re-tuned per theme.</li><li>Geometry, spacing, type scale and control sizes never change.</li><li>Charts keep their series order; only hues adapt for contrast.</li></ul>`,
            )}
          </section>
          <section id="guides" data-spy>
            ${article(
              a2,
              `<div class="tm-alert tm-alert--${esc(s.callout.kind)}" role="note">${icon("info")}<div><div class="tm-alert__title">${esc(s.callout.heading)}</div><div class="tm-alert__body">${esc(s.callout.body)}</div></div></div>
               <h3>Border strength by level</h3>
               <div class="tm-prose__scroll" tabindex="0" role="region" aria-label="Border tokens table"><table><caption class="tm-sr-only">Border tokens by hierarchy level</caption><thead><tr><th scope="col">Level</th><th scope="col">Used for</th><th scope="col">Token</th></tr></thead><tbody>
                 <tr><td>1 · Region</td><td>App shell, KPI strip, major sections</td><td><code>--tm-bw-1</code> + <code>--tm-line-1</code></td></tr>
                 <tr><td>2 · Panel</td><td>Panels, tables, cards, dialogs</td><td><code>--tm-bw-2</code> + <code>--tm-line-2</code></td></tr>
                 <tr><td>3 · Record</td><td>Rows, nested groups, block labels</td><td><code>--tm-bw-3</code> + <code>--tm-line-3</code></td></tr></tbody></table></div>
               <h3>Using the CSS without a framework</h3>
               <pre tabindex="0"><code>&lt;link rel="stylesheet" href="the-mechanics/fonts.css"&gt;
&lt;link rel="stylesheet" href="the-mechanics/the-mechanics.css"&gt;
&lt;html data-tm-theme="coffee"&gt; … &lt;body class="tm-root"&gt;
&lt;section class="tm-panel"&gt;…&lt;/section&gt;</code></pre>
               <p>Polish text renders with the same fonts: <span lang="pl">Zażółć gęślą jaźń — źródło, łąka, część.</span></p>`,
            )}
          </section>
          <section id="about" data-spy aria-labelledby="about-h">
            <h2 id="about-h" tabindex="-1">About this project</h2>
            <p>The Field Notes is a demonstration site inside The Mechanics playground. All copy is synthetic and exists to test long-form reading, headings, lists and interactive disclosure.</p>
            <h3>Frequently asked questions</h3>
            <div class="tm-accordion">${s.faq.map((f, i) => `<details ${i === 0 ? "open" : ""}><summary>${esc(f.question)}</summary><div class="tm-accordion__body">${esc(f.answer)}</div></details>`).join("")}</div>
          </section>
          <section class="pg-cta" aria-labelledby="cta-h">
            <h2 id="cta-h">Get the field notes</h2>
            <p>A short, occasional digest about structured interfaces. No real emails are sent from this demo.</p>
            <form class="pg-inline" id="subscribe" novalidate>
              <label class="tm-sr-only" for="sub-email">Email address</label>
              <input class="tm-input" type="email" id="sub-email" name="email" placeholder="you@example.test" autocomplete="email" spellcheck="false">
              <button class="tm-btn tm-btn--primary">Subscribe</button>
            </form>
          </section>
        </div>
      </div>
      <footer class="tm-footer pg-site-foot"><span>${esc(s.siteName)} · ${esc(s.footer)}</span><span>Built with The Mechanics design tokens</span></footer>
    </div>`;

    // Smooth in-page navigation without touching the hash router.
    main.addEventListener("click", (e) => {
      const a = e.target.closest("[data-scroll]");
      if (!a) return;
      e.preventDefault();
      const target = main.querySelector(`#${a.dataset.scroll}`);
      const heading = target.querySelector("h1, h2") || target;
      target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      heading.focus({ preventScroll: true });
    });
    const toc = main.querySelector("#toc");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          toc.querySelectorAll("a").forEach((l) => (l.dataset.scroll === en.target.id ? l.setAttribute("aria-current", "true") : l.removeAttribute("aria-current")));
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    main.querySelectorAll("[data-spy], #overview").forEach((sec) => io.observe(sec));
    toc.querySelector("a").setAttribute("aria-current", "true");

    main.querySelector("#subscribe").addEventListener("submit", (e) => {
      e.preventDefault();
      const i = main.querySelector("#sub-email");
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value);
      i.setAttribute("aria-invalid", String(!ok));
      toast(ok ? { tone: "success", title: "Subscribed (simulated)", body: i.value } : { tone: "danger", title: "Enter a complete email address", body: "Example: you@example.test", timeout: 6000 });
    });
    return () => io.disconnect();
  },
};
