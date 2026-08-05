export type TeamRating = { offense: number; defense: number; overall: number };

// Simulation ratings. They are deliberately separate from player-card data:
// offense sets scoring expectation, defense sets prevention, and overall is
// their rounded average. Update these values when tuning league simulations.
const inputs: Array<[string, number, number]> = [
  ["Anaheim Ducks", 85, 81], ["Boston Bruins", 85, 87], ["Buffalo Sabres", 86, 83],
  ["Calgary Flames", 81, 82], ["Carolina Hurricanes", 89, 90], ["Chicago Blackhawks", 83, 80],
  ["Colorado Avalanche", 91, 87], ["Columbus Blue Jackets", 83, 82], ["Dallas Stars", 89, 89],
  ["Detroit Red Wings", 84, 82], ["Edmonton Oilers", 89, 84], ["Florida Panthers", 90, 87],
  ["Los Angeles Kings", 84, 84], ["Minnesota Wild", 86, 87], ["Montreal Canadiens", 87, 84],
  ["Nashville Predators", 82, 83], ["New Jersey Devils", 87, 84], ["New York Islanders", 81, 85],
  ["New York Rangers", 84, 86], ["Ottawa Senators", 84, 85], ["Philadelphia Flyers", 81, 82],
  ["Pittsburgh Penguins", 84, 83], ["San Jose Sharks", 85, 83], ["Seattle Kraken", 80, 83],
  ["St. Louis Blues", 82, 84], ["Tampa Bay Lightning", 88, 85], ["Toronto Maple Leafs", 83, 83],
  ["Utah Mammoth", 87, 85], ["Vancouver Canucks", 81, 82], ["Vegas Golden Knights", 88, 88],
  ["Washington Capitals", 87, 84], ["Winnipeg Jets", 83, 85],
];

export const teamRatings: Record<string, TeamRating> = Object.fromEntries(
  inputs.map(([team, offense, defense]) => [team, { offense, defense, overall: Math.round((offense + defense) / 2) }]),
);

export function ratingFor(team: string): TeamRating {
  return teamRatings[team] ?? { offense: 82, defense: 82, overall: 82 };
}
