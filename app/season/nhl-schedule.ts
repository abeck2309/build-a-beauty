export type ScheduledGame = { opponent: string; home: boolean };

type Division = { name: string; conference: "Eastern" | "Western"; teams: string[]; canadianTeams?: string[] };

const divisions: Division[] = [
  { name: "Atlantic", conference: "Eastern", teams: ["Boston Bruins", "Buffalo Sabres", "Detroit Red Wings", "Florida Panthers", "Montreal Canadiens", "Ottawa Senators", "Tampa Bay Lightning", "Toronto Maple Leafs"], canadianTeams: ["Montreal Canadiens", "Ottawa Senators", "Toronto Maple Leafs"] },
  { name: "Metropolitan", conference: "Eastern", teams: ["Carolina Hurricanes", "Columbus Blue Jackets", "New Jersey Devils", "New York Islanders", "New York Rangers", "Philadelphia Flyers", "Pittsburgh Penguins", "Washington Capitals"] },
  { name: "Central", conference: "Western", teams: ["Chicago Blackhawks", "Colorado Avalanche", "Dallas Stars", "Minnesota Wild", "Nashville Predators", "St. Louis Blues", "Utah Mammoth", "Winnipeg Jets"] },
  { name: "Pacific", conference: "Western", teams: ["Anaheim Ducks", "Calgary Flames", "Edmonton Oilers", "Los Angeles Kings", "San Jose Sharks", "Seattle Kraken", "Vancouver Canucks", "Vegas Golden Knights"], canadianTeams: ["Calgary Flames", "Edmonton Oilers", "Vancouver Canucks"] },
];

const allTeams = divisions.flatMap((division) => division.teams);

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

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function addSeries(schedule: Record<string, ScheduledGame[]>, first: string, second: string, games: number, random: () => number) {
  const firstHostsExtra = games % 2 === 1 && random() >= 0.5;
  const firstHome = Math.floor(games / 2) + Number(firstHostsExtra);
  for (let game = 0; game < games; game += 1) {
    const firstHomeGame = game < firstHome;
    schedule[first].push({ opponent: second, home: firstHomeGame });
    schedule[second].push({ opponent: first, home: !firstHomeGame });
  }
}

function divisionFourGamePairs(division: Division, random: () => number) {
  const forced = new Set<string>();
  for (const first of division.canadianTeams ?? []) for (const second of division.canadianTeams ?? []) if (first < second) forced.add(`${first}|${second}`);
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const order = shuffled(division.teams, random);
    const threeGamePairs = new Set<string>();
    let valid = true;
    for (let index = 0; index < order.length; index += 1) {
      const pair = [order[index], order[(index + 1) % order.length]].sort().join("|");
      if (forced.has(pair)) { valid = false; break; }
      threeGamePairs.add(pair);
    }
    if (valid && threeGamePairs.size === 8) return threeGamePairs;
  }
  throw new Error(`Unable to assign division schedule for ${division.name}.`);
}

function arrangeGames(games: ScheduledGame[], random: () => number) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate = shuffled(games, random);
    let valid = true;
    for (let index = 1; index < candidate.length; index += 1) {
      if (candidate[index].opponent === candidate[index - 1].opponent) { valid = false; break; }
      if (index >= 4 && candidate.slice(index - 4, index + 1).every((game) => game.home === candidate[index].home)) { valid = false; break; }
    }
    if (valid) return candidate;
  }
  return shuffled(games, random);
}

/** Generates the 82-game matrix: 26 division, 24 same-conference, 32 interconference. */
export function generateNhlSchedule(seed = 202627) {
  const random = seededRandom(seed);
  const schedule = Object.fromEntries(allTeams.map((team) => [team, [] as ScheduledGame[]])) as Record<string, ScheduledGame[]>;
  for (const division of divisions) {
    const threeGamePairs = divisionFourGamePairs(division, random);
    for (let firstIndex = 0; firstIndex < division.teams.length; firstIndex += 1) for (let secondIndex = firstIndex + 1; secondIndex < division.teams.length; secondIndex += 1) {
      const first = division.teams[firstIndex];
      const second = division.teams[secondIndex];
      const pair = [first, second].sort().join("|");
      addSeries(schedule, first, second, threeGamePairs.has(pair) ? 3 : 4, random);
    }
  }
  for (const conference of ["Eastern", "Western"] as const) {
    const [firstDivision, secondDivision] = divisions.filter((division) => division.conference === conference);
    for (const first of firstDivision.teams) for (const second of secondDivision.teams) addSeries(schedule, first, second, 3, random);
  }
  const eastern = divisions.filter((division) => division.conference === "Eastern").flatMap((division) => division.teams);
  const western = divisions.filter((division) => division.conference === "Western").flatMap((division) => division.teams);
  for (const first of eastern) for (const second of western) addSeries(schedule, first, second, 2, random);
  for (const team of allTeams) {
    if (schedule[team].length !== 82) throw new Error(`${team} has ${schedule[team].length} games instead of 82.`);
    schedule[team] = arrangeGames(schedule[team], random);
  }
  return schedule;
}
