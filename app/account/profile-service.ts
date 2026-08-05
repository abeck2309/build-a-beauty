"use client";

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

export type SavedRun = { id: string; mode: string; position: string; overall: number; archetype: string; career_team: string; record: string | null; result: string; created_at: string };

export async function ensureProfile(user: User) {
  if (!supabase || !user.email) return;
  const { error } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, display_name: user.user_metadata.full_name ?? user.user_metadata.name ?? null }, { onConflict: "id" });
  if (error) throw new Error(`Profile setup failed: ${error.message}`);
}

export async function saveRun(run: Omit<SavedRun, "id" | "created_at"> & { build_snapshot: Record<string, number> }) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Log in to save this run.");
  await ensureProfile(user);
  const { data: existingRuns, error: existingRunsError } = await supabase.from("runs").select("id, mode, overall, result").eq("user_id", user.id);
  if (existingRunsError) throw new Error(`Could not read saved runs: ${existingRunsError.message}`);
  const { error } = await supabase.from("runs").insert({ ...run, user_id: user.id });
  if (error) throw new Error(`Could not save run: ${error.message}`);
  const prior = existingRuns ?? [];
  const earned: { id: string; title: string; reward: number }[] = [];
  if (!prior.length) earned.push({ id: "first-run", title: "First Shift", reward: 10 });
  if (!prior.some((item) => item.mode === run.mode)) earned.push({ id: `first-${run.mode}`, title: `First ${run.mode[0].toUpperCase()}${run.mode.slice(1)}`, reward: 10 });
  if (run.overall >= 96) earned.push({ id: "goat-blueprint", title: "GOAT Blueprint", reward: 120 });
  else if (run.overall >= 93) earned.push({ id: "superstar-build", title: "Superstar Build", reward: 60 });
  else if (run.overall >= 90) earned.push({ id: "elite-build", title: "Elite Build", reward: 30 });
  if (run.result === "Stanley Cup Champion") {
    if (!prior.some((item) => item.result === "Stanley Cup Champion")) earned.push({ id: "first-banner", title: "First Banner", reward: 120 });
    if (run.mode === "classic") earned.push({ id: "classic-cup", title: "Classic Cup", reward: 30 });
    if (run.mode === "blind") earned.push({ id: "blind-cup", title: "Blind Cup", reward: 30 });
  }
  if (typeof window !== "undefined") earned.forEach((achievement, index) => window.setTimeout(() => window.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: achievement })), index * 720));
}
