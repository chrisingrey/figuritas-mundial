import type { WorldCupAlbumTemplate } from "@businessLogic/worldCupAlbum";

export type WorldCupAlbumResponse = WorldCupAlbumTemplate;

export const mapWorldCupAlbumResponse = (
  template: WorldCupAlbumTemplate,
): WorldCupAlbumResponse => template;
