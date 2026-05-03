import type { WorldCupAlbumPage, WorldCupAlbumTemplate, WorldCupSticker, WorldCupTeam } from "../types/album";

const teams: WorldCupTeam[] = [
  { code: "MEX", name: "Mexico", group: "1", confederation: "CONCACAF" },
  { code: "RSA", name: "South Africa", group: "1", confederation: "CAF" },
  { code: "KOR", name: "Korea Republic", group: "1", confederation: "AFC" },
  { code: "CZE", name: "Czechia", group: "1", confederation: "UEFA" },
  { code: "CAN", name: "Canada", group: "2", confederation: "CONCACAF" },
  { code: "BIH", name: "Bosnia and Herzegovina", group: "2", confederation: "UEFA" },
  { code: "QAT", name: "Qatar", group: "2", confederation: "AFC" },
  { code: "SUI", name: "Switzerland", group: "2", confederation: "UEFA" },
  { code: "BRA", name: "Brazil", group: "3", confederation: "CONMEBOL" },
  { code: "MAR", name: "Morocco", group: "3", confederation: "CAF" },
  { code: "HAI", name: "Haiti", group: "3", confederation: "CONCACAF" },
  { code: "SCO", name: "Scotland", group: "3", confederation: "UEFA" },
  { code: "USA", name: "USA", group: "4", confederation: "CONCACAF" },
  { code: "PAR", name: "Paraguay", group: "4", confederation: "CONMEBOL" },
  { code: "AUS", name: "Australia", group: "4", confederation: "AFC" },
  { code: "TUR", name: "Turkiye", group: "4", confederation: "UEFA" },
  { code: "GER", name: "Germany", group: "5", confederation: "UEFA" },
  { code: "CUW", name: "Curacao", group: "5", confederation: "CONCACAF" },
  { code: "CIV", name: "Cote d'Ivoire", group: "5", confederation: "CAF" },
  { code: "ECU", name: "Ecuador", group: "5", confederation: "CONMEBOL" },
  { code: "NED", name: "Netherlands", group: "6", confederation: "UEFA" },
  { code: "JPN", name: "Japan", group: "6", confederation: "AFC" },
  { code: "SWE", name: "Sweden", group: "6", confederation: "UEFA" },
  { code: "TUN", name: "Tunisia", group: "6", confederation: "CAF" },
  { code: "BEL", name: "Belgium", group: "7", confederation: "UEFA" },
  { code: "EGY", name: "Egypt", group: "7", confederation: "CAF" },
  { code: "IRN", name: "IR Iran", group: "7", confederation: "AFC" },
  { code: "NZL", name: "New Zealand", group: "7", confederation: "OFC" },
  { code: "ESP", name: "Spain", group: "8", confederation: "UEFA" },
  { code: "CPV", name: "Cabo Verde", group: "8", confederation: "CAF" },
  { code: "KSA", name: "Saudi Arabia", group: "8", confederation: "AFC" },
  { code: "URU", name: "Uruguay", group: "8", confederation: "CONMEBOL" },
  { code: "FRA", name: "France", group: "9", confederation: "UEFA" },
  { code: "SEN", name: "Senegal", group: "9", confederation: "CAF" },
  { code: "IRQ", name: "Iraq", group: "9", confederation: "AFC" },
  { code: "NOR", name: "Norway", group: "9", confederation: "UEFA" },
  { code: "ARG", name: "Argentina", group: "10", confederation: "CONMEBOL" },
  { code: "ALG", name: "Algeria", group: "10", confederation: "CAF" },
  { code: "AUT", name: "Austria", group: "10", confederation: "UEFA" },
  { code: "JOR", name: "Jordan", group: "10", confederation: "AFC" },
  { code: "POR", name: "Portugal", group: "11", confederation: "UEFA" },
  { code: "COD", name: "Congo DR", group: "11", confederation: "CAF" },
  { code: "UZB", name: "Uzbekistan", group: "11", confederation: "AFC" },
  { code: "COL", name: "Colombia", group: "11", confederation: "CONMEBOL" },
  { code: "ENG", name: "England", group: "12", confederation: "UEFA" },
  { code: "CRO", name: "Croatia", group: "12", confederation: "UEFA" },
  { code: "GHA", name: "Ghana", group: "12", confederation: "CAF" },
  { code: "PAN", name: "Panama", group: "12", confederation: "CONCACAF" },
];

const coverSticker: WorldCupSticker = {
  id: "FWC26-00",
  number: 0,
  stickerCode: "00",
  type: "special",
  title: "Album cover foil",
  rarity: "extra",
  page: 1,
};

const fwxTitles = [
  "Tournament emblem",
  "Match ball",
  "Host cities map",
  "Trophy moment",
  "Opening match",
  "Final venue",
  "Group stage",
  "Round of 32",
];

const fwxStickers: WorldCupSticker[] = fwxTitles.map((title, index) => ({
  id: `FWC26-FWX${index + 1}`,
  number: index + 1,
  stickerCode: `FWX ${index + 1}`,
  type: "special",
  title,
  rarity: "special",
  page: 1,
}));

const fwcTitles = [
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
];

const fwcStickers: WorldCupSticker[] = fwcTitles.map((title, index) => ({
  id: `FWC26-FWC${index + 9}`,
  number: 969 + index,
  stickerCode: `FWC ${index + 9}`,
  type: "special",
  title,
  rarity: "special",
  page: 2,
}));

const teamStickers: WorldCupSticker[] = teams.flatMap((team, teamIndex) =>
  Array.from({ length: 20 }, (_, playerIndex) => {
    const playerNumber = playerIndex + 1;
    return {
      id: `FWC26-${team.code}-${String(playerNumber).padStart(2, "0")}`,
      number: 9 + teamIndex * 20 + playerIndex,
      stickerCode: `${team.code} ${playerNumber}`,
      type: "player" as const,
      teamCode: team.code,
      teamName: team.name,
      playerName: `Jugador ${String(playerNumber).padStart(2, "0")}`,
      title: `${team.name} - Jugador ${String(playerNumber).padStart(2, "0")}`,
      rarity: "base",
      page: 3 + teamIndex * 2 + Math.floor(playerIndex / 10),
    };
  }),
);

const stickers = [coverSticker, ...fwxStickers, ...teamStickers, ...fwcStickers];

const pages: WorldCupAlbumPage[] = [
  {
    number: 1,
    title: "Presentacion del torneo",
    type: "main",
    stickerNumbers: [coverSticker.number, ...fwxStickers.map((s) => s.number)],
  },
  {
    number: 2,
    title: "Sedes, pelota y checklist",
    type: "main",
    stickerNumbers: fwcStickers.map((s) => s.number),
  },
  ...teams.flatMap((team, teamIndex) =>
    [0, 1].map((offset) => {
      const pageNumber = 3 + teamIndex * 2 + offset;
      return {
        number: pageNumber,
        title: `${team.name} ${offset === 0 ? "plantel" : "figuras"}`,
        type: "team" as const,
        teamCode: team.code,
        stickerNumbers: stickers.filter((s) => s.page === pageNumber).map((s) => s.number),
      };
    }),
  ),
  { number: 99, title: "Round of 32", type: "knockout", stickerNumbers: [] },
  { number: 100, title: "Round of 16", type: "knockout", stickerNumbers: [] },
  { number: 101, title: "Quarter-finals", type: "knockout", stickerNumbers: [] },
  { number: 102, title: "Semi-finals", type: "knockout", stickerNumbers: [] },
  { number: 103, title: "Third place", type: "finals", stickerNumbers: [] },
  { number: 104, title: "Final", type: "finals", stickerNumbers: [] },
];

export const worldCupAlbum: WorldCupAlbumTemplate = {
  id: "world-cup-2026",
  name: "Figuritas Mundial 2026",
  tournament: "FIFA World Cup 2026",
  hostCountries: ["Canada", "Mexico", "USA"],
  year: 2026,
  pageCount: 112,
  stickerCount: 980,
  specialStickerCount: 20,
  stickersPerPacket: 7,
  teams,
  pages,
  stickers,
  sourceNotes: [
    "Panini: 112 paginas, 980 figuritas, 20 especiales y sobres de 7.",
    "FIFA: formato de 48 equipos, 12 grupos y fase eliminatoria desde Round of 32.",
    "Nombres de jugadores como placeholders hasta importar listas reales.",
  ],
};
