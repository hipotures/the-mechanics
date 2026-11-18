import { esc, icon, fmtMoney, fmtNum, badge, toast, rangeFill, stepperHTML, wireSteppers, status } from "../lib.js";

const BASE = import.meta.env.BASE_URL;
const img = (key) => `${BASE}products/${key}.svg`;

// eager: images likely above the fold (first catalog row) load at once; the first gets fetchpriority=high (LCP).
export function media(key, alt, { cls = "", badgeHTML = "", eager = false, priority = false } = {}) {
  return `<div class="tm-media ${cls}" data-state="loading">
    <img src="${img(key)}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}"${priority ? ' fetchpriority="high"' : ""} decoding="async" width="400" height="300">
    <div class="tm-media__fallback" role="img" aria-label="Image unavailable: ${esc(alt)}">${icon("image", "tm-icon--lg")}<span>Image unavailable</span></div>
    ${badgeHTML ? `<span class="tm-media__badge">${badgeHTML}</span>` : ""}
  </div>`;
}
export function bindMedia(root) {
  root.querySelectorAll(".tm-media img").forEach((im) => {
    const frame = im.parentElement;
    const done = () => (frame.dataset.state = im.naturalWidth ? "loaded" : "error");
    if (im.complete) done();
    else {
      im.addEventListener("load", done, { once: true });
      im.addEventListener("error", () => (frame.dataset.state = "error"), { once: true });
    }
  });
}

const STOCK_LABEL = (p) =>
  p.stockStatus === "limited" ? `Only ${p.stockCount} left` : p.stockStatus === "in-stock" ? `In stock · ${p.stockCount}` : p.stockStatus === "preorder" ? "Preorder" : "Out of stock";
const AVAIL = { "in-stock": "In stock", limited: "Limited stock", preorder: "Preorder", "out-of-stock": "Out of stock" };
const BADGE_TONE = { Featured: "none", "Sold out": "danger", Preorder: "info" };

function rating(r) {
  return r == null
    ? `<span class="tm-rating tm-muted">No ratings yet</span>`
    : `<span class="tm-rating" role="img" aria-label="Rated ${r} out of 5"><span class="tm-rating__bar" aria-hidden="true"><span style="width:${(r / 5) * 100}%"></span></span>${fmtNum(r, 1)} / 5</span>`;
}

function actionBtn(p, cls = "tm-btn--sm") {
  if (p.stockStatus === "out-of-stock") return `<button class="tm-btn ${cls}" disabled>Sold out</button>`;
  if (p.stockStatus === "preorder") return `<button class="tm-btn tm-btn--outline ${cls}" data-add="${p.id}">${icon("calendar", "tm-icon--sm")}Preorder</button>`;
  return `<button class="tm-btn tm-btn--primary ${cls}" data-add="${p.id}">${icon("cart", "tm-icon--sm")}Add<span class="tm-sr-only"> ${esc(p.title)} to cart</span></button>`;
}

export default {
  render(main, data) {
    const c = data.commerce;
    const byId = Object.fromEntries(c.products.map((p) => [p.id, p]));
    const maxPrice = Math.ceil(Math.max(...c.products.map((p) => p.price)) / 10) * 10;
    const st = { cat: "All", q: "", sort: c.sortOptions[0], stock: new Set(), maxPrice, minRating: 0 };
    const cart = new Map(c.cart.items.map((i) => [i.productId, i.quantity]));
    const money = (n) => fmtMoney(n, c.currency);

    main.innerHTML = `
    <header class="tm-page-head">
      <div class="tm-page-head__text">
        <div class="tm-eyebrow">Catalog · Storefront</div>
        <h1 class="tm-page-title">${esc(c.pageTitle)}</h1>
        <p class="tm-subtitle">${esc(c.description)}</p>
      </div>
      <div class="pg-controls"><button class="tm-btn tm-btn--outline" id="open-cart">${icon("cart")}Cart <span class="tm-badge tm-badge--count" id="cart-count"></span></button></div>
    </header>
    <div class="pg-cat-cats" role="group" aria-label="Category">
      ${c.categories.map((k) => `<button class="tm-chip tm-chip--toggle" data-cat="${esc(k)}" aria-pressed="${k === st.cat}">${esc(k)} <span class="tm-meta">${k === "All" ? c.products.length : c.products.filter((p) => p.category === k).length}</span></button>`).join("")}
    </div>
    <div class="pg-cat-layout">
      <details class="pg-filters-toggle" open>
        <summary class="tm-btn tm-btn--outline tm-btn--block">${icon("filter")}Filters</summary>
        <aside class="tm-panel pg-filters" aria-labelledby="flt-title">
          <header class="tm-panel__head"><h2 class="tm-panel__title" id="flt-title">${icon("filter", "tm-icon--sm")}Refine</h2><button class="tm-btn tm-btn--ghost tm-btn--sm" id="reset-filters">Reset</button></header>
          <div class="tm-panel__body pg-stack">
            <div class="tm-field"><label class="tm-field__label" for="cat-q">Search</label>
              <div class="tm-input-group"><span class="tm-affix">${icon("search", "tm-icon--sm")}</span><input class="tm-input" type="search" id="cat-q" placeholder="Product name or description"></div></div>
            <fieldset class="tm-fieldset pg-stack-sm"><legend>Availability</legend>
              ${["in-stock", "limited", "preorder", "out-of-stock"].map((s) => `<label class="tm-choice"><input class="tm-check" type="checkbox" value="${s}" data-stock><span class="tm-choice__label">${AVAIL[s]}</span></label>`).join("")}
            </fieldset>
            <div class="tm-field"><label class="tm-field__label" for="price">Max price <output class="tm-num" id="price-out" for="price">${money(maxPrice)}</output></label>
              <input class="tm-range" type="range" id="price" min="10" max="${maxPrice}" step="5" value="${maxPrice}">
              <div class="pg-range-scale tm-meta"><span>${money(10)}</span><span>${money(maxPrice)}</span></div></div>
            <fieldset class="tm-fieldset pg-stack-sm"><legend>Rating</legend>
              ${[["0", "Any rating"], ["4", "4.0 and up"], ["4.5", "4.5 and up"]].map(([v, l]) => `<label class="tm-choice"><input class="tm-radio" type="radio" name="rating" value="${v}" ${v === "0" ? "checked" : ""}><span class="tm-choice__label">${l}</span></label>`).join("")}
            </fieldset>
          </div>
        </aside>
      </details>
      <section aria-labelledby="results-title" class="pg-results">
        <div class="pg-results-bar">
          <h2 class="tm-label" id="results-title" aria-live="polite"></h2>
          <span class="tm-toolbar__spacer"></span>
          <label class="tm-field__label pg-inline-label" for="sort">Sort</label>
          <select class="tm-select pg-w-auto" id="sort">${c.sortOptions.map((o) => `<option>${esc(o)}</option>`).join("")}</select>
        </div>
        <div class="pg-product-grid" id="grid"></div>
      </section>
    </div>

    <dialog class="tm-drawer" id="detail" aria-labelledby="detail-title"></dialog>
    <dialog class="tm-drawer" id="cart" aria-labelledby="cart-title"></dialog>`;

    const $ = (s) => main.querySelector(s);

    function results() {
      const q = st.q.trim().toLowerCase();
      const list = c.products.filter(
        (p) =>
          (st.cat === "All" || p.category === st.cat) &&
          (!q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
          (!st.stock.size || st.stock.has(p.stockStatus)) &&
          p.price <= st.maxPrice &&
          (st.minRating === 0 || (p.rating ?? 0) >= st.minRating),
      );
      const s = st.sort;
      if (s.includes("low")) list.sort((a, b) => a.price - b.price);
      else if (s.includes("high")) list.sort((a, b) => b.price - a.price);
      else if (s === "Name") list.sort((a, b) => a.title.localeCompare(b.title));
      return list;
    }

    function card(p, i) {
      const b = p.badge ? status(BADGE_TONE[p.badge], p.badge) : "";
      return `<article class="tm-product" aria-labelledby="t-${p.id}">
        ${media(p.imageKey, p.title, { badgeHTML: b, eager: i < 4, priority: i === 0 })}
        <div class="tm-product__body">
          <div class="tm-meta-row"><span>${esc(p.category)}</span><span>${esc(p.id)}</span></div>
          <h3 class="tm-product__title" id="t-${p.id}"><button data-detail="${p.id}">${esc(p.title)}</button></h3>
          <p class="tm-product__desc">${esc(p.description)}</p>
          ${rating(p.rating)}
          ${badge(p.stockStatus, STOCK_LABEL(p)).replace('class="tm-badge ', 'class="tm-badge tm-badge--bare ')}
        </div>
        <div class="tm-product__foot">
          <span class="tm-price"><span class="tm-price__now">${money(p.price)}</span></span>
          ${actionBtn(p, "")}
        </div>
      </article>`;
    }

    function renderGrid() {
      const list = results();
      $("#results-title").textContent = `${list.length} of ${c.products.length} products`;
      $("#grid").innerHTML = list.length
        ? list.map(card).join("")
        : `<div class="tm-state pg-span-all"><div class="tm-state__icon">${icon("catalog")}</div><div class="tm-state__title">No products found${st.q ? ` for “${esc(st.q)}”` : ""}</div><div class="tm-state__body">Try a broader search, another category, or raise the price limit.</div><button class="tm-btn tm-btn--sm tm-btn--outline" id="clear-cat">Reset filters</button></div>`;
      $("#clear-cat")?.addEventListener("click", reset);
      bindMedia($("#grid"));
    }

    function updateCartCount() {
      const n = [...cart.values()].reduce((a, b) => a + b, 0);
      $("#cart-count").textContent = n;
    }

    function reset() {
      Object.assign(st, { cat: "All", q: "", stock: new Set(), maxPrice, minRating: 0 });
      $("#cat-q").value = "";
      main.querySelectorAll("[data-stock]").forEach((i) => (i.checked = false));
      const pr = $("#price");
      pr.value = maxPrice;
      rangeFill(pr);
      $("#price-out").textContent = money(maxPrice);
      main.querySelector('input[name="rating"][value="0"]').checked = true;
      main.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === "All")));
      renderGrid();
    }

    function addToCart(id, qty = 1) {
      const p = byId[id];
      cart.set(id, (cart.get(id) || 0) + qty);
      updateCartCount();
      toast({ tone: "success", title: p.stockStatus === "preorder" ? "Preorder added" : "Added to cart", body: `${qty} × ${p.title}`, timeout: 3500 });
    }

    function openDetail(id) {
      const p = byId[id];
      const d = $("#detail");
      d.innerHTML = `
        <div class="tm-dialog__head"><h2 class="tm-dialog__title tm-truncate" id="detail-title">Product detail</h2>
          <button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" data-close aria-label="Close product detail">${icon("x")}</button></div>
        <div class="tm-dialog__body"><div class="pg-stack">
          ${media(p.imageKey, p.title, { cls: "tm-media--framed", badgeHTML: p.badge ? status(BADGE_TONE[p.badge], p.badge) : "" })}
          <div class="pg-thumbs" role="group" aria-label="Views">
            <figure>${media(p.imageKey, `${p.title}, front view`, { cls: "tm-media--square tm-media--framed" })}<figcaption class="tm-meta">Front</figcaption></figure>
            <figure>${media(c.edgeCases.missingImageKey, `${p.title}, detail view`, { cls: "tm-media--square tm-media--framed" })}<figcaption class="tm-meta">Detail · missing</figcaption></figure>
          </div>
          <div class="pg-stack-sm">
            <div class="tm-meta-row"><span>${esc(p.category)}</span><span>${esc(p.id)}</span></div>
            <h3 class="pg-detail-title">${esc(p.title)}</h3>
            <div class="pg-row-between"><span class="tm-price"><span class="tm-price__now">${money(p.price)}</span></span>${badge(p.stockStatus, STOCK_LABEL(p))}</div>
            ${rating(p.rating)}
            <p>${esc(p.description)}</p>
          </div>
          ${
            p.stockStatus === "out-of-stock"
              ? `<div class="tm-alert tm-alert--warning">${icon("alert")}<div><div class="tm-alert__title">Currently sold out</div><div class="tm-alert__body">Restock date not announced. You can still save it for later.</div></div></div>`
              : p.stockStatus === "preorder"
                ? `<div class="tm-alert tm-alert--info">${icon("info")}<div><div class="tm-alert__title">Preorder item</div><div class="tm-alert__body">Charged when the item ships. Quantity is not limited.</div></div></div>`
                : ""
          }
          <div class="pg-buy">
            <div class="tm-field"><label class="tm-field__label" for="qty">Quantity</label>
              ${stepperHTML({ id: "qty", value: 1, min: 1, max: p.stockCount || 99, label: "quantity", size: "lg", disabled: p.stockStatus === "out-of-stock" })}</div>
            ${p.stockStatus === "out-of-stock" ? `<button class="tm-btn tm-btn--lg" disabled>Sold out</button>` : `<button class="tm-btn tm-btn--primary tm-btn--lg" data-add-qty="${p.id}">${icon("cart")}${p.stockStatus === "preorder" ? "Preorder" : "Add to cart"}</button>`}
          </div>
          <table class="tm-table pg-spec-table"><caption class="tm-sr-only">Specifications</caption><tbody>
            <tr><th scope="row">SKU</th><td class="tm-num">${esc(p.id)}</td></tr><tr><th scope="row">Category</th><td>${esc(p.category)}</td></tr>
            <tr><th scope="row">Units available</th><td class="tm-num">${p.stockCount}</td></tr><tr><th scope="row">Currency</th><td class="tm-num">${esc(p.currency)}</td></tr></tbody></table>
        </div></div>`;
      bindMedia(d);
      wireSteppers(d);
      d.showModal();
    }

    function renderCart() {
      const d = $("#cart");
      const lines = [...cart.entries()].map(([id, q]) => ({ p: byId[id], q }));
      const subtotal = lines.reduce((a, l) => a + l.p.price * l.q, 0);
      d.innerHTML = `
        <div class="tm-dialog__head"><h2 class="tm-dialog__title" id="cart-title">Cart</h2><button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" data-close aria-label="Close cart">${icon("x")}</button></div>
        <div class="tm-dialog__body"><div class="pg-stack">
          ${
            lines.length
              ? `<ul class="tm-list pg-cart-lines">${lines
                  .map(
                    ({ p, q }) => `<li class="tm-row pg-cart-line">${media(p.imageKey, p.title, { cls: "tm-media--square tm-media--framed pg-cart-thumb" })}
                  <div class="pg-cart-info"><span class="tm-table__primary">${esc(p.title)}</span><span class="tm-meta">${money(p.price)} each</span>
                    <div class="tm-btn-group"><button class="tm-btn tm-btn--sm tm-btn--icon" data-cq="${p.id}" data-d="-1" aria-label="Decrease ${esc(p.title)}">${icon("minus", "tm-icon--sm")}</button><span class="tm-btn tm-btn--sm pg-cq" aria-live="polite">${q}</span><button class="tm-btn tm-btn--sm tm-btn--icon" data-cq="${p.id}" data-d="1" aria-label="Increase ${esc(p.title)}">${icon("plus", "tm-icon--sm")}</button></div></div>
                  <span class="tm-num pg-cart-total">${money(p.price * q)}</span></li>`,
                  )
                  .join("")}</ul>`
              : `<div class="tm-state"><div class="tm-state__icon">${icon("cart")}</div><div class="tm-state__title">Your cart is empty</div><div class="tm-state__body">Add a product from the catalog to continue.</div></div>`
          }
          <form class="tm-field" id="discount" novalidate><label class="tm-field__label" for="code">Discount code</label>
            <div class="pg-inline"><input class="tm-input tm-input--mono" id="code" name="discount-code" value="${esc(c.cart.discountCode)}" aria-describedby="code-err" autocomplete="off" spellcheck="false"><button class="tm-btn tm-btn--outline">Apply</button></div>
            <span class="tm-field__error" id="code-err" hidden></span></form>
          <dl class="pg-dl pg-totals"><dt>Subtotal</dt><dd class="tm-num">${money(subtotal)}</dd><dt>Discount</dt><dd class="tm-num">${money(0)}</dd><dt>Shipping</dt><dd class="tm-muted">Calculated at checkout</dd><dt class="pg-total">Total</dt><dd class="tm-num pg-total">${money(subtotal)}</dd></dl>
        </div></div>
        <div class="tm-dialog__foot"><button class="tm-btn tm-btn--outline" data-close>Continue shopping</button><button class="tm-btn tm-btn--primary" id="checkout" ${lines.length ? "" : "disabled"}>Checkout</button></div>`;
      bindMedia(d);
      d.querySelector("#discount").addEventListener("submit", (e) => {
        e.preventDefault();
        const code = d.querySelector("#code");
        const err = d.querySelector("#code-err");
        code.setAttribute("aria-invalid", "true");
        err.hidden = false;
        err.textContent = `Code “${code.value || "empty"}” is not valid or has expired.`;
        code.focus();
      });
      d.querySelector("#checkout")?.addEventListener("click", () => toast({ tone: "info", title: "Checkout is simulated", body: "No orders are placed from this playground." }));
    }

    /* ---------- Events --------------------------------------------- */
    main.querySelectorAll("[data-cat]").forEach((b) =>
      b.addEventListener("click", () => {
        st.cat = b.dataset.cat;
        main.querySelectorAll("[data-cat]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        renderGrid();
      }),
    );
    $("#cat-q").addEventListener("input", (e) => { st.q = e.target.value; renderGrid(); });
    $("#sort").addEventListener("change", (e) => { st.sort = e.target.value; renderGrid(); });
    main.querySelectorAll("[data-stock]").forEach((i) => i.addEventListener("change", () => { i.checked ? st.stock.add(i.value) : st.stock.delete(i.value); renderGrid(); }));
    const pr = $("#price");
    rangeFill(pr);
    pr.addEventListener("input", () => { st.maxPrice = +pr.value; rangeFill(pr); $("#price-out").textContent = money(st.maxPrice); renderGrid(); });
    main.querySelectorAll('input[name="rating"]').forEach((r) => r.addEventListener("change", () => { st.minRating = +r.value; renderGrid(); }));
    $("#reset-filters").addEventListener("click", reset);
    $("#open-cart").addEventListener("click", () => { renderCart(); $("#cart").showModal(); });

    main.addEventListener("click", (e) => {
      const t = e.target;
      const det = t.closest("[data-detail]");
      if (det) return openDetail(det.dataset.detail);
      const add = t.closest("[data-add]");
      if (add) return addToCart(add.dataset.add);
      const addq = t.closest("[data-add-qty]");
      if (addq) {
        addToCart(addq.dataset.addQty, Math.max(1, +$("#qty").value || 1));
        $("#detail").close();
        return;
      }
      const cq = t.closest("[data-cq]");
      if (cq) {
        const n = (cart.get(cq.dataset.cq) || 0) + +cq.dataset.d;
        n <= 0 ? cart.delete(cq.dataset.cq) : cart.set(cq.dataset.cq, n);
        updateCartCount();
        renderCart();
        return;
      }
      if (t.closest("[data-close]")) t.closest("dialog").close();
    });
    main.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

    const mq = window.matchMedia("(max-width: 899px)");
    const syncFilters = () => ($(".pg-filters-toggle").open = !mq.matches);
    mq.addEventListener("change", syncFilters);
    syncFilters();

    updateCartCount();
    renderGrid();
    return () => mq.removeEventListener("change", syncFilters);
  },
};
