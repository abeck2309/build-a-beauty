import type { Metadata } from "next";
import TeamSpin from "./team-spin";
import AccountActions from "../account/account-actions";

export const metadata: Metadata = {
  title: "Career Team — Build a Beauty",
  description: "Spin the team that begins your Build a Beauty career.",
};

type Position = "W" | "C" | "D" | "G";
type BuildRatings = { off: number; pas: number; acc: number; pow: number; dek: number; def: number; spd: number };

function ratingParam(value: string | undefined) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 99 ? rating : 80;
}

function Header() {
  return (
    <header className="topbar team-topbar">
      <a className="brand" href="/" aria-label="Build a Beauty home">
        <span className="brand-mark" aria-hidden="true">BB</span>
        <span className="brand-copy"><strong>Build a Beauty</strong><small>Legacy Builder</small></span>
      </a>
      <nav className="main-nav" aria-label="Primary navigation">
        <a className="nav-active" href="/play">Play</a>
        <a href="/achievements">Achievements</a>
        <a href="/#leaderboard">Leaderboard</a>
      </nav>
      <AccountActions />
    </header>
  );
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; overall?: string; archetype?: string; off?: string; pas?: string; acc?: string; pow?: string; dek?: string; def?: string; spd?: string }>;
}) {
  const params = await searchParams;
  const position: Position = params.position === "C" || params.position === "D" || params.position === "G" ? params.position : "W";
  const overallValue = Number(params.overall);
  const overall = Number.isInteger(overallValue) && overallValue >= 1 && overallValue <= 99 ? overallValue : 80;
  const archetype = params.archetype?.trim() || "All-Around Skater";
  const buildRatings: BuildRatings = { off: ratingParam(params.off), pas: ratingParam(params.pas), acc: ratingParam(params.acc), pow: ratingParam(params.pow), dek: ratingParam(params.dek), def: ratingParam(params.def), spd: ratingParam(params.spd) };

  return (
    <main className="team-shell">
      <Header />
      <div className="team-page">
        <a className="game-chip team-brand" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer" aria-label="View Golden Edge"><span className="puck-icon" aria-hidden="true" /><span>View Golden Edge</span></a>
        <section className="team-intro">
          <div>
            <p className="team-eyebrow">Career team spin</p>
            <h1>Your team</h1>
            <p>Your Beauty is joining a club and entering the lineup for the first chapter of their career.</p>
          </div>
          <aside className="team-next-badge"><span>Next</span><strong>League Sim</strong></aside>
        </section>

        <section className="team-layout">
          <TeamSpin position={position} overall={overall} archetype={archetype} buildRatings={buildRatings} />
        </section>
      </div>
    </main>
  );
}
