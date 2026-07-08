import { jsPDF } from "jspdf";
import type { EvaluationResult, Criterion } from "@/types";

// ── Helper: get page count reliably across jsPDF versions ──────────────
function getPageCount(doc: jsPDF): number {
  if (typeof (doc as any).getNumberOfPages === 'function') {
    return (doc as any).getNumberOfPages();
  }
  return (doc.internal as any).getNumberOfPages();
}

// ── Brand colours ──────────────────────────────────────────────────────
const BRAND = {
  primary: "#0d9488",
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

// ── Labels / metadata ──────────────────────────────────────────────────
const DT_LABELS = ["Physical Disability", "Sensory Disability", "Cognitive & Neurodiverse", "Communication & Mental Health", "Multiple / Situational"];
const DT_SHORT = ["Physical", "Sensory", "Cognitive", "Comm. & Mental", "Multiple"];
const DT_COLORS = ["#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
const AD_LABELS = ["Spatial & Physical Accessibility", "Safety & Environmental Comfort", "Cognitive & Navigational Accessibility", "Digital Interaction & Smart Usability", "Social Inclusion & Human Experience"];
const AD_SHORT = ["Spatial & Physical", "Safety & Env.", "Cognitive & Nav.", "Digital & Smart", "Social Inclusion"];
const AD_COLORS = ["#14b8a6", "#0ea5e9", "#6366f1", "#f59e0b", "#ec4899"];

// ── NEB colour / label mapping ─────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────
function wrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return lines.length * lineHeight;
}

function roundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: string) {
  doc.setFillColor(fill);
  doc.roundedRect(x, y, w, h, Math.min(r, w / 2, h / 2), Math.min(r, w / 2, h / 2), "F");
}

function hr(doc: jsPDF, x: number, y: number, w: number, color: string = BRAND.slateLight) {
  doc.setDrawColor(color);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + w, y);
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ── Standard page frame ────────────────────────────────────────────────
function applyPageFrame(doc: jsPDF, pageNum: number, totalPages: number) {
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
  doc.setDrawColor(BRAND.primary);
  doc.setLineWidth(1);
  doc.line(15, 14, 195, 14);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor("#64748b");
  doc.text("AASTool - Accessibility Assessment Scheme | EN 17210 Aligned | Confidential", 105, 292, { align: "center" });

  // Bottom accent line
  doc.setDrawColor(BRAND.primaryLight);
  doc.setLineWidth(0.3);
  doc.line(15, 288, 195, 288);
}

function addContentPage(doc: jsPDF): number {
  const p = getPageCount(doc) + 1;
  doc.addPage();
  return p;
}

function sectionTitle(doc: jsPDF, title: string, subtitle: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(BRAND.darkBg);
  doc.text(title, 15, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.slateLight);
  doc.text(subtitle, 15, y);
  y += 6;
  hr(doc, 15, y, 180, BRAND.primary);
  y += 12;
  return y;
}

// ══════════════════════════════════════════════════════════════════════
//  1. COVER PAGE
// ══════════════════════════════════════════════════════════════════════
function buildCoverPage(doc: jsPDF, results: EvaluationResult, buildingType: string) {
  const pw = 210, ph = 297;

  // Full dark background
  doc.setFillColor(BRAND.darkBg);
  doc.rect(0, 0, pw, ph, "F");

  // Top decorative bars
  doc.setFillColor(BRAND.primary);
  doc.rect(0, 0, pw, 8, "F");
  doc.setFillColor(BRAND.accent);
  doc.rect(0, 0, pw * 0.35, 3.5, "F");

  // Brand
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND.primaryLight);
  doc.setFontSize(10);
  doc.text("AASTool  |  EN 17210", 105, 50, { align: "center" });

  // Main title
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND.white);
  doc.setFontSize(34);
  doc.text("ACCESSIBILITY", 105, 80, { align: "center" });
  doc.text("CERTIFICATION REPORT", 105, 98, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#94a3b8");
  doc.text("EN 17210  -  Accessibility Assessment Scheme", 105, 118, { align: "center" });

  // Divider
  doc.setDrawColor(BRAND.primary);
  doc.setLineWidth(0.75);
  doc.line(60, 130, 150, 130);

  // Building type
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(BRAND.white);
  doc.text(buildingType, 105, 152, { align: "center" });

  // NEB Badge
  const nc = nebColor(results.nebClass);
  const cy = 185;
  doc.setFillColor(nc);
  doc.roundedRect(75, cy - 12, 60, 40, 6, 6, "F");
  doc.setTextColor(BRAND.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("NEB CLASSIFICATION", 105, cy + 1, { align: "center" });
  doc.setFontSize(24);
  doc.text(results.nebClass || "-", 105, cy + 23, { align: "center" });

  // OBS
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor("#94a3b8");
  doc.text(`Overall Building Score:  ${results.obs}%`, 105, 242, { align: "center" });

  // Equivalence
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.slateLight);
  doc.text(`${nebLabel(results.nebClass)}  |  Score ${results.nebScore}/5`, 105, 256, { align: "center" });

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#475569");
  doc.text(`Report generated: ${todayFormatted()}`, 105, 280, { align: "center" });
}

// ══════════════════════════════════════════════════════════════════════
//  2. TABLE OF CONTENTS
// ══════════════════════════════════════════════════════════════════════
function buildTOC(doc: jsPDF, totalSections: number) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "Table of Contents", "Report structure and navigation", 30);

  const sections = [
    { t: "1", s: "Executive Summary", d: "Key metrics, score distribution, and KPI overview" },
    { t: "2", s: "Methodology", d: "Assessment framework, EN 17210 alignment, and scoring approach" },
    { t: "3", s: "Disability Type Analysis", d: "Detailed TIS scores and performance per user persona" },
    { t: "4", s: "Assessment Dimension Analysis", d: "CIS scores and performance per building pillar" },
    { t: "5", s: "Strengths & Weaknesses", d: "Top performing and underperforming criteria" },
    { t: "6", s: "Criteria Details", d: "Full 63-criterion scoring table" },
    { t: "7", s: "Recommendations", d: "Prioritised improvement actions" },
  ];

  for (const sec of sections) {
    // Number circle
    doc.setFillColor(BRAND.primary);
    doc.circle(22, y + 2, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(BRAND.white);
    doc.text(sec.t, 22, y + 4, { align: "center" });

    // Title + description
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(BRAND.darkBg);
    doc.text(sec.s, 32, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND.slateLight);
    doc.text(sec.d, 32, y + 9);
    y += 18;
  }
}

// ══════════════════════════════════════════════════════════════════════
//  3. EXECUTIVE SUMMARY
// ══════════════════════════════════════════════════════════════════════
function buildExecutiveSummary(doc: jsPDF, results: EvaluationResult, buildingType: string) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "1. Executive Summary", "Key metrics and overall performance", 30);

  // Introduction
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor("#475569");
  const intro = `This certification report presents the accessibility evaluation results for "${buildingType}" conducted using the AASTool framework aligned with EN 17210 standards. The assessment measures building accessibility across five disability types (DT) and five assessment dimensions (AD), covering ${results.criteria?.length || 63} individual criteria.`;
  y += wrappedText(doc, intro, 15, y, 180, 5);
  y += 12;

  // KPI Cards
  const kpis = [
    { label: "Overall Score", value: `${results.obs}%`, color: BRAND.primary },
    { label: "NEB Class", value: results.nebClass || "-", color: nebColor(results.nebClass) },
    { label: "Average Score", value: `${results.averageRawScore}`, color: BRAND.accent },
    { label: "Criteria Count", value: `${results.criteria?.length || 0}`, color: BRAND.slate },
  ];

  const cardW = 42, cardGap = 6, cardH = 36;
  const startX = 15;
  for (let i = 0; i < kpis.length; i++) {
    const cx = startX + i * (cardW + cardGap);
    // Card shadow
    doc.setFillColor("#e2e8f0");
    doc.roundedRect(cx + 0.5, y + 0.5, cardW, cardH, 4, 4, "F");
    // Card
    doc.setFillColor("#ffffff");
    doc.roundedRect(cx, y, cardW, cardH, 4, 4, "F");
    doc.setDrawColor(BRAND.primaryLight);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cardW, cardH, 4, 4, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(kpis[i].color);
    doc.text(kpis[i].value, cx + cardW / 2, y + 16, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(BRAND.slateLight);
    doc.text(kpis[i].label.toUpperCase(), cx + cardW / 2, y + 27, { align: "center" });
  }
  y += cardH + 16;

  // Score Distribution
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Score Distribution", 15, y);
  y += 8;

  const dist = results.scoreDistribution || {};
  const barColors = [BRAND.danger, BRAND.warning, BRAND.primaryLight, BRAND.accent, BRAND.success];
  const barMaxW = 140;
  const maxCount = Math.max(...Object.values(dist), 1);

  for (let level = 1; level <= 5; level++) {
    const count = dist[level] || 0;
    const barW = (count / maxCount) * barMaxW;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor("#475569");
    doc.text(`Level ${level}`, 15, y + 3);

    doc.setFillColor("#f1f5f9");
    doc.roundedRect(50, y - 1, barMaxW, 7, 3, 3, "F");
    if (barW > 0) {
      doc.setFillColor(barColors[level - 1]);
      doc.roundedRect(50, y - 1, Math.max(barW, 3), 7, 3, 3, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor("#475569");
    doc.text(`${count}`, 195, y + 3, { align: "right" });
    y += 11;
  }

  y += 4;

  // NEB OBS Gauge text
  doc.setFillColor("#f1f5f9");
  doc.roundedRect(15, y, 180, 25, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.darkBg);
  doc.text(`OBS: ${results.obs}%`, 25, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.slateLight);
  doc.text(`NEB Classification: ${results.nebClass} - ${nebLabel(results.nebClass)}`, 25, y + 19);
  // NEB color bar at right
  const nebCol = nebColor(results.nebClass);
  doc.setFillColor(nebCol);
  doc.roundedRect(165, y + 4, 22, 17, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.white);
  doc.text(results.nebClass || "-", 176, y + 15, { align: "center" });
}

// ══════════════════════════════════════════════════════════════════════
//  4. METHODOLOGY
// ══════════════════════════════════════════════════════════════════════
function buildMethodology(doc: jsPDF) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "2. Methodology", "Assessment framework and scoring approach", 30);

  const paragraphs = [
    { h: "Framework Alignment", b: "This assessment is conducted in accordance with EN 17210:2021 - Accessibility and usability of the built environment. The AASTool framework maps building accessibility criteria across a comprehensive 5x5 matrix of disability types and assessment dimensions." },
    { h: "Disability Types (DT)", b: "Five core disability categories define user persona groups: Physical Disability (mobility, dexterity), Sensory Disability (vision, hearing), Cognitive & Neurodiverse (memory, attention), Communication & Mental Health (speech, anxiety), and Multiple / Situational (combined conditions). Each criterion is assigned to one DT." },
    { h: "Assessment Dimensions (AD)", b: "Five building performance pillars: Spatial & Physical Accessibility (ramps, doors), Safety & Environmental Comfort (lighting, acoustics), Cognitive & Navigational Accessibility (signage, wayfinding), Digital Interaction & Smart Usability (kiosks, apps), and Social Inclusion & Human Experience (dignity, privacy)." },
    { h: "Scoring Scale", b: "Each criterion is scored on a 1-5 progressive automation scale: Level 1 (No provision) through Level 5 (Advanced / Universal). The default score is 3 (Adequate). Users may override scores per assessment. The Impact Score (IS) is computed as IS = value x score, where value is the criterion's base weight (0-1)." },
    { h: "OBS Calculation", b: "The Overall Building Score aggregates weighted Total Impact Scores by disability type, normalised to a 0-100 scale using MAX_OBS. The NEB (Normalised Efficiency Band) classification maps OBS to letter grades: A+ (>=85, Excellent), A (>=60, Good), B (>=40, Acceptable), C (>=20, Below Average), No Rating (<20, Non-compliant)." },
  ];

  for (const p of paragraphs) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(BRAND.darkBg);
    doc.text(p.h, 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor("#475569");
    y += wrappedText(doc, p.b, 15, y, 180, 4.5);
    y += 8;
  }
}

// ══════════════════════════════════════════════════════════════════════
//  5. DISABILITY TYPE ANALYSIS (TIS)
// ══════════════════════════════════════════════════════════════════════
function buildDTAnalysis(doc: jsPDF, results: EvaluationResult) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "3. Disability Type Analysis", "Total Impact Scores and average scores per user persona", 30);

  const dtAvg = results.avgRawScoreByDT || {};
  const tis = results.tisByDT || {};
  const barMaxW = 55;

  // Table header
  const cols = [
    { x: 15, w: 6, label: "" },
    { x: 23, w: 50, label: "Disability Type" },
    { x: 78, w: 15, label: "Avg", align: "center" as const },
    { x: 95, w: 15, label: "TIS", align: "center" as const },
    { x: 115, w: 75, label: "Performance Bar" },
  ];

  doc.setFillColor(BRAND.darkBg);
  doc.roundedRect(13, y - 4, 188, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BRAND.white);
  for (const col of cols) doc.text(col.label, col.x, y + 2);
  y += 14;

  let rowIndex = 0;
  for (const [dtId, avg] of Object.entries(dtAvg)) {
    const idx = Number(dtId) - 1;
    const label = DT_LABELS[idx] || `DT${dtId}`;
    const tisVal = tis[Number(dtId)] || 0;
    const barW = (Number(avg) / 5) * barMaxW;

    if (rowIndex % 2 === 0) {
      doc.setFillColor("#f8fafc");
      doc.roundedRect(13, y - 3, 188, 12, 1, 1, "F");
    }

    // DT color dot
    doc.setFillColor(DT_COLORS[idx] || BRAND.slate);
    doc.circle(18, y + 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#1e293b");
    doc.text(label, 24, y + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(BRAND.darkBg);
    doc.text(`${avg}`, 86, y + 4, { align: "center" });
    doc.text(`${tisVal.toFixed?.(2) || tisVal}`, 103, y + 4, { align: "center" });

    doc.setFillColor("#f1f5f9");
    doc.roundedRect(115, y + 1, barMaxW, 7, 3, 3, "F");
    if (barW > 0) {
      doc.setFillColor(DT_COLORS[idx] || BRAND.slate);
      doc.roundedRect(115, y + 1, Math.max(barW, 3), 7, 3, 3, "F");
    }

    y += 14;
    rowIndex++;
  }

  y += 6;

  // Summary box
  doc.setFillColor("#f0fdf4");
  doc.roundedRect(15, y, 180, 20, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.success);
  doc.text("TIS - Total Impact Score", 22, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#475569");
  doc.text("Sum of (value x score) for all criteria within each disability type. Weighted by building type profile.", 22, y + 15);
}

// ══════════════════════════════════════════════════════════════════════
//  6. ASSESSMENT DIMENSION ANALYSIS (CIS)
// ══════════════════════════════════════════════════════════════════════
function buildADAnalysis(doc: jsPDF, results: EvaluationResult) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "4. Assessment Dimension Analysis", "Composite Impact Scores per building pillar", 30);

  const adAvg = results.avgRawScoreByAD || {};
  const cis = results.cisByAD || {};
  const barMaxW = 55;

  const cols = [
    { x: 15, w: 6, label: "" },
    { x: 23, w: 55, label: "Assessment Dimension" },
    { x: 80, w: 15, label: "Avg", align: "center" as const },
    { x: 97, w: 15, label: "CIS", align: "center" as const },
    { x: 115, w: 75, label: "Performance Bar" },
  ];

  doc.setFillColor(BRAND.darkBg);
  doc.roundedRect(13, y - 4, 188, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BRAND.white);
  for (const col of cols) doc.text(col.label, col.x, y + 2);
  y += 14;

  let rowIndex = 0;
  for (const [adId, avg] of Object.entries(adAvg)) {
    const idx = Number(adId) - 1;
    const label = AD_LABELS[idx] || `AD${adId}`;
    const cisVal = cis[Number(adId)] || 0;
    const barW = (Number(avg) / 5) * barMaxW;

    if (rowIndex % 2 === 0) {
      doc.setFillColor("#f8fafc");
      doc.roundedRect(13, y - 3, 188, 12, 1, 1, "F");
    }

    doc.setFillColor(AD_COLORS[idx] || BRAND.slate);
    doc.circle(18, y + 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#1e293b");
    doc.text(label, 24, y + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(BRAND.darkBg);
    doc.text(`${avg}`, 88, y + 4, { align: "center" });
    doc.text(`${cisVal.toFixed?.(2) || cisVal}`, 105, y + 4, { align: "center" });

    doc.setFillColor("#f1f5f9");
    doc.roundedRect(115, y + 1, barMaxW, 7, 3, 3, "F");
    if (barW > 0) {
      doc.setFillColor(AD_COLORS[idx] || BRAND.slate);
      doc.roundedRect(115, y + 1, Math.max(barW, 3), 7, 3, 3, "F");
    }

    y += 14;
    rowIndex++;
  }

  y += 6;

  doc.setFillColor("#eff6ff");
  doc.roundedRect(15, y, 180, 20, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor("#3b82f6");
  doc.text("CIS - Composite Impact Score", 22, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#475569");
  doc.text("Weighted sum of IS values by dimension, incorporating disability type weights from the building profile.", 22, y + 15);
}

// ══════════════════════════════════════════════════════════════════════
//  7. STRENGTHS & WEAKNESSES
// ══════════════════════════════════════════════════════════════════════
function buildStrengthsWeaknesses(doc: jsPDF, results: EvaluationResult) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "5. Strengths & Weaknesses", "Top performing and underperforming criteria", 30);

  // Strengths
  doc.setFillColor("#f0fdf4");
  doc.roundedRect(15, y - 2, 180, 20, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.success);
  doc.text("Strengths  (Score >= 5)", 22, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#475569");
  doc.text("Criteria that meet or exceed the top performance threshold.", 22, y + 15);
  y += 24;

  const strengths = results.strengths || [];
  if (strengths.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor("#94a3b8");
    doc.text("No criteria met the strength threshold.", 20, y);
    y += 10;
  } else {
    // Column headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND.slateLight);
    doc.text("Code", 15, y);
    doc.text("Criterion Name", 42, y);
    doc.text("DT", 120, y);
    doc.text("Score", 170, y, { align: "right" });
    doc.text("IS", 195, y, { align: "right" });
    y += 2;
    hr(doc, 15, y, 180, "#e2e8f0");
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (let i = 0; i < strengths.length; i++) {
      const s = strengths[i];
      if (i % 2 === 0) {
        doc.setFillColor("#fafafa");
        doc.roundedRect(13, y - 2, 188, 8, 1, 1, "F");
      }
      doc.setTextColor(BRAND.primary);
      doc.text(s.code, 15, y + 2);
      doc.setTextColor("#1e293b");
      doc.text(s.name.length > 55 ? s.name.substring(0, 53) + ".." : s.name, 42, y + 2);
      doc.setTextColor(BRAND.slateLight);
      doc.text(`DT${s.disability}`, 120, y + 2);
      doc.setTextColor(BRAND.success);
      doc.text(`${s.score}`, 170, y + 2, { align: "right" });
      doc.setTextColor(BRAND.primary);
      doc.text(s.is?.toFixed(4) || "-", 195, y + 2, { align: "right" });
      y += 9;
    }
  }

  y += 8;

  // Weaknesses
  doc.setFillColor("#fef2f2");
  doc.roundedRect(15, y - 2, 180, 20, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.danger);
  doc.text("Weaknesses  (Score <= 2)", 22, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#475569");
  doc.text("Criteria that fall at or below the minimum performance threshold.", 22, y + 15);
  y += 24;

  const weaknesses = results.weaknesses || [];
  if (weaknesses.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor("#94a3b8");
    doc.text("No criteria met the weakness threshold.", 20, y);
    y += 10;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND.slateLight);
    doc.text("Code", 15, y);
    doc.text("Criterion Name", 42, y);
    doc.text("DT", 120, y);
    doc.text("Score", 170, y, { align: "right" });
    doc.text("IS", 195, y, { align: "right" });
    y += 2;
    hr(doc, 15, y, 180, "#e2e8f0");
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (let i = 0; i < weaknesses.length; i++) {
      const w = weaknesses[i];
      if (i % 2 === 0) {
        doc.setFillColor("#fafafa");
        doc.roundedRect(13, y - 2, 188, 8, 1, 1, "F");
      }
      doc.setTextColor(BRAND.primary);
      doc.text(w.code, 15, y + 2);
      doc.setTextColor("#1e293b");
      doc.text(w.name.length > 55 ? w.name.substring(0, 53) + ".." : w.name, 42, y + 2);
      doc.setTextColor(BRAND.slateLight);
      doc.text(`DT${w.disability}`, 120, y + 2);
      doc.setTextColor(BRAND.danger);
      doc.text(`${w.score}`, 170, y + 2, { align: "right" });
      doc.setTextColor(BRAND.primary);
      doc.text(w.is?.toFixed(4) || "-", 195, y + 2, { align: "right" });
      y += 9;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
//  8. CRITERIA DETAILS TABLE
// ══════════════════════════════════════════════════════════════════════
function buildCriteriaTable(doc: jsPDF, criteria: Criterion[]) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "6. Criteria Details", "Full 63-criterion scoring table", 30);

  const cols = [
    { x: 14, w: 18, label: "Code" },
    { x: 34, w: 55, label: "Criterion" },
    { x: 93, w: 16, label: "DT" },
    { x: 111, w: 16, label: "AD" },
    { x: 129, w: 18, label: "Weight" },
    { x: 149, w: 14, label: "Score" },
    { x: 165, w: 14, label: "IS" },
    { x: 181, w: 18, label: "Level" },
  ];

  // Header
  doc.setFillColor(BRAND.darkBg);
  doc.roundedRect(12, y - 4, 188, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(BRAND.white);
  for (const col of cols) doc.text(col.label, col.x, y + 2);
  y += 12;

  // Data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  let row = 0;
  for (const raw of criteria) {
    const c = raw as Criterion & { is?: number };
    if (y > 268) {
      const nextP = getPageCount(doc) + 1;
      doc.addPage();
      applyPageFrame(doc, nextP, 0);
      y = 30;
      // Repeat header
      doc.setFillColor(BRAND.darkBg);
      doc.roundedRect(12, y - 4, 188, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(BRAND.white);
      for (const col of cols) doc.text(col.label, col.x, y + 2);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
    }

    if (row % 2 === 0) {
      doc.setFillColor("#f8fafc");
      doc.roundedRect(12, y - 3, 188, 7, 1, 1, "F");
    }

    doc.setTextColor("#1e293b");
    doc.text(c.code, cols[0].x, y + 2);
    doc.text(c.name.length > 42 ? c.name.substring(0, 40) + ".." : c.name, cols[1].x, y + 2);
    doc.setTextColor(DT_COLORS[(c.disability - 1) % DT_COLORS.length]);
    doc.text(`DT${c.disability}`, cols[2].x, y + 2);
    doc.setTextColor(AD_COLORS[(c.dimension - 1) % AD_COLORS.length]);
    doc.text(`AD${c.dimension}`, cols[3].x, y + 2);
    doc.setTextColor("#475569");
    doc.text(`${(c.value * 100).toFixed(0)}%`, cols[4].x, y + 2);

    const sc = c.score >= 4 ? BRAND.success : c.score <= 2 ? BRAND.danger : "#475569";
    doc.setTextColor(sc);
    doc.text(`${c.score}`, cols[5].x, y + 2);

    doc.setTextColor(BRAND.primary);
    doc.text(`${(c as any).is?.toFixed(4) || "-"}`, cols[6].x, y + 2);

    doc.setTextColor(BRAND.slateLight);
    doc.text((c.levels?.[c.score - 1] || "").substring(0, 18), cols[7].x, y + 2);

    y += 8;
    row++;
  }
}

// ══════════════════════════════════════════════════════════════════════
//  9. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════
function buildRecommendations(doc: jsPDF, results: EvaluationResult) {
  const p = addContentPage(doc);
  applyPageFrame(doc, p, 0);
  let y = sectionTitle(doc, "7. Recommendations", "Prioritised improvement actions", 30);

  // Derive recommendations from weaknesses
  const weaknesses = results.weaknesses || [];

  if (weaknesses.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#94a3b8");
    doc.text("No specific recommendations - all criteria meet acceptable thresholds.", 20, y);
    return;
  }

  // Group weaknesses by DT for actionable recommendations
  const byDT: Record<number, Criterion[]> = {};
  for (const w of weaknesses) {
    if (!byDT[w.disability]) byDT[w.disability] = [];
    byDT[w.disability].push(w);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.darkBg);
  doc.text("Priority Improvement Areas", 15, y);
  y += 8;

  for (const [dtId, items] of Object.entries(byDT)) {
    const idx = Number(dtId) - 1;
    const dtName = DT_LABELS[idx] || `DT${dtId}`;
    const dtColor = DT_COLORS[idx] || BRAND.slate;

    // DT header box
    doc.setFillColor(dtColor + "15");
    doc.roundedRect(15, y - 2, 180, 14, 3, 3, "F");
    doc.setFillColor(dtColor);
    doc.circle(22, y + 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(dtColor);
    doc.text(dtName, 30, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(BRAND.slateLight);
    doc.text(`${items.length} criteria below threshold`, 160, y + 6, { align: "right" });
    y += 20;

    for (const item of items) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(BRAND.primary);
      doc.text(item.code, 20, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor("#1e293b");
      doc.text(item.name, 42, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND.danger);
      doc.text(`Score: ${item.score}/5`, 175, y, { align: "right" });
      y += 5;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(BRAND.slateLight);
      doc.text(`Current: ${item.levels?.[item.score - 1] || "N/A"}`, 42, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(BRAND.success);
      doc.text(`Target: ${item.levels?.[item.levels.length - 1] || "N/A"}`, 105, y);
      y += 10;
    }
    y += 4;
  }

  // General recommendation box
  y += 6;
  doc.setFillColor("#f8fafc");
  doc.roundedRect(15, y, 180, 30, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.darkBg);
  doc.text("General Recommendations", 22, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#475569");
  const genRec = "Prioritise improvements based on impact (IS) and user population served. Focus on low-scoring criteria that serve high-weight disability types for maximum OBS improvement. Refer to EN 17210 for detailed implementation guidance.";
  wrappedText(doc, genRec, 22, y + 16, 168, 4);
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT FUNCTION
// ══════════════════════════════════════════════════════════════════════
export async function exportCertificationPDF(
  results: EvaluationResult,
  buildingType: string,
  elementId?: string,
): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");

  // 1. Cover (no page frame)
  buildCoverPage(doc, results, buildingType);

  // 2. Table of Contents
  buildTOC(doc, 7);

  // 3. Executive Summary
  buildExecutiveSummary(doc, results, buildingType);

  // 4. Methodology
  buildMethodology(doc);

  // 5. DT Analysis
  buildDTAnalysis(doc, results);

  // 6. AD Analysis
  buildADAnalysis(doc, results);

  // 7. Strengths & Weaknesses
  buildStrengthsWeaknesses(doc, results);

  // 8. Criteria Table
  buildCriteriaTable(doc, results.criteria || []);

  // 9. Recommendations
  buildRecommendations(doc, results);

  // ── Fix all page numbers in headers ──
  const finalPages = getPageCount(doc);
  for (let i = 1; i <= finalPages; i++) {
    doc.setPage(i);
    if (i === 1) continue; // skip cover page
    // Re-draw header with correct page count
    doc.setFillColor(BRAND.darkBg);
    doc.rect(0, 0, 210, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(BRAND.primaryLight);
    doc.text("AASTOOL - CERTIFICATION REPORT", 15, 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#94a3b8");
    doc.text(`Page ${i} of ${finalPages}`, 180, 9, { align: "right" });
    doc.setDrawColor(BRAND.primary);
    doc.setLineWidth(1);
    doc.line(15, 14, 195, 14);

    // Re-draw footer bottom line
    doc.setDrawColor(BRAND.primaryLight);
    doc.setLineWidth(0.3);
    doc.line(15, 288, 195, 288);
  }

  // Save
  const safeName = buildingType.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const fileName = `AASTool-Certification-${safeName}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export default exportCertificationPDF;
