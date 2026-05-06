import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { albumsService, type AlbumResponse, type StickerStatus } from "@backend";
import { worldCupAlbum } from "@/data/worldCupAlbum";
import type { WorldCupSticker } from "@/types/album";
import styles from "./index.module.scss";

type StickerMode = "all" | "tengo" | "no_tengo";

const STATUS_LABEL: Record<StickerStatus, string> = {
  no_tengo: "No tengo",
  tengo: "Tengo",
  pegado: "Pegado",
};

const normalizeSearchValue = (value: string) =>
  value.trim().toUpperCase().replace(/\s+/g, " ");

const matchesStickerSearch = (sticker: WorldCupSticker, query: string) => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const code = normalizeSearchValue(sticker.stickerCode);
  if (/^\d+$/.test(normalizedQuery)) {
    return Boolean(sticker.teamCode) && code.endsWith(` ${normalizedQuery}`);
  }

  return code.startsWith(normalizedQuery);
};

export default function SharedAlbum() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [stickerMode, setStickerMode] = useState<StickerMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!shareToken) return;
    albumsService.getSharedAlbum(shareToken)
      .then(setAlbum)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const statusMap = useMemo(() => {
    if (!album) return new Map<string, StickerStatus>();
    return new Map(album.stickers.map(s => [s.code, s.status]));
  }, [album]);

  const repeatedMap = useMemo(() => {
    if (!album) return new Map<string, number>();
    return new Map(album.stickers.map(s => [s.code, s.repeated ?? 0]));
  }, [album]);

  const groups = useMemo(
    () => ["Todos", ...Array.from(new Set(worldCupAlbum.teams.map(t => t.group))).sort((a, b) => Number(a) - Number(b))],
    [],
  );

  const visibleStickers = useMemo((): WorldCupSticker[] => {
    return worldCupAlbum.stickers
      .filter(sticker => {
        if (selectedGroup === "Todos") return true;
        if (sticker.type === "special") return false;
        const team = worldCupAlbum.teams.find(t => t.code === sticker.teamCode);
        return team?.group === selectedGroup;
      })
      .filter(sticker => {
        if (!matchesStickerSearch(sticker, searchQuery)) return false;
        const st = statusMap.get(sticker.stickerCode) ?? "no_tengo";
        if (stickerMode === "tengo") return st !== "no_tengo";
        if (stickerMode === "no_tengo") return st === "no_tengo";
        return true;
      });
  }, [searchQuery, selectedGroup, stickerMode, statusMap]);

  const ownedCount = album?.ownedCount ?? 0;
  const totalCount = album?.totalCount ?? 980;
  const pct = Math.round((ownedCount / totalCount) * 100);

  if (loading) return <div className={styles.center}>Cargando álbum compartido...</div>;
  if (notFound) return <div className={styles.center}>Este álbum no existe o el enlace expiró.</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.albumName}>{album?.name ?? "Álbum"}</span>
          <span className={styles.badge}>Solo lectura</span>
        </div>
        <span className={styles.progress}>{ownedCount}/{totalCount} ({pct}%)</span>
      </header>

      <div className={styles.body}>
        <div className={styles.controls}>
          <div className={styles.segmented}>
            {groups.map(group => (
              <button
                type="button"
                key={group}
                className={group === selectedGroup ? styles.segBtnActive : styles.segBtn}
                onClick={() => setSelectedGroup(group)}
              >
                {group === "Todos" ? "Todos" : `G${group}`}
              </button>
            ))}
          </div>
          <div className={styles.modeSwitch}>
            {(["all", "tengo", "no_tengo"] as StickerMode[]).map(mode => (
              <button
                type="button"
                key={mode}
                className={mode === stickerMode ? `${styles.modeBtn} ${styles.modeBtnActive}` : styles.modeBtn}
                onClick={() => setStickerMode(mode)}
              >
                {mode === "all" ? "Todas" : mode === "tengo" ? "Tiene" : "Le faltan"}
              </button>
            ))}
          </div>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por codigo: MEX, MEX 1, 17"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.stickerGrid}>
          {visibleStickers.map(sticker => {
            const status = statusMap.get(sticker.stickerCode) ?? "no_tengo";
            return (
              <div
                key={sticker.id}
                className={`${styles.sticker} ${styles[`sticker_${status}`]}`}
                title={`${sticker.stickerCode} · ${sticker.teamName ?? "Especial"}`}
              >
                <strong className={styles.stickerCode}>{sticker.stickerCode}</strong>
                <span className={styles.stickerMeta}>{sticker.teamCode ?? "SP"}</span>
                {(repeatedMap.get(sticker.stickerCode) ?? 0) > 0 && (
                  <span className={styles.repeatedBadge}>Rep. {repeatedMap.get(sticker.stickerCode)}</span>
                )}
                <span className={styles[`label_${status}`]}>
                  {STATUS_LABEL[status]}
                </span>
              </div>
            );
          })}
          {visibleStickers.length === 0 && (
            <p className={styles.empty}>No hay figuritas para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
