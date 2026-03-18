import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { getCompetitorList, getCompetitorTotal } from "@/data/softwareDefaults";
import { SQUADD_PRICE, type PriceTier } from "@/data/templates";
import { getApiKey, setApiKey } from "@/components/SettingsDialog";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [tier, setTier] = useState<PriceTier>("budget");

  const handleSaveApiKey = () => {
    setApiKey(apiKey);
  };

  const competitors = getCompetitorList(tier);
  const total = getCompetitorTotal(tier);

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <img src="/squadd-logo.svg" alt="Squadd" className="h-10" />
          <nav className="flex items-center gap-1.5 font-mono text-sm">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              Squadd
            </button>
            <span className="text-muted-foreground">&gt;</span>
            <span className="font-bold">Impostazioni</span>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full space-y-6">
        {/* Competitor pricing reference */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Competitor & Prezzi di Mercato
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-2xs ${tier === "budget" ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                  Budget
                </span>
                <Switch
                  checked={tier === "premium"}
                  onCheckedChange={(checked) => setTier(checked ? "premium" : "budget")}
                  className=""
                />
                <span className={`font-mono text-2xs ${tier === "premium" ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                  Premium
                </span>
              </div>
            </div>
            <p className="text-2xs text-muted-foreground mt-1">
              Prezzi reali dei software che Squadd sostituisce. Usati per calcolare il risparmio nel builder.
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            {competitors.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-medium block">{item.name}</span>
                  <span className="text-2xs text-muted-foreground">{item.category}</span>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums shrink-0">
                  €{item.defaultCost}/mese
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="border-t-2 border-foreground/20 pt-4 space-y-2">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">
              Totale se usassero tutto ({tier === "budget" ? "budget" : "premium"})
            </span>
            <span className="font-bold tabular-nums">€{total}/mese</span>
          </div>
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">Costo Squadd</span>
            <span className="font-bold tabular-nums text-foreground">€{SQUADD_PRICE}/mese</span>
          </div>
          <div className="flex justify-between font-mono text-sm pt-1 border-t border-border">
            <span className="font-bold">Risparmio potenziale</span>
            <span className="font-bold tabular-nums text-foreground">€{Math.max(0, total - SQUADD_PRICE)}/mese</span>
          </div>
        </div>

        {/* API Key */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              API Key OpenAI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk-..."
                  className="font-mono text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <Button onClick={handleSaveApiKey} variant="outline" size="sm" className="font-mono text-xs shrink-0">
                Salva
              </Button>
            </div>
            <p className="text-2xs text-muted-foreground mt-1.5">
              Salvata solo nel browser (localStorage).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
