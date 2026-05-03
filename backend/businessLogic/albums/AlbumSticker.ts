export type StickerStatus = "no_tengo" | "tengo" | "pegado";

export const STICKER_STATUSES: StickerStatus[] = ["no_tengo", "tengo", "pegado"];

export interface AlbumSticker {
  code: string;
  status: StickerStatus;
  /** @deprecated migrated from boolean owned field */
  owned?: boolean;
}

export function resolveStickerStatus(s: AlbumSticker): StickerStatus {
  if (s.status) return s.status;
  return s.owned ? "tengo" : "no_tengo";
}
