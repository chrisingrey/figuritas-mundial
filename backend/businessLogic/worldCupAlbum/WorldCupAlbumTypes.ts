export type AlbumPageType = "cover" | "main" | "team" | "knockout" | "finals";

export interface WorldCupTeam {
  code: string;
  name: string;
  group: string;
  confederation: string;
}

export interface WorldCupSticker {
  id: string;
  number: number;
  type: "player" | "special";
  teamCode?: string;
  teamName?: string;
  playerName?: string;
  title: string;
  rarity: "base" | "special" | "extra";
  page: number;
}

export interface WorldCupAlbumPage {
  number: number;
  title: string;
  type: AlbumPageType;
  teamCode?: string;
  stickerNumbers: number[];
}

export interface WorldCupAlbumTemplate {
  id: string;
  name: string;
  tournament: string;
  hostCountries: string[];
  year: number;
  pageCount: number;
  stickerCount: number;
  specialStickerCount: number;
  stickersPerPacket: number;
  teams: WorldCupTeam[];
  pages: WorldCupAlbumPage[];
  stickers: WorldCupSticker[];
  sourceNotes: string[];
}
