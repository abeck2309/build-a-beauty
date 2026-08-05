"use client";

import { useEffect, useState } from "react";
import { ensureProfile, SavedRun } from "../account/profile-service";
import { supabase } from "../account/supabase-client";

export default function ProfilePanel() {
  const [email, setEmail] = useState("");
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user?.email) { setLoading(false); return; }
      await ensureProfile(user); setEmail(user.email);
      const { data } = await supabase.from("runs").select("id, mode, position, overall, archetype, career_team, record, result, created_at").order("created_at", { ascending: false });
      setRuns((data ?? []) as SavedRun[]); setLoading(false);
    });
  }, []);
  const logout = async () => { await supabase?.auth.signOut(); window.location.href = "/"; };
  if (loading) return <section className="profile-card"><p>Loading your legacy…</p></section>;
  if (!email) return <section className="profile-card"><p className="profile-eyebrow">Your legacy</p><h1>Sign in to save your runs.</h1><a className="button button-metal" href="/account?tab=login">Login</a></section>;
  return <section className="profile-card"><div className="profile-heading"><div><p className="profile-eyebrow">Your legacy</p><h1>{email.split("@")[0]}</h1><span>{email}</span></div><button type="button" onClick={logout}>Log out</button></div><div className="profile-stats"><article><small>Saved runs</small><strong>{runs.length}</strong></article><article><small>Best OVR</small><strong>{runs.length ? Math.max(...runs.map((run) => run.overall)) : "—"}</strong></article><article><small>Latest result</small><strong>{runs[0]?.result ?? "—"}</strong></article></div><div className="profile-runs"><p className="profile-eyebrow">Saved runs</p>{runs.length ? runs.map((run) => <article key={run.id}><div><strong>{run.career_team}</strong><span>{run.mode} · {run.position} · {run.archetype}</span></div><div><b>{run.overall} OVR</b><span>{run.record ?? run.result}</span></div></article>) : <div className="profile-empty"><strong>No saved runs yet</strong><span>Finish a season, then choose Save Run from the season-complete panel.</span></div>}</div></section>;
}
