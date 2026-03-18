import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const API_KEY_STORAGE = "squadd-openai-key";
const DEFAULT_API_KEY = "";

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || DEFAULT_API_KEY;
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [key, setKey] = useState(() => getApiKey());

  const handleSave = () => {
    setApiKey(key);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-widest">Impostazioni AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="font-mono text-xs">OpenAI API Key</Label>
            <Input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="mt-1 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              La chiave viene salvata solo nel browser (localStorage).
            </p>
          </div>
          <Button onClick={handleSave} className="w-full font-mono text-xs">
            Salva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
