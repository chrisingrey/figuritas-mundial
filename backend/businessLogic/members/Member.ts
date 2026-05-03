import type { MemberStatus } from "./MemberStatus";
import type { Album } from "@businessLogic/albums";
import type { AlbumRole } from "@businessLogic/albumRole";
import type { User } from "@auth/users";

export interface Member {
  id: string;
  albumId: string;
  userId: string;
  roleId: string;
  status: MemberStatus;
  joinedAt: Date;
  // Include-populated navigation properties (optional — set by repository when includes are used)
  album?: Album;
  role?: AlbumRole;
  user?: User;
}
