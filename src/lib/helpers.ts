// We use the class saving throws as a proxy for their primary stats.
// The key is the class 'index' from the API.
export const CLASS_PRIMARY_STATS: Record<string, string[]> = {
  barbarian: ["str", "con"],
  bard: ["dex", "cha"],
  cleric: ["wis", "cha"],
  druid: ["int", "wis"],
  fighter: ["str", "con"],
  monk: ["str", "dex"],
  paladin: ["wis", "cha"],
  ranger: ["str", "dex"],
  rogue: ["dex", "int"],
  sorcerer: ["con", "cha"],
  warlock: ["wis", "cha"],
  wizard: ["int", "wis"],
};

// A map for ability score abbreviations
export const ABILITY_SCORE_MAP: Record<string, string> = {
  STR: "str",
  DEX: "dex",
  CON: "con",
  INT: "int",
  WIS: "wis",
  CHA: "cha",
};

export const ABILITIES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export type Ability = (typeof ABILITIES)[number];

// Simulates rolling 4 six-sided dice and summing the highest 3
export function rollForStat(): number {
  const rolls: number[] = [];
  for (let i = 0; i < 4; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1);
  }

  // Sort rolls in ascending order and remove the lowest (the first element)
  rolls.sort((a, b) => a - b).shift();

  // Sum the remaining 3 dice
  return rolls.reduce((sum, current) => sum + current, 0);
}

export const CANTRIP_COUNTS: Record<string, number> = {
  bard: 2,
  cleric: 3,
  druid: 2,
  sorcerer: 4,
  warlock: 2,
  wizard: 3,
  // Other classes like Fighter, Rogue, etc., get 0 at level 1.
};
