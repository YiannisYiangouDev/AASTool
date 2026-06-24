import { jsPDF } from "jspdf";
import type { EvaluationResult, Criterion } from "@/types";

// ── Helper: access jsPDF internal page count reliably ───────────────────
function getPageCount(doc: jsPDF): number {
  return (doc.internal as any).getNumberOfPages();
}

// ── Brand colours ──────────────────────────────────────────────────────
const BRAND = {
  primary: "#0d9488",    // teal-600
  primaryLight: "#14b8a6",
  darkBg: "#0b1120",
  slate: "#334155",
  slateLight: "#64748b",
  slateDark: "#1e293b",
  accent: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  white: "#ffffff",
  offWhite: "#f8fafc",
};

// ── NEB colour mapping ─────────────────────────────────────────────────
function nebColor(nebClass: string): string {
  switch (nebClass?.trim()) {
    case "A+": return "#22c55e";
    case "A":  return "#14b8a6";
    case "B":  return "#f59e0b";
    case "C":  return "#f97316";
    default:   return "#ef4444";
  }
}

function nebLabel(nebClass: string): string {
  switch (nebClass?.trim()) {
    case "A+": return "EXCELLENT";
    case "A":  return "GOOD";
    case "B":  return "ACCEPTABLE";
    case "C":  return "BELOW AVERAGE";
    default:   return "NON-COMPLIANT";
  }
}

// ── Helper: wrapped text with word wrap ─────────────────────────────────
function wrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return lines.length * lineHeight;
}

// ── Draw a filled rounded rect ──────────────────────────────────────────
function roundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: string) {
  doc.setFillColor(fill);
  // jsPDF rounded rect via lines + arcs
  const hr = Math.min(r, w / 2, h / 2);
  doc.roundedRect(x, y, w, h, hr, hr, "F");
}

// ── Draw a horizontal rule ──────────────────────────────────────────────
function hr(doc: jsPDF, x: number, y: number, w: number, color: string = BRAND.slateLight) {
  doc.setDrawColor(color);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + w, y);
}

// ── Header / Footer on each page ───────────────────────────────────────
function addPageHeader(doc: jsPDF, pageNum: number, totalPages: number) {
  // Top bar
  doc.setFillColor(BRAND.darkBg);
  doc.rect(0, 0, 210, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BRAND.primaryLight);
  doc.text("AASTOOL - CERTIFICATION REPORT", 15, 9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#94a3b8");
  doc.text(`Page ${pageNum} of ${totalPages}`, 180, 9, { align: "right" });

  // Thin accent line
  doc.setDrawColor(BRAND.primary);
  doc.setLineWidth(1);
  doc.line(15, 14, 195, 14);
}

function addPageFooter(doc: jsPDF, pageNum: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor("#64748b");
  doc.text("AASTool - Accessibility Assessment Scheme | EN 17210 Aligned | Confidential", 105, 292, { align: "center" });
}

// ── Cover page ──────────────────────────────────────────────────────────
function buildCoverPage(doc: jsPDF, results: EvaluationResult, buildingType: string) {
  const pw = 210; // page width
  const ph = 297; // page height

  // Full dark background
  doc.setFillColor(BRAND.darkBg);
  doc.rect(0, 0, pw, ph, "F");

  // Top decorative gradient bar
  doc.setFillColor(BRAND.primary);
  doc.rect(0, 0, pw, 8, "F");
  doc.setFillColor(BRAND.accent);
  doc.rect(0, 0, pw * 0.4, 4, "F");

  // Brand
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND.primaryLight);
  doc.setFontSize(11);
  doc.text("AASTool", 105, 60, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND.white);
  doc.setFontSize(32);
  doc.text("ACCESSIBILITY", 105, 85, { align: "center" });
  doc.text("CERTIFICATION REPORT", 105, 100, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor("#94a3b8");
  doc.text("EN 17210 - Accessibility Assessment Scheme", 105, 118, { align: "center" });

  // Divider
  doc.setDrawColor(BRAND.primary);
  doc.setLineWidth(0.75);
  doc.line(70, 130, 140, 130);

  // Building type
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(BRAND.white);
  doc.text(buildingType, 105, 150, { align: "center" });

  // NEB Badge
  const nc = nebColor(results.nebClass);
  const cy = 180;
  doc.setFillColor(nc);
  doc.setDrawColor(nc);
  doc.roundedRect(75, cy - 10, 60, 38, 6, 6, "F");
  doc.setTextColor(BRAND.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("NEB CLASSIFICATION", 105, cy + 2, { align: "center" });
  doc.setFontSize(22);
  doc.text(results.nebClass || "-", 105, cy + 23, { align: "center" });

  // OBS
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor("#94a3b8");
  doc.text(`Overall Building Score: ${results.obs}%`, 105, 240, { align: "center" });

  // Equivalence
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.slateLight);
  doc.text(`Equivalent: ${nebLabel(results.nebClass)}  |  Rank: ${results.nebEquivalent}`, 105, 253, { align: "center" });

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#475569");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Report generated: ${today}`, 105, 278, { align: "center" });
}

// ── Executive Summary page ──────────────────────────────────────────────
function buildExecutiveSummary(doc: jsPDF, results: EvaluationResult, buildingType: string) {
  const pageNum = getPageCount(doc) + 1;
  doc.addPage();
  addPageHeader(doc, pageNum, 0);
  addPageFooter(doc, pageNum);

  let y = 30;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Executive Summary", 15, y);
  y += 12;

  hr(doc, 15, y, 180);
  y += 10;

  // Intro
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#475569");
  const intro = `This certification report presents the accessibility evaluation results for "${buildingType}" conducted using the AASTool framework aligned with EN 17210 standards. The assessment measures building accessibility across five disability types and five assessment dimensions.`;
  y += wrappedText(doc, intro, 15, y, 180, 5);
  y += 12;

  // KPI Cards — draw as boxes
  const kpis = [
    { label: "Overall Score", value: `${results.obs}%`, color: BRAND.primary },
    { label: "NEB Class", value: results.nebClass || "-", color: nebColor(results.nebClass) },
    { label: "Average Score", value: `${results.averageRawScore}`, color: BRAND.accent },
    { label: "Criteria", value: `${results.criteria?.length || 0}`, color: BRAND.slate },
  ];

  const cardW = 42;
  const cardGap = 6;
  const cardH = 38;
  const startX = 15;
  for (let i = 0; i < kpis.length; i++) {
    const cx = startX + i * (cardW + cardGap);
    roundedRect(doc, cx, y, cardW, cardH, 4, "#f1f5f9");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(kpis[i].color);
    doc.text(kpis[i].value, cx + cardW / 2, y + 17, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#64748b");
    doc.text(kpis[i].label.toUpperCase(), cx + cardW / 2, y + 27, { align: "center" });
  }
  y += cardH + 16;

  // Score Distribution chart (text-based bar chart)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Score Distribution", 15, y);
  y += 10;

  const dist = results.scoreDistribution || {};
  const barColors = [BRAND.danger, BRAND.warning, BRAND.primaryLight, BRAND.accent, BRAND.success];
  const barMaxW = 140;
  const maxCount = Math.max(...Object.values(dist), 1);

  for (let level = 1; level <= 5; level++) {
    const count = dist[level] || 0;
    const barW = (count / maxCount) * barMaxW;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text(`Level ${level}`, 15, y + 4);

    // Bar background
    doc.setFillColor("#f1f5f9");
    doc.roundedRect(50, y - 1, barMaxW, 8, 3, 3, "F");
    // Bar fill
    if (barW > 0) {
      doc.setFillColor(barColors[level - 1]);
      doc.roundedRect(50, y - 1, Math.max(barW, 4), 8, 3, 3, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text(`${count}`, 195, y + 4, { align: "right" });

    y += 13;
  }

  y += 6;

  // DT Average Scores
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Average Scores by Disability Type", 15, y);
  y += 10;

  const dtAvg = results.avgRawScoreByDT || {};
  const dtLabels = ["Physical", "Sensory", "Cognitive", "Comm. & Mental", "Multiple"];
  const dtColors = ["#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

  for (const [dtId, avg] of Object.entries(dtAvg)) {
    const idx = Number(dtId) - 1;
    const label = dtLabels[idx] || `DT${dtId}`;
    const barW = (Number(avg) / 5) * barMaxW;

    doc.setFillColor(dtColors[idx] || BRAND.slate);
    doc.circle(18, y, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text(label, 25, y + 3);

    doc.setFillColor("#f1f5f9");
    doc.roundedRect(70, y, barMaxW, 7, 3, 3, "F");
    if (barW > 0) {
      doc.setFillColor(dtColors[idx] || BRAND.slate);
      doc.roundedRect(70, y, Math.max(barW, 4), 7, 3, 3, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text(`${avg}`, 215, y + 3, { align: "right" });

    y += 12;
  }

  y += 6;

  // AD Average Scores
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Average Scores by Assessment Dimension", 15, y);
  y += 10;

  const adAvg = results.avgRawScoreByAD || {};
  const adLabels = ["Spatial & Physical", "Safety & Env.", "Cognitive & Nav.", "Digital & Smart", "Social Inclusion"];
  const adColors = ["#14b8a6", "#0ea5e9", "#6366f1", "#f59e0b", "#ec4899"];

  for (const [adId, avg] of Object.entries(adAvg)) {
    const idx = Number(adId) - 1;
    const label = adLabels[idx] || `AD${adId}`;
    const barW = (Number(avg) / 5) * barMaxW;

    doc.setFillColor(adColors[idx] || BRAND.slate);
    doc.circle(18, y, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text(label, 25, y + 3);

    doc.setFillColor("#f1f5f9");
    doc.roundedRect(70, y, barMaxW, 7, 3, 3, "F");
    if (barW > 0) {
      doc.setFillColor(adColors[idx] || BRAND.slate);
      doc.roundedRect(70, y, Math.max(barW, 4), 7, 3, 3, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text(`${avg}`, 215, y + 3, { align: "right" });

    y += 12;
  }
}

// ── Strengths & Weaknesses page ─────────────────────────────────────────
function buildStrengthsWeaknesses(doc: jsPDF, results: EvaluationResult) {
  const pageNum = getPageCount(doc) + 1;
  doc.addPage();
  addPageHeader(doc, pageNum, 0);
  addPageFooter(doc, pageNum);

  let y = 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Strengths & Weaknesses", 15, y);
  y += 12;
  hr(doc, 15, y, 180);
  y += 10;

  // Strengths
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.success);
  doc.text("Strengths  (Score >= 5)", 15, y);
  y += 10;

  const strengths = results.strengths || [];
  if (strengths.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#94a3b8");
    doc.text("No criteria met the strength threshold.", 20, y);
    y += 8;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text("Code", 20, y);
    doc.text("Criterion", 50, y);
    doc.text("Score", 175, y, { align: "right" });
    doc.text("IS", 195, y, { align: "right" });
    y += 2;
    hr(doc, 20, y, 175, "#e2e8f0");
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const s of strengths) {
      doc.setTextColor("#1e293b");
      doc.text(s.code, 20, y);
      doc.text(s.name.length > 60 ? s.name.substring(0, 58) + ".." : s.name, 50, y);
      doc.setTextColor(BRAND.success);
      doc.text(`${s.score}`, 175, y, { align: "right" });
      doc.setTextColor(BRAND.slateLight);
      doc.text(`${s.is.toFixed(4)}`, 195, y, { align: "right" });
      y += 6;
    }
  }

  y += 10;

  // Weaknesses
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.danger);
  doc.text("Weaknesses  (Score <= 2)", 15, y);
  y += 10;

  const weaknesses = results.weaknesses || [];
  if (weaknesses.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#94a3b8");
    doc.text("No criteria met the weakness threshold.", 20, y);
    y += 8;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text("Code", 20, y);
    doc.text("Criterion", 50, y);
    doc.text("Score", 175, y, { align: "right" });
    doc.text("IS", 195, y, { align: "right" });
    y += 2;
    hr(doc, 20, y, 175, "#e2e8f0");
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const w of weaknesses) {
      doc.setTextColor("#1e293b");
      doc.text(w.code, 20, y);
      doc.text(w.name.length > 60 ? w.name.substring(0, 58) + ".." : w.name, 50, y);
      doc.setTextColor(BRAND.danger);
      doc.text(`${w.score}`, 175, y, { align: "right" });
      doc.setTextColor(BRAND.slateLight);
      doc.text(`${w.is.toFixed(4)}`, 195, y, { align: "right" });
      y += 6;
    }
  }
}

// ── Full criteria table ─────────────────────────────────────────────
function buildCriteriaTable(doc: jsPDF, criteria: Criterion[]) {
  const pageNum = getPageCount(doc) + 1;
  doc.addPage();
  addPageHeader(doc, pageNum, 0);
  addPageFooter(doc, pageNum);

  let y = 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Criteria Details", 15, y);
  y += 12;
  hr(doc, 15, y, 180);
  y += 10;

  // Table header
  const cols = [
    { x: 15, w: 18, label: "Code" },
    { x: 35, w: 65, label: "Criterion" },
    { x: 105, w: 18, label: "DT" },
    { x: 125, w: 18, label: "AD" },
    { x: 145, w: 20, label: "Weight" },
    { x: 167, w: 16, label: "Score" },
    { x: 185, w: 16, label: "IS" },
  ];

  // Header row
  doc.setFillColor(BRAND.darkBg);
  doc.roundedRect(13, y - 4, 188, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BRAND.white);
  for (const col of cols) {
    doc.text(col.label, col.x, y + 2);
  }
  y += 12;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  let row = 0;
  for (const raw of criteria) {
    const c = raw as Criterion & { is?: number };
    // Check page break
    if (y > 265) {
      addPageFooter(doc, getPageCount(doc));
      const newPage = getPageCount(doc) + 1;
      doc.addPage();
      addPageHeader(doc, newPage, 0);
      addPageFooter(doc, newPage);
      y = 30;

      // Repeat header
      doc.setFillColor(BRAND.darkBg);
      doc.roundedRect(13, y - 4, 188, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(BRAND.white);
      for (const col of cols) {
        doc.text(col.label, col.x, y + 2);
      }
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }

    // Alternating row background
    if (row % 2 === 0) {
      doc.setFillColor("#f8fafc");
      doc.roundedRect(13, y - 3, 188, 8, 1, 1, "F");
    }

    doc.setTextColor("#1e293b");
    doc.text(c.code, cols[0].x, y + 2);

    const name = c.name.length > 50 ? c.name.substring(0, 48) + ".." : c.name;
    doc.text(name, cols[1].x, y + 2);

    doc.setTextColor(BRAND.primary);
    doc.text(`DT${c.disability}`, cols[2].x, y + 2);

    doc.setTextColor(BRAND.accent);
    doc.text(`AD${c.dimension}`, cols[3].x, y + 2);

    doc.setTextColor("#475569");
    doc.text(`${(c.value * 100).toFixed(0)}%`, cols[4].x, y + 2);

    // Score colour
    const sc = c.score >= 4 ? BRAND.success : c.score <= 2 ? BRAND.danger : "#475569";
    doc.setTextColor(sc);
    doc.text(`${c.score}`, cols[5].x, y + 2);

    doc.setTextColor(BRAND.primary);
    doc.text(`${c.is?.toFixed(4) || "-"}`, cols[6].x, y + 2);

    y += 9;
    row++;
  }
}

// ── Main export function ────────────────────────────────────────────────
export async function exportCertificationPDF(
  results: EvaluationResult,
  buildingType: string,
  elementId?: string,
): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  let totalPages = 5; // will update after building

  // 1. Cover page
  buildCoverPage(doc, results, buildingType);

  // 2. Executive Summary
  buildExecutiveSummary(doc, results, buildingType);

  // 3. Strengths & Weaknesses
  buildStrengthsWeaknesses(doc, results);

  // 4. Criteria table (may span multiple pages)
  buildCriteriaTable(doc, results.criteria || []);

  // Update page numbers in headers
  const finalPages = getPageCount(doc);
  for (let i = 1; i <= finalPages; i++) {
    doc.setPage(i);
    if (i === 1) continue; // skip cover page
    // Re-apply header with correct total
    const x1 = 15;
    const y1 = 9;
    doc.setFillColor(BRAND.darkBg);
    doc.rect(0, 0, 210, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(BRAND.primaryLight);
    doc.text("AASTOOL - CERTIFICATION REPORT", x1, y1);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#94a3b8");
    doc.text(`Page ${i} of ${finalPages}`, 180, y1, { align: "right" });
    doc.setDrawColor(BRAND.primary);
    doc.setLineWidth(1);
    doc.line(x1, 14, 195, 14);
  }

  // Save
  const fileName = `AASTool-Certification-${buildingType.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export default exportCertificationPDF;
