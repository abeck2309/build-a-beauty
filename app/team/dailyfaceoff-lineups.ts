/**
 * Projected first units captured from Daily Faceoff's 2026 offseason lineup
 * pages.  This is deliberately static so a completed run does not change when
 * Daily Faceoff updates a club's combinations mid-season.
 */
export type ProjectedFirstUnit = {
  forwards: readonly [leftWing: string, center: string, rightWing: string];
  defense: readonly [leftDefense: string, rightDefense: string];
  goalie: string;
};

export const dailyFaceoffFirstUnits: Record<string, ProjectedFirstUnit> = {
  "Anaheim Ducks": { forwards: ["Chris Kreider", "Leo Carlsson", "Troy Terry"], defense: ["Jackson Lacombe", "Tristan Luneau"], goalie: "Lukas Dostal" },
  "Boston Bruins": { forwards: ["JJ Peterka", "Pavel Zacha", "David Pastrnak"], defense: ["Mason Lohrei", "Charlie McAvoy"], goalie: "Jeremy Swayman" },
  "Buffalo Sabres": { forwards: ["Zach Benson", "Jiri Kulich", "Tage Thompson"], defense: ["Mattias Samuelsson", "Rasmus Dahlin"], goalie: "Ukko-Pekka Luukkonen" },
  "Calgary Flames": { forwards: ["Matvei Gridin", "Morgan Frost", "Matt Coronato"], defense: ["Kevin Bahl", "Zach Whitecloud"], goalie: "Dustin Wolf" },
  "Carolina Hurricanes": { forwards: ["Nikolaj Ehlers", "Sebastian Aho", "Andrei Svechnikov"], defense: ["Jaccob Slavin", "Jalen Chatfield"], goalie: "Brandon Bussi" },
  "Chicago Blackhawks": { forwards: ["Tyler Bertuzzi", "Anton Frondell", "Roman Kantserov"], defense: ["Alex Vlasic", "Bowen Byram"], goalie: "Spencer Knight" },
  "Colorado Avalanche": { forwards: ["Artturi Lehkonen", "Nathan MacKinnon", "Martin Necas"], defense: ["Devon Toews", "Cale Makar"], goalie: "Scott Wedgewood" },
  "Columbus Blue Jackets": { forwards: ["Valeri Nichushkin", "Adam Fantilli", "Kirill Marchenko"], defense: ["Zach Werenski", "Damon Severson"], goalie: "Jet Greaves" },
  "Dallas Stars": { forwards: ["Justin Hryckowian", "Wyatt Johnston", "Mikko Rantanen"], defense: ["Esa Lindell", "Miro Heiskanen"], goalie: "Jake Oettinger" },
  "Detroit Red Wings": { forwards: ["Emmitt Finnie", "Dylan Larkin", "Lucas Raymond"], defense: ["Simon Edvinsson", "Moritz Seider"], goalie: "John Gibson" },
  "Edmonton Oilers": { forwards: ["Isaac Howard", "Connor McDavid", "Zach Hyman"], defense: ["Mattias Ekholm", "Evan Bouchard"], goalie: "Frederik Andersen" },
  "Florida Panthers": { forwards: ["Brady Tkachuk", "Aleksander Barkov", "Sam Reinhart"], defense: ["Gustav Forsling", "Aaron Ekblad"], goalie: "Jacob Markstrom" },
  "Los Angeles Kings": { forwards: ["Artemi Panarin", "Quinton Byfield", "Adrian Kempe"], defense: ["Mikey Anderson", "Drew Doughty"], goalie: "Darcy Kuemper" },
  "Minnesota Wild": { forwards: ["Kirill Kaprizov", "Danila Yurov", "Maxim Shabanov"], defense: ["Quinn Hughes", "Brock Faber"], goalie: "Jesper Wallstedt" },
  "Montreal Canadiens": { forwards: ["Cole Caufield", "Nick Suzuki", "Juraj Slafkovsky"], defense: ["Mike Matheson", "Noah Dobson"], goalie: "Jakub Dobes" },
  "Nashville Predators": { forwards: ["Steven Stamkos", "Ryan O'Reilly", "Luke Evangelista"], defense: ["Roman Josi", "Brady Skjei"], goalie: "Juuse Saros" },
  "New Jersey Devils": { forwards: ["Timo Meier", "Nico Hischier", "Dawson Mercer"], defense: ["Jonas Siegenthaler", "Dougie Hamilton"], goalie: "Jake Allen" },
  "New York Islanders": { forwards: ["Emil Heineman", "Bo Horvat", "Kyle Palmieri"], defense: ["Matthew Schaefer", "Ryan Pulock"], goalie: "Ilya Sorokin" },
  "New York Rangers": { forwards: ["Gabriel Perreault", "Mika Zibanejad", "Pavel Dorofeyev"], defense: ["Vladislav Gavrikov", "Adam Fox"], goalie: "Igor Shesterkin" },
  "Ottawa Senators": { forwards: ["William Eklund", "Tim Stützle", "Fabian Zetterlund"], defense: ["Jake Sanderson", "Artem Zub"], goalie: "Linus Ullmark" },
  "Philadelphia Flyers": { forwards: ["Travis Konecny", "Christian Dvorak", "Porter Martone"], defense: ["Travis Sanheim", "Rasmus Ristolainen"], goalie: "Dan Vladar" },
  "Pittsburgh Penguins": { forwards: ["Rickard Rakell", "Sidney Crosby", "Bryan Rust"], defense: ["Trevor van Riemsdyk", "Erik Karlsson"], goalie: "Arturs Silovs" },
  "San Jose Sharks": { forwards: ["Igor Chernyshov", "Macklin Celebrini", "Will Smith"], defense: ["Sam Dickinson", "Jacob Trouba"], goalie: "Yaroslav Askarov" },
  "Seattle Kraken": { forwards: ["Bobby McMann", "Matty Beniers", "Jordan Eberle"], defense: ["Vince Dunn", "Adam Larsson"], goalie: "Joey Daccord" },
  "St. Louis Blues": { forwards: ["Dylan Holloway", "Robert Thomas", "Jimmy Snuggerud"], defense: ["Philip Broberg", "Logan Mailloux"], goalie: "Joel Hofer" },
  "Tampa Bay Lightning": { forwards: ["Jake Guentzel", "Brayden Point", "Nikita Kucherov"], defense: ["J.J. Moser", "John Carlson"], goalie: "Andrei Vasilevskiy" },
  "Toronto Maple Leafs": { forwards: ["Matthew Knies", "Auston Matthews", "Jack Roslovic"], defense: ["Jake McCabe", "Darren Raddysh"], goalie: "Sergei Bobrovsky" },
  "Utah Mammoth": { forwards: ["Lawson Crouse", "Nick Schmaltz", "Clayton Keller"], defense: ["Mikhail Sergachev", "MacKenzie Weegar"], goalie: "Karel Vejmelka" },
  "Vancouver Canucks": { forwards: ["Jake DeBrusk", "Elias Pettersson", "Linus Karlsson"], defense: ["Zeev Buium", "Filip Hronek"], goalie: "Thatcher Demko" },
  "Vegas Golden Knights": { forwards: ["Ivan Barbashev", "Jack Eichel", "Mark Stone"], defense: ["Brayden McNabb", "Shea Theodore"], goalie: "Carter Hart" },
  "Washington Capitals": { forwards: ["Alex Tuch", "Dylan Strome", "Jordan Kyrou"], defense: ["Jakob Chychrun", "Matt Roy"], goalie: "Logan Thompson" },
  "Winnipeg Jets": { forwards: ["Kyle Connor", "Mark Scheifele", "Gabriel Vilardi"], defense: ["Josh Morrissey", "Dylan DeMelo"], goalie: "Connor Hellebuyck" },
};
