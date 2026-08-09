"use client";

import { useEffect, useMemo, useState } from "react";
import type { SavedRun } from "../account/profile-service";
import { supabase } from "../account/supabase-client";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Special" | "GOAT";
type Achievement = { id: string; title: string; description: string; category: "Modes" | "Builds" | "Awards" | "Season" | "Legacy"; rarity: Rarity; reward: number; unlock: (runs: SavedRun[]) => boolean };
const completed = (runs: SavedRun[]) => runs.filter((run) => run.result === "Stanley Cup Champion");
const atLeast = (count: number) => (runs: SavedRun[]) => runs.length >= count;
const cupCount = (count: number) => (runs: SavedRun[]) => completed(runs).length >= count;
const ovr = (value: number) => (runs: SavedRun[]) => runs.some((run) => run.overall >= value);
const achievements: Achievement[] = [
  { id: "first-run", title: "First Shift", description: "Complete your first run.", category: "Modes", rarity: "Common", reward: 10, unlock: atLeast(1) },
  { id: "first-classic", title: "First Classic", description: "Finish a run in Classic Mode.", category: "Modes", rarity: "Common", reward: 10, unlock: (runs) => runs.some((run) => run.mode === "classic") },
  { id: "first-blind", title: "First Blind", description: "Finish a run in Blind Mode.", category: "Modes", rarity: "Common", reward: 10, unlock: (runs) => runs.some((run) => run.mode === "blind") },
  { id: "first-chaos", title: "First Chaos", description: "Finish a run in Chaos Mode.", category: "Modes", rarity: "Common", reward: 10, unlock: (runs) => runs.some((run) => run.mode === "chaos") },
  { id: "classic-cup", title: "Classic Cup", description: "Win the Stanley Cup in Classic Mode.", category: "Modes", rarity: "Rare", reward: 30, unlock: (runs) => runs.some((run) => run.mode === "classic" && run.result === "Stanley Cup Champion") },
  { id: "blind-cup", title: "Blind Cup", description: "Win the Stanley Cup in Blind Mode.", category: "Modes", rarity: "Rare", reward: 30, unlock: (runs) => runs.some((run) => run.mode === "blind" && run.result === "Stanley Cup Champion") },
  { id: "elite-build", title: "Elite Build", description: "Create a 90+ OVR build.", category: "Builds", rarity: "Rare", reward: 30, unlock: ovr(90) },
  { id: "superstar-build", title: "Superstar Build", description: "Create a 93+ OVR build.", category: "Builds", rarity: "Epic", reward: 60, unlock: ovr(93) },
  { id: "goat-blueprint", title: "GOAT Blueprint", description: "Create a 96+ OVR build.", category: "Builds", rarity: "Legendary", reward: 120, unlock: ovr(96) },
  { id: "balanced-monster", title: "Balanced Monster", description: "Finish a 90+ OVR all-around build.", category: "Builds", rarity: "Epic", reward: 60, unlock: (runs) => runs.some((run) => run.overall >= 90 && /All-Around|Two-Way/.test(run.archetype)) },
  { id: "sniper-build", title: "Sniper Build", description: "Finish a goal-scoring build at 88+ OVR.", category: "Builds", rarity: "Rare", reward: 30, unlock: (runs) => runs.some((run) => run.overall >= 88 && /Goal-Scoring/.test(run.archetype)) },
  { id: "floor-general", title: "Floor General", description: "Finish a playmaking build at 88+ OVR.", category: "Builds", rarity: "Rare", reward: 30, unlock: (runs) => runs.some((run) => run.overall >= 88 && /Playmaking/.test(run.archetype)) },
  { id: "defensive-wall", title: "Defensive Wall", description: "Finish a shutdown build at 88+ OVR.", category: "Builds", rarity: "Epic", reward: 60, unlock: (runs) => runs.some((run) => run.overall >= 88 && /Shutdown|Defensive/.test(run.archetype)) },
  { id: "power-house", title: "Power House", description: "Finish a power build at 88+ OVR.", category: "Builds", rarity: "Epic", reward: 60, unlock: (runs) => runs.some((run) => run.overall >= 88 && /Power/.test(run.archetype)) },
  { id: "transition-threat", title: "Transition Threat", description: "Finish a transition build at 88+ OVR.", category: "Builds", rarity: "Epic", reward: 60, unlock: (runs) => runs.some((run) => run.overall >= 88 && /Transition|Mobile/.test(run.archetype)) },
  { id: "calm-backbone", title: "Calm Backbone", description: "Finish a goalie build at 88+ OVR.", category: "Builds", rarity: "Epic", reward: 60, unlock: (runs) => runs.some((run) => run.position === "G" && run.overall >= 88) },
  { id: "perfect-balance", title: "Perfect Balance", description: "Create a 95+ OVR two-way build.", category: "Builds", rarity: "Legendary", reward: 120, unlock: (runs) => runs.some((run) => run.overall >= 95 && /Two-Way/.test(run.archetype)) },
  { id: "hart", title: "Hart Winner", description: "Win the Hart Trophy.", category: "Awards", rarity: "Epic", reward: 60, unlock: () => false },
  { id: "art-ross", title: "Scoring King", description: "Win the Art Ross Trophy.", category: "Awards", rarity: "Rare", reward: 30, unlock: () => false },
  { id: "rocket", title: "Rocket Winner", description: "Lead the league in goals.", category: "Awards", rarity: "Rare", reward: 30, unlock: () => false },
  { id: "norris", title: "Blue-Line Boss", description: "Win the Norris Trophy.", category: "Awards", rarity: "Epic", reward: 60, unlock: () => false },
  { id: "vezina", title: "Vezina Winner", description: "Win the Vezina Trophy.", category: "Awards", rarity: "Epic", reward: 60, unlock: () => false },
  { id: "conn-smythe", title: "Conn Smythe", description: "Win the Conn Smythe Trophy.", category: "Awards", rarity: "Epic", reward: 60, unlock: () => false },
  { id: "trophy-case", title: "Trophy Case", description: "Win three individual awards in one run.", category: "Awards", rarity: "Legendary", reward: 120, unlock: () => false },
  { id: "perfect-resume", title: "Perfect Resume", description: "Win the Hart, Art Ross, and Conn Smythe in one run.", category: "Awards", rarity: "Special", reward: 200, unlock: () => false },
  { id: "season-centurion", title: "Century Club", description: "Record 100 points in a season.", category: "Season", rarity: "Rare", reward: 30, unlock: () => false },
  { id: "forty-goals", title: "Forty Goal Club", description: "Score 40 goals in a season.", category: "Season", rarity: "Rare", reward: 30, unlock: () => false },
  { id: "fifty-goals", title: "Fifty Goal Club", description: "Score 50 goals in a season.", category: "Season", rarity: "Epic", reward: 60, unlock: () => false },
  { id: "one-twenty", title: "120 Club", description: "Record 120 points in a season.", category: "Season", rarity: "Epic", reward: 60, unlock: () => false },
  { id: "one-forty", title: "140 Club", description: "Record 140 points in a season.", category: "Season", rarity: "Legendary", reward: 120, unlock: () => false },
  { id: "sixty-wins", title: "60-Win Team", description: "Win 60 regular-season games.", category: "Season", rarity: "Epic", reward: 60, unlock: () => false },
  { id: "presidents", title: "Presidents' Trophy", description: "Finish first in the NHL standings.", category: "Season", rarity: "Legendary", reward: 120, unlock: () => false },
  { id: "wildcard-warrior", title: "Wildcard Warrior", description: "Reach the playoffs as a wild card.", category: "Season", rarity: "Rare", reward: 30, unlock: () => false },
  { id: "playoff-push", title: "Playoff Push", description: "Reach the Stanley Cup Playoffs.", category: "Season", rarity: "Common", reward: 10, unlock: (runs) => runs.some((run) => run.result !== "Missed Playoffs") },
  { id: "first-banner", title: "First Banner", description: "Win your first Stanley Cup.", category: "Legacy", rarity: "Legendary", reward: 120, unlock: cupCount(1) },
  { id: "ring-collector", title: "Ring Collector", description: "Win three Stanley Cups.", category: "Legacy", rarity: "Epic", reward: 60, unlock: cupCount(3) },
  { id: "five-rings", title: "Five Rings", description: "Win five Stanley Cups.", category: "Legacy", rarity: "Legendary", reward: 120, unlock: cupCount(5) },
  { id: "dynasty-builder", title: "Dynasty Builder", description: "Win 10 Stanley Cups.", category: "Legacy", rarity: "Legendary", reward: 120, unlock: cupCount(10) },
  { id: "immortal-legacy", title: "Immortal Legacy", description: "Win 25 Stanley Cups.", category: "Legacy", rarity: "Special", reward: 120, unlock: cupCount(25) },
  { id: "fifty-runs", title: "Fifty Runs", description: "Complete 50 career runs.", category: "Legacy", rarity: "Legendary", reward: 120, unlock: atLeast(50) },
  { id: "hundred-runs", title: "Century Legacy", description: "Complete 100 career runs.", category: "Legacy", rarity: "Special", reward: 120, unlock: atLeast(100) },
  { id: "franchise-icon", title: "Franchise Icon", description: "Win a Cup with the same club three times.", category: "Legacy", rarity: "Epic", reward: 60, unlock: (runs) => Object.values(completed(runs).reduce<Record<string, number>>((counts, run) => ({ ...counts, [run.career_team]: (counts[run.career_team] ?? 0) + 1 }), {})).some((count) => count >= 3) },
  { id: "road-warrior", title: "Road Warrior", description: "Complete runs with five different teams.", category: "Legacy", rarity: "Epic", reward: 60, unlock: (runs) => new Set(runs.map((run) => run.career_team)).size >= 5 },
  { id: "cup-chaser", title: "Cup Chaser", description: "Reach 10 completed postseason runs.", category: "Legacy", rarity: "Epic", reward: 60, unlock: (runs) => runs.filter((run) => run.result !== "Missed Playoffs").length >= 10 },
  { id: "all-modes", title: "Three Ways", description: "Complete a run in every mode.", category: "Legacy", rarity: "Special", reward: 120, unlock: (runs) => ["classic", "blind", "chaos"].every((mode) => runs.some((run) => run.mode === mode)) },
  { id: "cup-machine", title: "Cup Machine", description: "Win Cups with five different clubs.", category: "Legacy", rarity: "Special", reward: 120, unlock: (runs) => new Set(completed(runs).map((run) => run.career_team)).size >= 5 },
  { id: "goat", title: "GOAT", description: "Complete 100 runs and win 25 Stanley Cups.", category: "Legacy", rarity: "GOAT", reward: 300, unlock: (runs) => runs.length >= 100 && completed(runs).length >= 25 },
  { id: "perfect-run", title: "Perfect Run", description: "Win the Cup with a 95+ OVR build.", category: "Legacy", rarity: "Legendary", reward: 120, unlock: (runs) => runs.some((run) => run.result === "Stanley Cup Champion" && run.overall >= 95) },
  { id: "under-dog", title: "Underdog Story", description: "Win the Cup with an 82 OVR or lower build.", category: "Legacy", rarity: "Legendary", reward: 120, unlock: (runs) => runs.some((run) => run.result === "Stanley Cup Champion" && run.overall <= 82) },
  { id: "first-ten", title: "Ten Deep", description: "Complete 10 career runs.", category: "Legacy", rarity: "Rare", reward: 30, unlock: atLeast(10) },
  { id: "first-twenty-five", title: "Twenty-Five Deep", description: "Complete 25 career runs.", category: "Legacy", rarity: "Epic", reward: 60, unlock: atLeast(25) },
  { id: "long-game", title: "Long Game", description: "Complete 15 career runs.", category: "Legacy", rarity: "Rare", reward: 30, unlock: atLeast(15) },
];

export default function AchievementBoard() {
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");
  const [category, setCategory] = useState("All Categories");
  const [rarity, setRarity] = useState("All Rarities");
  const [isCompact, setIsCompact] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    setSignedIn(Boolean(user));
    if (user) { const { data } = await supabase.from("runs").select("id, mode, position, overall, archetype, career_team, record, result, created_at").order("created_at", { ascending: false }); setRuns((data ?? []) as SavedRun[]); }
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => setIsCompact(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const decorated = useMemo(() => achievements.map((achievement) => ({ ...achievement, unlocked: achievement.unlock(runs) })), [runs]);
  const filtered = decorated.filter((achievement) => (status === "All Status" || (status === "Unlocked" ? achievement.unlocked : !achievement.unlocked)) && (category === "All Categories" || achievement.category === category) && (rarity === "All Rarities" || achievement.rarity === rarity) && `${achievement.title} ${achievement.description}`.toLowerCase().includes(query.toLowerCase()));
  const unlocked = decorated.filter((achievement) => achievement.unlocked);
  const points = unlocked.reduce((total, achievement) => total + achievement.reward, 0);
  const total = achievements.reduce((sum, achievement) => sum + achievement.reward, 0);
  const visibleAchievements = isCompact ? filtered.slice(0, visibleCount) : filtered;
  const resetVisible = () => setVisibleCount(9);
  return <div className="achievements-page"><section className="achievement-hero"><div className="achievement-title"><p>Build a Beauty</p><h1>Achievements</h1><span>Track your Cups, awards, elite builds, records, and legacy milestones.</span></div><div className="achievement-actions"><a href="/">Home</a><a href="/profile">Profile</a><button type="button" onClick={() => void load()}>Refresh</button></div><div className={`achievement-notice ${signedIn ? "is-signed-in" : ""}`}>{signedIn ? <span>Your legacy is connected. Completed runs update progress automatically.</span> : <><span>You are not logged in. You can view the catalog, but unlock progress appears after login.</span><a href="/account?tab=login">Login</a></>}</div><div className="achievement-summary"><article><small>Unlocked</small><strong>{unlocked.length}/{achievements.length}</strong></article><article><small>Progress</small><strong>{Math.round((unlocked.length / achievements.length) * 100)}%</strong></article><article><small>Points</small><strong>{points}/{total}</strong></article><article><small>Remaining</small><strong>{achievements.length - unlocked.length}</strong></article></div><div className="achievement-progress"><span style={{ width: `${(unlocked.length / achievements.length) * 100}%` }} /></div><div className="achievement-filters"><input value={query} onChange={(event) => { setQuery(event.target.value); resetVisible(); }} placeholder="Search achievements..." /><select value={status} onChange={(event) => { setStatus(event.target.value); resetVisible(); }}><option>All Status</option><option>Unlocked</option><option>Locked</option></select><select value={category} onChange={(event) => { setCategory(event.target.value); resetVisible(); }}><option>All Categories</option>{["Modes", "Builds", "Awards", "Season", "Legacy"].map((item) => <option key={item}>{item}</option>)}</select><select value={rarity} onChange={(event) => { setRarity(event.target.value); resetVisible(); }}><option>All Rarities</option>{["Common", "Rare", "Epic", "Legendary", "Special", "GOAT"].map((item) => <option key={item}>{item}</option>)}</select></div></section><p className="achievement-count">{loading ? "Loading achievements..." : `Showing ${visibleAchievements.length} of ${filtered.length} achievements`}</p><section className="achievement-grid">{visibleAchievements.map((achievement) => <article key={achievement.id} className={`achievement-card ${achievement.unlocked ? "is-unlocked" : "is-locked"}`}><div className="achievement-icon" aria-hidden="true">{achievement.unlocked ? "★" : "▣"}</div><div className="achievement-copy"><div className="achievement-tags"><span className={`rarity-${achievement.rarity.toLowerCase()}`}>{achievement.rarity}</span><span>{achievement.category}</span></div><h2>{achievement.title}</h2><p>{achievement.description}</p></div><span className="achievement-status">{achievement.unlocked ? "Unlocked" : "Locked"}</span><footer><div><small>Reward</small><b>+{achievement.reward} pts</b></div><div><small>{achievement.unlocked ? "Complete" : "Locked"}</small><span>{achievement.unlocked ? "Achievement earned" : "Complete objective"}</span></div></footer></article>)}</section>{isCompact && visibleAchievements.length < filtered.length && <button type="button" className="achievement-more" onClick={() => setVisibleCount((count) => count + 9)}>Show 9 more</button>}</div>;
}
