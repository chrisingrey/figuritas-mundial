import type { AlbumSticker } from "./AlbumSticker";

const TEAM_CODES = [
  "MEX", "RSA", "KOR", "CZE",
  "CAN", "BIH", "QAT", "SUI",
  "BRA", "MAR", "HAI", "SCO",
  "USA", "PAR", "AUS", "TUR",
  "GER", "CUW", "CIV", "ECU",
  "NED", "JPN", "SWE", "TUN",
  "BEL", "EGY", "IRN", "NZL",
  "ESP", "CPV", "KSA", "URU",
  "FRA", "SEN", "IRQ", "NOR",
  "ARG", "ALG", "AUT", "JOR",
  "POR", "COD", "UZB", "COL",
  "ENG", "CRO", "GHA", "PAN",
];

export const STICKER_NOTES: Record<string, string> = {};

function buildNotes(): void {
  for (const code of TEAM_CODES) {
    STICKER_NOTES[`${code} 1`] = "Logo del equipo";
    STICKER_NOTES[`${code} 13`] = "Foto del plantel";
  }
}

buildNotes();

export function generateAlbumStickers(): AlbumSticker[] {
  const stickers: AlbumSticker[] = [];

  stickers.push({ code: "00", status: "no_tengo" });

  for (let i = 1; i <= 8; i++) {
    stickers.push({ code: `FWX ${i}`, status: "no_tengo" });
  }

  for (const code of TEAM_CODES) {
    for (let n = 1; n <= 20; n++) {
      stickers.push({ code: `${code} ${n}`, status: "no_tengo" });
    }
  }

  for (let i = 9; i <= 19; i++) {
    stickers.push({ code: `FWC ${i}`, status: "no_tengo" });
  }

  return stickers;
}

export const ALL_STICKER_CODES = new Set(generateAlbumStickers().map(s => s.code));
