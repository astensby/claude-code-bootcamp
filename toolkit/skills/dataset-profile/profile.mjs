// profile.mjs — profile every CSV in a folder. No dependencies.
//   node profile.mjs [folder]   (default: data)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const folder = process.argv[2] || "data";
if (!existsSync(folder) || !statSync(folder).isDirectory()) {
  console.error(`profile.mjs: no such folder: ${folder} (usage: node profile.mjs [folder]; default: data)`);
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const shape = (v) => v.replace(/[0-9]/g, "9").replace(/[A-Za-z]/g, "a").replace(/a+/g, "a").replace(/9+/g, "9").slice(0, 40);
const typeOf = (v) => v === "" ? "empty" : /^-?\d+$/.test(v) ? "int" : /^-?\d*\.\d+$/.test(v) ? "float" : !Number.isNaN(Date.parse(v)) && /\d{4}/.test(v) ? "date" : "text";

for (const name of readdirSync(folder).filter((f) => f.endsWith(".csv")).sort()) {
  const path = join(folder, name);
  const rows = parseCsv(readFileSync(path, "utf8"));
  const [header, ...data] = rows;
  console.log(`\n== ${path}  (${data.length} rows, ${header.length} columns, ${(statSync(path).size / 1024).toFixed(0)} KB)`);
  console.log("| column | type | empty | distinct | dominant shape | minority shapes (share, example) |");
  console.log("|---|---|---|---|---|---|");
  header.forEach((col, i) => {
    const vals = data.map((r) => r[i] ?? "");
    const types = {}, shapes = {}, example = {};
    for (const v of vals) {
      types[typeOf(v)] = (types[typeOf(v)] || 0) + 1;
      if (v === "") continue;
      const s = shape(v);
      shapes[s] = (shapes[s] || 0) + 1;
      example[s] ??= v;
    }
    const type = Object.entries(types).filter(([t]) => t !== "empty").sort((a, b) => b[1] - a[1])[0]?.[0] ?? "empty";
    const empty = types.empty || 0;
    const distinct = new Set(vals).size;
    const sorted = Object.entries(shapes).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0] ? `${sorted[0][0]} (${((sorted[0][1] / vals.length) * 100).toFixed(1)}%)` : "";
    const minority = sorted.slice(1, 4).map(([s, n]) => `${s} (${((n / vals.length) * 100).toFixed(1)}%, e.g. ${example[s]})`).join("; ");
    console.log(`| ${col} | ${type} | ${empty} | ${distinct} | ${dominant} | ${minority || "—"} |`);
  });
}
