#!/usr/bin/env bash
# =============================================================================
# AASTool — Documentation PDF Generator (4 Individual PDFs)
# =============================================================================
# 2-step pipeline for each .md file:
#   1. pandoc  md → html   (with embedded CSS styling)
#   2. node    html → pdf   (headless Chromium via Puppeteer)
#
# Output: 4 PDFs in project root
# =============================================================================
set -euo pipefail

PROJECT_NAME="AASTool"
DOCS_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$DOCS_DIR")"
TEMP_DIR="${DOCS_DIR}/.pdf-build"
VERSION="1.0.0"
DATE=$(date "+%B %d, %Y")
OUTPUT_DIR="${PROJECT_ROOT}"
HTML_TO_PDF="${DOCS_DIR}/html-to-pdf.js"

declare -a DOCUMENTS=(
    "docs/api.md|AASTool-API-Reference.pdf|AASTool API Reference"
    "docs/backend.md|AASTool-Backend-Architecture.pdf|AASTool Backend Architecture"
    "docs/frontend.md|AASTool-Frontend-Architecture.pdf|AASTool Frontend Architecture"
    "docs/pdf-generation.md|AASTool-PDF-Generation-Subsystem.pdf|AASTool PDF Generation"
)

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }
title() { echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"; }

show_help() {
    cat << EOF
AASTool Documentation PDF Generator — v${VERSION}
Pipeline: Markdown → HTML (pandoc) → PDF (Puppeteer/Chromium)

Usage: $0 [OPTIONS]
  --open        Open output dir after generation
  --clean       Clean temp dir before generating
  --api-only    Generate only API PDF
  --be-only     Generate only Backend PDF
  --fe-only     Generate only Frontend PDF
  --pdf-only    Generate only PDF Generation PDF
  --help        Show this help
EOF
    exit 0
}

OPEN_DIR=false; CLEAN_FIRST=false; ONLY_MODE=""
for arg in "$@"; do
    case $arg in
        --open)      OPEN_DIR=true ;;
        --clean)     CLEAN_FIRST=true ;;
        --api-only)  ONLY_MODE="api" ;;
        --be-only)   ONLY_MODE="be" ;;
        --fe-only)   ONLY_MODE="fe" ;;
        --pdf-only)  ONLY_MODE="pdf" ;;
        --help)      show_help ;;
        *)           err "Unknown: $arg"; show_help ;;
    esac
done

check_prerequisites() {
    info "Checking prerequisites..."
    command -v pandoc &>/dev/null || { err "pandoc missing"; exit 1; }
    ok "pandoc $(pandoc --version | head -1 | grep -oP '[0-9.]+')"
    command -v node &>/dev/null || { err "node missing"; exit 1; }
    ok "node $(node --version)"
    node -e "require('puppeteer')" &>/dev/null || { err "puppeteer missing — npm install puppeteer"; exit 1; }
    ok "puppeteer ready"
    [ -f "$HTML_TO_PDF" ] || { err "Missing $HTML_TO_PDF"; exit 1; }
    ok "html-to-pdf.js found"
}

prepare_build() {
    [ "$CLEAN_FIRST" = true ] || [ -d "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    ok "Build dir: $TEMP_DIR"
}

strip_frontmatter() {
    awk 'BEGIN{skip=0;first=1}/^---$/{if(first){skip=!skip;first=0;next}}!skip{print}' "$1"
}

generate_one_pdf() {
    local md_file="$1" pdf_name="$2" doc_title="$3"
    local full_md="${PROJECT_ROOT}/${md_file}"
    local base_name="$(basename "$md_file" .md)"
    local tmp_html="${TEMP_DIR}/${base_name}.html"
    local output_pdf="${OUTPUT_DIR}/${pdf_name}"

    [ -f "$full_md" ] || { warn "Not found: $full_md"; return 1; }

    echo ""
    echo "──────────────────────────────────────────────────────────"
    info "Generating: $pdf_name"
    info "  Title: $doc_title"

    local tmp_body="${TEMP_DIR}/${base_name}-body.md"
    strip_frontmatter "$full_md" > "$tmp_body"

    # Build HTML wrapper with embedded CSS
    cat > "$tmp_html" << HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${doc_title}</title>
<style>
  *,*::before,*::after{box-sizing:border-box}
  body{font-family:'Inter','DejaVu Sans','Segoe UI',system-ui,sans-serif;font-size:10.5pt;line-height:1.7;color:#1a1a2e;max-width:190mm;margin:0 auto;padding:10mm 0 20mm 0}
  .title-page{text-align:center;padding:40mm 10mm 0 10mm;page-break-after:always}
  .title-page .project{font-size:11pt;font-weight:600;color:#1a56db;letter-spacing:3px;text-transform:uppercase;margin-bottom:8mm}
  .title-page h1{font-size:28pt;font-weight:700;color:#1a1a2e;margin:0 0 6mm 0;line-height:1.2}
  .title-page .meta{font-size:9pt;color:#718096;margin-top:20mm;line-height:2}
  .title-page .meta strong{color:#1a56db}
  .title-page .divider{width:60mm;height:3px;background:#1a56db;margin:10mm auto;border-radius:2px}
  nav#TOC{page-break-after:always}
  nav#TOC h2{font-size:16pt;color:#1a56db;border-bottom:2px solid #1a56db;padding-bottom:3mm;margin-bottom:6mm}
  nav#TOC ul{list-style:none;padding-left:0}
  nav#TOC li{margin:1.5mm 0}
  nav#TOC a{color:#1a56db;text-decoration:none;font-weight:500}
  h1{font-size:18pt;color:#1a1a2e;margin:12mm 0 5mm 0;page-break-before:always}
  h1:first-of-type{page-break-before:avoid}
  h2{font-size:14pt;color:#1a56db;margin:8mm 0 4mm 0;border-bottom:1px solid #e2e8f0;padding-bottom:2mm}
  h3{font-size:12pt;color:#2d3748;margin:6mm 0 3mm 0}
  h4{font-size:11pt;color:#4a5568;margin:4mm 0 2mm 0}
  p{margin:2mm 0}
  a{color:#1a56db;text-decoration:none}
  strong{color:#1a1a2e;font-weight:600}
  code{font-family:'Cascadia Code','Fira Code','DejaVu Sans Mono',monospace;font-size:9pt;background:#f7fafc;padding:1px 5px;border-radius:3px;color:#c7254e}
  pre{background:#1a1a2e;color:#e2e8f0;padding:4mm 5mm;border-radius:4px;font-size:8.5pt;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-word}
  pre code{background:none;color:inherit;padding:0;border-radius:0}
  table{width:100%;border-collapse:collapse;margin:4mm 0;font-size:9.5pt}
  th{background:#1a56db;color:#fff;padding:2mm 3mm;text-align:left;font-weight:600}
  td{padding:2mm 3mm;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f7fafc}
  blockquote{border-left:4px solid #1a56db;margin:4mm 0;padding:2mm 5mm;background:#ebf4ff;border-radius:0 4px 4px 0;color:#2c5282}
  ul,ol{margin:2mm 0;padding-left:8mm}
  li{margin:1mm 0}
  hr{border:none;border-top:1px solid #e2e8f0;margin:6mm 0}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:A4;margin:20mm 18mm}
  }
</style>
</head>
<body>
<div class="title-page">
  <div class="project">AASTool Enterprise Documentation</div>
  <div class="divider"></div>
  <h1>${doc_title}</h1>
  <div class="meta">
    <strong>Version:</strong> ${VERSION}<br>
    <strong>Date:</strong> ${DATE}<br>
    <strong>Author:</strong> AASTool by Serg | Dev by Y
  </div>
</div>
HTMLEOF

    # Step 1: Markdown → HTML (pandoc)
    info "  [1/2] Markdown → HTML (pandoc)..."
    pandoc "$tmp_body" --from markdown+smart --to html5 --table-of-contents --toc-depth 3 --standalone >> "$tmp_html" || { err "pandoc failed"; return 1; }
    echo "</body></html>" >> "$tmp_html"
    ok "  HTML: $(wc -c < "$tmp_html") bytes"

    # Step 2: HTML → PDF (Puppeteer)
    info "  [2/2] HTML → PDF (Puppeteer)..."
    if node "$HTML_TO_PDF" "$tmp_html" "$output_pdf" "$doc_title" 2>&1; then
        local sz=$(du -h "$output_pdf" 2>/dev/null | cut -f1 || echo "?")
        ok "  Generated: $pdf_name ($sz)"
        return 0
    else
        err "HTML → PDF failed"
        return 1
    fi
}

open_output_dir() {
    info "Opening output dir..."
    case "$(uname -s)" in
        Darwin) open "$OUTPUT_DIR" ;;
        Linux)  xdg-open "$OUTPUT_DIR" 2>/dev/null || ok "PDFs in: $OUTPUT_DIR" ;;
        CYGWIN*|MINGW*|MSYS*)
            explorer.exe "$(wslpath -w "$OUTPUT_DIR" 2>/dev/null || echo "$OUTPUT_DIR")" 2>/dev/null || ok "PDFs in: $OUTPUT_DIR" ;;
        *) ok "PDFs in: $OUTPUT_DIR" ;;
    esac
}

selected_docs() {
    case "$ONLY_MODE" in
        api) echo "0" ;; be) echo "1" ;; fe) echo "2" ;; pdf) echo "3" ;;
        *)   echo "0 1 2 3" ;;
    esac
}

main() {
    echo ""; title
    echo "          AASTool Documentation PDF Generator"
    echo "          Pipeline: Markdown → HTML → PDF"
    echo "          Version ${VERSION}  |  $(date +%Y)"
    title; echo ""

    check_prerequisites
    prepare_build

    local gen=0 fail=0
    for idx in $(selected_docs); do
        IFS='|' read -r md_path pdf_name doc_title <<< "${DOCUMENTS[$idx]}"
        generate_one_pdf "$md_path" "$pdf_name" "$doc_title" && ((gen++)) || ((fail++))
    done

    [ "$CLEAN_FIRST" = false ] && rm -rf "$TEMP_DIR"

    echo ""; title
    echo "          Generated: $gen  |  Failed: $fail  |  Output: $OUTPUT_DIR"
    title; echo ""

    [ "$OPEN_DIR" = true ] && open_output_dir
}

main "$@"
