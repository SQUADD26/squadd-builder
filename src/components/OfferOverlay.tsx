import { useState } from "react";
import {
  ArrowLeft, X, Check, Shield, Rocket, Zap, Star, GraduationCap,
  Settings, Search, BarChart3, Filter, Award, Heart, Users, Target,
} from "lucide-react";
import { motion } from "motion/react";
import type { VariableCost } from "@/data/templates";
import { Switch } from "@/components/ui/switch";

type OfferView = "choice" | "integrale" | "abbonamento";
type BillingCycle = "mensile" | "annuale";
type PlanId = "pro" | "max" | "agency";

interface OfferOverlayProps {
  onClose: () => void;
  activeVariableCosts: VariableCost[];
  totalExternal: number;
}

export function OfferOverlay({ onClose, activeVariableCosts, totalExternal }: OfferOverlayProps) {
  const [view, setView] = useState<OfferView>("choice");
  const [billing, setBilling] = useState<BillingCycle>("mensile");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("max");
  const [includeFormazione, setIncludeFormazione] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-10 bg-background flex flex-col overflow-hidden"
    >
      {view === "choice" && (
        <ChoiceView onSelect={(v) => setView(v)} onClose={onClose} />
      )}
      {view === "integrale" && (
        <IntegraleView onBack={() => setView("choice")} onClose={onClose} />
      )}
      {view === "abbonamento" && (
        <AbbonamentoView
          billing={billing}
          setBilling={setBilling}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          includeFormazione={includeFormazione}
          setIncludeFormazione={setIncludeFormazione}
          activeVariableCosts={activeVariableCosts}
          totalExternal={totalExternal}
          onBack={() => setView("choice")}
          onClose={onClose}
        />
      )}
    </motion.div>
  );
}

// ── Header shared ──

function OverlayHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="border-b border-border bg-card px-5 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <img src="/squadd-logo.svg" alt="Squadd" className="h-8 shrink-0" />
      </div>
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </span>
      <button
        onClick={onClose}
        className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Choice View ──

function ChoiceView({
  onSelect,
  onClose,
}: {
  onSelect: (v: OfferView) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <OverlayHeader title="Scegli tipo di offerta" onClose={onClose} />
      <div className="flex-1 grid grid-cols-2 content-center gap-6 px-8 max-w-3xl mx-auto">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => onSelect("integrale")}
          className="group flex flex-col items-start p-8 rounded-2xl border border-border/40 bg-card hover:border-lime/40 transition-all duration-200 w-full text-left hover:shadow-lg hover:shadow-lime/5 self-stretch"
        >
          <div className="w-12 h-12 rounded-xl bg-lime/10 flex items-center justify-center mb-4">
            <Rocket className="w-6 h-6 text-lime" />
          </div>
          <h3 className="font-mono text-lg font-bold uppercase tracking-wider mb-2">
            Soluzione Integrale
          </h3>
          <p className="text-sm text-muted-foreground">
            Setup completo Done For You. Analisi, automazioni custom, contatto diretto col reparto tecnico.
          </p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => onSelect("abbonamento")}
          className="group flex flex-col items-start p-8 rounded-2xl border border-border/40 bg-card hover:border-lime/40 transition-all duration-200 w-full text-left hover:shadow-lg hover:shadow-lime/5 self-stretch"
        >
          <div className="w-12 h-12 rounded-xl bg-lime/10 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-lime" />
          </div>
          <h3 className="font-mono text-lg font-bold uppercase tracking-wider mb-2">
            Abbonamento CRM
          </h3>
          <p className="text-sm text-muted-foreground">
            Piattaforma completa con CRM, automazioni, chatbot AI e assistenza dedicata.
          </p>
        </motion.button>
      </div>
    </div>
  );
}

// ── Integrale View ──

const INTEGRALE_SECTIONS: {
  icon: typeof Settings;
  title: string;
  description: string;
  points: string[];
}[] = [
  {
    icon: Settings,
    title: "Personalizzazione del Software",
    description:
      "Personalizziamo il CRM affinch\u00E9 faccia quello per cui \u00E8 stato creato: gestire, automatizzare, tracciare.",
    points: [
      "Categorizzazione clienti e lead",
      "Software personalizzato per la gestione del carico di lavoro",
      "Pipeline di vendita specifiche ed automatizzate",
    ],
  },
  {
    icon: Search,
    title: "Studio del Mercato",
    description:
      "Analizziamo il vostro mercato in profondit\u00E0 per adattare l\u2019intero processo al vostro settore e massimizzare la conversion rate.",
    points: [
      "Raccolta info su competitor e loro offerte",
      "Analisi servizi, prodotti e struttura della proposta",
      "Proposta di offerte pi\u00F9 appetibili da testare sul mercato target",
    ],
  },
  {
    icon: BarChart3,
    title: "Implementazione Metriche",
    description:
      "Implementiamo le metriche fondamentali per sapere quanto costa acquisire, quanto rende un investimento, e cosa rende di pi\u00F9.",
    points: ["CPL, CAC, ROAS, ROI", "LTGV, KPI, Conversion Rate", "Churn Rate"],
  },
  {
    icon: Filter,
    title: "Funnel di Marketing",
    description:
      "Analisi dell\u2019attuale funnel e struttura di marketing. Non \u00E8 un servizio marketing: daremo strutture e consigli concreti per farlo in piena autonomia.",
    points: [
      "Revisione di funnels, sito e dati di conversione",
      "Consigli strutturali dal nostro reparto (15.000\u20AC/giorno in ads gestiti)",
    ],
  },
  {
    icon: Award,
    title: "Rafforzamento del Brand",
    description:
      "L\u2019obiettivo \u00E8 rafforzare il brand e creare un\u2019idea chiara nella testa del cliente, con mosse mirate e concrete.",
    points: [
      "Personalizzazione della comunicazione per ogni cliente",
      "Valore continuo ai clienti esistenti",
      "Incentivi a rimanere e a portare altri clienti",
    ],
  },
  {
    icon: Heart,
    title: "Customer Experience",
    description:
      "Tempestivit\u00E0 nella comunicazione, valore ai lead ancora prima che acquistino, un assistente dedicato dietro ogni interazione.",
    points: [
      "Cura del lead pre e post vendita",
      "Tempestivit\u00E0 e adeguatezza delle risposte",
      "Chatbot per fissare appuntamenti con un operatore",
    ],
  },
  {
    icon: Users,
    title: "Gestione dei Clienti",
    description:
      "Automazione delle comunicazioni ripetitive e centralizzazione dei canali per una gestione fluida e senza errori.",
    points: [
      "Ottimizzazione canali di comunicazione e mail automatiche",
      "Chat omnicanale (Instagram, Facebook, WhatsApp, email, live chat)",
      "Comunicazione di massa (newsletter, WhatsApp broadcast)",
    ],
  },
  {
    icon: Target,
    title: "Canali di Acquisizione",
    description:
      "Implementazione di sistemi per raggiungere nuovi potenziali clienti e riattivare quelli non convertiti.",
    points: [
      "Cold outreach via email e messaggi personalizzati",
      "Campagne di riattivazione lead",
      "Email marketing, collegamento Meta/Google, template sponsorizzate",
    ],
  },
];

function IntegraleView({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <OverlayHeader title="Soluzione Integrale" onBack={onBack} onClose={onClose} />
      <div className="flex-1 overflow-y-auto">
        {/* ── Hero ── */}
        <div className="relative py-16 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-lime/[0.04] to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <p className="font-mono text-2xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Proposta
            </p>
            <h1 className="text-5xl font-black tracking-tight mb-4" style={{ color: "#c2ff10" }}>
              Soluzione Integrale
            </h1>
            <p className="text-lg text-foreground/60 max-w-xl mx-auto leading-relaxed">
              Automatizza i processi di marketing e vendita e cresci con Squadd.
              <br />
              <span className="text-foreground/40">Ci prendiamo carico di tutto noi.</span>
            </p>
          </motion.div>
        </div>

        {/* ── Sections grid ── */}
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            {INTEGRALE_SECTIONS.map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                  className="rounded-xl border border-border/30 bg-card/60 p-5 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-lime/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-lime" />
                    </div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "#c2ff10" }}>
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-2xs text-foreground/50 leading-relaxed mb-3">
                    {section.description}
                  </p>
                  <div className="space-y-1 mt-auto">
                    {section.points.map((p) => (
                      <div key={p} className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-lime/60 shrink-0 mt-0.5" />
                        <span className="text-2xs text-foreground/60">{p}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Investment + Garanzia + Bonus ── */}
        <div className="max-w-3xl mx-auto px-6 pb-12 space-y-5">
          {/* Garanzia */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5"
          >
            <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                Garanzia soddisfatti o rimborsati
              </h3>
              <p className="text-sm text-foreground/60 mt-0.5">
                Anche sui primi 5.000&euro;. Zero rischi.
              </p>
            </div>
          </motion.div>

          {/* Bonus */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.55 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="rounded-xl border border-border/30 bg-card/60 p-5 flex flex-col items-center text-center gap-1">
              <span className="font-mono text-3xl font-bold" style={{ color: "#c2ff10" }}>12</span>
              <span className="font-mono text-2xs uppercase tracking-wider text-foreground/40">
                Mesi di CRM inclusi
              </span>
            </div>
            <div className="rounded-xl border border-border/30 bg-card/60 p-5 flex flex-col items-center text-center gap-1">
              <span className="font-mono text-3xl font-bold" style={{ color: "#c2ff10" }}>10h</span>
              <span className="font-mono text-2xs uppercase tracking-wider text-foreground/40">
                Formazione dedicata
              </span>
            </div>
          </motion.div>

          {/* Investment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="rounded-2xl border border-border/30 bg-card/60 p-6"
          >
            <div className="flex items-baseline justify-between mb-5">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/40">
                Investimento
              </span>
              <span className="font-mono text-4xl font-black" style={{ color: "#c2ff10" }}>
                10.000&euro;
              </span>
            </div>
            <div className="space-y-0 divide-y divide-border/15">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground/70">Alla firma del contratto</span>
                <span className="font-mono font-bold">5.000&euro;</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="text-sm text-foreground/70">Al raggiungimento del break-even</span>
                  <p className="text-2xs text-foreground/30 mt-0.5">
                    10.000&euro; di fatturato aggiuntivo entro 6 mesi
                  </p>
                </div>
                <span className="font-mono font-bold">5.000&euro;</span>
              </div>
            </div>
          </motion.div>

          {/* Closing */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="text-center text-sm text-foreground/30 pt-4 leading-relaxed max-w-lg mx-auto"
          >
            Un approccio totale per <span className="text-foreground/60 font-medium">ottimizzare i processi di vendita</span>,
            migliorare la <span className="text-foreground/60 font-medium">gestione dei clienti</span> e
            potenziare i <span className="text-foreground/60 font-medium">canali di acquisizione</span>,
            con l&apos;obiettivo di aumentare le conversioni e il fatturato.
          </motion.p>
        </div>
      </div>
    </div>
  );
}

// ── Abbonamento View ──

const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  accounts: string;
  highlight?: string;
  features: string[];
  extras: string[];
}[] = [
  {
    id: "pro",
    name: "PRO",
    price: 97,
    accounts: "1 account",
    features: [
      "CRM completo",
      "1 ora di onboarding gratuita",
      "Set di automazioni pronte all'uso",
      "Chatbot AI (a consumo)",
    ],
    extras: ["Assistenza WhatsApp inclusa", "Fast Track formazione: +250\u20AC"],
  },
  {
    id: "max",
    name: "MAX",
    price: 197,
    accounts: "5 account",
    highlight: "Consigliato",
    features: [
      "CRM completo",
      "Assistenza live in videocall (20 min/giorno)",
      "1 ora di onboarding gratuita",
      "Set di automazioni pronte all'uso",
      "Chatbot AI (a consumo)",
    ],
    extras: [
      "Assistenza WhatsApp inclusa",
      "Fast Track compreso con acquisto 5h di formazione",
    ],
  },
  {
    id: "agency",
    name: "AGENCY",
    price: 247,
    accounts: "Account illimitati",
    features: [
      "CRM completo",
      "1 ora di onboarding gratuita",
      "Set di automazioni pronte all'uso",
      "Chatbot AI (a consumo)",
    ],
    extras: [
      "Assistenza WhatsApp inclusa",
      "Fast Track compreso con acquisto 5h di formazione",
    ],
  },
];

function AbbonamentoView({
  billing,
  setBilling,
  selectedPlan,
  setSelectedPlan,
  includeFormazione,
  setIncludeFormazione,
  activeVariableCosts,
  totalExternal,
  onBack,
  onClose,
}: {
  billing: BillingCycle;
  setBilling: (b: BillingCycle) => void;
  selectedPlan: PlanId;
  setSelectedPlan: (p: PlanId) => void;
  includeFormazione: boolean;
  setIncludeFormazione: (v: boolean) => void;
  activeVariableCosts: VariableCost[];
  totalExternal: number;
  onBack: () => void;
  onClose: () => void;
}) {
  const currentPlan = PLANS.find((p) => p.id === selectedPlan)!;
  const displayPrice = billing === "annuale" ? currentPlan.price * 10 : currentPlan.price;
  const billingLabel = billing === "annuale" ? "/anno" : "/mese";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <OverlayHeader title="Abbonamento CRM" onBack={onBack} onClose={onClose} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
          >
            <div className="flex items-center bg-muted/40 rounded-lg p-1">
              {(["mensile", "annuale"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`px-4 py-1.5 rounded-md font-mono text-xs font-medium uppercase tracking-wider transition-all ${
                    billing === b
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b === "mensile" ? "Mensile" : "Annuale"}
                  {b === "annuale" && (
                    <span className="ml-1.5 text-3xs px-1.5 py-0.5 rounded-full bg-lime/10 text-lime font-bold">
                      -2 mesi
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Plan cards */}
          <div className="grid grid-cols-3 gap-4">
            {PLANS.map((plan, i) => {
              const isSelected = selectedPlan === plan.id;
              const price = billing === "annuale" ? plan.price * 10 : plan.price;
              return (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative flex flex-col p-5 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? "border-lime/50 bg-lime/5 shadow-lg shadow-lime/5"
                      : "border-border/40 bg-card hover:border-border/60"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-3xs font-mono font-bold uppercase tracking-wider bg-lime text-background">
                      {plan.highlight}
                    </span>
                  )}
                  <h3 className="font-mono text-lg font-bold uppercase tracking-widest mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-2xs text-muted-foreground mb-3">{plan.accounts}</p>
                  <div className="mb-4">
                    <span
                      className="font-mono text-3xl font-bold"
                      style={{ color: isSelected ? "#c2ff10" : undefined }}
                    >
                      {price}&euro;
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      {billing === "annuale" ? "/anno" : "/mese"}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-lime shrink-0 mt-0.5" />
                        <span className="text-2xs text-foreground/70">{f}</span>
                      </div>
                    ))}
                  </div>
                  {plan.extras.length > 0 && (
                    <div className="pt-3 border-t border-border/20 space-y-1.5 mt-auto">
                      <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        Extra
                      </span>
                      {plan.extras.map((e) => (
                        <div key={e} className="flex items-start gap-2">
                          <Star className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-2xs text-foreground/60">{e}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Formazione toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  Pacchetto Formativo
                </span>
                <p className="text-2xs text-muted-foreground">5 ore di formazione dedicata</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold">+250&euro;</span>
              <Switch checked={includeFormazione} onCheckedChange={setIncludeFormazione} />
            </div>
          </motion.div>

          {/* Variable costs */}
          {activeVariableCosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className="space-y-3"
            >
              <h3 className="font-mono text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                Costi variabili attivi (a consumo)
              </h3>
              <div className="rounded-lg border border-border/30 bg-card overflow-hidden">
                {activeVariableCosts.map((vc, i) => (
                  <div
                    key={vc.id}
                    className={`flex items-center justify-between px-4 py-2.5 font-mono text-2xs ${
                      i % 2 === 0 ? "" : "bg-foreground/[0.02]"
                    }`}
                  >
                    <span className="text-foreground/80 font-medium">{vc.label}</span>
                    <span className="text-muted-foreground">{vc.description}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Price summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="rounded-2xl border border-border/30 bg-card/60 p-6 space-y-4"
          >
            {/* Recurring cost */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/40">
                  Abbonamento
                </span>
                <p className="text-sm text-foreground/70 mt-0.5">
                  Squadd {currentPlan.name} ({billing})
                </p>
              </div>
              <span className="font-mono text-3xl font-bold" style={{ color: "#c2ff10" }}>
                {displayPrice}&euro;
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  {billingLabel}
                </span>
              </span>
            </div>
            {totalExternal > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-border/15">
                <span className="text-2xs text-muted-foreground">
                  Costo attuale con software separati
                </span>
                <span className="font-mono text-sm line-through text-muted-foreground/50">
                  {billing === "annuale" ? totalExternal * 12 : totalExternal}&euro;
                  {billingLabel}
                </span>
              </div>
            )}
            {/* One-time cost */}
            {includeFormazione && (
              <div className="flex items-center justify-between pt-3 border-t border-border/15">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/40">
                    Una tantum
                  </span>
                  <p className="text-sm text-foreground/70 mt-0.5">Pacchetto formativo (5h)</p>
                </div>
                <span className="font-mono text-xl font-bold">250&euro;</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
