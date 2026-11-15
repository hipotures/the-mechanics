// Generates original, flat technical-illustration SVG placeholders for every
// commerce imageKey in fixtures/demo-data.json → public/products/<key>.svg.
// Deliberately NOT generated: "product-missing" (exercises the image failure state).
// Run: node scripts/gen-product-images.mjs   (output is committed)
import { writeFileSync, mkdirSync } from "node:fs";

const W = 400;
const H = 300;
const ink = "#2b2f2a";
const paper = "#f2eee4";

// Scene helper: backdrop + floor + soft hard-edged shadow; `obj` is the item.
const scene = (bg, floor, obj, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
<rect width="${W}" height="${H}" fill="${bg}"/>
<rect y="214" width="${W}" height="86" fill="${floor}"/>
<g stroke="${ink}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${obj}</g>
<path d="M0 214H${W}" stroke="${ink}" stroke-opacity=".25" stroke-width="2"/>
</svg>
`;

const items = {
  "product-001": ["#c9cfc0", "#b3baa9", `<rect x="250" y="206" width="20" height="10" fill="${ink}" opacity=".15" stroke="none"/>
    <rect x="120" y="70" width="150" height="140" fill="#4d5d3e"/><rect x="128" y="70" width="10" height="140" fill="#3c4a30"/>
    <path d="M250 70v140" stroke="#d8b25a" stroke-width="4"/><rect x="160" y="105" width="80" height="26" fill="${paper}"/><path d="M170 118h60" stroke-width="2"/>`, "Field notebook"],
  "product-002": ["#d6cbb6", "#c2b59c", `<rect x="140" y="200" width="90" height="14" fill="#5b6066"/><path d="M185 200L160 120L230 70" fill="none" stroke-width="7"/>
    <circle cx="160" cy="120" r="7" fill="${paper}"/><path d="M215 55l50 30-18 28-50-30z" fill="#5b6066"/>
    <path d="M232 112l-20 52M248 116l6 50" stroke="#e7c35a" stroke-width="3" stroke-dasharray="6 6" opacity=".9"/>`, "Desk lamp"],
  "product-003": ["#bfc3c6", "#a7acb0", `<rect x="70" y="150" width="260" height="60" fill="#55595e"/>
    ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 11 }, (_, c) => `<rect x="${80 + c * 22.5}" y="${156 + r * 13}" width="17" height="9" fill="${r === 3 && c > 2 && c < 8 ? "#55595e" : "#d9dcd6"}" stroke-width="1.5"/>`).join("")).join("")}
    <rect x="148" y="195" width="104" height="9" fill="#d9dcd6" stroke-width="1.5"/>`, "Mechanical keyboard"],
  "product-004": ["#d8cdb9", "#c1b298", `<path d="M140 210l40-130h50l-25 130z" fill="#b8874f"/><path d="M175 95h60" stroke-width="3"/>
    <rect x="182" y="70" width="70" height="95" fill="${paper}" transform="rotate(14 217 117)"/><path d="M196 96l42 10M193 110l42 10M190 124l30 7" stroke-width="2" transform="rotate(0)"/>
    <path d="M150 210h110" stroke-width="5"/>`, "Document stand"],
  "product-005": ["#cfc7b5", "#b9b09b", `<path d="M130 105h140l-10 108H140z" fill="#d9ccaa"/><path d="M165 105c0-55 70-55 70 0" fill="none" stroke-width="6"/>
    <rect x="175" y="140" width="50" height="40" fill="none" stroke-dasharray="5 4" stroke-width="2"/>`, "Canvas tote"],
  "product-006": ["#c5c9bf", "#aeb3a7", `<circle cx="200" cy="120" r="78" fill="${paper}" stroke-width="7"/>
    ${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${200 + 62 * Math.cos(a)} ${120 + 62 * Math.sin(a)}L${200 + 70 * Math.cos(a)} ${120 + 70 * Math.sin(a)}" stroke-width="3"/>`; }).join("")}
    <path d="M200 120V72M200 120l30 18" stroke-width="5"/><circle cx="200" cy="120" r="5" fill="${ink}"/>`, "Wall clock"],
  "product-007": ["#d4c6b3", "#bdae98", `<path d="M150 110h90v80a20 20 0 0 1-20 20h-50a20 20 0 0 1-20-20z" fill="#cfd2c9"/>
    <path d="M240 128h14a22 22 0 0 1 0 44h-14" fill="none" stroke-width="7"/><ellipse cx="195" cy="110" rx="45" ry="8" fill="#6b4a33"/>
    <path d="M180 90c-6-10 6-16 0-26M206 92c-6-10 6-16 0-26" stroke-width="2" opacity=".55" fill="none"/>`, "Coffee mug"],
  "product-008": ["#c3c6c8", "#abb0b3", `<rect x="125" y="110" width="150" height="96" rx="10" fill="#4e555c"/><rect x="140" y="124" width="120" height="68" rx="4" fill="#3f454b"/>
    <path d="M275 140h20v36h-20" fill="#4e555c"/><rect x="160" y="140" width="80" height="36" fill="#9aa3ab" stroke-width="2"/>`, "SSD case"],
  "product-009": ["#d6d0c0", "#c0b8a4", `<rect x="110" y="140" width="160" height="70" fill="#8c6b4c"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${122 + i * 20}" y="${100 + (i % 3) * 6}" width="16" height="60" fill="${i === 3 ? "#e8d9a8" : paper}" stroke-width="2"/>`).join("")}
    <rect x="110" y="150" width="160" height="60" fill="#8c6b4c"/><rect x="175" y="168" width="30" height="12" fill="${paper}" stroke-width="2"/>`, "Index cards"],
  "product-010": ["#c8cbc2", "#b0b4a8", `<rect x="90" y="150" width="220" height="18" fill="#5c6166"/><path d="M110 168v42M290 168v42" stroke-width="8"/>
    <rect x="125" y="62" width="150" height="88" fill="#30353a"/><rect x="135" y="72" width="130" height="66" fill="#7d9aa8" stroke-width="2"/>`, "Monitor riser"],
  "product-011": ["#cfcabc", "#b8b2a1", `<path d="M70 200l50-60h220l-50 60z" fill="#6f7a6a"/><path d="M85 196l44-52" stroke-dasharray="4 6" stroke-width="2" opacity=".6"/>
    <rect x="180" y="150" width="40" height="30" fill="${paper}" stroke-width="2" transform="skewX(-30)"/>`, "Felt desk mat"],
  "product-012": ["#d3cfc4", "#bcb6a8", `<rect x="95" y="120" width="210" height="80" fill="#3f4542"/><rect x="105" y="128" width="190" height="64" fill="#a19378"/>
    ${Array.from({ length: 5 }, (_, i) => `<path d="M118 ${138 + i * 12}h150l12 0" stroke="${["#2b2f2a", "#5a3d2b", "#2d4a63", "#6a2f2a", "#3f5a33"][i]}" stroke-width="6"/><path d="M268 ${138 + i * 12}l14 0" stroke="#d9d4c5" stroke-width="3"/>`).join("")}`, "Technical pen set"],
};

mkdirSync("public/products", { recursive: true });
for (const [key, [bg, floor, obj, label]] of Object.entries(items)) {
  writeFileSync(`public/products/${key}.svg`, scene(bg, floor, obj, label));
}
console.log(`Wrote ${Object.keys(items).length} SVGs to public/products/`);
