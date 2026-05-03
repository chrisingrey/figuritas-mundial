import { z } from "zod";
import type { ToggleStickerArgs } from "./ToggleStickerArgs";

const schema = z.object({
  albumId: z.string().min(1, "albumId is required"),
  code: z.string().min(1, "code is required"),
});

export type ToggleStickerValidationResult =
  | { success: true; data: ToggleStickerArgs }
  | { success: false; errors: string[] };

export const validateToggleStickerArgs = (input: unknown): ToggleStickerValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map(e => e.message) };
  }
  return { success: true, data: result.data as ToggleStickerArgs };
};
