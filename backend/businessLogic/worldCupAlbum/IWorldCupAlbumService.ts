import type { WorldCupAlbumTemplate, WorldCupSticker, WorldCupTeam } from "./WorldCupAlbumTypes";

export interface IWorldCupAlbumService {
  getTemplate(): WorldCupAlbumTemplate;
  getTeams(): WorldCupTeam[];
  getStickers(teamCode?: string): WorldCupSticker[];
}
