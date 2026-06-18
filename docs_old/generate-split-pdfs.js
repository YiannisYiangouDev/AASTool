#!/usr/bin/env node
/**
 * AAST Split PDF Generator
 * Generates separate Backend and Frontend developer PDFs
 * Usage: node generate-split-pdfs.js
 */

const { marked } = require("marked");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const altEdgePath = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe";

const configs = [
  {
    name: "backend",
    input: path.join(__dirname, "developer-onboarding-backend.md"),
    htmlOut: path.join(__dirname, "developer-onboarding-backend.html"),
    pdfOut: path.join(__dirname, "developer-onboarding-backend.pdf"),
    title: "AAST Backend Developer Guide — Enterprise Edition v1.0",
  },
  {
    name: "frontend",
    input: path.join(__dirname, "developer-onboarding-frontend.md"),
    htmlOut: path.join(__dirname, "developer-onboarding-frontend.html"),
    pdfOut: path.join(__dirname, "developer-onboarding-frontend.pdf"),
    title: "AAST Frontend Developer Guide — Enterprise Edition v1.0",
  },
];

function buildHtml(md, title, label) {
  let body = marked.parse(md, { gfm: true, breaks: false });

  // Post-process: add id attributes to headings for anchor links
  body = body.replace(/<h([1-4])>([^<]*)<\/h\1>/gi, (match, level, text) => {
    const plain = text.replace(/<[^>]+>/g, "");
    const slug = plain
      .toLowerCase()
      .replace(/&amp;/g, "and")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return `<h${level} id="${slug}">${text}</h${level}>`;
  });

  // Fix href with double hyphens
  const idSet = new Set();
  body.replace(/id="([^"]+)"/gi, (m, id) => { idSet.add(id); return m; });
  body = body.replace(/href="#([^"]+)"/gi, (match, slug) => {
    if (idSet.has(slug)) return match;
    const fixed = slug.replace(/--/g, "-and-");
    if (idSet.has(fixed)) return `href="#${fixed}"`;
    return match;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;600;700&family=Consolas:wght@400;700&display=swap');

  :root {
    --primary: #003D7A;
    --primary-dark: #002850;
    --primary-light: #005AAD;
    --accent: #0078D4;
    --text: #1A1A1A;
    --text-secondary: #444444;
    --bg: #FFFFFF;
    --bg-alt: #F5F8FC;
    --border: #D0D7DE;
    --table-header: #003D7A;
    --table-stripe: #F0F4FA;
    --code-bg: #F6F8FA;
    --code-text: #1A1A1A;
    --code-border: #D0D7DE;
    --success: #107C10;
    --warning: #FF8C00;
    --danger: #D13438;
    --info: #0078D4;
    --mermaid-bg: #FAFBFC;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.65;
    font-size: 11pt;
    max-width: 210mm;
    margin: 0 auto;
  }

  /* ===== COVER PAGE ===== */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 277mm;
    padding: 40px;
    background: linear-gradient(160deg, #003D7A 0%, #002850 40%, #001A35 100%);
    color: #FFFFFF;
    page-break-after: always;
  }
  .cover-page h1 {
    font-size: 32pt;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
    color: #FFFFFF;
    line-height: 1.2;
  }
  .cover-page h1 + h1 {
    font-size: 24pt;
    font-weight: 300;
    color: rgba(255,255,255,0.9);
    margin-bottom: 40px;
  }
  .cover-page hr {
    width: 120px;
    border: 0;
    border-top: 3px solid #0078D4;
    margin: 30px auto;
  }
  .cover-page h2 {
    font-size: 18pt;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }
  .cover-page h3 {
    font-size: 13pt;
    font-weight: 400;
    color: rgba(255,255,255,0.75);
    margin-bottom: 50px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .cover-page p {
    font-size: 10pt;
    color: rgba(255,255,255,0.65);
    margin-bottom: 12px;
  }
  .cover-page strong {
    color: rgba(255,255,255,0.85);
  }
  .cover-page p:last-child {
    margin-top: 60px;
    font-style: italic;
    color: rgba(255,255,255,0.5);
    font-size: 9pt;
  }

  /* ===== MAIN CONTENT ===== */
  h1 {
    font-size: 22pt;
    font-weight: 700;
    color: var(--primary);
    margin: 40px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--primary);
    page-break-before: always;
    page-break-after: avoid;
  }
  h1:first-of-type { page-break-before: avoid; }

  h2 {
    font-size: 16pt;
    font-weight: 600;
    color: var(--primary-dark);
    margin: 28px 0 12px 0;
    page-break-after: avoid;
  }

  h3 {
    font-size: 13pt;
    font-weight: 600;
    color: var(--text);
    margin: 22px 0 10px 0;
    page-break-after: avoid;
  }

  h4 {
    font-size: 11pt;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 18px 0 8px 0;
    page-break-after: avoid;
  }

  p, li { margin-bottom: 8px; text-align: justify; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* ===== TABLES ===== */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  thead th {
    background: var(--table-header);
    color: #FFFFFF;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 9.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tbody td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: var(--table-stripe); }
  tbody tr:hover { background: #E8F0FE; }

  /* ===== CODE BLOCKS ===== */
  pre {
    background: var(--code-bg);
    border: 1px solid var(--code-border);
    border-radius: 4px;
    padding: 14px 16px;
    margin: 12px 0;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9pt;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    page-break-inside: avoid;
    color: var(--code-text);
  }
  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9pt;
    background: var(--code-bg);
    padding: 2px 5px;
    border-radius: 3px;
    border: 1px solid var(--code-border);
  }
  pre code {
    background: none;
    border: none;
    padding: 0;
    font-size: 9pt;
  }

  /* ===== BLOCKQUOTES ===== */
  blockquote {
    border-left: 4px solid var(--primary);
    margin: 16px 0;
    padding: 12px 20px;
    background: var(--bg-alt);
    border-radius: 0 4px 4px 0;
    color: var(--text-secondary);
    page-break-inside: avoid;
  }
  blockquote p:last-child { margin-bottom: 0; }

  hr {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 24px 0;
  }

  ul, ol { margin: 8px 0 12px 24px; }
  li { margin-bottom: 4px; }

  strong { color: var(--primary-dark); }
  em { color: var(--text-secondary); }

  .page-break { page-break-after: always; }

  .document-end {
    text-align: center;
    padding: 40px 0;
    margin-top: 40px;
    border-top: 2px solid var(--primary);
    color: var(--text-secondary);
    font-size: 9pt;
  }

  @media print {
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
      @bottom-center {
        content: "AAST — ${label} Developer Guide — Enterprise Edition v1.0";
        font-family: 'Segoe UI', sans-serif;
        font-size: 7pt;
        color: #888888;
      }
    }
    body { max-width: none; padding: 0 10px; }
    h1 { page-break-before: always; }
    h1:first-of-type { page-break-before: avoid; }
    h1, h2, h3, h4 { page-break-after: avoid; }
    pre, table, blockquote { page-break-inside: avoid; }
    .cover-page { page-break-after: always; }
    .page-break { page-break-after: always; }
  }

  @media screen {
    body { padding: 30px 40px; }
  }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function generatePdf(config) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Generating: ${config.name.toUpperCase()} PDF`);
  console.log(`${"=".repeat(60)}`);

  console.log("Reading markdown...");
  const md = fs.readFileSync(config.input, "utf-8");

  console.log("Converting markdown to HTML...");
  const html = buildHtml(md, config.title, config.name === "backend" ? "Backend" : "Frontend");

  console.log("Writing HTML file...");
  fs.writeFileSync(config.htmlOut, html, "utf-8");
  console.log(`HTML written: ${config.htmlOut}`);

  console.log("Generating PDF with Edge headless...");
  const htmlPath = path.resolve(config.htmlOut);
  const pdfPath = path.resolve(config.pdfOut);
  const cmd = `"${edgePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" --print-to-pdf-no-header --no-margins --virtual-time-budget=10000 "file:///${htmlPath.replace(/\\/g, '/')}"`;

  try {
    execSync(cmd, { stdio: "inherit", timeout: 30000 });
    console.log(`\n✅ ${config.name} PDF generated: ${config.pdfOut}`);
    console.log(`   File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`);
    return true;
  } catch (err) {
    console.error(`Primary Edge path failed: ${err.message}`);

    if (fs.existsSync(altEdgePath)) {
      console.log("Trying alternate Edge path...");
      try {
        const cmd2 = `"${altEdgePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" --print-to-pdf-no-header --no-margins --virtual-time-budget=10000 "file:///${htmlPath.replace(/\\/g, '/')}"`;
        execSync(cmd2, { stdio: "inherit", timeout: 30000 });
        console.log(`\n✅ ${config.name} PDF generated: ${config.pdfOut}`);
        console.log(`   File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`);
        return true;
      } catch (err2) {
        console.error(`Alternate Edge also failed: ${err2.message}`);
        console.log(`HTML file available at: ${config.htmlOut}`);
      }
    } else {
      console.log(`HTML file available at: ${config.htmlOut}`);
    }
    return false;
  }
}

// Main
console.log("=".repeat(60));
console.log("AAST — Split PDF Generator");
console.log("=".repeat(60));

let allOk = true;
for (const config of configs) {
  if (!fs.existsSync(config.input)) {
    console.error(`\n❌ Input file not found: ${config.input}`);
    allOk = false;
    continue;
  }
  const ok = generatePdf(config);
  if (!ok) allOk = false;
}

console.log(`\n${"=".repeat(60)}`);
if (allOk) {
  console.log("✅ All PDFs generated successfully!");
} else {
  console.log("⚠️  Some PDFs failed. See errors above.");
}
console.log(`${"=".repeat(60)}`);
