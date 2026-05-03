import { z } from "zod";
import {
  type GetPagedNotificationsArgs,
  type NormalizedPagedNotificationsArgs,
} from "./GetPagedNotificationsArgs";
import { NotificationOrderBy } from "./NotificationOrderBy";

const getPagedNotificationsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(50).optional(),
  orderBy: z
    .enum([NotificationOrderBy.RECENT, NotificationOrderBy.OLDEST])
    .optional(),
});

export type ValidationResult =
  | { success: true; data: NormalizedPagedNotificationsArgs }
  | { success: false; errors: string[] };

export const validateGetPagedNotificationsArgs = (
  input: GetPagedNotificationsArgs,
): ValidationResult => {
  const result = getPagedNotificationsSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }

  return {
    success: true,
    data: {
      page: result.data.page ?? 1,
      pageSize: result.data.pageSize ?? 10,
      orderBy: result.data.orderBy ?? NotificationOrderBy.RECENT,
    },
  };
};
