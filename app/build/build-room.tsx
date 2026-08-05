"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { nhlRosterData, type NhlPlayer } from "./nhl-roster-data";

const teamLogos: Record<string, string> = {
  "Anaheim Ducks": "ANA",
  "Boston Bruins": "BOS",
  "Buffalo Sabres": "BUF",
  "Calgary Flames": "CGY",
  "Carolina Hurricanes": "CAR",
  "Chicago Blackhawks": "CHI",
  "Colorado Avalanche": "COL",
  "Columbus Blue Jackets": "CBJ",
  "Dallas Stars": "DAL",
  "Detroit Red Wings": "DET",
  "Edmonton Oilers": "EDM",
  "Florida Panthers": "FLA",
  "Los Angeles Kings": "LAK",
  "Minnesota Wild": "MIN",
  "Montreal Canadiens": "MTL",
  "Nashville Predators": "NSH",
  "New Jersey Devils": "N.J",
  "New York Islanders": "NYI",
  "New York Rangers": "NYR",
  "Ottawa Senators": "OTT",
  "Philadelphia Flyers": "PHI",
  "Pittsburgh Penguins": "PIT",
  "San Jose Sharks": "SJS",
  "Seattle Kraken": "SEA",
  "St. Louis Blues": "STL",
  "Tampa Bay Lightning": "T.B",
  "Toronto Maple Leafs": "TOR",
  "Utah Mammoth": "UTA",
  "Vancouver Canucks": "VAN",
  "Vegas Golden Knights": "VGK",
  "Washington Capitals": "WSH",
  "Winnipeg Jets": "WPG",
  "Montreal Canadiens — 1976-77": "MTL",
  "New York Islanders — 1981-82": "NYI",
  "Edmonton Oilers — 1983-84": "EDM",
  "Detroit Red Wings — 1995-96": "DET",
  "Chicago Blackhawks — 2012-13": "CHI",
  "Pittsburgh Penguins — 2008-09": "PIT",
};

const dynastyTeams = new Set([
  "Montreal Canadiens — 1976-77",
  "New York Islanders — 1981-82",
  "Edmonton Oilers — 1983-84",
  "Detroit Red Wings — 1995-96",
  "Chicago Blackhawks — 2012-13",
  "Pittsburgh Penguins — 2008-09",
]);

const dynastySpinWeight = 0.1;

const positionNames = { W: "Winger", C: "Center", D: "Defenseman", G: "Goalie" } as const;
const skaterAttributes = ["POW", "ACC", "OFF", "DEF", "PAS", "SPD", "POI", "STR", "DIS", "DEK", "BOD", "DUR"];
const goalieAttributes = ["STI", "GLV", "AGG", "VIS", "POK", "REB", "POI", "AGI", "DUR", "FIV", "REC", "ANG"];
const gradeColor = (grade?: string) => {
  if (!grade) return "grade-developing";
  if (grade.startsWith("A")) return "grade-elite";
  if (grade.startsWith("B")) return "grade-strong";
  if (grade.startsWith("C")) return "grade-solid";
  return "grade-developing";
};

type Archetype = { name: string; description: string };

type LockedPick = { player: string; team: string; grade: string; rating: number };
type Props = { position: "W" | "C" | "D" | "G"; mode: "classic" | "blind" | "chaos"; demoComplete?: boolean; demoSeed?: string };

function seedValue(seed: string) {
  return [...seed].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

export default function BuildRoom({ position, mode, demoComplete = false, demoSeed = "default" }: Props) {
  const teamNames = useMemo(() => Object.keys(teamLogos), []);
  const weightedTeams = useMemo(
    () => teamNames.map((team) => ({ team, weight: dynastyTeams.has(team) ? dynastySpinWeight : 1 })),
    [teamNames],
  );
  const isChaos = mode === "chaos";
  const isBlind = mode !== "classic";
  const [chaosPosition, setChaosPosition] = useState<"W" | "C" | "D">("W");
  const revealedPosition = isChaos ? chaosPosition : position;
  const attributes = isChaos || position !== "G" ? skaterAttributes : goalieAttributes;
  const demoPicks = useMemo<Record<string, LockedPick>>(() => {
    if (!demoComplete) return {};
    const candidates = nhlRosterData.filter((player) => !player.isDynasty && (isChaos ? player.position !== "G" : position === "G" ? player.position === "G" : player.position !== "G"));
    let state = seedValue(demoSeed);
    const draw = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const shuffled = [...candidates];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(draw() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return Object.fromEntries(attributes.map((attribute, index) => {
      const player = shuffled[index % shuffled.length];
      return [attribute, { player: player.name, team: player.team, grade: player.attributes[attribute], rating: player.ratings[attribute] }];
    }));
  }, [attributes, demoComplete, demoSeed, isChaos, position]);
  const [team, setTeam] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rollingTeam, setRollingTeam] = useState("");
  const [rerolls, setRerolls] = useState(3);
  const [selectedPlayer, setSelectedPlayer] = useState<NhlPlayer | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [lockedPlayers, setLockedPlayers] = useState<Set<string>>(() => new Set(Object.values(demoPicks).map((pick) => pick.player)));
  const [lockedAttributes, setLockedAttributes] = useState<Record<string, LockedPick>>(() => demoPicks);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isChaos) setChaosPosition((["W", "C", "D"] as const)[Math.floor(Math.random() * 3)]);
  }, [isChaos]);

  const drawTeam = () => {
    const totalWeight = weightedTeams.reduce((total, entry) => total + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of weightedTeams) {
      roll -= entry.weight;
      if (roll <= 0) return entry.team;
    }
    return weightedTeams[weightedTeams.length - 1].team;
  };

  const spinTeam = (isReroll = false) => {
    if (spinning || (isReroll && rerolls === 0)) return;
    if (isReroll) setRerolls((count) => count - 1);
    setSelectedPlayer(null);
    setSelectedAttribute(null);
    setSpinning(true);
    let ticks = 0;
    timerRef.current = window.setInterval(() => {
      setRollingTeam(drawTeam());
      ticks += 1;
      if (ticks >= 13 && timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        const result = drawTeam();
        setTeam(result);
        setRollingTeam(result);
        setSpinning(false);
      }
    }, 110);
  };

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  const roster = useMemo(
    () => (
      team
        ? nhlRosterData.filter((player) => (isChaos ? player.team === team && player.position !== "G" : position === "G" ? player.team === team && player.position === "G" : player.team === team && player.position !== "G"))
        : []
    ),
    [team, position, isChaos],
  );

  const choosePlayer = (player: NhlPlayer) => {
    if (lockedPlayers.has(player.name)) return;
    setSelectedPlayer(player);
    setSelectedAttribute(null);
  };

  const lockPick = () => {
    if (!selectedPlayer || !selectedAttribute) return;
    setLockedPlayers((players) => new Set(players).add(selectedPlayer.name));
    setLockedAttributes((picks) => ({
      ...picks,
      [selectedAttribute]: {
        player: selectedPlayer.name,
        team: selectedPlayer.team,
        grade: selectedPlayer.attributes[selectedAttribute],
        rating: selectedPlayer.ratings[selectedAttribute],
      },
    }));
    setSelectedPlayer(null);
    setSelectedAttribute(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (complete + 1 >= attributes.length) return;
    window.setTimeout(() => spinTeam(), 280);
  };

  const activeTeam = spinning ? rollingTeam : team;
  const complete = Object.keys(lockedAttributes).length;
  const teamLogo = activeTeam ? teamLogos[activeTeam] : null;
  const activeTeamIsDynasty = activeTeam ? dynastyTeams.has(activeTeam) : false;
  const isComplete = complete === attributes.length;
  const overall = isComplete ? (() => {
    const ratings = attributes.map((attribute) => lockedAttributes[attribute].rating);
    const rawAverage = ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
    const elitePicks = ratings.filter((rating) => rating >= 90).length;
    // Great builds should feel genuinely special: the bonus only begins once the
    // base average is already strong, then rewards repeated elite pulls.
    const highEndBonus = rawAverage >= 84
      ? Math.min(5, Math.max(0, (rawAverage - 84) * .3 + elitePicks * .25))
      : 0;
    return Math.max(60, Math.min(99, Math.round(rawAverage + highEndBonus)));
  })() : 0;
  const overallGrade = overall >= 95 ? "A+" : overall >= 92 ? "A" : overall >= 89 ? "A-" : overall >= 86 ? "B+" : overall >= 83 ? "B" : overall >= 80 ? "B-" : overall >= 77 ? "C+" : overall >= 73 ? "C" : overall >= 70 ? "C-" : "D+";
  const archetype = useMemo<Archetype | null>(() => {
    if (!isComplete) return null;
    const average = (...keys: string[]) => keys.reduce((total, key) => total + lockedAttributes[key].rating, 0) / keys.length;
    if (revealedPosition === "G") {
      const athletic = average("AGI", "REC", "POI");
      const technical = average("ANG", "VIS", "STI", "GLV");
      const rebound = average("REB", "POK", "VIS");
      const aggressive = average("AGG", "POK", "AGI");
      if (overall < 76) return { name: "Development Project", description: "An unfinished goalie build with clear room to sharpen its foundation." };
      if (aggressive >= athletic + 2 && aggressive >= technical) return { name: "Aggressive Challenger", description: "Attacks pucks outside the crease and disrupts chances early." };
      if (athletic >= technical + 2 && athletic >= rebound) return { name: "Athletic Goaltender", description: "Relies on quick recovery, movement, and composure in scramble situations." };
      if (technical >= athletic + 2 && technical >= rebound) return { name: "Technical Goaltender", description: "Wins with sound angles, visual tracking, and controlled positioning." };
      if (rebound >= athletic && rebound >= technical) return { name: "Rebound Controller", description: "Limits second chances with reliable puck control and patient reads." };
      if (lockedAttributes.POI.rating >= 88 && lockedAttributes.DUR.rating >= 84) return { name: "Calm Backbone", description: "A steady, dependable presence built to hold form through a full season." };
      return { name: "Balanced Netminder", description: "A complete crease profile with no glaring weakness to target." };
    }
    const offense = average("OFF", "PAS", "DEK");
    const shooting = average("POW", "ACC", "OFF");
    const defense = average("DEF", "BOD", "STR", "DIS");
    const power = average("POW", "STR", "BOD");
    const transition = average("SPD", "PAS", "OFF");
    if (overall < 76) return { name: "Development Project", description: "A raw build with a few usable tools and a clear path to improve." };
    if (revealedPosition === "D") {
      if (defense >= 87 && offense >= 84) return { name: "Two-Way Defenseman", description: "Drives play at both ends while staying trustworthy in his own zone." };
      if (defense >= offense + 3) return { name: "Shutdown Defender", description: "Built to close gaps, win contact, and make life difficult for attackers." };
      if (offense >= defense + 3) return { name: "Offensive Defenseman", description: "Creates from the blue line and turns possession into attacking pressure." };
      if (lockedAttributes.SPD.rating >= 87) return { name: "Mobile Defender", description: "Uses skating and clean puck movement to exit the zone and join rushes." };
      return { name: "Reliable Blue-Liner", description: "A balanced defender who can handle regular minutes in every situation." };
    }
    if (defense >= 87 && offense >= 86) return { name: "Two-Way Driver", description: "A complete forward who creates offense without giving away the defensive end." };
    if (power >= shooting && power >= offense && power >= 86) return { name: "Power Forward", description: "Creates chances through strength, puck protection, and hard-area play." };
    if (shooting >= offense + 2 && shooting >= transition) return { name: "Goal-Scoring Threat", description: "Built to find space and finish chances with a dangerous release." };
    if (offense >= shooting + 2 && offense >= defense) return { name: "Playmaking Creator", description: "Sees lanes early and makes teammates more dangerous with the puck." };
    if (defense >= offense + 3) return { name: "Defensive Specialist", description: "A detail-oriented forward who wins matchups and suppresses quality looks." };
    if (transition >= 87) return { name: "Transition Threat", description: "Uses speed and puck movement to turn exits into immediate offense." };
    if (lockedAttributes.SPD.rating >= 85 && lockedAttributes.DUR.rating >= 84) return { name: "Energy Forward", description: "Brings pace, pressure, and repeatable effort shift after shift." };
    return { name: "All-Around Skater", description: "A versatile build with enough tools to contribute in multiple roles." };
  }, [isComplete, lockedAttributes, overall, revealedPosition]);

  if (isComplete) {
    const buildRatingParams = new URLSearchParams({
      off: String(lockedAttributes.OFF?.rating ?? 80),
      pas: String(lockedAttributes.PAS?.rating ?? 80),
      acc: String(lockedAttributes.ACC?.rating ?? 80),
      pow: String(lockedAttributes.POW?.rating ?? 80),
      def: String(lockedAttributes.DEF?.rating ?? 80),
      spd: String(lockedAttributes.SPD?.rating ?? 80),
    });
    return (
      <section className="build-reveal" aria-label="Final build reveal">
        <p className="build-panel-kicker">Build reveal</p>
        <div className="build-reveal-grid">
          <div className="build-final-summary">
            <span>Final position</span>
            <strong>{revealedPosition}</strong>
            <p>{positionNames[revealedPosition]}</p>
            <div className="build-final-overall"><span>Overall</span><b>{overall}</b><em className={gradeColor(overallGrade)}>{overallGrade}</em></div>
            <div className="build-archetype"><span>Archetype</span><h2>{archetype?.name}</h2><p>{archetype?.description}</p></div>
            <a
              className="build-continue-button"
              href={`/team?mode=${mode}&position=${revealedPosition}&overall=${overall}&archetype=${encodeURIComponent(archetype?.name ?? "")}&${buildRatingParams.toString()}`}
            >
              Continue to team spin
            </a>
          </div>
          <div className="build-final-table-wrap">
            <div className="build-final-table-heading"><h2>Final Build</h2><p>All twelve ratings are now revealed.</p></div>
            <div className="build-final-table">
              <div className="build-final-table-head"><span>Attr</span><span>Player</span><span>Team</span><span>Rating</span></div>
              {attributes.map((attribute) => {
                const pick = lockedAttributes[attribute];
                return <div className="build-final-table-row" key={attribute}><strong>{attribute}</strong><b>{pick.player}</b><span>{pick.team}</span><em className={gradeColor(pick.grade)}>{pick.grade}<small>{pick.rating}</small></em></div>;
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="build-room-layout">
      <section className="build-team-panel">
        <div className="build-team-heading">
          <div>
            <p className="build-panel-kicker">Team spin</p>
            <h2>{spinning ? "Finding your team…" : team ? "Choose your player" : "Ready for the first draw"}</h2>
            <p>{team ? "Pick one available player and one available attribute." : "Spin the league to reveal the first team and its player pool."}</p>
          </div>
          <button className="build-spin-control" type="button" onClick={() => spinTeam()} disabled={spinning}>
            {spinning ? "Spinning…" : team ? "Spin team" : "Start spin"}
          </button>
        </div>

        {activeTeam ? (
          <>
            <div className={`build-team-card ${spinning ? "is-spinning" : ""} ${activeTeamIsDynasty ? "is-dynasty" : ""}`}>
              {teamLogo && <img className="team-logo" src={`/nhl-logos/${teamLogo}.svg`} alt={`${activeTeam} logo`} />}
              <div>
                <span>{spinning ? "Team spinning" : activeTeamIsDynasty ? "Dynasty team locked" : "Team locked"}</span>
                <h3>{activeTeam}</h3>
                <p>{activeTeamIsDynasty ? "Classic peak-season roster" : "Current NHL roster"}</p>
                <strong>Rerolls left: {rerolls}</strong>
              </div>
              <button className="build-reroll" type="button" onClick={() => spinTeam(true)} disabled={spinning || rerolls === 0}>
                Reroll team ({rerolls} left)
              </button>
            </div>

            {!spinning && (
              <div className="build-roster">
                <div className="build-roster-head"><span>Player</span><span>Position</span><span>Status</span></div>
                {roster.map((player) => {
                  const used = lockedPlayers.has(player.name);
                  const selected = selectedPlayer?.name === player.name;
                  return (
                    <button
                      className={`build-roster-row ${selected ? "is-selected" : ""}`}
                      type="button"
                      key={`${player.team}-${player.name}`}
                      onClick={() => choosePlayer(player)}
                      disabled={used}
                    >
                      <strong>{player.name}</strong>
                      <span>{player.position} · {positionNames[player.position]}</span>
                      <em>{used ? "Unavailable" : selected ? "Selected" : "Available"}</em>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="build-roster-placeholder">
            <h3>No lineup revealed</h3>
            <p>Once a team locks in, its eligible players will fill this space.</p>
          </div>
        )}
      </section>

      <aside className="build-sidebar">
        <section className="build-player-panel">
          <p className="build-panel-kicker">Selected player</p>
          <div>
            {selectedPlayer ? (
              <>
                <h2>{selectedPlayer.name}</h2>
                <p className="build-position">{selectedPlayer.position} · {positionNames[selectedPlayer.position]}</p>
                <p>{isBlind ? "Select one open attribute. Ratings stay hidden until the final reveal." : "Select one open rating from this player."}</p>
              </>
            ) : (
              <>
                <h2>{team ? "No player selected" : "Spin a team first"}</h2>
                <p>{team ? "Choose an available player from the roster to see their ratings." : "The player choice opens after a team and roster are revealed."}</p>
              </>
            )}
          </div>
        </section>

        {selectedPlayer && (
          <section className="build-pick-panel">
            <p className="build-panel-kicker">Attributes</p>
            <div className="build-grade-grid">
              {attributes.map((attribute) => {
                const alreadyLocked = Boolean(lockedAttributes[attribute]);
                const active = selectedAttribute === attribute;
                return (
                  <button
                    className={`build-grade-card ${active ? "is-active" : ""} ${alreadyLocked ? "is-locked" : ""} ${isBlind ? "is-blind" : ""}`}
                    type="button"
                    key={attribute}
                    disabled={alreadyLocked}
                    onClick={() => setSelectedAttribute(attribute)}
                  >
                    <span>{attribute}</span>
                    <b className={isBlind ? "grade-hidden" : gradeColor(selectedPlayer.attributes[attribute] ?? "")}>{isBlind ? "??" : selectedPlayer.attributes[attribute] ?? "—"}</b>
                    <small>{alreadyLocked ? "Locked" : active ? "Selected" : isBlind ? "Hidden" : "Available"}</small>
                  </button>
                );
              })}
            </div>
            <button className="build-lock-button" type="button" disabled={!selectedAttribute} onClick={lockPick}>
              Lock pick & spin next
            </button>
          </section>
        )}

        <section className="build-attribute-panel">
          <div className="build-attribute-heading">
            <p className="build-panel-kicker">Build progress</p>
            <strong>{complete} / 12</strong>
          </div>
          <div className="build-attribute-list">
            {attributes.map((attribute) => {
              const pick = lockedAttributes[attribute];
              return (
                <div className="build-attribute-row" key={attribute}>
                  <span><strong>{attribute}</strong><small>{pick ? isBlind ? "Locked" : `Round ${Object.keys(lockedAttributes).indexOf(attribute) + 1}` : "Empty"}</small></span>
                  <span className="build-locked-rating"><b>{pick ? isBlind ? "??" : pick.grade : "—"}</b>{pick && !isBlind && <small>{pick.rating}</small>}</span>
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}
