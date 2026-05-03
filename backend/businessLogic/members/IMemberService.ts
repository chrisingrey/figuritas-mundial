import type { Member } from "./Member";
import type { UpdateMemberRoleArgs } from "./UpdateMemberRoleArgs";

export interface IMemberService {
  /** Returns the active member for the given album+user pair, with role populated. Used by memberAuthorizationFilter. */
  getMemberWithRole(albumId: string, userId: string): Promise<Member | null>;
  /** Returns the active member for the given album+user pair (without includes). */
  getOrDefaultAsync(albumId: string, userId: string): Promise<Member | null>;
  /** Returns all active members of a album, with user info populated. */
  getMembers(albumId: string): Promise<Member[]>;
  /** Returns all active memberships for a user, with album and role populated. */
  getMyMemberships(userId: string): Promise<Member[]>;
  /** Updates the role of an active member. */
  updateMemberRole(albumId: string, memberId: string, args: UpdateMemberRoleArgs): Promise<Member>;
  /** Marks a member as inactive (soft-remove). */
  removeMember(albumId: string, memberId: string): Promise<void>;
}
