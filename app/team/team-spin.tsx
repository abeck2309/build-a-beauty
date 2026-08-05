"use client";

import { useMemo, useRef, useState } from "react";
import { nhlRosterData, type NhlPlayer } from "../build/nhl-roster-data";
import { ratingFor } from "../season/team-ratings";
import { dailyFaceoffFirstUnits } from "./dailyfaceoff-lineups";

const teamLogos: Record<string, string> = {
  "Anaheim Ducks": "ANA", "Boston Bruins": "BOS", "Buffalo Sabres": "BUF", "Calgary Flames": "CGY", "Carolina Hurricanes": "CAR", "Chicago Blackhawks": "CHI", "Colorado Avalanche": "COL", "Columbus Blue Jackets": "CBJ", "Dallas Stars": "DAL", "Detroit Red Wings": "DET", "Edmonton Oilers": "EDM", "Florida Panthers": "FLA", "Los Angeles Kings": "LAK", "Minnesota Wild": "MIN", "Montreal Canadiens": "MTL", "Nashville Predators": "NSH", "New Jersey Devils": "N.J", "New York Islanders": "NYI", "New York Rangers": "NYR", "Ottawa Senators": "OTT", "Philadelphia Flyers": "PHI", "Pittsburgh Penguins": "PIT", "San Jose Sharks": "SJS", "Seattle Kraken": "SEA", "St. Louis Blues": "STL", "Tampa Bay Lightning": "T.B", "Toronto Maple Leafs": "TOR", "Utah Mammoth": "UTA", "Vancouver Canucks": "VAN", "Vegas Golden Knights": "VGK", "Washington Capitals": "WSH", "Winnipeg Jets": "WPG",
};

const easternTeams = new Set(["Boston Bruins", "Buffalo Sabres", "Carolina Hurricanes", "Columbus Blue Jackets", "Detroit Red Wings", "Florida Panthers", "Montreal Canadiens", "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators", "Philadelphia Flyers", "Pittsburgh Penguins", "Tampa Bay Lightning", "Toronto Maple Leafs", "Washington Capitals"]);
const teamNames = Object.keys(teamLogos);

type BuildRatings = { off: number; pas: number; acc: number; pow: number; def: number; spd: number };
type Props = { position: "W" | "C" | "D" | "G"; overall: number; archetype: string; buildRatings: BuildRatings };
type LineupSlot = { slot: string; player: string; note: string; isBeauty?: boolean };

function playerScore(player: NhlPlayer) {
  const values = Object.values(player.ratings);
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function normalizedName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/gi, "").toLowerCase();
}

function scoreForProjectedPlayer(name: string, roster: NhlPlayer[]) {
  const player = roster.find((candidate) => normalizedName(candidate.name) === normalizedName(name));
  return player ? playerScore(player) : -Infinity;
}

export default function TeamSpin({ position, overall, archetype, buildRatings }: Props) {
  const [team, setTeam] = useState<string | null>(null);
  const [rollingTeam, setRollingTeam] = useState("");
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const activeTeam = spinning ? rollingTeam : team;
  const roster = useMemo(() => team ? nhlRosterData.filter((player) => player.team === team && !player.isDynasty) : [], [team]);

  const spinTeam = () => {
    if (spinning) return;
    setSpinning(true);
    let ticks = 0;
    timerRef.current = window.setInterval(() => {
      setRollingTeam(teamNames[Math.floor(Math.random() * teamNames.length)]);
      ticks += 1;
      if (ticks >= 14 && timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        const result = teamNames[Math.floor(Math.random() * teamNames.length)];
        setTeam(result);
        setRollingTeam(result);
        setSpinning(false);
      }
    }, 100);
  };

  const lineup = useMemo<LineupSlot[]>(() => {
    if (!team) return [];
    const projected = dailyFaceoffFirstUnits[team];
    if (!projected) return [];

    const rows: Array<LineupSlot & { role: "W" | "C" | "D" | "G" }> = [
      { slot: "LW", player: projected.forwards[0], note: "Projected first line", role: "W" },
      { slot: "C", player: projected.forwards[1], note: "Projected first line", role: "C" },
      { slot: "RW", player: projected.forwards[2], note: "Projected first line", role: "W" },
      { slot: "LD", player: projected.defense[0], note: "Projected first pair", role: "D" },
      { slot: "RD", player: projected.defense[1], note: "Projected first pair", role: "D" },
      { slot: "G", player: projected.goalie, note: "Projected starter", role: "G" },
    ];

    const replacementIndex = position === "W"
      ? scoreForProjectedPlayer(rows[0].player, roster) <= scoreForProjectedPlayer(rows[2].player, roster) ? 0 : 2
      : position === "D"
        ? scoreForProjectedPlayer(rows[3].player, roster) <= scoreForProjectedPlayer(rows[4].player, roster) ? 3 : 4
        : position === "C" ? 1 : 5;

    return rows.map(({ role: _role, ...row }, index) => index === replacementIndex
      ? { ...row, player: "Your Beauty", note: `${archetype} · ${row.player} moves to depth`, isBeauty: true }
      : row);
  }, [archetype, position, roster, team]);

  const profile = useMemo(() => {
    if (!team || !roster.length) return null;
    const rating = ratingFor(team);
    return { ovr: rating.overall, offense: rating.offense, defense: rating.defense, depth: Math.round(roster.filter((player) => player.position !== "G").reduce((total, player) => total + playerScore(player), 0) / Math.max(1, roster.filter((player) => player.position !== "G").length)) };
  }, [roster, team]);

  return (
    <>
      <section className={`career-spin-panel ${team ? "has-team" : ""}`}>
        <p className="team-panel-kicker">Career team spin</p>
        {activeTeam ? (
          <div className={`team-selected-card ${spinning ? "is-spinning" : ""}`}>
            <img src={`/nhl-logos/${teamLogos[activeTeam]}.svg`} alt={`${activeTeam} logo`} />
            <div><span>{spinning ? "Team spinning" : "Team locked"}</span><h2>{activeTeam}</h2><p>{easternTeams.has(activeTeam) ? "Eastern Conference" : "Western Conference"}</p></div>
          </div>
        ) : (
          <div className="team-spin-placeholder"><div className="team-empty-mark">—</div><div><span>No team yet</span><h2>Press start<br />team spin</h2><p>Your career team will be revealed here.</p></div></div>
        )}
        {team ? <a className="team-spin-button" href={`/season?team=${encodeURIComponent(team)}&position=${position}&overall=${overall}&archetype=${encodeURIComponent(archetype)}&off=${buildRatings.off}&pas=${buildRatings.pas}&acc=${buildRatings.acc}&pow=${buildRatings.pow}&def=${buildRatings.def}&spd=${buildRatings.spd}`}>Continue to season</a> : <button className="team-spin-button" type="button" onClick={spinTeam} disabled={spinning}>{spinning ? "Spinning..." : "Start team spin"}</button>}
        <p className="team-note">{team ? "The season opens with all 32 teams at 0–0. Game simulation comes next." : "Press the button to reveal where your Beauty starts their career."}</p>
      </section>

      <aside className="team-sidebar">
        <section className="your-player-panel"><p className="team-panel-kicker">Your Beauty</p><div className="player-summary-card"><span>Position</span><strong>{position}</strong></div><div className="player-summary-card"><span>Overall</span><strong>{overall}</strong></div><div className="player-summary-card"><span>Archetype</span><strong>{archetype}</strong></div></section>
        <section className="team-info-panel"><p className="team-panel-kicker">Projected starting lineup</p>{team ? <div className="team-lineup">{lineup.map((row) => <div className={`team-lineup-row ${row.isBeauty ? "is-beauty" : ""}`} key={row.slot}><strong>{row.slot}</strong><span><b>{row.player}</b><small>{row.note}</small></span></div>)}</div> : <div className="team-info-placeholder"><h2>Waiting for team spin</h2><p>Your projected lineup appears after your career team is locked.</p></div>}</section>
        <section className="team-info-panel"><p className="team-panel-kicker">Team profile</p><div className="team-profile-grid">{[["Team OVR", profile?.ovr], ["Offense", profile?.offense], ["Defense", profile?.defense], ["Depth", profile?.depth]].map(([label, value]) => <div className="team-profile-card" key={String(label)}><span>{label}</span><strong>{value ?? "—"}</strong></div>)}</div></section>
      </aside>
    </>
  );
}
