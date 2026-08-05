import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BlindPositionRoll from "./blind-position-roll";
import AccountActions from "../account/account-actions";

export const metadata: Metadata = {
  title: "Player Setup — Build a Beauty",
  description: "Set the role and begin a Build a Beauty run.",
};

type Mode = "classic" | "blind" | "chaos";

const skaterAttributes = [
  "POW",
  "ACC",
  "OFF",
  "DEF",
  "PAS",
  "SPD",
  "POI",
  "STR",
  "DIS",
  "DEK",
  "BOD",
  "DUR",
] as const;

function Header() {
  return (
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
  );
}

function SetupHeading({
  eyebrow,
  title,
  description,
  mode,
}: {
  eyebrow: string;
  title: string;
  description: string;
  mode: string;
}) {
  return (
    <section className="setup-intro">
      <div>
        <p className="setup-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="setup-lede">{description}</p>
      </div>
      <aside className="mode-badge" aria-label={`Selected mode: ${mode}`}>
        <span>Mode</span>
        <strong>{mode}</strong>
      </aside>
    </section>
  );
}

function ClassicSetup() {
  const positions = [
    ["W", "Winger"],
    ["C", "Center"],
    ["D", "Defenseman"],
    ["G", "Goalie"],
  ] as const;

  return (
    <>
      <SetupHeading
        eyebrow="Classic mode"
        title="Pick your position"
        description="Choose the role that fits your game before the build begins. Your scouting information will remain in view throughout the draft."
        mode="Classic"
      />
      <form className="classic-layout" action="/build" method="get">
        <input type="hidden" name="mode" value="classic" />
        <section className="position-panel" aria-label="Hockey positions">
          <div className="position-grid" role="radiogroup" aria-label="Choose a hockey position">
            {positions.map(([code, name]) => (
              <div className="position-option" key={code}>
                <input
                  className="position-option-input"
                  type="radio"
                  id={`position-${code.toLowerCase()}`}
                  name="position"
                  value={code}
                  required
                />
                <label className="position-card" htmlFor={`position-${code.toLowerCase()}`}>
                  <strong>{code}</strong>
                  <span>{name}</span>
                </label>
              </div>
            ))}
          </div>
        </section>
        <aside className="selected-position-panel">
          <p className="panel-kicker">Selected position</p>
          <div className="selection-window">
            <span className="position-empty">
              <strong>—</strong>
              <small>Choose a position to continue</small>
            </span>
            {positions.map(([code, name]) => (
              <span className={`chosen-position chosen-${code.toLowerCase()}`} key={`chosen-${code}`}>
                <strong>{code}</strong>
                <small>{name}</small>
              </span>
            ))}
          </div>
          <button className="classic-start-button" type="submit">Start build</button>
        </aside>
      </form>
    </>
  );
}

function BlindSetup() {
  return (
    <>
      <SetupHeading
        eyebrow="Blind mode"
        title="Position roll"
        description="Your role is revealed before the first pick, while every player rating stays sealed until the completed build is shown."
        mode="Blind"
      />
      <BlindPositionRoll />
    </>
  );
}

function ChaosSetup() {
  return (
    <>
      <SetupHeading
        eyebrow="Chaos mode"
        title="Build in the dark"
        description="Shape the player one draw at a time without seeing the role or the ratings. Every decision has to stand on its own."
        mode="Chaos"
      />
      <div className="chaos-layout">
        <section className="team-spin-panel">
          <div className="spin-panel-heading">
            <div>
              <p className="panel-kicker">Team spin</p>
              <h2>Waiting at center ice</h2>
              <p>The first team-season draw will set the player pool.</p>
            </div>
            <span className="static-secondary">Start spin</span>
          </div>
          <div className="team-placeholder">
            <div className="team-mark">—</div>
            <div>
              <span>No team selected</span>
              <h3>Spin to reveal the roster</h3>
              <p>The available players stay off the board until a team-season locks in.</p>
              <strong>Rerolls left: 1</strong>
            </div>
          </div>
          <div className="roster-placeholder">
            <h3>No roster on the ice yet</h3>
            <p>The player list will appear here after the first team spin.</p>
          </div>
        </section>

        <aside className="chaos-sidebar">
          <section className="selected-player-panel">
            <p className="panel-kicker">Selected player</p>
            <div>
              <h2>Spin a team first</h2>
              <p>A roster has to be revealed before a player can be chosen.</p>
            </div>
          </section>
          <section className="progress-panel">
            <div className="progress-heading">
              <p className="panel-kicker">Build progress</p>
              <strong>0 / 12</strong>
            </div>
            <div className="progress-list">
              {skaterAttributes.map((attribute) => (
                <div className="progress-row" key={attribute}>
                  <span><strong>{attribute}</strong><small>Empty</small></span>
                  <b>—</b>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const requestedMode = params.mode;
  const mode: Mode =
    requestedMode === "blind" || requestedMode === "chaos" ? requestedMode : "classic";

  if (mode === "chaos") redirect("/build?mode=chaos");

  return (
    <main className="setup-shell">
      <Header />
      <div className="setup-page">
        <a className="game-chip setup-brand" href="https://www.goldenedgeanalytics.pro/" target="_blank" rel="noreferrer" aria-label="View Golden Edge">
          <span className="puck-icon" aria-hidden="true" />
          <span>View Golden Edge</span>
        </a>
        {mode === "classic" && <ClassicSetup />}
        {mode === "blind" && <BlindSetup />}
      </div>
    </main>
  );
}
