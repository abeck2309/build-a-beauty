import { nhlRosterData, type NhlPlayer, type PlayerPosition } from "../build/nhl-roster-data";

export type TeamLineup = {
  forwards: Array<{ line: number; leftWing: NhlPlayer | null; center: NhlPlayer | null; rightWing: NhlPlayer | null }>;
  defensePairs: Array<{ pair: number; leftDefense: NhlPlayer | null; rightDefense: NhlPlayer | null }>;
  starter: NhlPlayer | null;
  backup: NhlPlayer | null;
};

export function beautyInsertionRank(position: PlayerPosition) {
  if (position === "G") return 1;
  return position === "D" ? 6 : 12;
}

export function playerOverall(player: NhlPlayer) {
  const ratings = Object.values(player.ratings);
  return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
}

function ordered(team: string, position: PlayerPosition) {
  return nhlRosterData.filter((player) => player.team === team && !player.isDynasty && player.position === position).sort((first, second) => playerOverall(second) - playerOverall(first));
}

function take(pool: NhlPlayer[], used: Set<string>, preferred?: (player: NhlPlayer) => number) {
  const candidates = pool.filter((player) => !used.has(player.name));
  const player = preferred ? [...candidates].sort((first, second) => preferred(second) - preferred(first))[0] : candidates[0];
  if (player) used.add(player.name);
  return player ?? null;
}

// The first unit is selected by role, not simply the top five ratings: it always
// contains a center, two wings, two defensemen and the best available goaltender.
export function buildTeamLineup(team: string): TeamLineup {
  const centers = ordered(team, "C");
  const wings = ordered(team, "W");
  const defense = ordered(team, "D");
  const goalies = ordered(team, "G");
  const used = new Set<string>();
  const forwards = Array.from({ length: 4 }, (_, index) => ({
    line: index + 1,
    leftWing: take(wings, used, (player) => (player.ratings.PAS ?? 0) + (player.ratings.OFF ?? 0)),
    center: take(centers, used, (player) => (player.ratings.OFF ?? 0) + (player.ratings.PAS ?? 0) + (player.ratings.DEF ?? 0) * .35),
    rightWing: take(wings, used, (player) => (player.ratings.POW ?? 0) + (player.ratings.ACC ?? 0) + (player.ratings.OFF ?? 0)),
  }));
  const usedDefense = new Set<string>();
  const defensePairs = Array.from({ length: 3 }, (_, index) => ({
    pair: index + 1,
    leftDefense: take(defense, usedDefense, (player) => (player.ratings.DEF ?? 0) + (player.ratings.PAS ?? 0) * .3),
    rightDefense: take(defense, usedDefense, (player) => (player.ratings.DEF ?? 0) + (player.ratings.BOD ?? 0) * .35 + (player.ratings.POW ?? 0) * .2),
  }));
  return { forwards, defensePairs, starter: goalies[0] ?? null, backup: goalies[1] ?? null };
}

// Used by the career flow: forwards replace the 12th forward, defensemen the
// sixth defenseman, and a goalie enters as the active starter. The thresholds
// keep a low-rated created player from arbitrarily pushing out a club's stars.
export function beautyDisplaces(team: string, position: PlayerPosition) {
  const lineup = buildTeamLineup(team);
  if (position === "G") return lineup.starter?.name ?? null;
  const ranked = position === "D"
    ? lineup.defensePairs.flatMap((pair) => [pair.leftDefense, pair.rightDefense]).filter((player): player is NhlPlayer => Boolean(player)).sort((a, b) => playerOverall(b) - playerOverall(a))
    : lineup.forwards.flatMap((line) => [line.leftWing, line.center, line.rightWing]).filter((player): player is NhlPlayer => Boolean(player)).sort((a, b) => playerOverall(b) - playerOverall(a));
  return ranked[beautyInsertionRank(position) - 1]?.name ?? null;
}
