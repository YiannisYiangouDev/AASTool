#!/usr/bin/env node
// =============================================================================
// AASTool — HTML to PDF Converter (Puppeteer)
// =============================================================================
// Converts a single HTML file to a branded A4 PDF using headless Chromium.
//
// Usage:
//   node docs/html-to-pdf.js <input.html> <output.pdf> [title]
// =============================================================================

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node html-to-pdf.js <input.html> <output.pdf> [title]");
  process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = path.resolve(args[1]);
const docTitle = args[2] || "AASTool Documentation";

if (!fs.existsSync(inputPath)) {
  console.error(`ERROR: Input file not found: ${inputPath}`);
  process.exit(1);
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const html = fs.readFileSync(inputPath, "utf8");

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Set document title
    await page.evaluate((title) => {
      document.title = title;
    }, docTitle);

    await page.pdf({
      path: outputPath,
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px;font-family:'DejaVu Sans',sans-serif;color:#666;width:100%;text-align:center;padding:2mm 18mm 0 18mm;">
          <span style="float:left;">AASTool v1.0.0</span>
          <span style="float:right;">${docTitle}</span>
        </div>`,
      footerTemplate: `
        <div style="font-size:8px;font-family:'DejaVu Sans',sans-serif;color:#666;width:100%;text-align:center;padding:0 18mm 2mm 18mm;">
          <span style="float:left;">AASTool by Serg | Dev by Y</span>
          <span style="float:right;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
    });

    console.log(`OK: Generated ${outputPath}`);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
