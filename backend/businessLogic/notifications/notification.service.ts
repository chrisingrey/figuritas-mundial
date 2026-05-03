import type { IRepository } from "@dataAccess/IRepository";
import { AppError, ErrorCode } from "@errors";
import type { CreateNotificationArgs } from "./CreateNotificationArgs";
import { validateCreateNotificationArgs } from "./CreateNotificationArgsValidator";
import type { GetPagedNotificationsArgs } from "./GetPagedNotificationsArgs";
import { validateGetPagedNotificationsArgs } from "./GetPagedNotificationsArgsValidator";
import type { INotificationService } from "./INotificationService";
import type { Notification } from "./Notification";
import { NotificationOrderBy } from "./NotificationOrderBy";
import type { NotificationPage } from "./NotificationPage";
import type { PatchNotificationArgs } from "./PatchNotificationArgs";
import { validatePatchNotificationArgs } from "./PatchNotificationArgsValidator";

export class NotificationService implements INotificationService {
  constructor(
    private readonly notificationRepository: IRepository<Notification>,
  ) {}

  async createNotification(args: CreateNotificationArgs): Promise<Notification> {
    const validation = validateCreateNotificationArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_NOTIFICATION_DATA, validation.errors.join(", "));
    }

    return this.notificationRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      title: validation.data.title,
      description: validation.data.description,
      targetUserId: validation.data.targetUserId,
      createdAt: new Date(),
      viewed: { seen: false },
      action: validation.data.action,
    });
  }

  async patchNotificationForUser(
    userId: string,
    id: string,
    args: PatchNotificationArgs,
  ): Promise<Notification> {
    const validation = validatePatchNotificationArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_NOTIFICATION_DATA, validation.errors.join(", "));
    }

    if (Object.keys(validation.data).length === 0) {
      throw new AppError(400, ErrorCode.EMPTY_NOTIFICATION_UPDATE, "At least one field is required for notification update.");
    }

    await this.getOwnedNotification(userId, id);

    const patch: Partial<Omit<Notification, "id">> = {};
    if (validation.data.title !== undefined) {
      patch.title = validation.data.title;
    }
    if (validation.data.description !== undefined) {
      patch.description = validation.data.description;
    }
    if (validation.data.action !== undefined) {
      patch.action = validation.data.action;
    }
    if (validation.data.viewed !== undefined) {
      patch.viewed = {
        seen: validation.data.viewed.seen,
        at: validation.data.viewed.seen
          ? validation.data.viewed.at
            ? new Date(validation.data.viewed.at)
            : new Date()
          : undefined,
      };
    }

    return this.notificationRepository.patchByIdAndSaveAsync(id, patch);
  }

  async getNotificationByIdForUser(
    userId: string,
    id: string,
  ): Promise<Notification> {
    return this.getOwnedNotification(userId, id);
  }

  async getPagedNotificationsForUser(
    userId: string,
    args: GetPagedNotificationsArgs,
  ): Promise<NotificationPage> {
    const validation = validateGetPagedNotificationsArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_NOTIFICATION_DATA, validation.errors.join(", "));
    }

    const all = await this.notificationRepository.getAllAsync(
      (notification) => notification.targetUserId === userId,
    );

    all.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (validation.data.orderBy === NotificationOrderBy.OLDEST) {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    const total = all.length;
    const { page, pageSize } = validation.data;
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = all.slice(startIndex, startIndex + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  private async getOwnedNotification(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification =
      await this.notificationRepository.getOrDefaultAsync(
        (item) => item.id === notificationId,
      );

    if (!notification || notification.targetUserId !== userId) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Notification not found.");
    }

    return notification;
  }
}
