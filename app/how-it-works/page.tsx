import type { Metadata } from "next";
import AccountActions from "../account/account-actions";

export const metadata: Metadata = {
  title: "How It Works — Build a Beauty",
  description: "Learn how to draft your hockey player and chase the Cup.",
};

export default function HowItWorks() {
  return (
    <main className="site-shell how-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Build a Beauty home">
          <span className="brand-mark" aria-hidden="true">BB</span>
          <span className="brand-copy">
            <strong>Build a Beauty</strong>
            <small>Legacy Builder</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          <a className="nav-active" href="/play">Play</a>
          <a href="/achievements">Achievements</a>
          <a href="/#leaderboard">Leaderboard</a>
        </nav>

        <AccountActions />
      </header>

      <div className="how-page">
        <a className="game-chip how-game-chip" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer">
          <span className="puck-icon" aria-hidden="true" />
          <span>View Golden Edge</span>
        </a>

        <section className="how-intro">
          <p className="eyebrow how-eyebrow">How it works</p>
          <h1 className="how-title">Build. Spin. Survive.</h1>
          <p>
            Build a Beauty is a hockey player creator mixed with team roulette
            and a full pro-style season simulation. Draft one attribute at a
            time from current and classic team-seasons, reveal your player,
            join a club, and chase awards, playoffs, and the Cup.
          </p>
        </section>

        <div className="how-grid">
          <div className="how-column">
            <section className="how-card modes-card">
              <p className="card-kicker">1. Choose a mode</p>
              <div className="mode-option">
                <h2>Classic</h2>
                <p>
                  Choose your position before the build. Player grades are
                  visible, and you get three team rerolls during the draft.
                </p>
              </div>
              <div className="mode-option">
                <h2>Blind</h2>
                <p>
                  Your position is rolled before the build, but player grades
                  stay hidden until the final reveal. You get one team reroll.
                </p>
              </div>
              <div className="mode-option">
                <h2>Chaos</h2>
                <p>
                  Position and ratings stay hidden until the end. Build in the
                  dark, trust your instincts, and make one team reroll count.
                </p>
              </div>
            </section>

            <section className="how-card">
              <p className="card-kicker">2. Build your player</p>
              <p>
                Your build is shaped by 12 core attributes. Each round, spin a
                team, choose a player from its roster, and lock in one open
                rating.
              </p>
              <p>
                Every player can only be selected once per run—even if their
                team comes up again later.
              </p>
            </section>
          </div>

          <div className="how-column">
            <aside className="how-card rare-card">
              <p className="card-kicker">Special team-seasons</p>
              <h2>Dynasty pulls are rare.</h2>
              <p>
                Current clubs are the normal pull. Classic and championship
                teams are special pulls with a platinum card, icy glow, and a
                special team-season label.
              </p>
            </aside>

            <section className="how-card">
              <p className="card-kicker">3. Reveal and start your career</p>
              <p>
                When all 12 attributes are locked, your final position,
                overall rating, grades, and player archetype are revealed.
              </p>
              <p>
                Then spin your career team. Your beauty joins that roster, the
                lines adjust, and the season begins.
              </p>
            </section>

            <section className="how-card">
              <p className="card-kicker">4. Sim the season</p>
              <p>
                Simulate games, follow GameCast, track your last five, chase
                the Hart, Norris, Art Ross, Selke, and Rocket Richard, and fight
                for playoff seeding.
              </p>
              <p>
                If you make the playoffs, every series unfolds with live game
                flow, bracket movement, and one final Cup champion.
              </p>
            </section>

            <section className="how-card share-card">
              <p className="card-kicker">5. Share your run</p>
              <p>
                Your final player card recaps the build, season, playoff run,
                awards, championship, and playoff MVP honors — ready to share
                with friends.
              </p>
              <a className="button button-metal start-button" href="/#play">
                Start building
              </a>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
