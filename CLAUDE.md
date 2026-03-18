# CLAUDE.md — squadd-flow-buddy
<!-- last updated: 2026-03-11 -->

## Comandi di sviluppo

```bash
npm run dev          # Vite dev server su http://localhost:8080
npm run build        # Build produzione → dist/
npm run build:dev    # Build development (unminified)
npm run lint         # ESLint
npm run test         # Vitest (run singolo)
npm run test:watch   # Vitest (watch mode)
npm run preview      # Preview build produzione
```

## Architettura

React 18 SPA con Vite 5 + TypeScript 5. Path alias: `@/` → `src/`.

### Struttura

```
src/
├── pages/              # Route pages (Index, SettingsPage, NotFound)
├── components/
│   ├── flow/           # Nodi ReactFlow (SourceNode, ActionNode, ConditionNode, ConvergeNode)
│   ├── ui/             # 60+ componenti shadcn/ui
│   ├── TopBar.tsx      # Header con input settore e pulsante suggerimenti AI
│   ├── FlowCanvas.tsx  # Canvas ReactFlow con nodi custom
│   ├── BuilderPanel.tsx # Sidebar destra (380px) per aggiungere sorgenti/step
│   └── SettingsDialog.tsx
├── hooks/
│   ├── useFlowBuilder.ts  # Hook core: stato flow, layout, persistenza
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── data/
│   ├── flowTypes.ts       # Interfacce FlowStep, FlowData, StepType
│   ├── templates.ts       # SOURCE_TEMPLATES (8), STEP_TEMPLATES (13), SQUADD_PRICE=197
│   └── softwareDefaults.ts
├── lib/
│   ├── ai.ts              # OpenAI API (gpt-4o-mini): suggestTemplates, generatePitch
│   └── utils.ts           # cn() per class merging
├── App.tsx                # Router + providers
└── main.tsx               # Entry point
```

### Routing

React Router DOM v6, 3 route:
- `/` → `Index` (flow builder principale)
- `/settings` → `SettingsPage` (costi software, API key)
- `*` → `NotFound` (404)

Providers globali: QueryClientProvider, TooltipProvider, Toaster (sonner), BrowserRouter.

### Stato e persistenza

`useFlowBuilder` è l'hook centrale. Stato persistito in localStorage:

| Chiave | Contenuto |
|--------|-----------|
| `squadd-flow-v2` | FlowData (sources + steps) |
| `squadd-sector` | Settore cliente |
| `squadd-openai-key` | API key OpenAI |
| `squadd-software-costs` | Override costi software |

Operazioni esposte: `addSource`, `removeSource`, `addStep`, `addCondition`, `removeStep`, `updateNote`, `reset`.
Computed: `totalExternal`, `savings`, `allComponents`.

### Tipi dati principali

```typescript
type StepType = "source" | "action" | "condition" | "converge";

interface FlowStep {
  id: string;              // 7 char alfanumerici
  type: StepType;
  templateId?: string;
  label: string;
  note?: string;
  costPerMonth: number;
  icon?: string;
  conditionQuestion?: string;
  yesBranch?: FlowStep[];  // Branching condizionale
  noBranch?: FlowStep[];
}

interface FlowData {
  sources: FlowStep[];
  steps: FlowStep[];       // Albero ricorsivo di step
}
```

### AI Integration

File `src/lib/ai.ts`. Endpoint OpenAI (`gpt-4o-mini`, temp 0.7, max 300 token).
- `suggestTemplates(sector)` → array di template ID suggeriti
- `generatePitch(components, savings, sector)` → pitch testuale in italiano

### UI e styling

- **shadcn/ui** + Radix UI, componenti in `src/components/ui/`
- **Tailwind CSS** con variabili HSL custom
- Tema arancione: `--primary: 16 100% 50%`
- Font: Roboto Mono (headings), Inter (body)
- Dark mode via classe `.dark`
- ReactFlow v12 con nodi custom, dagre per layout automatico

### Dipendenze chiave

- `@xyflow/react` + `@dagrejs/dagre` — flow visualization e layout
- `@tanstack/react-query` — data fetching
- `react-hook-form` + `zod` — form e validazione
- `sonner` — toast
- `lucide-react` — icone
- `vitest` — testing
- `playwright` — e2e testing
