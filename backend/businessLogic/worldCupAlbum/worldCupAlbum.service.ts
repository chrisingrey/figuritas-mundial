import type { IWorldCupAlbumService } from "./IWorldCupAlbumService";
import type { WorldCupAlbumTemplate, WorldCupSticker, WorldCupTeam } from "./WorldCupAlbumTypes";
import { worldCup2026Album } from "./worldCup2026Album";

export class WorldCupAlbumService implements IWorldCupAlbumService {
  getTemplate(): WorldCupAlbumTemplate {
    return worldCup2026Album;
  }

  getTeams(): WorldCupTeam[] {
    return worldCup2026Album.teams;
  }

  getStickers(teamCode?: string): WorldCupSticker[] {
    if (!teamCode) {
      return worldCup2026Album.stickers;
    }

    const normalizedTeamCode = teamCode.trim().toUpperCase();
    return worldCup2026Album.stickers.filter(
      (sticker) => sticker.teamCode === normalizedTeamCode,
    );
  }
}
