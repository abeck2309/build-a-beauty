export default function Home() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Build a Beauty home">
          <span className="brand-mark" aria-hidden="true">
            BB
          </span>
          <span className="brand-copy">
            <strong>Build a Beauty</strong>
            <small>Legacy Builder</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          <a className="nav-active" href="/play">Play</a>
          <a href="/achievements">Achievements</a>
          <a href="#leaderboard">Leaderboard</a>
        </nav>

        <AccountActions />
      </header>

      <section className="hero" id="top">
        <div className="hero-toolbar" aria-label="Site information">
          <a className="game-chip" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer">
            <span className="puck-icon" aria-hidden="true" />
            <span>View Golden Edge</span>
          </a>
          <div className="meta-chips">
            <span>V1.0.0</span>
            <span>English</span>
          </div>
        </div>

        <div className="arena-lines" aria-hidden="true">
          <span className="blue-line blue-line-left" />
          <span className="blue-line blue-line-right" />
          <span className="center-line" />
          <span className="center-circle" />
          <span className="rink-circle rink-circle-left rink-circle-top" />
          <span className="rink-circle rink-circle-left rink-circle-bottom" />
          <span className="rink-circle rink-circle-right rink-circle-top" />
          <span className="rink-circle rink-circle-right rink-circle-bottom" />
          <span className="faceoff-dots dots-left" />
          <span className="faceoff-dots dots-right" />
          <span className="goal-crease crease-left" />
          <span className="goal-crease crease-right" />
        </div>

        <div className="hero-content">
          <p className="eyebrow">Draft. Build. Simulate.</p>
          <h1>
            <span>Build a</span>
            <span className="metal-text">Beauty</span>
          </h1>
          <p className="hero-copy">
            Draft skills from hockey legends and today&apos;s stars, create your
            ultimate player, and chase the Cup through an 82-game season.
          </p>

          <div className="hero-actions" id="play">
            <a className="button button-metal button-large" href="/play">Play</a>
            <a className="button button-dark button-large" href="/how-it-works">
              How it works
            </a>
            <a
              className="button button-dark button-large button-contact"
              href="https://www.instagram.com/goldenedgeanalytics"
              target="_blank"
              rel="noreferrer"
            >
              Contact
            </a>
          </div>

          <dl className="stat-row" aria-label="Game details">
            <div>
              <dt>12</dt>
              <dd>Attributes</dd>
            </div>
            <div>
              <dt>4</dt>
              <dd>Positions</dd>
            </div>
            <div>
              <dt>82</dt>
              <dd>Games</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
import AccountActions from "./account/account-actions";
