import jsPDF from "jspdf";
import { FlowData, FlowNode } from "@/data/flowTypes";
import {
  SQUADD_PLANS,
  SOURCE_TEMPLATES,
  STEP_TEMPLATES,
  getCompetitorCost,
  getCompetitorName,
  type PriceTier,
  type SquaddPlanId,
  type VariableCost,
} from "@/data/templates";

interface PdfOptions {
  flowData: FlowData;
  sector: string;
  totalExternal: number;
  savings: number;
  priceTier: PriceTier;
  selectedPlan: SquaddPlanId;
  effectivePrice: number;
  activeVariableCosts: VariableCost[];
}

function collectUniqueCompetitors(
  nodes: FlowNode[],
  tier: PriceTier
): { name: string; cost: number }[] {
  const seen = new Set<string>();
  const result: { name: string; cost: number }[] = [];
  for (const n of nodes) {
    if (n.templateId) {
      const compId = getCompetitorIdFromTemplate(n.templateId);
      const name = getCompetitorName(compId, tier);
      const cost = getCompetitorCost(compId, tier);
      if (name && !seen.has(name)) {
        seen.add(name);
        result.push({ name, cost });
      }
    }
  }
  return result;
}

function getCompetitorIdFromTemplate(templateId: string): string | null {
  const src = SOURCE_TEMPLATES.find((t) => t.id === templateId);
  if (src) return src.competitorId;
  const step = STEP_TEMPLATES.find((t) => t.id === templateId);
  if (step) return step.competitorId;
  return null;
}

export function generateReport(options: PdfOptions) {
  const {
    flowData,
    sector,
    totalExternal,
    savings,
    priceTier,
    selectedPlan,
    effectivePrice,
    activeVariableCosts,
  } = options;

  const planName = SQUADD_PLANS[selectedPlan].name;

  const sources = flowData.nodes.filter(n => n.type === "source");
  const steps = flowData.nodes.filter(n => n.type !== "source" && n.type !== "converge");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [255, 90, 0];
  const darkColor: [number, number, number] = [30, 30, 30];
  const mutedColor: [number, number, number] = [120, 120, 120];

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageW, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(`SQUADD ${planName}`, margin, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Il tuo CRM all-in-one", margin, 24);

  const dateStr = new Date().toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(dateStr, pageW - margin, 16, { align: "right" });
  if (sector) {
    doc.text(`Settore: ${sector}`, pageW - margin, 23, { align: "right" });
  }

  y = 42;

  // ── Il tuo flusso ───────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text("Il tuo flusso operativo", margin, y);
  y += 8;

  // Sources
  if (sources.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text("Fonti di acquisizione", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    for (const src of sources) {
      doc.text(`•  ${src.label}`, margin + 4, y);
      y += 5;
    }
    y += 4;
  }

  // Steps
  if (steps.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text("Automazioni e step", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    for (const step of steps) {
      const prefix = step.type === "condition" ? "⟁" : "→";
      const noteText = step.note ? ` — ${step.note}` : "";
      doc.text(`${prefix}  ${step.label}${noteText}`, margin + 4, y);
      y += 5;
      if (y > 260) {
        doc.addPage();
        y = margin;
      }
    }
    y += 4;
  }

  // ── Confronto costi ─────────────────────────────────
  if (y > 200) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text("Confronto costi", margin, y);
  y += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(
    `Comparazione con competitor ${priceTier === "premium" ? "premium" : "budget"}`,
    margin,
    y + 4
  );
  y += 10;

  // Competitor table
  const competitors = collectUniqueCompetitors(flowData.nodes, priceTier);
  if (competitors.length > 0) {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 1, contentW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text("SOFTWARE", margin + 3, y + 4);
    doc.text("COSTO/MESE", pageW - margin - 3, y + 4, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    for (const c of competitors) {
      doc.text(c.name, margin + 3, y);
      doc.text(`€${c.cost}`, pageW - margin - 3, y, { align: "right" });
      y += 6;
    }

    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Totale competitor", margin + 3, y);
    doc.setTextColor(...mutedColor);
    doc.text(`€${totalExternal}/mese`, pageW - margin - 3, y, {
      align: "right",
    });
    y += 7;

    doc.setTextColor(...primaryColor);
    doc.text(`Squadd ${planName}`, margin + 3, y);
    doc.text(`\u20AC${effectivePrice}/mese`, pageW - margin - 3, y, {
      align: "right",
    });
    y += 10;
  }

  // ── Savings / Value box ─────────────────────────────
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  if (savings > 0) {
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(margin, y, contentW, 30, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text("Risparmio", margin + 8, y + 10);

    doc.setFontSize(24);
    doc.text(`€${savings * 12}`, margin + 8, y + 24);

    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.text("/anno", margin + 8 + doc.getTextWidth(`€${savings * 12}`) + 2, y + 24);

    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    doc.text(`€${savings}/mese`, pageW - margin - 8, y + 10, {
      align: "right",
    });
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(
      `In 3 anni risparmi €${savings * 36}`,
      pageW - margin - 8,
      y + 18,
      { align: "right" }
    );

    y += 38;
  } else {
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text("Il valore di Squadd", margin + 8, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text(
      "Un unico strumento per gestire tutto: niente integrazioni,",
      margin + 8,
      y + 17
    );
    doc.text(
      "un solo costo prevedibile, supporto dedicato e aggiornamenti inclusi.",
      margin + 8,
      y + 22
    );

    y += 36;
  }

  // ── Costi variabili ────────────────────────────────
  if (activeVariableCosts.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    doc.text("Costi variabili", margin, y);
    y += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text("Costi aggiuntivi a consumo basati sui servizi attivi nel flusso", margin, y + 4);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const vc of activeVariableCosts) {
      doc.setTextColor(...darkColor);
      doc.text(`\u2022  ${vc.label}`, margin + 4, y);
      doc.setTextColor(...mutedColor);
      doc.text(vc.description, margin + 4 + doc.getTextWidth(`\u2022  ${vc.label}  `), y);
      y += 6;
      if (y > 260) {
        doc.addPage();
        y = margin;
      }
    }
    y += 4;
  }

  // ── Footer CTA ──────────────────────────────────────
  if (y > 260) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, contentW, 18, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("Pronto a semplificare la tua attività?", pageW / 2, y + 8, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Contattaci per attivare Squadd oggi stesso", pageW / 2, y + 14, {
    align: "center",
  });

  // ── Footer ──────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedColor);
  doc.text(
    "Report generato da Squadd Flow Builder — squadd.it",
    pageW / 2,
    pageH - 8,
    { align: "center" }
  );

  // Save
  const filename = sector
    ? `Squadd-Report-${sector.replace(/\s+/g, "-")}.pdf`
    : "Squadd-Report.pdf";
  doc.save(filename);
}
