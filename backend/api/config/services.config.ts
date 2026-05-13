import type { Db } from "mongodb";
import type { DatabaseConnection } from "@dataAccess/config/database.config";
import { FirebaseService } from "@auth/firebase";
import { Session, SessionService, type ISessionService } from "@auth/sessions";
import { TwoFactorService, type ITwoFactorService } from "@auth/twoFactor";
import { User, UserService, type IUserService } from "@auth/users";
import {
  PasswordManagerService,
  type IPasswordManagerService,
} from "@auth/passwordManager";
import {
  EmailVerificationService,
  type IEmailVerificationService,
  PendingEmailVerification,
  ResetPasswordVerificationService,
} from "@auth/verifications";
import type { Email, IMessagingService } from "@businessLogic/messaging";
import {
  NotificationService,
  type INotificationService,
  type Notification,
} from "@businessLogic/notifications";
import {
  AlbumService,
  type IAlbumService,
  type Album,
} from "@businessLogic/albums";
import {
  AlbumRoleService,
  type IAlbumRoleService,
  type AlbumRole,
} from "@businessLogic/albumRole";
import {
  MemberService,
  type IMemberService,
  type Member,
} from "@businessLogic/members";
import {
  AlbumInviteService,
  type IAlbumInviteService,
  type AlbumInvitation,
} from "@businessLogic/albumInvite";
import {
  AlbumRequestService,
  type IAlbumRequestService,
  type AlbumRequest,
} from "@businessLogic/albumRequest";
import {
  PermissionService,
  type IPermissionService,
  type Permission,
} from "@businessLogic/permissions";
import {
  WorldCupAlbumService,
  type IWorldCupAlbumService,
} from "@businessLogic/worldCupAlbum";
import { Repository } from "@dataAccess/mongoDB/Repository";

interface Services {
  sessionService: ISessionService;
  twoFactorService: ITwoFactorService;
  userService: IUserService;
  passwordManagerService: IPasswordManagerService;
  emailVerificationService: IEmailVerificationService;
  notificationService: INotificationService;
  firebaseService: FirebaseService;
  messagingService: IMessagingService<Email>;
  albumService: IAlbumService;
  albumRoleService: IAlbumRoleService;
  memberService: IMemberService;
  albumInviteService: IAlbumInviteService;
  albumRequestService: IAlbumRequestService;
  permissionService: IPermissionService;
  worldCupAlbumService: IWorldCupAlbumService;
}

export const services = {} as Services;

export function setupServices(
  connection: DatabaseConnection,
  messagingService: IMessagingService<Email>,
): void {
  setupMongoServices(connection.db, messagingService);
}

function setupMongoServices(
  db: Db,
  messagingService: IMessagingService<Email>,
): void {
  const firebaseService = new FirebaseService();
  services.firebaseService = firebaseService;
  services.messagingService = messagingService;

  // ─── Auth repositories ──────────────────────────────────────────────────
  const userRepository = new Repository<User>(db.collection("users"));
  const emailVerificationRepository = new Repository<PendingEmailVerification>(
    db.collection("userEmailVerifications"),
  );
  const sessionRepository = new Repository<Session>(db.collection("sessions"));
  const notificationRepository = new Repository<Notification>(
    db.collection("notifications"),
  );

  // ─── Album repositories ─────────────────────────────────────────────
  const permissionRepository = new Repository<Permission>(
    db.collection("permissions"),
  );
  const albumRepository = new Repository<Album>(
    db.collection("albums"),
  );
  const albumRoleRepository = new Repository<AlbumRole>(
    db.collection("albumRoles"),
  );
  const memberRepository = new Repository<Member>(
    db.collection("members"),
    {
      album: db.collection("albums"),
      role: db.collection("albumRoles"),
      user: db.collection("users"),
    },
  );
  const invitationRepository = new Repository<AlbumInvitation>(
    db.collection("albumInvitations"),
  );
  const albumRequestRepository = new Repository<AlbumRequest>(
    db.collection("albumRequests"),
  );

  // ─── Auth services ──────────────────────────────────────────────────────
  services.notificationService = new NotificationService(notificationRepository);
  services.twoFactorService = new TwoFactorService(userRepository, sessionRepository);
  services.sessionService = new SessionService(
    userRepository,
    sessionRepository,
    firebaseService,
    services.twoFactorService,
  );
  const resetPasswordVerificationService = new ResetPasswordVerificationService(
    userRepository,
    messagingService,
  );
  services.userService = new UserService(
    userRepository,
    emailVerificationRepository,
    firebaseService,
    services.notificationService,
  );
  services.passwordManagerService = new PasswordManagerService(
    userRepository,
    resetPasswordVerificationService,
  );
  services.emailVerificationService = new EmailVerificationService(
    emailVerificationRepository,
    userRepository,
    messagingService,
    services.notificationService,
  );

  // ─── Album services ─────────────────────────────────────────────────
  services.worldCupAlbumService = new WorldCupAlbumService();
  services.permissionService = new PermissionService(permissionRepository);
  services.albumRoleService = new AlbumRoleService(
    albumRoleRepository,
    services.permissionService,
  );
  services.memberService = new MemberService(memberRepository, albumRoleRepository);
  services.albumService = new AlbumService(
    albumRepository,
    albumRoleRepository,
    memberRepository,
    permissionRepository,
  );
  services.albumInviteService = new AlbumInviteService(
    invitationRepository,
    albumRepository,
    albumRoleRepository,
    memberRepository,
    userRepository,
    messagingService,
    services.notificationService,
  );
  services.albumRequestService = new AlbumRequestService(
    albumRequestRepository,
    albumRepository,
    memberRepository,
    userRepository,
  );
}
