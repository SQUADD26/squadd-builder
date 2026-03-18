import { getApiKey } from "@/components/SettingsDialog";
import { STEP_TEMPLATES, SOURCE_TEMPLATES } from "@/data/templates";

async function callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("Inserisci la tua API Key OpenAI nelle impostazioni (icona ⚙️)");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      messages,
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Errore API OpenAI");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function suggestTemplates(sector: string): Promise<string[]> {
  const allIds = [
    ...SOURCE_TEMPLATES.map((t) => t.id),
    ...STEP_TEMPLATES.map((t) => t.id),
  ];

  const response = await callOpenAI([
    {
      role: "system",
      content: `Sei un esperto di CRM e marketing automation. Data una lista di componenti disponibili, suggerisci quali sono più utili per un dato settore. Rispondi SOLO con gli ID separati da virgola, nient'altro. Componenti: ${allIds.join(", ")}`,
    },
    { role: "user", content: `Settore: ${sector}` },
  ]);

  return response
    .split(",")
    .map((s) => s.trim())
    .filter((id) => allIds.includes(id));
}

// ── Smart Edge Configuration ────────────────────────────

export interface SmartEdgeConfig {
  type: "direct" | "wait" | "condition";
  label?: string;
  branches?: { label: string; action_hint?: string }[];
}

export async function interpretEdgeConfig(query: string): Promise<SmartEdgeConfig> {
  try {
    const response = await callOpenAI([
      {
        role: "system",
        content: `Sei un assistente per un CRM automation builder. L'utente descrive come configurare un collegamento tra due step di automazione.
Interpreta e rispondi SOLO con JSON valido.

Formati:
1. Attesa: {"type":"wait","label":"Attendi risposta"}
2. Condizione: {"type":"condition","branches":[{"label":"Risponde"},{"label":"Non risponde"}]}
3. Diretto: {"type":"direct"}

Regole:
- Attese/tempi/pause → "wait"
- "se...allora", scenari alternativi → "condition"
- Collegamento semplice → "direct"
- Label rami: concisi (2-4 parole)
- action_hint opzionale: tipo di azione suggerita per il ramo`,
      },
      { role: "user", content: query },
    ]);

    const parsed = JSON.parse(response.trim());
    if (parsed.type === "wait" || parsed.type === "condition" || parsed.type === "direct") {
      return parsed as SmartEdgeConfig;
    }
    return { type: "direct" };
  } catch {
    return { type: "direct" };
  }
}

/** AI-powered step matching: interprets vague/misspelled user input and returns matching template IDs. */
export async function matchStepFromQuery(query: string): Promise<string[]> {
  const templateList = STEP_TEMPLATES.map(t => `${t.id}: ${t.label}`).join("\n");

  try {
    const response = await callOpenAI([
      {
        role: "system",
        content: `Sei un assistente per un CRM builder. L'utente cerca uno step da aggiungere al flusso.
Ecco gli step disponibili:
${templateList}

Interpreta la richiesta dell'utente (anche se scritta male, con abbreviazioni o in modo vago) e rispondi SOLO con gli ID degli step più pertinenti, separati da virgola. Massimo 5 risultati, ordinati per pertinenza. Se la richiesta sembra una domanda/condizione (es. "se il cliente risponde", "il lead è caldo?"), rispondi con "CONDITION" seguito dalla domanda riformulata pulita. Se non trovi nulla di pertinente, rispondi "NONE".`,
      },
      { role: "user", content: query },
    ]);

    const trimmed = response.trim();
    if (trimmed === "NONE") return [];
    if (trimmed.startsWith("CONDITION:")) return [trimmed];

    const allIds = STEP_TEMPLATES.map(t => t.id);
    return trimmed
      .split(",")
      .map(s => s.trim())
      .filter(id => allIds.includes(id));
  } catch {
    return [];
  }
}

