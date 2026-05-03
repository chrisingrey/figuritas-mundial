import type {
  WorldCupAlbumPage,
  WorldCupAlbumTemplate,
  WorldCupSticker,
  WorldCupTeam,
} from "./WorldCupAlbumTypes";

const TEAMS: WorldCupTeam[] = [
  { code: "MEX", name: "Mexico", group: "A", confederation: "CONCACAF" },
  { code: "RSA", name: "South Africa", group: "A", confederation: "CAF" },
  { code: "KOR", name: "Korea Republic", group: "A", confederation: "AFC" },
  { code: "CZE", name: "Czechia", group: "A", confederation: "UEFA" },
  { code: "CAN", name: "Canada", group: "B", confederation: "CONCACAF" },
  { code: "BIH", name: "Bosnia and Herzegovina", group: "B", confederation: "UEFA" },
  { code: "QAT", name: "Qatar", group: "B", confederation: "AFC" },
  { code: "SUI", name: "Switzerland", group: "B", confederation: "UEFA" },
  { code: "BRA", name: "Brazil", group: "C", confederation: "CONMEBOL" },
  { code: "MAR", name: "Morocco", group: "C", confederation: "CAF" },
  { code: "HAI", name: "Haiti", group: "C", confederation: "CONCACAF" },
  { code: "SCO", name: "Scotland", group: "C", confederation: "UEFA" },
  { code: "USA", name: "USA", group: "D", confederation: "CONCACAF" },
  { code: "PAR", name: "Paraguay", group: "D", confederation: "CONMEBOL" },
  { code: "AUS", name: "Australia", group: "D", confederation: "AFC" },
  { code: "TUR", name: "Turkiye", group: "D", confederation: "UEFA" },
  { code: "GER", name: "Germany", group: "E", confederation: "UEFA" },
  { code: "CUW", name: "Curacao", group: "E", confederation: "CONCACAF" },
  { code: "CIV", name: "Cote d'Ivoire", group: "E", confederation: "CAF" },
  { code: "ECU", name: "Ecuador", group: "E", confederation: "CONMEBOL" },
  { code: "NED", name: "Netherlands", group: "F", confederation: "UEFA" },
  { code: "JPN", name: "Japan", group: "F", confederation: "AFC" },
  { code: "SWE", name: "Sweden", group: "F", confederation: "UEFA" },
  { code: "TUN", name: "Tunisia", group: "F", confederation: "CAF" },
  { code: "BEL", name: "Belgium", group: "G", confederation: "UEFA" },
  { code: "EGY", name: "Egypt", group: "G", confederation: "CAF" },
  { code: "IRN", name: "IR Iran", group: "G", confederation: "AFC" },
  { code: "NZL", name: "New Zealand", group: "G", confederation: "OFC" },
  { code: "ESP", name: "Spain", group: "H", confederation: "UEFA" },
  { code: "CPV", name: "Cabo Verde", group: "H", confederation: "CAF" },
  { code: "KSA", name: "Saudi Arabia", group: "H", confederation: "AFC" },
  { code: "URU", name: "Uruguay", group: "H", confederation: "CONMEBOL" },
  { code: "FRA", name: "France", group: "I", confederation: "UEFA" },
  { code: "SEN", name: "Senegal", group: "I", confederation: "CAF" },
  { code: "IRQ", name: "Iraq", group: "I", confederation: "AFC" },
  { code: "NOR", name: "Norway", group: "I", confederation: "UEFA" },
  { code: "ARG", name: "Argentina", group: "J", confederation: "CONMEBOL" },
  { code: "ALG", name: "Algeria", group: "J", confederation: "CAF" },
  { code: "AUT", name: "Austria", group: "J", confederation: "UEFA" },
  { code: "JOR", name: "Jordan", group: "J", confederation: "AFC" },
  { code: "POR", name: "Portugal", group: "K", confederation: "UEFA" },
  { code: "COD", name: "Congo DR", group: "K", confederation: "CAF" },
  { code: "UZB", name: "Uzbekistan", group: "K", confederation: "AFC" },
  { code: "COL", name: "Colombia", group: "K", confederation: "CONMEBOL" },
  { code: "ENG", name: "England", group: "L", confederation: "UEFA" },
  { code: "CRO", name: "Croatia", group: "L", confederation: "UEFA" },
  { code: "GHA", name: "Ghana", group: "L", confederation: "CAF" },
  { code: "PAN", name: "Panama", group: "L", confederation: "CONCACAF" },
];

const buildSpecialStickers = (): WorldCupSticker[] =>
  Array.from({ length: 20 }, (_, index) => ({
    id: `FWC26-S${String(index + 1).padStart(2, "0")}`,
    number: index + 1,
    type: "special",
    title: [
      "Album cover foil",
      "Tournament emblem",
      "Match ball",
      "Host cities map",
      "Trophy moment",
      "Opening match",
      "Final venue",
      "Group stage",
      "Round of 32",
      "Round of 16",
      "Quarter-finals",
      "Semi-finals",
      "Third-place match",
      "Final match",
      "Mascot Canada",
      "Mascot Mexico",
      "Mascot USA",
      "Legends foil",
      "Rising star foil",
      "Collector checklist",
    ][index],
    rarity: "special",
    page: index < 12 ? 1 : 2,
  }));

const buildTeamStickers = (): WorldCupSticker[] => {
  const firstTeamStickerNumber = 21;
  return TEAMS.flatMap((team, teamIndex) =>
    Array.from({ length: 20 }, (_, playerIndex) => {
      const number = firstTeamStickerNumber + teamIndex * 20 + playerIndex;
      return {
        id: `FWC26-${team.code}-${String(playerIndex + 1).padStart(2, "0")}`,
        number,
        type: "player",
        teamCode: team.code,
        teamName: team.name,
        playerName: `Jugador ${String(playerIndex + 1).padStart(2, "0")}`,
        title: `${team.name} - Jugador ${String(playerIndex + 1).padStart(2, "0")}`,
        rarity: "base",
        page: 3 + teamIndex * 2 + Math.floor(playerIndex / 10),
      };
    }),
  );
};

const buildPages = (stickers: WorldCupSticker[]): WorldCupAlbumPage[] => {
  const specialPages: WorldCupAlbumPage[] = [
    {
      number: 1,
      title: "Presentacion del torneo",
      type: "main",
      stickerNumbers: stickers.filter((sticker) => sticker.page === 1).map((sticker) => sticker.number),
    },
    {
      number: 2,
      title: "Sedes, pelota y checklist",
      type: "main",
      stickerNumbers: stickers.filter((sticker) => sticker.page === 2).map((sticker) => sticker.number),
    },
  ];

  const teamPages = TEAMS.flatMap((team, teamIndex) =>
    [0, 1].map((offset) => {
      const pageNumber = 3 + teamIndex * 2 + offset;
      return {
        number: pageNumber,
        title: `${team.name} ${offset === 0 ? "plantel" : "figuras"}`,
        type: "team" as const,
        teamCode: team.code,
        stickerNumbers: stickers.filter((sticker) => sticker.page === pageNumber).map((sticker) => sticker.number),
      };
    }),
  );

  return [
    ...specialPages,
    ...teamPages,
    { number: 99, title: "Round of 32", type: "knockout", stickerNumbers: [] },
    { number: 100, title: "Round of 16", type: "knockout", stickerNumbers: [] },
    { number: 101, title: "Quarter-finals", type: "knockout", stickerNumbers: [] },
    { number: 102, title: "Semi-finals", type: "knockout", stickerNumbers: [] },
    { number: 103, title: "Third place", type: "finals", stickerNumbers: [] },
    { number: 104, title: "Final", type: "finals", stickerNumbers: [] },
  ];
};

const stickers = [...buildSpecialStickers(), ...buildTeamStickers()];

export const worldCup2026Album: WorldCupAlbumTemplate = {
  id: "world-cup-2026",
  name: "Figuritas Mundial 2026",
  tournament: "FIFA World Cup 2026",
  hostCountries: ["Canada", "Mexico", "USA"],
  year: 2026,
  pageCount: 112,
  stickerCount: 980,
  specialStickerCount: 68,
  stickersPerPacket: 7,
  teams: TEAMS,
  pages: buildPages(stickers),
  stickers,
  sourceNotes: [
    "Panini product pages describe 112 pages, 980 stickers, 68 special premium stickers and packs of 7 stickers.",
    "FIFA describes the 48-team, 12-group, 104-match tournament format with a Round of 32 through the Final.",
    "Player names are placeholders until final squad/player data is imported.",
  ],
};
