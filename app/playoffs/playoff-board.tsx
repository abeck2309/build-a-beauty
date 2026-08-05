"use client";

import { useEffect, useMemo, useState } from "react";
import { ratingFor } from "../season/team-ratings";
import { saveRun } from "../account/profile-service";

type Props = { careerTeam: string; overall: number; position: "W" | "C" | "D" | "G"; archetype: string };
type MatchupData = [string, string];
type BracketContext = { east: MatchupData[]; west: MatchupData[] };
const eastFirst: MatchupData[] = [["A1. Florida Panthers", "WC2. Montreal Canadiens"], ["A2. Toronto Maple Leafs", "A3. Tampa Bay Lightning"], ["M1. Carolina Hurricanes", "WC1. New York Rangers"], ["M2. New Jersey Devils", "M3. Washington Capitals"]];
const westFirst: MatchupData[] = [["C1. Dallas Stars", "WC2. St. Louis Blues"], ["C2. Colorado Avalanche", "C3. Minnesota Wild"], ["P1. Vegas Golden Knights", "WC1. Vancouver Canucks"], ["P2. Edmonton Oilers", "P3. Los Angeles Kings"]];
const easternTeams = new Set(["Boston Bruins", "Buffalo Sabres", "Carolina Hurricanes", "Columbus Blue Jackets", "Detroit Red Wings", "Florida Panthers", "Montreal Canadiens", "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators", "Philadelphia Flyers", "Pittsburgh Penguins", "Tampa Bay Lightning", "Toronto Maple Leafs", "Washington Capitals"]);
const roundNames = ["First Round", "Conference Semifinals", "Conference Finals", "Stanley Cup Final"];
const atlantic = new Set(["Boston Bruins", "Buffalo Sabres", "Detroit Red Wings", "Florida Panthers", "Montreal Canadiens", "Ottawa Senators", "Tampa Bay Lightning", "Toronto Maple Leafs"]);
const central = new Set(["Chicago Blackhawks", "Colorado Avalanche", "Dallas Stars", "Minnesota Wild", "Nashville Predators", "St. Louis Blues", "Utah Mammoth", "Winnipeg Jets"]);
const seedForPlayer = (team: string) => atlantic.has(team) ? "A3" : central.has(team) ? "C3" : easternTeams.has(team) ? "M3" : "P3";
const clock = (tick: number) => `${Math.floor(Math.max(0, 1200 - (tick % 10) * 120) / 60)}:${String(Math.max(0, 1200 - (tick % 10) * 120) % 60).padStart(2, "0")}`;
const teamName = (entry: string) => entry.replace(/^[A-Z]+\d?\.\s*/, "");
const hash = (value: string) => [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
function seededRandom(seed: number) { let value = seed >>> 0; return () => { value += 0x6d2b79f5; let result = value; result = Math.imul(result ^ (result >>> 15), result | 1); result ^= result + Math.imul(result ^ (result >>> 7), result | 61); return ((result ^ (result >>> 14)) >>> 0) / 4294967296; }; }
function poisson(random: () => number, mean: number) { const threshold = Math.exp(-mean); let count = 0; let product = 1; do { count += 1; product *= random(); } while (product > threshold); return count - 1; }
function seriesResult(teams: MatchupData, key: number) {
  const [first, second] = teams.map(teamName) as MatchupData;
  const random = seededRandom(hash(`${first}-${second}`) + key * 101);
  const chance = Math.max(.2, Math.min(.8, .5 + (ratingFor(first).overall - ratingFor(second).overall) * .03));
  let firstWins = 0; let secondWins = 0; let game = 0;
  while (firstWins < 4 && secondWins < 4) {
    const homeAdjustment = game === 0 || game === 1 || game === 4 || game === 6 ? .028 : -.018;
    if (random() < Math.max(.16, Math.min(.84, chance + homeAdjustment))) firstWins += 1;
    else secondWins += 1;
    game += 1;
  }
  return { winner: firstWins === 4 ? teams[0] : teams[1], wins: [firstWins, secondWins] as [number, number] };
}
function seriesWinner(teams: MatchupData, key: number) {
  return seriesResult(teams, key).winner;
}
function playoffScore(first: string, second: string, game: number, round: number): [number, number] {
  const random = seededRandom(hash(`${first}-${second}`) + game * 211 + round * 701);
  const firstRating = ratingFor(teamName(first)); const secondRating = ratingFor(teamName(second));
  const matchupEdge = (firstRating.overall - secondRating.overall) * .075;
  const firstGoals = 3.03 + (firstRating.offense - 84) * .05 - (secondRating.defense - 84) * .05 + matchupEdge + (random() - .5) * .72;
  const secondGoals = 3.03 + (secondRating.offense - 84) * .05 - (firstRating.defense - 84) * .05 - matchupEdge + (random() - .5) * .72;
  let firstScore = Math.max(0, poisson(random, Math.max(1.45, firstGoals)));
  let secondScore = Math.max(0, poisson(random, Math.max(1.45, secondGoals)));
  if (firstScore === secondScore) {
    if (random() < .5 + (firstRating.overall - secondRating.overall) * .028) firstScore += 1;
    else secondScore += 1;
  }
  return [firstScore, secondScore];
}

function Matchup({ conference, teams, featured, wins }: { conference: string; teams: MatchupData; featured?: boolean; wins: [number, number] }) { return <article className={`playoff-matchup ${featured ? "is-featured" : ""}`}><div><span>{conference}</span><small>{wins[0]}–{wins[1]}</small></div>{teams.map((team, index) => <p key={team}><b>{team}</b><strong>{wins[index]}</strong></p>)}</article>; }

export default function PlayoffBoard({ careerTeam, overall, position, archetype }: Props) {
  const [speed, setSpeed] = useState("Normal");
  const [round, setRound] = useState(0);
  const [seriesWins, setSeriesWins] = useState<[number, number]>([0, 0]);
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  const [finished, setFinished] = useState(false);
  const [awaitingRound, setAwaitingRound] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [champion, setChampion] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [bracketContext, setBracketContext] = useState<BracketContext | null>(null);
  useEffect(() => {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem("build-a-beauty-playoff-bracket") ?? "null");
      if (Array.isArray(parsed?.east) && Array.isArray(parsed?.west)) setBracketContext(parsed);
    } catch { /* Use the built-in bracket when no saved context exists. */ }
  }, []);
  const { conference, playerSeries, westMatchups, eastMatchups } = useMemo(() => {
    const playerConference = easternTeams.has(careerTeam) ? "East" : "West";
    const baseRounds = bracketContext?.[playerConference.toLowerCase() as "east" | "west"] ?? (playerConference === "East" ? eastFirst : westFirst);
    const existingEntry = baseRounds.flat().find((team) => teamName(team) === careerTeam);
    const playerLabel = existingEntry ?? `${seedForPlayer(careerTeam)}. ${careerTeam}`;
    const firstRound = (base: MatchupData[], side: "East" | "West") => {
      const playerMatch = base.findIndex((matchup) => matchup.some((team) => teamName(team) === careerTeam));
      return base.map((matchup, index) => side === playerConference && index === (playerMatch >= 0 ? playerMatch : 2)
        ? matchup.map((team) => teamName(team) === careerTeam ? playerLabel : team) as MatchupData
        : matchup);
    };
    const westRound = firstRound(bracketContext?.west ?? westFirst, "West"); const eastRound = firstRound(bracketContext?.east ?? eastFirst, "East");
    const makeSemis = (games: MatchupData[], side: "East" | "West") => [[seriesWinner(games[0], 10), seriesWinner(games[1], 11)], [seriesWinner(games[2], 12), seriesWinner(games[3], 13)]] as MatchupData[];
    const westSemis = makeSemis(westRound, "West"); const eastSemis = makeSemis(eastRound, "East");
    const playerRound = playerConference === "West" ? westRound : eastRound;
    const playerFirstIndex = playerRound.findIndex((matchup) => matchup.some((team) => teamName(team) === careerTeam));
    const playerFirst = playerRound[playerFirstIndex >= 0 ? playerFirstIndex : 2];
    const playerSemiIndex = Math.floor((playerFirstIndex >= 0 ? playerFirstIndex : 2) / 2);
    const playerSemis = playerConference === "West" ? westSemis : eastSemis;
    const playerConferenceWinner = (semis: MatchupData[], key: number) => seriesWinner([seriesWinner(semis[0], key), seriesWinner(semis[1], key + 1)], key + 2);
    const playerOpponent = round === 0 ? playerFirst.find((team) => teamName(team) !== careerTeam)! : round === 1 ? playerSemis[playerSemiIndex].find((team) => teamName(team) !== careerTeam)! : round === 2 ? seriesWinner(playerSemis[playerSemiIndex === 0 ? 1 : 0], 24) : (playerConference === "West" ? playerConferenceWinner(eastSemis, 40) : playerConferenceWinner(westSemis, 40));
    const playerSeries: MatchupData = [playerLabel, playerOpponent];
    const conferenceFinal = (semis: MatchupData[], side: "East" | "West") => side === playerConference ? [playerSeries] : [[seriesWinner(semis[0], 30), seriesWinner(semis[1], 31)]];
    const westMatchups = round === 0 ? westRound : round === 1 ? (playerConference === "West" ? westSemis.map((matchup, index) => index === playerSemiIndex ? playerSeries : matchup) : westSemis) : round === 2 ? conferenceFinal(westSemis, "West") : [[playerConference === "West" ? playerSeries[0] : playerConferenceWinner(westSemis, 50), playerConference === "East" ? playerSeries[0] : playerConferenceWinner(eastSemis, 60)]];
    const eastMatchups = round === 0 ? eastRound : round === 1 ? (playerConference === "East" ? eastSemis.map((matchup, index) => index === playerSemiIndex ? playerSeries : matchup) : eastSemis) : round === 2 ? conferenceFinal(eastSemis, "East") : [];
    return { conference: playerConference, playerSeries, westMatchups, eastMatchups };
  }, [bracketContext, careerTeam, round]);
  const gameNumber = seriesWins[0] + seriesWins[1];
  const baseScore = playoffScore(playerSeries[0], playerSeries[1], gameNumber, round);
  const playerWinsGame = baseScore[0] > baseScore[1];
  const finalScore: [number, number] = baseScore;
  const liveScore: [number, number] = [Math.min(finalScore[0], Math.floor(finalScore[0] * tick / 30)), Math.min(finalScore[1], Math.floor(finalScore[1] * tick / 30))];
  const matchupWins = (teams: MatchupData, index: number, side: "West" | "East") => featured(teams) ? seriesWins : seriesResult(teams, (round + 1) * 100 + index + (side === "East" ? 40 : 0)).wins;

  useEffect(() => {
    if (!live) return;
    if (tick >= 30) { setLive(false); setFinished(true); return; }
    const delay = { Slow: 900, Normal: 520, Fast: 260, Ultra: 110 }[speed] ?? 520;
    const timer = window.setTimeout(() => setTick((value) => value + 1), delay);
    return () => window.clearTimeout(timer);
  }, [live, speed, tick]);

  const startGame = () => { setTick(0); setFinished(false); setLive(true); };
  const continueSeries = () => {
    const next: [number, number] = [seriesWins[0] + (playerWinsGame ? 1 : 0), seriesWins[1] + (playerWinsGame ? 0 : 1)];
    setSeriesWins(next); setFinished(false); setTick(0);
    if (next[0] === 4 || next[1] === 4) {
      if (next[1] === 4 || round === 3) { setChampion(next[0] === 4); setShowFinal(true); }
      else setAwaitingRound(true);
    }
  };
  const moveToNextSeries = () => { setRound((current) => Math.min(3, current + 1)); setSeriesWins([0, 0]); setAwaitingRound(false); setFinished(false); setTick(0); };
  const savePlayoffRun = async () => {
    const result = champion ? "Stanley Cup Champion" : `Eliminated in ${roundNames[round]}`;
    try {
      await saveRun({ mode: "classic", position, overall, archetype, career_team: careerTeam, record: null, result, build_snapshot: {} });
      setSaveMessage("Run saved to your profile.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save this run.");
    }
  };
  const featured = (teams: MatchupData) => teams.some((team) => teamName(team) === careerTeam);
  return <><section className="playoffs-intro"><div><p className="playoffs-eyebrow">Postseason</p><h1>Play-In &amp; Playoffs</h1><p>Follow your series, run the GameCast, and track the bracket as the playoffs unfold.</p></div><div className="playoffs-controls"><label>Speed<select value={speed} onChange={(event) => setSpeed(event.target.value)}><option>Slow</option><option>Normal</option><option>Fast</option><option>Ultra</option></select></label><div><span>Round</span><strong>{roundNames[round]}</strong></div></div></section><div className="playoff-layout"><div className="playoff-left"><section className="your-series"><div><p className="playoffs-eyebrow">Your series</p><span>Best of 7</span></div><article><p><b>{playerSeries[0]}</b><strong>{seriesWins[0]}</strong></p><p><b>{playerSeries[1]}</b><strong>{seriesWins[1]}</strong></p></article>{awaitingRound ? <button type="button" onClick={moveToNextSeries}>Move to next series</button> : finished ? <button type="button" onClick={continueSeries}>Continue series</button> : <button type="button" disabled={live || showFinal} onClick={startGame}>{live ? "Game in progress" : "Start next game"}</button>}<p className="series-note">All active series simulate concurrently. Other matchups finish while your series is underway.</p></section><section className="playoff-gamecast"><p className="playoffs-eyebrow">Gamecast</p><p>Live-style simulation for playoff games at {speed.toLowerCase()} speed.</p>{live || finished ? <><div className="playoff-score"><strong>{playerSeries[0]}<b>{live ? liveScore[0] : finalScore[0]}</b></strong><span><small>{finished ? "FINAL" : `P${Math.min(3, Math.floor(tick / 10) + 1)}`}</small><b>{finished ? "0:00" : clock(tick)}</b></span><strong>{playerSeries[1]}<b>{live ? liveScore[1] : finalScore[1]}</b></strong></div>{live && <button className="playoff-skip" type="button" onClick={() => setTick(30)}>Skip to end</button>}</> : <div><h2>No active game.</h2><span>Start your next playoff game to see the clock, score and play-by-play.</span></div>}</section></div><section className="playoff-bracket"><div className="bracket-title"><p className="playoffs-eyebrow">Bracket</p><span>{roundNames[round]}</span></div><div className="bracket-conferences"><div><p className="bracket-conference-label">West</p><div className="bracket-stack">{westMatchups.map((teams, index) => <Matchup key={teams.join("-")} conference="West" teams={teams} featured={featured(teams)} wins={matchupWins(teams, index, "West")} />)}</div></div><div><p className="bracket-conference-label">East</p><div className="bracket-stack">{eastMatchups.map((teams, index) => <Matchup key={teams.join("-")} conference="East" teams={teams} featured={featured(teams)} wins={matchupWins(teams, index, "East")} />)}</div></div></div></section></div>{showFinal && <div className="playoff-final-backdrop" role="dialog" aria-modal="true"><section className="playoff-final-modal"><p className="playoffs-eyebrow">Season complete</p><h2>{champion ? `${careerTeam} are champions` : "Season complete"}</h2><p>{champion ? "Your Beauty has won the Stanley Cup." : `Your Beauty was eliminated in the ${roundNames[round]}.`}</p><div><article><small>Finals MVP</small><strong>{champion ? "Your Beauty" : "Playoff MVP"}</strong></article><article><small>Your run</small><strong>{champion ? "Stanley Cup Champion" : `Eliminated in ${roundNames[round]}`}</strong></article></div><div className="playoff-final-actions"><button type="button" onClick={savePlayoffRun}>Save run</button><button type="button" onClick={() => setShowFinal(false)}>Close</button><a href="/profile">My profile</a></div>{saveMessage && <p className="playoff-save-message">{saveMessage}</p>}</section></div>}</>;
}
