import type { Metadata } from "next";
import AccountActions from "../account/account-actions";

export const metadata: Metadata = {
  title: "Choose a Mode — Build a Beauty",
  description: "Set the challenge level for your Build a Beauty run.",
};

const attributes = [
  ["POW", "Shot Power", "Release speed, one-timers, and raw shooting force."],
  ["ACC", "Shot Accuracy", "Placement, precision, and finishing from every angle."],
  ["OFF", "Offensive Awareness", "Reads, positioning, anticipation, and creativity with the puck."],
  ["DEF", "Defensive Awareness", "Coverage, positioning, stick placement, and danger recognition."],
  ["PAS", "Passing", "Playmaking, timing, touch, and creating for teammates."],
  ["SPD", "Speed", "Acceleration and straight-line pace in open ice."],
  ["POI", "Poise (Clutch)", "Composure and execution when the game tightens."],
  ["STR", "Strength", "Board battles, net-front power, and physical control."],
  ["DIS", "Discipline", "Smart aggression, restraint, and penalty avoidance."],
  ["DEK", "Deking", "Puck creativity, one-on-one moves, and control in tight space."],
  ["BOD", "Body Checking", "Timing, contact, and separating opponents from the puck."],
  ["DUR", "Durability", "Physical resilience, recovery, and availability through the season."],
] as const;

const goalieAttributes = [
  ["STI", "Stick Side", "Low and mid-height saves made to the stick side."],
  ["GLV", "Glove Side", "Reaction speed, tracking, and saves made with the glove."],
  ["AGG", "Aggressiveness", "How confidently the goalie challenges shooters and cuts distance."],
  ["VIS", "Vision", "Tracking the puck through traffic, screens, and deflections."],
  ["POK", "Poke Check", "Timing and reach when disrupting close-range chances."],
  ["REB", "Rebound Control", "Absorbing shots or steering rebounds away from danger."],
  ["POI", "Poise (Consistency)", "Consistency in game-to-game performance throughout the season."],
  ["AGI", "Agility", "Lateral movement, recoveries, and post-to-post quickness."],
  ["DUR", "Durability", "Physical resilience, recovery, and season-long availability."],
  ["FIV", "Five Hole", "Closing the space between the pads on low shots and dekes."],
  ["REC", "Shot Recovery", "Resetting position quickly after the initial save."],
  ["ANG", "Angles", "Squaring to the puck and taking away the shooter's net."],
] as const;

export default function Play() {
  return (
    <main className="play-shell">
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

      <div className="play-page">
        <a className="game-chip play-brand" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer" aria-label="View Golden Edge">
          <span className="puck-icon" aria-hidden="true" />
          <span>View Golden Edge</span>
        </a>

        <section className="play-intro">
          <div>
            <p className="play-eyebrow">Set your challenge</p>
            <h1 className="play-title">Build a Beauty</h1>
            <p className="play-lede">
              Decide how much of your build you want revealed before the first
              spin. Each mode changes what you know and when you know it.
            </p>
          </div>
          <aside className="setup-badge" aria-label="Current build stage">
            <span>MVP V0.1</span>
            <strong>Preseason</strong>
          </aside>
        </section>

        <form className="play-layout" action="/setup" method="get">
          <div className="play-main">
            <section aria-labelledby="mode-heading">
              <h2 id="mode-heading" className="section-title">Pick your challenge</h2>
              <p className="section-copy">
                Your choice controls how much information stays on the board during the build.
              </p>

              <div className="mode-grid" role="radiogroup" aria-labelledby="mode-heading">
                <input className="mode-option-input" type="radio" name="mode" id="mode-classic" value="classic" required />
                <label className="play-mode-card" htmlFor="mode-classic">
                  <p className="mode-label">Pick a position. Full scouting report.</p>
                  <h3>Classic</h3>
                  <p>
                    Start with your role locked in and every rating on the
                    board. It rewards planning and gives you the clearest path.
                  </p>
                </label>

                <input className="mode-option-input" type="radio" name="mode" id="mode-blind" value="blind" required />
                <label className="play-mode-card" htmlFor="mode-blind">
                  <p className="mode-label">Position known. Ratings under wraps.</p>
                  <h3>Blind</h3>
                  <p>
                    Your role is set from the opening faceoff, but the numbers
                    stay sealed until your player is complete.
                  </p>
                </label>

                <input className="mode-option-input" type="radio" name="mode" id="mode-chaos" value="chaos" required />
                <label className="play-mode-card" htmlFor="mode-chaos">
                  <p className="mode-label">No position. No ratings. No safety net.</p>
                  <h3>Chaos</h3>
                  <p>
                    Make every pick without a scouting report. Your role and
                    finished player arrive together at the final reveal.
                  </p>
                </label>
              </div>
            </section>

            <section className="attributes-panel" aria-labelledby="attributes-heading">
              <h2 id="attributes-heading" className="section-title">Build Attributes</h2>
              <div className="attribute-grid">
                {attributes.map(([code, name, description]) => (
                  <article className="attribute-card" key={code}>
                    <strong>{code}</strong>
                    <h3>{name}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>

              <div className="attribute-divider" aria-hidden="true" />

              <div className="goalie-attributes">
                <div className="attribute-grid">
                  {goalieAttributes.map(([code, name, description]) => (
                    <article className="attribute-card goalie-card" key={`goalie-${code}`}>
                      <strong>{code}</strong>
                      <h3>{name}</h3>
                      <p>{description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="build-status" aria-label="Build status">
            <p className="status-kicker">Build status</p>
            <dl>
              <div>
                <dt>Mode</dt>
                <dd className="mode-status-value">
                  <span className="mode-empty">No mode yet</span>
                  <span className="selected-mode selected-classic">Classic</span>
                  <span className="selected-mode selected-blind">Blind</span>
                  <span className="selected-mode selected-chaos">Chaos</span>
                </dd>
              </div>
              <div>
                <dt>Next</dt>
                <dd>Pick your challenge</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>0 / 12</dd>
              </div>
            </dl>
            <button className="inactive-action" type="submit">
              <span className="action-locked">Mode required</span>
              <span className="action-ready">Continue</span>
            </button>
            <p className="status-note">
              Classic gives you control up front. Blind hides the scouting
              numbers. Chaos keeps everything secret until the reveal.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
