"use client";

import { useEffect, useState } from "react";

const positions = [
  { code: "W", name: "Winger" },
  { code: "C", name: "Center" },
  { code: "D", name: "Defenseman" },
  { code: "G", name: "Goalie" },
] as const;

export default function BlindPositionRoll() {
  const [shownIndex, setShownIndex] = useState(0);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const isRolling = lockedIndex === null;
  const shownPosition = positions[lockedIndex ?? shownIndex];

  useEffect(() => {
    const finalIndex = Math.floor(Math.random() * positions.length);
    const rollInterval = window.setInterval(() => {
      setShownIndex((current) => (current + 1) % positions.length);
    }, 105);

    const lockTimer = window.setTimeout(() => {
      window.clearInterval(rollInterval);
      setShownIndex(finalIndex);
      setLockedIndex(finalIndex);
    }, 3000);

    return () => {
      window.clearInterval(rollInterval);
      window.clearTimeout(lockTimer);
    };
  }, []);

  return (
    <div className="blind-layout" aria-live="polite">
      <section className="roll-card">
        <div className={`position-orb${isRolling ? " is-rolling" : ""}`} aria-hidden="true">
          {shownPosition.code}
        </div>
        <p className="roll-state">{isRolling ? "Position rolling" : "Position locked"}</p>
        <h2>{isRolling ? "Reading the ice..." : `${shownPosition.code} — ${shownPosition.name}`}</h2>
        <p className="roll-note">
          {isRolling
            ? "The wheel will settle after three seconds."
            : "Your build will open with this role and hidden ratings."}
        </p>
      </section>

      <aside className="blind-status-card">
        <p className="panel-kicker">Blind status</p>
        <div className="status-window">
          <span>Position</span>
          <strong>{isRolling ? "Rolling..." : shownPosition.code}</strong>
        </div>
        <div className="status-window">
          <span>Ratings</span>
          <strong>Hidden</strong>
        </div>
        {isRolling ? (
          <span className="static-primary is-waiting">Rolling position</span>
        ) : (
          <a className="static-primary is-ready" href={`/build?mode=blind&position=${shownPosition.code}`}>Start build</a>
        )}
      </aside>
    </div>
  );
}
