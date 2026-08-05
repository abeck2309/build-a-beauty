import type { Metadata } from "next";
import SeasonBoard from "./season-board";
import AccountActions from "../account/account-actions";

export const metadata: Metadata = { title: "League Sim — Build a Beauty", description: "Follow your Build a Beauty season through the NHL standings." };

function Header() { return <header className="topbar season-topbar"><a className="brand" href="/" aria-label="Build a Beauty home"><span className="brand-mark" aria-hidden="true">BB</span><span className="brand-copy"><strong>Build a Beauty</strong><small>Legacy Builder</small></span></a><nav className="main-nav" aria-label="Primary navigation"><a className="nav-active" href="/play">Play</a><a href="/achievements">Achievements</a><a href="/#leaderboard">Leaderboard</a></nav><AccountActions /></header>; }

type BuildRatings = { off: number; pas: number; acc: number; pow: number; def: number; spd: number };

function ratingParam(value: string | undefined) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 99 ? rating : 80;
}

export default async function SeasonPage({ searchParams }: { searchParams: Promise<{ team?: string; overall?: string; position?: string; archetype?: string; off?: string; pas?: string; acc?: string; pow?: string; def?: string; spd?: string }> }) {
  const params = await searchParams;
  const overallValue = Number(params.overall);
  const overall = Number.isInteger(overallValue) && overallValue >= 1 && overallValue <= 99 ? overallValue : 80;
  const position = params.position === "C" || params.position === "D" || params.position === "G" ? params.position : "W";
  const buildRatings: BuildRatings = { off: ratingParam(params.off), pas: ratingParam(params.pas), acc: ratingParam(params.acc), pow: ratingParam(params.pow), def: ratingParam(params.def), spd: ratingParam(params.spd) };
  return <main className="season-shell"><Header /><div className="season-page"><a className="game-chip season-brand" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer" aria-label="View Golden Edge"><span className="puck-icon" aria-hidden="true" /><span>View Golden Edge</span></a><SeasonBoard careerTeam={params.team?.trim() || "Your Team"} overall={overall} position={position} archetype={params.archetype?.trim() || "All-Around Skater"} buildRatings={buildRatings} /></div></main>;
}
