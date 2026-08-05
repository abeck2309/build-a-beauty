import type { Metadata } from "next";
import PlayoffBoard from "./playoff-board";
import "./playoffs.css";
import AccountActions from "../account/account-actions";

export const metadata: Metadata = { title: "Playoffs — Build a Beauty" };

function Header() { return <header className="topbar playoffs-topbar"><a className="brand" href="/" aria-label="Build a Beauty home"><span className="brand-mark" aria-hidden="true">BB</span><span className="brand-copy"><strong>Build a Beauty</strong><small>Legacy Builder</small></span></a><nav className="main-nav" aria-label="Primary navigation"><a className="nav-active" href="/play">Play</a><a href="/achievements">Achievements</a><a href="/#leaderboard">Leaderboard</a></nav><AccountActions /></header>; }

export default async function PlayoffsPage({ searchParams }: { searchParams: Promise<{ team?: string; overall?: string; position?: string; archetype?: string }> }) {
  const params = await searchParams;
  const parsedOverall = Number(params.overall);
  const overall = Number.isFinite(parsedOverall) ? parsedOverall : 80;
  const position = params.position === "C" || params.position === "D" || params.position === "G" ? params.position : "W";
  return <main className="playoffs-shell"><Header /><div className="playoffs-page"><a className="game-chip playoffs-brand" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer" aria-label="View Golden Edge"><span className="puck-icon" aria-hidden="true" /><span>View Golden Edge</span></a><PlayoffBoard careerTeam={params.team?.trim() || "Your Team"} overall={overall} position={position} archetype={params.archetype?.trim() || "All-Around Skater"} /></div></main>;
}
