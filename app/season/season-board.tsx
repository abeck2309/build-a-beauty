"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nhlRosterData } from "../build/nhl-roster-data";
import { dailyFaceoffFirstUnits } from "../team/dailyfaceoff-lineups";
import { generateNhlSchedule } from "./nhl-schedule";
import { ratingFor } from "./team-ratings";
import { saveRun } from "../account/profile-service";

const divisions = [
  { conference: "Eastern Conference", name: "Atlantic Division", teams: ["Boston Bruins", "Buffalo Sabres", "Detroit Red Wings", "Florida Panthers", "Montreal Canadiens", "Ottawa Senators", "Tampa Bay Lightning", "Toronto Maple Leafs"] },
  { conference: "Eastern Conference", name: "Metropolitan Division", teams: ["Carolina Hurricanes", "Columbus Blue Jackets", "New Jersey Devils", "New York Islanders", "New York Rangers", "Philadelphia Flyers", "Pittsburgh Penguins", "Washington Capitals"] },
  { conference: "Western Conference", name: "Central Division", teams: ["Chicago Blackhawks", "Colorado Avalanche", "Dallas Stars", "Minnesota Wild", "Nashville Predators", "St. Louis Blues", "Utah Mammoth", "Winnipeg Jets"] },
  { conference: "Western Conference", name: "Pacific Division", teams: ["Anaheim Ducks", "Calgary Flames", "Edmonton Oilers", "Los Angeles Kings", "San Jose Sharks", "Seattle Kraken", "Vancouver Canucks", "Vegas Golden Knights"] },
] as const;

type BuildRatings = { off: number; pas: number; acc: number; pow: number; dek: number; def: number; spd: number };
type Props = { careerTeam: string; overall: number; position: "W" | "C" | "D" | "G"; archetype: string; buildRatings: BuildRatings };
type RecordState = { wins: number; losses: number; overtimeLosses: number };
type StandingsEntry = { team: string; record: RecordState; gamesPlayed: number; points: number; regulationWins: number; rowWins: number; goalsFor: number; goalsAgainst: number };
type ScheduledGame = { opponent: string; home: boolean };
type CompletedGame = { result: "W" | "L" | "OTL"; matchup: string; score: string; statline: string; points: number };
type LeagueLine = {
  player: (typeof nhlRosterData)[number];
  goals: number;
  assists: number;
  points: number;
  gamesPlayed: number;
  starts: number;
  wins: number;
  savePct: number;
  gaa: number;
};

function teamHash(team: string) { return [...team].reduce((total, letter) => total + letter.charCodeAt(0), 0); }

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function rosterInfluence(team: string) {
  const roster = nhlRosterData.filter((player) => player.team === team && !player.isDynasty);
  if (!roster.length) return 0;
  const skaters = roster.filter((player) => player.position !== "G");
  const raw = skaters.reduce((total, player) => total + ((player.ratings.OFF ?? 78) + (player.ratings.DEF ?? 78)) / 2, 0) / Math.max(1, skaters.length);
  // Player grades matter, but only as a small season-long modifier to the
  // independently configured team rating (maximum ±0.75 rating points).
  return Math.max(-.75, Math.min(.75, (raw - 78) * .075));
}

function playerSeasonForm(playerName: string, seasonSeed: number) {
  // Usage, health, linemate chemistry and finishing luck vary enough from
  // season to season to reshuffle the true contender tier, without turning a
  // depth player into the league leader.
  const random = seededRandom(teamHash(playerName) + seasonSeed * 97);
  return ((random() + random() + random()) / 3 - .5) * .98;
}

function leagueScoringEnvironment(seasonSeed: number) {
  // League scoring moves appreciably by season: a tighter year can have a
  // 105–115 point leader, while a high-event year can reward an elite scorer
  // with a 140-plus campaign.
  const random = seededRandom(seasonSeed * 173 + 41);
  return .84 + ((random() + random() + random()) / 3) * .36;
}

function finishingForm(playerName: string, seasonSeed: number) {
  const random = seededRandom(teamHash(`finish-${playerName}`) + seasonSeed * 313);
  return ((random() + random() + random()) / 3 - .5) * .16;
}

function awardVariance(playerName: string, award: string, seasonSeed: number, spread: number) {
  // A separate, bell-shaped awards bounce represents usage, linemate fit and
  // finishing luck that the compact stat model does not otherwise simulate.
  const random = seededRandom(teamHash(`${playerName}-${award}`) + seasonSeed * 211);
  return ((random() + random() + random() + random()) / 4 - .5) * spread;
}

function awardWinner(lines: LeagueLine[], baseline: (line: LeagueLine) => number, seasonScore: (line: LeagueLine) => number, candidateCount = 30) {
  // First establish a credible contender group, then let the individual season
  // decide it. This allows genuine surprise winners without handing awards to
  // depth players from a single lucky ratings roll.
  return [...lines]
    .sort((first, second) => baseline(second) - baseline(first))
    .slice(0, candidateCount)
    .sort((first, second) => seasonScore(second) - seasonScore(first))[0];
}

function normalizedName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/gi, "").toLowerCase();
}

function goalieUsage(player: (typeof nhlRosterData)[number], random: () => number) {
  const clubGoalies = nhlRosterData
    .filter((candidate) => candidate.team === player.team && !candidate.isDynasty && candidate.position === "G")
    .sort((first, second) => goalieQuality(second) - goalieQuality(first));
  const projectedStarter = dailyFaceoffFirstUnits[player.team]?.goalie;
  const projectedIndex = clubGoalies.findIndex((goalie) => normalizedName(goalie.name) === normalizedName(projectedStarter ?? ""));
  const playerIndex = clubGoalies.findIndex((goalie) => goalie.name === player.name);
  const rank = normalizedName(player.name) === normalizedName(projectedStarter ?? "") || (projectedIndex < 0 && playerIndex === 0)
    ? 0
    : Math.max(1, playerIndex);
  // A primary starter generally handles 50–64 games.  The second goalie gets
  // a real backup workload; any further goalie is only used as injury depth.
  if (rank === 0) return .61 + random() * .17;
  if (rank === 1) return .25 + random() * .13;
  return .03 + random() * .06;
}

function goalieQuality(player: (typeof nhlRosterData)[number]) {
  const ratings = player.ratings;
  return ((ratings.STI ?? 77) + (ratings.GLV ?? 77) + (ratings.POI ?? 77) + (ratings.AGI ?? 77)) / 4;
}

function teamPlayerForm(team: string, seasonSeed: number) {
  const skaters = nhlRosterData.filter((player) => player.team === team && !player.isDynasty && player.position !== "G")
    .map((player) => ({ player, quality: ((player.ratings.OFF ?? 78) + (player.ratings.PAS ?? 78) + (player.ratings.ACC ?? 78)) / 3 }))
    .sort((first, second) => second.quality - first.quality).slice(0, 6);
  const totalWeight = skaters.reduce((sum, entry) => sum + entry.quality, 0) || 1;
  // A star's hot/cold year influences the club, but the impact is capped so
  // team simulation ratings remain the decisive input.
  return skaters.reduce((sum, entry) => sum + playerSeasonForm(entry.player.name, seasonSeed) * (entry.quality / totalWeight), 0) * 1.8;
}

function simulatedRecord(team: string, games: number, seasonSeed = 0): RecordState {
  if (!games) return { wins: 0, losses: 0, overtimeLosses: 0 };
  const rating = ratingFor(team);
  const random = seededRandom(teamHash(team) + seasonSeed * 31);
  const seasonForm = (random() - .5) * .07;
  const winRate = Math.max(.35, Math.min(.68, .5 + (rating.overall - 84) * .014 + rosterInfluence(team) * .006 + teamPlayerForm(team, seasonSeed) * .015 + seasonForm));
  const overtimeLosses = Math.min(Math.floor(games * (.09 + random() * .06)), Math.max(0, games - 1));
  const wins = Math.min(games - overtimeLosses, Math.round(games * winRate));
  return { wins, losses: Math.max(0, games - wins - overtimeLosses), overtimeLosses };
}

function standingEntry(team: string, record: RecordState, games: number, seasonSeed: number): StandingsEntry {
  const random = seededRandom(teamHash(team) + seasonSeed * 59);
  const rating = ratingFor(team);
  const gamesPlayed = record.wins + record.losses + record.overtimeLosses;
  const regulationWins = Math.min(record.wins, Math.max(0, Math.round(record.wins * (.58 + random() * .18))));
  const rowWins = Math.min(record.wins, Math.max(regulationWins, regulationWins + Math.round((record.wins - regulationWins) * (.55 + random() * .3))));
  const goalsFor = Math.max(0, Math.round(gamesPlayed * (3.06 + (rating.offense - 84) * .045 + (random() - .5) * .16)));
  const goalsAgainst = Math.max(0, Math.round(gamesPlayed * (3.06 - (rating.defense - 84) * .045 + (random() - .5) * .16)));
  return { team, record, gamesPlayed: Math.min(games, gamesPlayed), points: record.wins * 2 + record.overtimeLosses, regulationWins, rowWins, goalsFor, goalsAgainst };
}

function headToHeadPointsPercentage(team: string, tiedTeams: string[], gamesPlayed: number, schedule: Record<string, ScheduledGame[]>, seasonSeed: number) {
  let points = 0;
  let available = 0;
  for (const opponent of tiedTeams) {
    if (opponent === team) continue;
    const [first, second] = [team, opponent].sort();
    const seriesLength = schedule[first]?.filter((game) => game.opponent === second).length ?? 0;
    const played = Math.round(seriesLength * gamesPlayed / 82);
    for (let game = 0; game < played; game += 1) {
      const random = seededRandom(teamHash(first) * 7 + teamHash(second) * 13 + seasonSeed * 101 + game * 31);
      const firstWins = random() < .5 + (ratingFor(first).overall - ratingFor(second).overall) * .012;
      const overtime = random() < .24;
      const winner = firstWins ? first : second;
      if (winner === team) points += 2;
      else if (overtime) points += 1;
      available += 2;
    }
  }
  return available ? points / available : 0;
}

function sortStandings(entries: StandingsEntry[], schedule: Record<string, ScheduledGame[]>, seasonSeed: number) {
  const baseComparison = (first: StandingsEntry, second: StandingsEntry) =>
    second.points - first.points || first.gamesPlayed - second.gamesPlayed || second.regulationWins - first.regulationWins || second.rowWins - first.rowWins || second.record.wins - first.record.wins;
  const ordered = [...entries].sort(baseComparison);
  let start = 0;
  while (start < ordered.length) {
    let end = start + 1;
    while (end < ordered.length && baseComparison(ordered[start], ordered[end]) === 0) end += 1;
    if (end - start > 1) {
      const tied = ordered.slice(start, end);
      const names = tied.map((entry) => entry.team);
      tied.sort((first, second) => {
        const headToHead = headToHeadPointsPercentage(second.team, names, first.gamesPlayed, schedule, seasonSeed) - headToHeadPointsPercentage(first.team, names, second.gamesPlayed, schedule, seasonSeed);
        if (headToHead) return headToHead;
        const goalDiff = (second.goalsFor - second.goalsAgainst) - (first.goalsFor - first.goalsAgainst);
        return goalDiff || second.goalsFor - first.goalsFor || first.team.localeCompare(second.team);
      });
      ordered.splice(start, tied.length, ...tied);
    }
    start = end;
  }
  return ordered;
}

function wildcardTeams(divisionGroup: readonly (typeof divisions)[number][], careerTeam: string, careerRecord: RecordState, games: number, seasonSeed: number, schedule: Record<string, ScheduledGame[]>) {
  const divisionQualifiers = new Set(divisionGroup.flatMap((division) => sortStandings(
    division.teams.map((team) => standingEntry(team, team === careerTeam ? careerRecord : simulatedRecord(team, games, seasonSeed), games, seasonSeed)),
    schedule,
    seasonSeed,
  ).slice(0, 3).map((entry) => entry.team)));
  const remaining = divisionGroup.flatMap((division) => division.teams)
    .filter((team) => !divisionQualifiers.has(team))
    .map((team) => standingEntry(team, team === careerTeam ? careerRecord : simulatedRecord(team, games, seasonSeed), games, seasonSeed));
  return sortStandings(remaining, schedule, seasonSeed).slice(0, 2).map((entry) => entry.team);
}

function reachesPlayoffs(team: string, games: number, careerRecord: RecordState, seasonSeed: number, schedule: Record<string, ScheduledGame[]>) {
  const conference = divisions.find((division) => division.teams.includes(team as never))?.conference;
  if (!conference) return false;
  const standings = divisions.filter((division) => division.conference === conference).flatMap((division) => division.teams).map((club) => standingEntry(club, club === team ? careerRecord : simulatedRecord(club, games, seasonSeed), games, seasonSeed));
  return sortStandings(standings, schedule, seasonSeed).slice(0, 8).some((entry) => entry.team === team);
}

function playoffBracketFor(divisionGroup: readonly (typeof divisions)[number][], careerTeam: string, careerRecord: RecordState, games: number, seasonSeed: number, schedule: Record<string, ScheduledGame[]>) {
  const seedPrefix: Record<string, string> = { "Atlantic Division": "A", "Metropolitan Division": "M", "Central Division": "C", "Pacific Division": "P" };
  const seeded = new Map<string, string>();
  for (const division of divisionGroup) {
    const standings = sortStandings(division.teams.map((team) => standingEntry(team, team === careerTeam ? careerRecord : simulatedRecord(team, games, seasonSeed), games, seasonSeed)), schedule, seasonSeed);
    standings.slice(0, 3).forEach((entry, index) => seeded.set(entry.team, `${seedPrefix[division.name]}${index + 1}. ${entry.team}`));
  }
  const wildcards = wildcardTeams(divisionGroup, careerTeam, careerRecord, games, seasonSeed, schedule);
  wildcards.forEach((team, index) => seeded.set(team, `WC${index + 1}. ${team}`));
  const [first, second] = divisionGroup;
  const firstSeeds = sortStandings(first.teams.map((team) => standingEntry(team, team === careerTeam ? careerRecord : simulatedRecord(team, games, seasonSeed), games, seasonSeed)), schedule, seasonSeed).slice(0, 3).map((entry) => seeded.get(entry.team) ?? entry.team);
  const secondSeeds = sortStandings(second.teams.map((team) => standingEntry(team, team === careerTeam ? careerRecord : simulatedRecord(team, games, seasonSeed), games, seasonSeed)), schedule, seasonSeed).slice(0, 3).map((entry) => seeded.get(entry.team) ?? entry.team);
  const [wildcardOne, wildcardTwo] = wildcards.map((team) => seeded.get(team) ?? team);
  return [[firstSeeds[0], wildcardTwo], [firstSeeds[1], firstSeeds[2]], [secondSeeds[0], wildcardOne], [secondSeeds[1], secondSeeds[2]]];
}

function playerLine(player: (typeof nhlRosterData)[number], games: number, seasonSeed = 0): LeagueLine {
  const ratings = player.ratings;
  const random = seededRandom(teamHash(player.name) + seasonSeed * 97);
  const seasonForm = playerSeasonForm(player.name, seasonSeed);
  if (player.position === "G") {
    const quality = goalieQuality(player);
    const starts = Math.max(0, Math.round(games * goalieUsage(player, random)));
    const appearances = Math.min(games, Math.max(starts, starts + Math.round(random() * 3)));
    const rating = ratingFor(player.team);
    const teamWinRate = simulatedRecord(player.team, games, seasonSeed).wins / Math.max(1, games);
    const goalieWinRate = Math.max(.32, Math.min(.72, teamWinRate + (quality - 80) * .0035 + seasonForm * .06 + (random() - .5) * .06));
    const savePct = Math.max(.878, Math.min(.930, .884 + (quality - 72) * .00125 + (rating.defense - 84) * .00065 + seasonForm * .009 + (random() - .5) * .006));
    const gaa = Math.max(1.95, Math.min(3.85, 3.18 - (rating.defense - 84) * .047 - (quality - 78) * .016 - seasonForm * .24 + (random() - .5) * .18));
    return { player, goals: 0, assists: 0, points: 0, gamesPlayed: appearances, starts, wins: Math.min(starts, Math.round(starts * goalieWinRate)), savePct, gaa };
  }
  const offense = ((ratings.OFF ?? 75) * .35 + (ratings.PAS ?? 75) * .2 + (ratings.ACC ?? 75) * .2 + (ratings.POW ?? 75) * .15 + (ratings.DEK ?? 75) * .1);
  const finishingLuck = finishingForm(player.name, seasonSeed);
  const positionMultiplier = player.position === "D" ? .56 : player.position === "C" ? 1.04 : 1;
  const scoringEnvironment = leagueScoringEnvironment(seasonSeed);
  const pointsPerGame = player.position === "D"
    ? Math.max(.07, (.1 + (offense - 65) * .036 + seasonForm) * (.48 + Math.max(0, (ratings.PAS ?? 75) + (ratings.OFF ?? 75) - 165) * .01) * scoringEnvironment)
    : Math.max(.08, (.15 + (offense - 65) * .034 + seasonForm) * positionMultiplier * scoringEnvironment);
  const skaterCeiling = Math.round(96 + scoringEnvironment * 45);
  const points = Math.min(player.position === "D" ? 92 : skaterCeiling, Math.round(games * pointsPerGame));
  const scoringShare = player.position === "D"
    ? Math.max(.12, Math.min(.34, .185 + ((ratings.POW ?? 75) + (ratings.ACC ?? 75) - 155) * .0025 + Math.max(0, (ratings.POW ?? 75) - 90) * .007))
    : Math.max(.24, Math.min(.62, .37 + ((ratings.POW ?? 75) + (ratings.ACC ?? 75) - (ratings.PAS ?? 75) - 75) * .004));
  const goals = Math.min(player.position === "D" ? 31 : 72, Math.round(points * Math.max(player.position === "D" ? .10 : .13, Math.min(player.position === "D" ? .36 : .65, scoringShare + finishingLuck + (random() - .5) * (player.position === "D" ? .055 : .09)))));
  return { player, goals, assists: Math.max(0, points - goals), points, gamesPlayed: games, starts: 0, wins: 0, savePct: 0, gaa: 0 };
}

function vezinaScore(line: LeagueLine) {
  // Quality matters most, but a 25-game heater cannot beat an elite full-season
  // workload. Starts are a soft influence rather than a strict eligibility gate.
  const statScore = (line.savePct - .9) * 2200 + (3.15 - line.gaa) * 18;
  const workloadFactor = .55 + Math.min(1, line.starts / 50) * .45;
  return statScore * workloadFactor + line.wins * 1.2 + line.starts * .55;
}

function StandingsTable({ name, teams, careerTeam, wildcards, record, leagueGames, seasonSeed, schedule }: { name: string; teams: readonly string[]; careerTeam: string; wildcards: readonly string[]; record: RecordState; leagueGames: number; seasonSeed: number; schedule: Record<string, ScheduledGame[]> }) {
  const standings = sortStandings(teams.map((team) => standingEntry(team, team === careerTeam ? record : simulatedRecord(team, leagueGames, seasonSeed), leagueGames, seasonSeed)), schedule, seasonSeed);
  return <section className="standings-card"><div className="standings-heading"><h2>{name}</h2><span>GP · W · L · OT · PTS</span></div><div className="standings-list">{standings.map((entry, index) => {
    const team = entry.team;
    const wildcardRank = wildcards.indexOf(team);
    const seed = index < 3 ? String(index + 1) : wildcardRank >= 0 ? `WC${wildcardRank + 1}` : "—";
    const isCareerTeam = team === careerTeam;
    const teamRecord = entry.record;
    const standingRecord = `${entry.gamesPlayed} · ${teamRecord.wins} · ${teamRecord.losses} · ${teamRecord.overtimeLosses} · ${entry.points}`;
    return <div className={`standing-row ${isCareerTeam ? "is-career-team" : ""}`} key={team}><span className={`seed-tag ${index < 3 ? "is-seed" : wildcardRank >= 0 ? "is-wildcard" : ""}`}>{seed}</span><strong>{team}</strong><span className="standing-record">{standingRecord}</span></div>;
  })}</div></section>;
}

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function poisson(random: () => number, mean: number) {
  const threshold = Math.exp(-Math.max(.1, mean));
  let count = 0;
  let product = 1;
  do { count += 1; product *= Math.max(.0001, random()); } while (product > threshold && count < 14);
  return count - 1;
}

const playoffTeamName = (entry: string) => entry.replace(/^[A-Z]+\d?\.\s*/, "");
type PlayoffOutcome = { champion: string; finalist: string; finalScore: string; finalsMvp: string };
function simulatePlayoffSeries(firstEntry: string, secondEntry: string, seed: number) {
  const first = playoffTeamName(firstEntry); const second = playoffTeamName(secondEntry);
  const random = seededRandom(teamHash(`${first}-${second}`) + seed * 397);
  let firstWins = 0; let secondWins = 0; let game = 0;
  while (firstWins < 4 && secondWins < 4) {
    const firstRating = ratingFor(first); const secondRating = ratingFor(second);
    let firstGoals = poisson(random, Math.max(1.25, 3.0 + (firstRating.offense - 84) * .05 - (secondRating.defense - 84) * .05 + (random() - .5) * .75));
    let secondGoals = poisson(random, Math.max(1.25, 3.0 + (secondRating.offense - 84) * .05 - (firstRating.defense - 84) * .05 + (random() - .5) * .75));
    if (firstGoals === secondGoals) {
      if (random() < .5 + (firstRating.overall - secondRating.overall) * .012) firstGoals += 1;
      else secondGoals += 1;
    }
    if (firstGoals > secondGoals) firstWins += 1; else secondWins += 1;
    game += 1;
  }
  return { winner: firstWins > secondWins ? first : second, loser: firstWins > secondWins ? second : first, score: `${Math.max(firstWins, secondWins)}-${Math.min(firstWins, secondWins)}`, games: game };
}
function simulatePostseason(bracket: { east: string[][]; west: string[][] }, seed: number): PlayoffOutcome {
  const eastFirst = bracket.east.map((matchup, index) => simulatePlayoffSeries(matchup[0], matchup[1], seed + index));
  const westFirst = bracket.west.map((matchup, index) => simulatePlayoffSeries(matchup[0], matchup[1], seed + 10 + index));
  const eastSemis = [simulatePlayoffSeries(eastFirst[0].winner, eastFirst[1].winner, seed + 20), simulatePlayoffSeries(eastFirst[2].winner, eastFirst[3].winner, seed + 21)];
  const westSemis = [simulatePlayoffSeries(westFirst[0].winner, westFirst[1].winner, seed + 30), simulatePlayoffSeries(westFirst[2].winner, westFirst[3].winner, seed + 31)];
  const eastChampion = simulatePlayoffSeries(eastSemis[0].winner, eastSemis[1].winner, seed + 40);
  const westChampion = simulatePlayoffSeries(westSemis[0].winner, westSemis[1].winner, seed + 50);
  const final = simulatePlayoffSeries(eastChampion.winner, westChampion.winner, seed + 60);
  const mvp = nhlRosterData.filter((player) => player.team === final.winner && player.position !== "G" && !player.isDynasty)
    .sort((first, second) => ((second.ratings.OFF ?? 75) + (second.ratings.POI ?? 75) + (second.ratings.ACC ?? 75)) - ((first.ratings.OFF ?? 75) + (first.ratings.POI ?? 75) + (first.ratings.ACC ?? 75)))[0]?.name ?? "Playoff MVP";
  return { champion: final.winner, finalist: final.loser, finalScore: final.score, finalsMvp: mvp };
}

export default function SeasonBoard({ careerTeam, overall, position, archetype, buildRatings }: Props) {
  const [speed, setSpeed] = useState("Normal");
  const [watching, setWatching] = useState(false);
  const [watchTick, setWatchTick] = useState(0);
  const [gameIndex, setGameIndex] = useState(0);
  const [record, setRecord] = useState<RecordState>({ wins: 0, losses: 0, overtimeLosses: 0 });
  const [lastFive, setLastFive] = useState<CompletedGame[]>([]);
  const [beautyStats, setBeautyStats] = useState({ goals: 0, assists: 0, points: 0 });
  const gamesPlayed = record.wins + record.losses + record.overtimeLosses;
  const [seasonSeed, setSeasonSeed] = useState(0);
  useEffect(() => {
    const entropy = Math.floor((Date.now() + Math.random() * 1000000) % 1000000000);
    setSeasonSeed(entropy || 1);
  }, []);
  const east = divisions.slice(0, 2);
  const west = divisions.slice(2, 4);
  const conference = east.some((division) => division.teams.includes(careerTeam as never)) ? "Eastern" : "Western";
  const schedule = useMemo(() => generateNhlSchedule(), []);
  const teamSchedule = schedule[careerTeam] ?? [];
  const nextGame: ScheduledGame = teamSchedule[gameIndex] ?? { opponent: "Boston Bruins", home: true };
  const opponent = nextGame.opponent;
  const opponentRoster = useMemo(() => nhlRosterData.filter((player) => player.team === opponent && !player.isDynasty && player.position !== "G"), [opponent]);
  const leader = (keys: string[]) => [...opponentRoster].sort((first, second) => keys.reduce((total, key) => (second.ratings[key] ?? 0) - (first.ratings[key] ?? 0) + total, 0))[0]?.name ?? "—";
  const leaders = { goals: leader(["POW", "ACC", "OFF"]), assists: leader(["PAS", "OFF", "DEK"]), points: leader(["OFF", "PAS", "ACC", "DEK"]) };
  const eastWildcards = wildcardTeams(east, careerTeam, record, gamesPlayed, seasonSeed, schedule);
  const westWildcards = wildcardTeams(west, careerTeam, record, gamesPlayed, seasonSeed, schedule);
  const playoffBracket = useMemo(() => ({
    east: playoffBracketFor(east, careerTeam, record, gamesPlayed, seasonSeed, schedule),
    west: playoffBracketFor(west, careerTeam, record, gamesPlayed, seasonSeed, schedule),
  }), [careerTeam, eastWildcards, gamesPlayed, record, schedule, seasonSeed, westWildcards]);
  const simulatedPlayoffOutcome = useMemo(() => simulatePostseason(playoffBracket, seasonSeed), [playoffBracket, seasonSeed]);
  const [showSeasonComplete, setShowSeasonComplete] = useState(false);
  const [showSeasonEnd, setShowSeasonEnd] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const gameResult = useCallback((index: number, game: ScheduledGame) => {
    const random = seededRandom(seasonSeed + teamHash(careerTeam) * 11 + teamHash(game.opponent) * 17 + index * 101);
    const team = ratingFor(careerTeam);
    const opponentTeam = ratingFor(game.opponent);
    // Team ratings set the scoring baseline. The custom Beauty's quality and
    // game-to-game form can nudge it, but never overpower the team model.
    const buildSkill = (buildRatings.off + buildRatings.pas + buildRatings.acc + buildRatings.pow + buildRatings.def + buildRatings.spd) / 6;
    // A Beauty's scoring role comes from the offensive tools actually drafted,
    // not just the rounded OVR. This gives loaded offensive builds a meaningful
    // star-scoring ceiling without making every high-OVR two-way build a lock
    // for 120 points.
    const offensiveProfile = buildRatings.off * .30 + buildRatings.pas * .25 + buildRatings.acc * .20 + buildRatings.pow * .18 + buildRatings.dek * .07;
    const eliteOffensiveBonus = Math.max(0, (offensiveProfile - 84) * .024) + Math.max(0, (overall - 89) * .012);
    const beautySeasonRandom = seededRandom(seasonSeed + teamHash(careerTeam) * 31 + overall * 131);
    const beautySeasonForm = (beautySeasonRandom() - .5) * .26;
    const eliteOpportunity = overall >= 90 ? Math.min(.14, (overall - 89) * .014) : Math.max(-.025, (overall - 82) * .0015);
    // OVR lightly affects role/usage. The actual box score is driven mostly by
    // the selected skill mix and a season form roll, so identical OVRs can have
    // very different point totals.
    const beautyForm = (random() - .5) * .20 + (buildSkill - 82) * .003 + (overall - 82) * .0015;
    const teamExpectedGoals = 3.08 + (team.offense - 84) * .045 - (opponentTeam.defense - 84) * .045 + (game.home ? .10 : 0) + beautyForm + rosterInfluence(careerTeam) * .03 + teamPlayerForm(careerTeam, seasonSeed) * .04;
    const opponentExpectedGoals = 3.08 + (opponentTeam.offense - 84) * .045 - (team.defense - 84) * .045 + (game.home ? -.10 : .10) + (random() - .5) * .16 + rosterInfluence(game.opponent) * .03 + teamPlayerForm(game.opponent, seasonSeed) * .04;
    let teamScore = poisson(random, teamExpectedGoals);
    let opponentScore = poisson(random, opponentExpectedGoals);
    const overtime = teamScore === opponentScore;
    if (overtime) {
      if (random() < .5 + (team.overall - opponentTeam.overall) * .012 + (overall - 82) * .002) teamScore += 1;
      else opponentScore += 1;
    }
    const win = teamScore > opponentScore;
    const result: CompletedGame["result"] = win ? "W" : overtime ? "OTL" : "L";
    const isDefenseman = position === "D";
    const isGoalie = position === "G";
    const isOffensiveDefenseman = archetype === "Offensive Defenseman";
    const isTwoWayDefenseman = archetype === "Two-Way Defenseman" || archetype === "Mobile Defender";
    const shooting = buildRatings.pow * .4 + buildRatings.acc * .4 + buildRatings.off * .2;
    const puckSkill = buildRatings.off * .45 + buildRatings.pas * .4 + buildRatings.spd * .15;
    // Defensemen score predominantly through assists. A shutdown player with a
    // high offensive-awareness pull is still not treated as a 25-goal forward;
    // offensive blue-liners can reach that territory only through a rare spike.
    const defenseGoalMean = Math.max(.025, .03 + (shooting - 70) * .0027 + (isOffensiveDefenseman ? .038 : isTwoWayDefenseman ? .019 : 0) + beautyForm * .07);
    const defenseAssistMean = Math.max(.10, .12 + (puckSkill - 70) * .0075 + (isOffensiveDefenseman ? .07 : isTwoWayDefenseman ? .04 : .012) + beautyForm * .12);
    const forwardGoalMean = Math.max(.08, .22 + (shooting - 75) * .006 + beautyForm * .24 + eliteOpportunity * .42 + eliteOffensiveBonus * .43 + beautySeasonForm * .42);
    const forwardAssistMean = Math.max(.08, .25 + (puckSkill - 75) * .0075 + beautyForm * .3 + eliteOpportunity * .58 + eliteOffensiveBonus * .57 + beautySeasonForm * .58);
    const goals = isGoalie ? 0 : Math.max(0, Math.min(isDefenseman ? 2 : 3, poisson(random, isDefenseman ? defenseGoalMean : forwardGoalMean)));
    const assists = isGoalie ? 0 : Math.max(0, Math.min(isDefenseman ? 3 : 4, poisson(random, isDefenseman ? defenseAssistMean : forwardAssistMean)));
    const shots = Math.max(1, goals + poisson(random, 2.2 + (shooting - 75) * .035 + eliteOpportunity * 1.5));
    const toi = `${15 + Math.floor(random() * 7)}:${String(Math.floor(random() * 60)).padStart(2, "0")}`;
    return { teamScore, opponentScore, result, goals, assists, shots, toi };
  }, [archetype, buildRatings, careerTeam, overall, position, seasonSeed]);

  const completeGames = useCallback((count: number) => {
    const games = teamSchedule.slice(gameIndex, gameIndex + count);
    if (!games.length) return;
    const completed = games.map((game, offset) => {
      const result = gameResult(gameIndex + offset, game);
      return { result: result.result, matchup: game.home ? `${careerTeam} vs ${game.opponent}` : `${careerTeam} @ ${game.opponent}`, score: `${result.teamScore}-${result.opponentScore}${result.result === "OTL" ? " OT" : ""}`, statline: `${result.goals} G · ${result.assists} A · ${result.goals + result.assists} PTS · ${result.shots} SOG · ${result.toi} TOI`, points: result.goals + result.assists };
    });
    setRecord((current) => completed.reduce((updated, game) => ({ wins: updated.wins + (game.result === "W" ? 1 : 0), losses: updated.losses + (game.result === "L" ? 1 : 0), overtimeLosses: updated.overtimeLosses + (game.result === "OTL" ? 1 : 0) }), current));
    setLastFive((current) => [...completed.reverse(), ...current].slice(0, 5));
    setBeautyStats((current) => completed.reduce((updated, game) => {
      const [goals, , , assists] = game.statline.split(" ");
      const nextGoals = Number(goals) || 0;
      const nextAssists = Number(assists) || 0;
      return { goals: updated.goals + nextGoals, assists: updated.assists + nextAssists, points: updated.points + game.points };
    }, current));
    const nextIndex = Math.min(teamSchedule.length, gameIndex + games.length);
    setGameIndex(nextIndex);
    if (nextIndex >= 82) setShowSeasonComplete(true);
  }, [careerTeam, gameIndex, gameResult, teamSchedule]);

  const makesPlayoffs = reachesPlayoffs(careerTeam, gamesPlayed, record, seasonSeed, schedule);
  const saveCurrentRun = async (result: string) => {
    try {
      await saveRun({ mode: "classic", position, overall, archetype, career_team: careerTeam, record: `${record.wins}-${record.losses}-${record.overtimeLosses}`, result, build_snapshot: buildRatings });
      setSaveMessage("Run saved to your profile.");
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : "Could not save this run."); }
  };

  useEffect(() => {
    const playoffsButton = [...document.querySelectorAll<HTMLButtonElement>(".season-sim-panel button")].find((button) => button.textContent === "Playoffs");
    if (!playoffsButton) return;
    const finishSeason = () => completeGames(82 - gamesPlayed);
    playoffsButton.disabled = watching || gamesPlayed >= 82;
    playoffsButton.addEventListener("click", finishSeason);
    return () => playoffsButton.removeEventListener("click", finishSeason);
  }, [completeGames, gamesPlayed, watching]);

  useEffect(() => {
    if (!watching) return;
    if (watchTick >= 30) {
      completeGames(1);
      setWatching(false);
      setWatchTick(0);
      return;
    }
    const cadence = { Slow: 900, Normal: 520, Fast: 260, Ultra: 110 }[speed] ?? 520;
    const timer = window.setTimeout(() => setWatchTick((tick) => tick + 1), cadence);
    return () => window.clearTimeout(timer);
  }, [completeGames, speed, watchTick, watching]);

  const startWatch = () => {
    if (watching || gameIndex >= teamSchedule.length) return;
    setWatchTick(0);
    setWatching(true);
  };

  const liveResult = gameResult(gameIndex, nextGame);
  const period = Math.min(3, Math.floor(watchTick / 10) + 1);
  const clock = formatClock(Math.max(0, 1200 - (watchTick % 10) * 120));
  const teamLiveScore = Math.min(liveResult.teamScore, Math.floor((liveResult.teamScore * watchTick) / 30));
  const opponentLiveScore = Math.min(liveResult.opponentScore, Math.floor((liveResult.opponentScore * watchTick) / 30));
  const playerPoints = beautyStats.points;

  useEffect(() => {
    const statCells = document.querySelectorAll<HTMLElement>(".season-team-averages span");
    const statValues: Array<[number, string]> = [[beautyStats.goals, "G"], [beautyStats.assists, "A"], [beautyStats.points, "PTS"]];
    statCells.forEach((cell, index) => {
      const [value, label] = statValues[index] ?? [0, ""];
      const valueNode = cell.querySelector("strong");
      const labelNode = cell.querySelector("small");
      if (valueNode) valueNode.textContent = String(value);
      if (labelNode) labelNode.textContent = label;
    });
  }, [beautyStats]);
  const leagueLines = useMemo(() => nhlRosterData.filter((player) => !player.isDynasty).map((player) => playerLine(player, gamesPlayed, seasonSeed)), [gamesPlayed, seasonSeed]);
  const skaterLines = leagueLines.filter((line) => line.player.position !== "G");
  const goalies = leagueLines.filter((line) => line.player.position === "G");
  const awards = gamesPlayed ? [
    { award: "Hart Trophy", detail: "League MVP", winner: awardWinner(skaterLines, (line) => line.points + line.goals * .18 + (line.player.ratings.POI ?? 75) * .08 + simulatedRecord(line.player.team, gamesPlayed, seasonSeed).wins * .11, (line) => line.points + line.goals * .18 + (line.player.ratings.POI ?? 75) * .08 + simulatedRecord(line.player.team, gamesPlayed, seasonSeed).wins * .11 + awardVariance(line.player.name, "hart", seasonSeed, 36), 64), value: "GAP" },
    { award: "Art Ross Trophy", detail: "Most points", winner: awardWinner(skaterLines, (line) => line.points, (line) => line.points, 72), value: "GAP" },
    { award: "Rocket Richard Trophy", detail: "Most goals", winner: awardWinner(skaterLines, (line) => line.goals, (line) => line.goals, 64), value: "G" },
    { award: "Norris Trophy", detail: "Top defenseman", winner: awardWinner(skaterLines.filter((line) => line.player.position === "D"), (line) => line.points + (line.player.ratings.DEF ?? 75) * .34 + (line.player.ratings.PAS ?? 75) * .08, (line) => line.points + (line.player.ratings.DEF ?? 75) * .34 + (line.player.ratings.PAS ?? 75) * .08 + awardVariance(line.player.name, "norris", seasonSeed, 28), 42), value: "GAP" },
    { award: "Vezina Trophy", detail: "Top goaltender", winner: awardWinner(goalies.filter((line) => line.starts >= Math.min(28, gamesPlayed * .42)), (line) => vezinaScore(line), (line) => vezinaScore(line) + awardVariance(line.player.name, "vezina", seasonSeed, 27), 28), value: "GOALIE" },
  ] : [];

  useEffect(() => {
    if (!showSeasonComplete) return;
    const summary = document.querySelector<HTMLElement>(".season-final-line");
    if (summary) {
      const cards = [...summary.querySelectorAll<HTMLElement>("span")];
      const values = [["G", String(beautyStats.goals)], ["PTS", String(beautyStats.points)], ["A", String(beautyStats.assists)], ["RECORD", `${record.wins}-${record.losses}-${record.overtimeLosses}`]];
      const assistCard = cards[2]?.cloneNode(true) as HTMLElement | undefined;
      if (assistCard && cards.length === 3) summary.insertBefore(assistCard, cards[2]);
      [...summary.querySelectorAll<HTMLElement>("span")].forEach((card, index) => {
        const [label, value] = values[index] ?? ["", ""];
        const labelNode = card.querySelector("small");
        const valueNode = card.querySelector("strong");
        if (labelNode) labelNode.textContent = label;
        if (valueNode) valueNode.textContent = value;
      });
    }
    document.querySelectorAll<HTMLElement>(".season-awards-list article").forEach((card, index) => {
      const winner = awards[index]?.winner;
      const statline = card.querySelector("span");
      if (!winner || !statline) return;
      const award = awards[index].award;
      if (award === "Rocket Richard Trophy") statline.textContent = `${winner.goals} G`;
      else if (award === "Vezina Trophy") {
        const losses = Math.max(0, winner.starts - winner.wins - Math.round(winner.starts * .08));
        const overtime = Math.max(1, Math.round(winner.starts * .08));
        statline.textContent = `${winner.gamesPlayed} GP · ${winner.starts} GS · ${winner.wins}-${losses}-${overtime} · ${winner.gaa.toFixed(2)} GAA · ${winner.savePct.toFixed(3)} SV%`;
      } else statline.textContent = `${winner.goals} G · ${winner.assists} A · ${winner.points} PTS`;
    });
  }, [awards, beautyStats, record, showSeasonComplete]);

  useEffect(() => {
    const panel = document.querySelector<HTMLElement>(".season-sim-panel");
    if (!panel) return;
    const existing = panel.querySelector<HTMLElement>(".post-season-actions");
    if (gamesPlayed < 82) {
      existing?.remove();
      return;
    }
    const controls = existing ?? document.createElement("div");
    controls.className = "post-season-actions";
    controls.innerHTML = makesPlayoffs ? '<button type="button" class="view-awards">View awards</button><button type="button" class="enter-playoffs">Enter playoffs</button>' : '<button type="button" class="view-awards">View awards</button>';
    if (!existing) panel.appendChild(controls);
    const viewAwards = controls.querySelector<HTMLButtonElement>(".view-awards");
    const enterPlayoffs = controls.querySelector<HTMLButtonElement>(".enter-playoffs");
    const showAwards = () => setShowSeasonComplete(true);
    const beginPlayoffs = () => {
      window.sessionStorage.setItem("build-a-beauty-playoff-bracket", JSON.stringify(playoffBracket));
      window.location.href = `/playoffs?team=${encodeURIComponent(careerTeam)}&overall=${overall}&position=${position}&archetype=${encodeURIComponent(archetype)}`;
    };
    viewAwards?.addEventListener("click", showAwards);
    enterPlayoffs?.addEventListener("click", beginPlayoffs);
    return () => {
      viewAwards?.removeEventListener("click", showAwards);
      enterPlayoffs?.removeEventListener("click", beginPlayoffs);
    };
  }, [careerTeam, gamesPlayed, makesPlayoffs, overall, playoffBracket]);

  useEffect(() => {
    if (gamesPlayed >= 82 && !makesPlayoffs && !showSeasonComplete) setShowSeasonEnd(true);
  }, [gamesPlayed, makesPlayoffs, showSeasonComplete]);

  return <>
    <section className="season-intro"><div><p className="season-eyebrow">2026–27 season</p><h1>League Sim</h1><p>Your Beauty begins with the {careerTeam}. Division leaders take the top three playoff seeds; the next two teams in each conference claim the wild cards.</p></div><div className="season-controls"><label>Sim speed<select value={speed} onChange={(event) => setSpeed(event.target.value)}><option>Slow</option><option>Normal</option><option>Fast</option><option>Ultra</option></select></label><div><span>Your OVR</span><strong>{overall}</strong></div></div></section>
    <div className="season-dashboard"><div className="season-game-column"><section className="season-team-panel"><div className="season-team-heading"><p className="season-eyebrow">Your team</p><span>Seed <b>—</b></span></div><h2>{careerTeam}</h2><div className="season-team-metrics"><span><small>Conf</small><strong>{conference}</strong></span><span><small>Record</small><strong>{record.wins}-{record.losses}-{record.overtimeLosses}</strong></span><span><small>Left</small><strong>{Math.max(0, 82 - gamesPlayed)}</strong></span><span><small>Game</small><strong>{Math.min(gamesPlayed + 1, 82)}/82</strong></span></div><div className="season-team-averages"><p className="season-eyebrow">Season avg</p><span><strong>{gamesPlayed ? (playerPoints / gamesPlayed).toFixed(1) : "—"}</strong><small>PTS</small></span><span><strong>—</strong><small>G</small></span><span><strong>—</strong><small>A</small></span></div></section><section className="season-sim-panel"><p className="season-eyebrow">Sim</p><div><button className="season-watch-button" type="button" disabled={watching || gamesPlayed >= 82} onClick={startWatch}>Watch 1</button><button type="button" disabled={watching || gamesPlayed >= 82} onClick={() => completeGames(1)}>Sim 1</button><button type="button" disabled={watching || gamesPlayed >= 82} onClick={() => completeGames(5)}>Sim 5</button><button type="button" disabled={gamesPlayed < 82}>Playoffs</button></div></section><section className="gamecast-panel"><div className="gamecast-heading"><div><p className="season-eyebrow">Regular gamecast</p><p>{watching ? `Live at ${speed.toLowerCase()} speed.` : "Your next scheduled opponent and their season leaders."}</p></div>{watching && <button type="button" className="gamecast-skip" onClick={() => setWatching(false)}>Stop watching</button>}</div>{watching ? <><div className="game-score"><div><strong>{careerTeam}</strong><b>{teamLiveScore}</b></div><span><small>{period === 3 && clock === "0:00" ? "FINAL" : `${period}${period === 1 ? "ST" : period === 2 ? "ND" : "RD"}`}</small><strong>{clock}</strong></span><div><strong>{opponent}</strong><b>{opponentLiveScore}</b></div></div><div className="game-beauty-box"><div><p className="season-eyebrow">Your Beauty</p><span>Live box</span></div><dl><div><dt>G</dt><dd>{Math.min(liveResult.goals, Math.floor(liveResult.goals * watchTick / 30))}</dd></div><div><dt>A</dt><dd>{Math.min(liveResult.assists, Math.floor(liveResult.assists * watchTick / 30))}</dd></div><div><dt>PTS</dt><dd>{Math.min(liveResult.goals + liveResult.assists, Math.floor((liveResult.goals + liveResult.assists) * watchTick / 30))}</dd></div><div><dt>SOG</dt><dd>{Math.min(liveResult.shots, Math.floor(liveResult.shots * watchTick / 30))}</dd></div><div><dt>HIT</dt><dd>{Math.floor(watchTick / 11)}</dd></div><div><dt>TOI</dt><dd>{Math.min(20, Math.floor(watchTick * 0.65))}:00</dd></div></dl></div><div className="game-events"><p><strong>{period}RD {clock}</strong>{watchTick < 10 ? " Opening shift underway." : watchTick < 20 ? " The middle frame is in motion." : " The game is tightening late."}</p><p><strong>Live</strong>{careerTeam} {teamLiveScore}-{opponentLiveScore} {opponent}.</p></div></> : <div className="upcoming-game"><div><span>Next game</span><h3>{gamesPlayed >= 82 ? "Regular season complete" : nextGame.home ? `${careerTeam} vs ${opponent}` : `${careerTeam} @ ${opponent}`}</h3><p>{gamesPlayed >= 82 ? "82 games played" : `${opponent} · ${simulatedRecord(opponent, gamesPlayed, seasonSeed).wins}-${simulatedRecord(opponent, gamesPlayed, seasonSeed).losses}-${simulatedRecord(opponent, gamesPlayed, seasonSeed).overtimeLosses}`}</p></div>{gamesPlayed < 82 && <div className="opponent-leaders"><span><b>G</b>{leaders.goals}<small>{[...leagueLines].find((line) => line.player.name === leaders.goals)?.goals ?? 0}</small></span><span><b>A</b>{leaders.assists}<small>{[...leagueLines].find((line) => line.player.name === leaders.assists)?.assists ?? 0}</small></span><span><b>PTS</b>{leaders.points}<small>{[...leagueLines].find((line) => line.player.name === leaders.points)?.points ?? 0}</small></span></div>}</div>}</section><section className="last-five-panel"><div className="last-five-heading"><p className="season-eyebrow">Last 5</p><span>Player log</span></div>{lastFive.length ? <div className="last-five-list">{lastFive.map((game, index) => <div className="last-five-game" key={`${game.matchup}-${index}`}><b className={`last-five-result is-${game.result.toLowerCase()}`}>{game.result}</b><div><strong>{game.matchup}</strong><span>{game.statline}</span></div><em>{game.score}</em></div>)}</div> : <div className="last-five-empty"><strong>No games played</strong><span>Your last five player performances will appear here once the season begins.</span></div>}</section></div><section className="season-standings"><div className="conference-grid"><section className="conference-column"><p className="conference-label">Eastern Conference</p>{east.map((division) => <StandingsTable key={division.name} name={division.name} teams={division.teams} careerTeam={careerTeam} wildcards={eastWildcards} record={record} leagueGames={gamesPlayed} seasonSeed={seasonSeed} schedule={schedule} />)}</section><section className="conference-column"><p className="conference-label">Western Conference</p>{west.map((division) => <StandingsTable key={division.name} name={division.name} teams={division.teams} careerTeam={careerTeam} wildcards={westWildcards} record={record} leagueGames={gamesPlayed} seasonSeed={seasonSeed} schedule={schedule} />)}</section></div></section></div>
    {showSeasonComplete && gamesPlayed >= 82 && <div className="season-complete-backdrop" role="dialog" aria-modal="true" aria-label="Season complete"><section className="season-complete-modal"><button className="season-complete-close" type="button" onClick={() => setShowSeasonComplete(false)}>Close</button><p className="season-eyebrow">Season complete</p><h2>AWARDS &amp; AVERAGES</h2><div className="season-final-line"><span><small>GP</small><strong>82</strong></span><span><small>PTS</small><strong>{(playerPoints / 82).toFixed(1)}</strong></span><span><small>RECORD</small><strong>{record.wins}-{record.losses}-{record.overtimeLosses}</strong></span></div><p className="season-eyebrow season-awards-label">Awards</p><div className="season-awards-list">{awards.map(({ award, detail, winner, value }) => winner && <article key={award}><div><small>{award}</small><strong>{winner.player.name}</strong><span>{detail} · {value === "SV%" ? winner.savePct.toFixed(3) : `${value === "G" ? winner.goals : winner.points} ${value}`}</span></div><b>{winner.player.team}</b></article>)}</div></section></div>}
    {showSeasonEnd && <div className="season-complete-backdrop" role="dialog" aria-modal="true" aria-label="Playoffs complete"><section className="season-complete-modal season-end-modal"><button className="season-complete-close" type="button" onClick={() => setShowSeasonEnd(false)}>Close</button><p className="season-eyebrow">Season complete</p><h2>{simulatedPlayoffOutcome.champion} are champions</h2><p className="season-end-summary">{simulatedPlayoffOutcome.champion} defeat {simulatedPlayoffOutcome.finalist} {simulatedPlayoffOutcome.finalScore} in the Stanley Cup Final.</p><div className="season-end-grid"><article><small>Finals MVP</small><strong>{simulatedPlayoffOutcome.finalsMvp}</strong></article><article><small>Your run</small><strong>Missed Playoffs</strong></article></div><article className="season-achievements"><small>Achievements</small><span>{saveMessage || "Save this completed run to your profile."}</span></article><div className="season-end-actions"><button type="button" onClick={() => saveCurrentRun("Missed Playoffs")}>Save run</button><button type="button" onClick={() => setShowSeasonEnd(false)}>Close</button><a href="/profile">My profile</a></div></section></div>}
  </>;
}
