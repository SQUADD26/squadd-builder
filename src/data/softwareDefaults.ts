import { COMPETITORS, type PriceTier } from "./templates";

export interface SoftwareItem {
  id: string;
  name: string;
  defaultCost: number;
  category: string;
}

// Re-export competitors as software items for the Settings page
export function getCompetitorList(tier: PriceTier): SoftwareItem[] {
  return COMPETITORS.map(c => ({
    id: c.id,
    name: tier === "budget" ? c.nameBudget : c.namePremium,
    defaultCost: tier === "budget" ? c.costBudget : c.costPremium,
    category: c.category,
  }));
}

export function getCompetitorTotal(tier: PriceTier): number {
  return COMPETITORS.reduce((sum, c) => sum + (tier === "budget" ? c.costBudget : c.costPremium), 0);
}
