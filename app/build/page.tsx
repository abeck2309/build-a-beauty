import type { Metadata } from "next";
import BuildRoom from "./build-room";
import AccountActions from "../account/account-actions";

export const metadata: Metadata = {
  title: "Build Room — Build a Beauty",
  description: "Draft the attributes for a custom hockey player.",
};

const positions = { W: "Winger", C: "Center", D: "Defenseman", G: "Goalie" } as const;
type Position = keyof typeof positions;
type Mode = "classic" | "blind" | "chaos";

function Header() {
  return (
    <header className="topbar build-topbar">
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

export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; mode?: string; demo?: string; seed?: string }>;
}) {
  const params = await searchParams;
  const requestedPosition = params.position?.toUpperCase();
  const position: Position =
    requestedPosition === "C" || requestedPosition === "D" || requestedPosition === "G"
      ? requestedPosition
      : "W";
  const mode: Mode = params.mode === "blind" || params.mode === "chaos" ? params.mode : "classic";

  return (
    <main className="build-shell">
      <Header />
      <div className="build-page">
        <a className="game-chip build-brand" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer" aria-label="View Golden Edge">
          <span className="puck-icon" aria-hidden="true" />
          <span>View Golden Edge</span>
        </a>
        <section className="build-intro">
          <div>
            <p className="build-eyebrow">{mode === "classic" ? "Classic build room" : `${mode} build room`}</p>
            <h1>Build your Beauty</h1>
            <p className="build-lede">{mode === "chaos" ? "Spin teams and choose from visible skater rosters, but lock every attribute without seeing its rating. Your own position and finished player arrive together at the final reveal." : mode === "blind" ? "Spin a team, select a player, and lock one unknown attribute at a time. Every rating stays sealed until your final reveal." : `Spin a current NHL team, choose one player from its roster, and lock one open rating into your ${positions[position].toLowerCase()} build.`}</p>
          </div>
          <aside className="build-progress-badge" aria-label="Build progress">
            <span>{mode === "classic" ? "Position" : "Mode"}</span>
            <strong>{mode === "classic" ? position : mode}</strong>
            <small>{mode === "classic" ? positions[position] : mode === "blind" ? "Ratings hidden" : "Everything hidden"}</small>
          </aside>
        </section>
        <BuildRoom position={position} mode={mode} demoComplete={params.demo === "complete"} demoSeed={params.seed} />
      </div>
    </main>
  );
}
