import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlanType = "free" | "pro";

interface PlanStore {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  isFree: () => boolean;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plan: "free",
      setPlan: (plan) => set({ plan }),
      isFree: () => get().plan === "free",
    }),
    { name: "orgchart-plan" }
  )
);
