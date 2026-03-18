export type PriceTier = "budget" | "premium";

export interface Competitor {
  id: string;
  nameBudget: string;
  namePremium: string;
  costBudget: number;
  costPremium: number;
  category: string;
}

export const COMPETITORS: Competitor[] = [
  { id: "crm",         nameBudget: "Pipedrive",       namePremium: "HubSpot",              costBudget: 49,  costPremium: 99,  category: "CRM & Pipeline" },
  { id: "funnel",      nameBudget: "Leadpages",       namePremium: "ClickFunnels",         costBudget: 49,  costPremium: 297, category: "Sales Funnels" },
  { id: "sito",        nameBudget: "Wix",             namePremium: "WordPress Pro",        costBudget: 16,  costPremium: 29,  category: "Website Builder" },
  { id: "form",        nameBudget: "Jotform",         namePremium: "Typeform",             costBudget: 34,  costPremium: 49,  category: "Surveys & Forms" },
  { id: "email",       nameBudget: "Mailchimp",       namePremium: "ActiveCampaign",       costBudget: 45,  costPremium: 99,  category: "Email Marketing" },
  { id: "sms",         nameBudget: "EZ Texting",      namePremium: "Salesmsg",             costBudget: 49,  costPremium: 99,  category: "2-Way SMS" },
  { id: "calendario",  nameBudget: "Calendly",        namePremium: "Acuity Scheduling",    costBudget: 10,  costPremium: 29,  category: "Booking & Appointments" },
  { id: "automazione", nameBudget: "Keap",            namePremium: "HubSpot Workflows",    costBudget: 79,  costPremium: 169, category: "Workflow Automations" },
  { id: "community",   nameBudget: "Circle",          namePremium: "Skool",                costBudget: 49,  costPremium: 89,  category: "Communities" },
  { id: "corsi",       nameBudget: "Teachable",       namePremium: "Kajabi",               costBudget: 59,  costPremium: 99,  category: "Courses / Products" },
  { id: "reviews",     nameBudget: "Grade.us",        namePremium: "Birdeye",              costBudget: 89,  costPremium: 159, category: "Reputation Management" },
  { id: "call-tracking", nameBudget: "CallRail",      namePremium: "CallTrackingMetrics",  costBudget: 30,  costPremium: 49,  category: "Call Tracking" },
  { id: "social",      nameBudget: "Buffer",          namePremium: "Hootsuite",            costBudget: 15,  costPremium: 99,  category: "Social Scheduling" },
  { id: "chat",        nameBudget: "Crisp",           namePremium: "Intercom",             costBudget: 45,  costPremium: 95,  category: "Live Chat / Inbox" },
  { id: "whatsapp",    nameBudget: "WATI",            namePremium: "Respond.io",           costBudget: 63,  costPremium: 146, category: "WhatsApp Business" },
  { id: "chatbot",     nameBudget: "Tidio + Lyro AI", namePremium: "Intercom Fin",         costBudget: 63,  costPremium: 130, category: "Chatbot AI" },
  { id: "voice-ai",    nameBudget: "Bland.ai",        namePremium: "Air.ai",               costBudget: 30,  costPremium: 200, category: "Voice AI" },
  { id: "docs",        nameBudget: "signNow",         namePremium: "Adobe Sign",           costBudget: 25,  costPremium: 47,  category: "Document Signing" },
  { id: "analytics",   nameBudget: "AgencyAnalytics",  namePremium: "AgencyAnalytics Pro", costBudget: 149, costPremium: 299, category: "Tracking & Analytics" },
];

const competitorMap = new Map(COMPETITORS.map(c => [c.id, c]));

/** Map competitor software names → logo paths in /competitors/ */
export const COMPETITOR_LOGOS: Record<string, string> = {
  // budget names
  "Pipedrive": "",
  "Leadpages": "/competitors/leadpages.svg",
  "Wix": "/competitors/wix.svg",
  "Jotform": "/competitors/jotform.svg",
  "Mailchimp": "/competitors/mailchimp.svg",
  "EZ Texting": "/competitors/eztexting.svg",
  "Calendly": "/competitors/calendly.svg",
  "Keap": "/competitors/keap.svg",
  "Circle": "",
  "Teachable": "/competitors/teachable.svg",
  "Grade.us": "",
  "CallRail": "",
  "Buffer": "",
  "Crisp": "/competitors/crisp.svg",
  "WATI": "/competitors/wati.svg",
  "Tidio + Lyro AI": "",
  "Bland.ai": "",
  "signNow": "/competitors/signnow.svg",
  "AgencyAnalytics": "/competitors/agencyanalytics.svg",
  // premium names
  "HubSpot": "/competitors/hubspot.svg",
  "ClickFunnels": "/competitors/clickfunnels.svg",
  "WordPress Pro": "/competitors/wordpress.svg",
  "Typeform": "/competitors/typeform.svg",
  "ActiveCampaign": "/competitors/activecampaign.svg",
  "Salesmsg": "/competitors/salesmsg.svg",
  "Acuity Scheduling": "/competitors/acuityscheduling.svg",
  "HubSpot Workflows": "/competitors/hubspot.svg",
  "Skool": "/competitors/skool.svg",
  "Kajabi": "/competitors/kajabi.svg",
  "Birdeye": "",
  "CallTrackingMetrics": "",
  "Hootsuite": "/competitors/hootsuite.svg",
  "Squarespace": "/competitors/squarespace.svg",
  "Zapier": "/competitors/zapier.svg",
  "Intercom": "/competitors/intercom.svg",
  "Intercom Fin": "/competitors/intercom.svg",
  "Respond.io": "/competitors/respondio.svg",
  "Air.ai": "/competitors/airai.svg",
  "Adobe Sign": "/competitors/adobesign.svg",
  "AgencyAnalytics Pro": "/competitors/agencyanalytics.svg",
};

export function getCompetitorCost(competitorId: string | null, tier: PriceTier): number {
  if (!competitorId) return 0;
  const c = competitorMap.get(competitorId);
  if (!c) return 0;
  return tier === "budget" ? c.costBudget : c.costPremium;
}

export function getCompetitorName(competitorId: string | null, tier: PriceTier): string {
  if (!competitorId) return "";
  const c = competitorMap.get(competitorId);
  if (!c) return "";
  return tier === "budget" ? c.nameBudget : c.namePremium;
}

export function getCompetitorCategory(competitorId: string | null): string {
  if (!competitorId) return "";
  const c = competitorMap.get(competitorId);
  return c?.category ?? "";
}

/** Extra competitors per category (beyond the budget/premium pair) */
const CATEGORY_EXTRAS: Record<string, { name: string; logo: string }[]> = {
  "sito":        [{ name: "Squarespace", logo: "/competitors/squarespace.svg" }],
  "automazione": [{ name: "Zapier", logo: "/competitors/zapier.svg" }],
};

/** Returns ALL competitor names + logos for a category (budget + premium + extras) */
export function getCompetitorAllNames(competitorId: string): { name: string; logo: string }[] {
  const c = competitorMap.get(competitorId);
  if (!c) return [];
  const entries: { name: string; logo: string }[] = [];
  const budgetLogo = COMPETITOR_LOGOS[c.nameBudget] || "";
  const premiumLogo = COMPETITOR_LOGOS[c.namePremium] || "";
  if (budgetLogo) entries.push({ name: c.nameBudget, logo: budgetLogo });
  if (premiumLogo && c.namePremium !== c.nameBudget) entries.push({ name: c.namePremium, logo: premiumLogo });
  // Add extras for this category
  const extras = CATEGORY_EXTRAS[competitorId] || [];
  for (const extra of extras) {
    if (!entries.some(e => e.name === extra.name)) entries.push(extra);
  }
  return entries;
}

export interface SourceTemplate {
  id: string;
  label: string;
  icon: string;
  competitorId: string | null;
}

export type StepCategory = "automation" | "communication" | "ai" | "crm" | "web";

export interface StepCategoryMeta {
  id: StepCategory;
  label: string;
  color: string; // tailwind color name (e.g. "sky", "emerald")
}

export const STEP_CATEGORIES: StepCategoryMeta[] = [
  { id: "communication", label: "Comunicazione", color: "sky" },
  { id: "crm",           label: "CRM",           color: "emerald" },
  { id: "automation",    label: "Automazioni",   color: "orange" },
  { id: "ai",            label: "AI",            color: "violet" },
  { id: "web",           label: "Web",           color: "pink" },
];

export interface StepTemplate {
  id: string;
  label: string;
  icon: string;
  competitorId: string | null;
  category: StepCategory;
}

export const SOURCE_TEMPLATES: SourceTemplate[] = [
  { id: "sito-web", label: "Sito Web", icon: "Globe", competitorId: "sito" },
  { id: "landing", label: "Landing / Funnel", icon: "FileText", competitorId: "funnel" },
  { id: "social", label: "Social Media", icon: "Share2", competitorId: "social" },
  { id: "form", label: "Form Online", icon: "ClipboardList", competitorId: "form" },
  { id: "manuale", label: "Inserimento Manuale", icon: "UserPlus", competitorId: null },
  { id: "porta-a-porta", label: "Porta a Porta", icon: "Footprints", competitorId: null },
  { id: "volantini", label: "Volantini / Offline", icon: "Newspaper", competitorId: null },
  { id: "referral", label: "Passaparola", icon: "Users", competitorId: null },
];

export const STEP_TEMPLATES: StepTemplate[] = [
  { id: "whatsapp-auto", label: "WhatsApp Automatico", icon: "MessageCircle", competitorId: "whatsapp", category: "communication" },
  { id: "email-auto", label: "Email Automatica", icon: "Mail", competitorId: "email", category: "communication" },
  { id: "sms-auto", label: "SMS Automatico", icon: "MessageSquare", competitorId: "sms", category: "communication" },
  { id: "calendario", label: "Invio Calendario", icon: "Calendar", competitorId: "calendario", category: "crm" },
  { id: "pipeline", label: "Sposta in Pipeline", icon: "GitBranch", competitorId: "crm", category: "crm" },
  { id: "tag-contatto", label: "Aggiungi Tag", icon: "Tag", competitorId: null, category: "crm" },
  { id: "reminder-wa", label: "Reminder WhatsApp", icon: "Bell", competitorId: "whatsapp", category: "automation" },
  { id: "reminder-email", label: "Reminder Email", icon: "BellRing", competitorId: "email", category: "automation" },
  { id: "automazione", label: "Automazione Custom", icon: "Zap", competitorId: "automazione", category: "automation" },
  { id: "chatbot-ai", label: "Chatbot AI", icon: "Bot", competitorId: "chatbot", category: "ai" },
  { id: "voice-ai", label: "Voice AI", icon: "Mic", competitorId: "voice-ai", category: "ai" },
  { id: "call-tracking", label: "Call Tracking", icon: "Mic", competitorId: "call-tracking", category: "ai" },
  { id: "funnel-step", label: "Step Funnel", icon: "Filter", competitorId: "funnel", category: "web" },
  { id: "notifica-team", label: "Notifica al Team", icon: "BellRing", competitorId: null, category: "automation" },
  { id: "live-chat", label: "Live Chat / Inbox", icon: "MessageCircle", competitorId: "chat", category: "communication" },
  { id: "recensioni", label: "Gestione Recensioni", icon: "Star", competitorId: "reviews", category: "web" },
  { id: "community", label: "Community", icon: "Users", competitorId: "community", category: "web" },
  { id: "corsi", label: "Corsi / Prodotti", icon: "Users", competitorId: "corsi", category: "web" },
];

export const SQUADD_PRICE = 197;

// ── Piani Squadd ────────────────────────────────────

export type SquaddPlanId = "pro" | "max" | "agency";

export interface SquaddPlan {
  id: SquaddPlanId;
  name: string;
  basePrice: number;
  features: string[];
  accounts: string;
  onboarding: string;
  whatsappIncluded: boolean;
  fastTrack: boolean;
}

export const SQUADD_PLANS: Record<SquaddPlanId, SquaddPlan> = {
  pro: {
    id: "pro", name: "PRO", basePrice: 97, accounts: "1", onboarding: "1h onboarding gratuita",
    whatsappIncluded: false, fastTrack: false,
    features: ["CRM completo", "1 account", "1h onboarding", "Automazioni pronte all'uso", "Chatbot AI (a consumo)", "Assistenza WhatsApp"],
  },
  max: {
    id: "max", name: "MAX", basePrice: 197, accounts: "5", onboarding: "1h onboarding gratuita",
    whatsappIncluded: true, fastTrack: true,
    features: ["CRM completo", "5 account", "Assistenza videocall 20min/giorno", "1h onboarding", "Automazioni pronte all'uso", "Chatbot AI (a consumo)", "Assistenza WhatsApp", "Fast Track con 5h formazione"],
  },
  agency: {
    id: "agency", name: "AGENCY", basePrice: 247, accounts: "illimitati", onboarding: "1h onboarding gratuita",
    whatsappIncluded: true, fastTrack: true,
    features: ["CRM completo", "Account illimitati", "1h onboarding", "Automazioni pronte all'uso", "Chatbot AI (a consumo)", "Assistenza WhatsApp", "Fast Track con 5h formazione"],
  },
};

export interface VariableCost {
  id: string;
  label: string;
  description: string;
  triggerTemplateIds: string[];
}

export const VARIABLE_COSTS: VariableCost[] = [
  { id: "email", label: "Email", description: "10\u20AC/10.000 inviate", triggerTemplateIds: ["email-auto", "reminder-email"] },
  { id: "whatsapp-qr", label: "WhatsApp QR Code", description: "30\u20AC/mese \u2014 messaggi illimitati", triggerTemplateIds: ["whatsapp-auto", "reminder-wa"] },
  { id: "whatsapp-api", label: "WhatsApp API (alternativa)", description: "9\u20AC/mese + 0,0572\u20AC/conversazione marketing", triggerTemplateIds: ["whatsapp-auto", "reminder-wa"] },
  { id: "chatbot", label: "Chatbot AI", description: "da 0,0005\u20AC a 0,02\u20AC/messaggio", triggerTemplateIds: ["chatbot-ai"] },
  { id: "voice-ai", label: "IA Telefonica", description: "0,05\u20AC\u20130,15\u20AC/min + VoIP 25\u20AC/mese + 0,045\u20AC/min", triggerTemplateIds: ["voice-ai"] },
  { id: "sms", label: "SMS", description: "Via crediti", triggerTemplateIds: ["sms-auto"] },
];

const WHATSAPP_TEMPLATE_IDS = ["whatsapp-auto", "reminder-wa"];

export function flowHasWhatsApp(nodes: { templateId?: string }[]): boolean {
  return nodes.some(n => n.templateId && WHATSAPP_TEMPLATE_IDS.includes(n.templateId));
}

export function getEffectivePlanPrice(planId: SquaddPlanId, hasWhatsApp: boolean): number {
  const plan = SQUADD_PLANS[planId];
  if (planId === "pro" && hasWhatsApp) return plan.basePrice + 30;
  return plan.basePrice;
}

export function getActiveVariableCosts(nodes: { templateId?: string }[]): VariableCost[] {
  const templateIds = new Set(nodes.map(n => n.templateId).filter(Boolean));
  return VARIABLE_COSTS.filter(vc => vc.triggerTemplateIds.some(id => templateIds.has(id)));
}
