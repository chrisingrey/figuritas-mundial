import type { Request } from "express";
import type { Member } from "@businessLogic/members";
import type { AlbumRole } from "@businessLogic/albumRole";
import type { Permission } from "@businessLogic/permissions";
import { AppError, ErrorCode } from "@errors";

export interface AuthorizedMemberContext {
	albumId: string;
	member: Member;
	role: AlbumRole;
	permissions: Permission[];
}

export interface AuthorizedMemberRequest extends Request {
	authorizedMember: AuthorizedMemberContext;
}

export const toAuthorizedMemberRequest = (
	req: Request,
): AuthorizedMemberRequest => {
	const typedRequest = req as Partial<AuthorizedMemberRequest>;
	if (!typedRequest.authorizedMember) {
		throw new AppError(400, ErrorCode.VALIDATION_ERROR, "Member authorization filter is required.");
	}

	return typedRequest as AuthorizedMemberRequest;
};
