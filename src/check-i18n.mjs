// Checks that a translation file has exactly the same structure as the
// English one (same keys, same array lengths, no empty or "undefined"
// strings) and that its language metadata matches config.
//   node src/check-i18n.mjs es
import { langMeta } from "./config.mjs";

const lang = process.argv[2];
if (!lang || !langMeta[lang]) {
  console.error(`Usage: node src/check-i18n.mjs <code>  (one of ${Object.keys(langMeta).join(", ")})`);
  process.exit(2);
}
const ref = (await import("./i18n/en.mjs")).default;
const t = (await import(`./i18n/${lang}.mjs?${Date.now()}`)).default;
const problems = [];

const walk = (a, b, path) => {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return problems.push(`${path}: should be an array`);
    if (a.length !== b.length) problems.push(`${path}: ${b.length} items, expected ${a.length}`);
    a.forEach((v, i) => b[i] !== undefined && walk(v, b[i], `${path}[${i}]`));
  } else if (a && typeof a === "object") {
    if (!b || typeof b !== "object" || Array.isArray(b)) return problems.push(`${path}: should be an object`);
    for (const k of Object.keys(a)) {
      if (!(k in b)) problems.push(`${path}.${k}: missing`);
      else walk(a[k], b[k], `${path}.${k}`);
    }
    for (const k of Object.keys(b)) if (!(k in a)) problems.push(`${path}.${k}: unexpected key`);
  } else if (typeof a === "string") {
    if (typeof b !== "string") problems.push(`${path}: should be a string`);
    else if (!b.trim() || /undefined|TODO|TRANSLATE/.test(b)) problems.push(`${path}: empty or placeholder`);
  } else if (typeof a === "number") {
    if (b !== a) problems.push(`${path}: should be ${a}`);
  }
};
walk(ref, t, lang);

if (t.lang !== lang) problems.push(`lang should be "${lang}"`);
if (t.locale !== langMeta[lang].locale) problems.push(`locale should be "${langMeta[lang].locale}"`);
if (t.langName !== langMeta[lang].name) problems.push(`langName should be "${langMeta[lang].name}"`);
for (const [page, m] of Object.entries(t.meta || {})) {
  if (m.title && m.title.length > 75) problems.push(`meta.${page}.title is ${m.title.length} chars (max 75)`);
  if (m.description && (m.description.length < 90 || m.description.length > 170)) problems.push(`meta.${page}.description is ${m.description.length} chars (aim 110–165)`);
}

if (problems.length) {
  console.log(problems.map((p) => "✗ " + p).join("\n"));
  console.log(`\n${problems.length} problem(s) in src/i18n/${lang}.mjs`);
  process.exit(1);
}
console.log(`✓ src/i18n/${lang}.mjs matches the English structure`);
