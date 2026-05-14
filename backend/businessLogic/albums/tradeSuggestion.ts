import type { AlbumSticker } from "./AlbumSticker";
import { resolveStickerStatus } from "./AlbumSticker";

export interface TradeSuggestionResult {
  exchanges: Array<{ iGive: string; theyGive: string }>;
  missingForMe: string[];
  missingForThem: string[];
}

function getStickerNumber(code: string): number | null {
  const parts = code.split(" ");
  if (parts.length < 2) return null;
  const n = parseInt(parts[1], 10);
  return isNaN(n) ? null : n;
}

function isSpecialOrFirst(code: string): boolean {
  if (code === "00") return true;
  const n = getStickerNumber(code);
  return code.startsWith("FWC ") || code.startsWith("FWX ") || n === 1;
}

function isThirteen(code: string): boolean {
  return getStickerNumber(code) === 13;
}

function getCountryPrefix(code: string): string {
  return code.split(" ")[0];
}

export function computeTradeSuggestion(
  myStickers: AlbumSticker[],
  theirStickers: AlbumSticker[],
): TradeSuggestionResult {
  const myStatusMap = new Map(myStickers.map(s => [s.code, resolveStickerStatus(s)]));
  const theirStatusMap = new Map(theirStickers.map(s => [s.code, resolveStickerStatus(s)]));

  const iCanGive = myStickers
    .filter(s => resolveStickerStatus(s) === "pegado" && (s.repeated ?? 0) > 0 && theirStatusMap.get(s.code) === "no_tengo")
    .map(s => s.code);

  const theyCanGive = theirStickers
    .filter(s => resolveStickerStatus(s) === "pegado" && (s.repeated ?? 0) > 0 && myStatusMap.get(s.code) === "no_tengo")
    .map(s => s.code);

  const remaining_a = new Set(iCanGive);
  const remaining_b = new Set(theyCanGive);
  const exchanges: Array<{ iGive: string; theyGive: string }> = [];

  function tryMatch(from_a: string[], from_b: string[]) {
    const avail_a = from_a.filter(c => remaining_a.has(c));
    const avail_b = from_b.filter(c => remaining_b.has(c));
    const count = Math.min(avail_a.length, avail_b.length);
    for (let i = 0; i < count; i++) {
      exchanges.push({ iGive: avail_a[i], theyGive: avail_b[i] });
      remaining_a.delete(avail_a[i]);
      remaining_b.delete(avail_b[i]);
    }
  }

  // Priority 1: FWC / FWX / sticker #1 vs same
  tryMatch(
    iCanGive.filter(isSpecialOrFirst),
    theyCanGive.filter(isSpecialOrFirst),
  );

  // Priority 2: sticker #13 vs sticker #13
  tryMatch(
    iCanGive.filter(isThirteen),
    theyCanGive.filter(isThirteen),
  );

  // Priority 3: same country code
  const prefixes = new Set([...remaining_a, ...remaining_b].map(getCountryPrefix));
  for (const prefix of prefixes) {
    tryMatch(
      [...remaining_a].filter(c => getCountryPrefix(c) === prefix),
      [...remaining_b].filter(c => getCountryPrefix(c) === prefix),
    );
  }

  // Priority 4a: regular vs regular (no FWC/FWX/1/13)
  tryMatch(
    [...remaining_a].filter(c => !isSpecialOrFirst(c) && !isThirteen(c)),
    [...remaining_b].filter(c => !isSpecialOrFirst(c) && !isThirteen(c)),
  );

  // Priority 4b: FWC/FWX/1 vs 13 (and vice versa)
  tryMatch(
    [...remaining_a].filter(isSpecialOrFirst),
    [...remaining_b].filter(isThirteen),
  );
  tryMatch(
    [...remaining_a].filter(isThirteen),
    [...remaining_b].filter(isSpecialOrFirst),
  );

  // Priority 4c: anything remaining
  tryMatch([...remaining_a], [...remaining_b]);

  return {
    exchanges,
    missingForMe: [...remaining_b],
    missingForThem: [...remaining_a],
  };
}
