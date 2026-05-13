import { useEffect, useMemo, useRef, useState } from "react";
import type { StickerStatus } from "@backend";
import type { WorldCupSticker, WorldCupTeam } from "@/types/album";
import { TeamCodeDropdown } from "./TeamCodeDropdown";
import styles from "./StickersSection.module.scss";

type StickerMode = "all" | "no_tengo" | "owned" | "tengo" | "pegado" | "repetidas" | "viewer_needs_my_repeated";
type SelectionGroup = "missing" | "owned";

const STATUS_LABEL: Record<StickerStatus, string> = {
  no_tengo: "No tengo",
  tengo: "Tengo",
  pegado: "Pegado",
};

const getSelectionGroup = (status: StickerStatus): SelectionGroup =>
  status === "no_tengo" ? "missing" : "owned";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "#5a5d63" }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

type Props = {
  visibleStickers: WorldCupSticker[];
  visibleTeams: WorldCupTeam[];
  visibleTeam: WorldCupTeam | undefined;
  statusMap: Map<string, StickerStatus>;
  repeatedMap: Map<string, number>;
  selection: Set<string>;
  selectionGroup: SelectionGroup | null;
  stickerMode: StickerMode;
  modeCounts: { noTengo: number; tengo: number; pegado: number; repetidas: number };
  selectedTeamCode: string;
  searchQuery: string;
  readOnlyAlbum: boolean;
  hasMyAlbum: boolean;
  onStickerClick: (code: string) => void;
  onTeamSelect: (code: string) => void;
  onModeChange: (mode: StickerMode) => void;
  onSearchChange: (query: string) => void;
};

type StickerGroup = { label: string; stickers: WorldCupSticker[] };

function groupStickers(stickers: WorldCupSticker[]): StickerGroup[] {
  const result: StickerGroup[] = [];

  for (const s of stickers) {
    let label: string;
    if (s.stickerCode === "00") {
      label = "Portada";
    } else if (s.stickerCode.startsWith("FWX")) {
      label = "Copas y Mascotas";
    } else if (s.stickerCode.startsWith("FWC")) {
      label = "Selecciones Campeonas";
    } else if (s.teamCode && s.teamName) {
      label = `${s.teamName} (${s.teamCode})`;
    } else {
      label = "Especiales";
    }

    const last = result[result.length - 1];
    if (!last || last.label !== label) {
      result.push({ label, stickers: [s] });
    } else {
      last.stickers.push(s);
    }
  }

  return result;
}

export function StickersSection({
  visibleStickers, visibleTeams, visibleTeam,
  statusMap, repeatedMap,
  selection, selectionGroup, stickerMode, modeCounts,
  selectedTeamCode, searchQuery,
  readOnlyAlbum, hasMyAlbum,
  onStickerClick, onTeamSelect, onModeChange, onSearchChange,
}: Props) {
  const stickerGroups = useMemo(() => groupStickers(visibleStickers), [visibleStickers]);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const hasTeamFilter = selectedTeamCode !== "Todos";

  useEffect(() => {
    if (!mobileDropdownOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!mobileDropdownRef.current?.contains(e.target as Node)) setMobileDropdownOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [mobileDropdownOpen]);
  const modes = [
    "all",
    "no_tengo",
    "owned",
    "tengo",
    "pegado",
    ...(!readOnlyAlbum ? ["repetidas" as const] : []),
    ...(readOnlyAlbum && hasMyAlbum ? ["viewer_needs_my_repeated" as const] : []),
  ] as StickerMode[];

  const modeLabel = (mode: StickerMode) => {
    if (mode === "all") return "Todas";
    if (mode === "no_tengo") return `No tengo (${modeCounts.noTengo})`;
    if (mode === "owned") return `Tengo y pegado (${modeCounts.tengo + modeCounts.pegado})`;
    if (mode === "tengo") return `Tengo (${modeCounts.tengo})`;
    if (mode === "pegado") return `Pegado (${modeCounts.pegado})`;
    if (mode === "repetidas") return `Repetidas (${modeCounts.repetidas})`;
    return "Mis repetidas que necesita";
  };

  return (
    <section className={styles.mainPanel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>{visibleTeam ? visibleTeam.name : "Figuritas"}</h2>
          <p>
            {visibleTeam
              ? `Grupo ${visibleTeam.group} · ${visibleTeam.confederation}`
              : `${visibleStickers.length} figuritas`}
          </p>
        </div>
        <div className={styles.panelHeaderRight}>
          <div className={styles.modeSwitch}>
            {modes.map(mode => (
              <button
                type="button"
                key={mode}
                className={mode === stickerMode ? `${styles.modeBtn} ${styles.modeBtnActive}` : styles.modeBtn}
                onClick={() => onModeChange(mode)}
              >
                {modeLabel(mode)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className={styles.albumFilters}>
        <div className={styles.filterHeader}>
          <span>Paises y busqueda</span>
          <strong>{visibleTeams.length} paises</strong>
        </div>

        {/* Desktop: full dropdown + search */}
        <div className={`${styles.filterControls} ${styles.filterControlsDesktop}`}>
          <div className={styles.dropdownWithClear}>
            <TeamCodeDropdown
              teams={visibleTeams}
              selectedTeamCode={selectedTeamCode}
              selectedGroup="Todos"
              onSelect={onTeamSelect}
            />
            {hasTeamFilter && (
              <button
                type="button"
                className={styles.clearFilterBtn}
                onClick={() => onTeamSelect("Todos")}
                aria-label="Quitar filtro de país"
              >
                ✕
              </button>
            )}
          </div>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por codigo: MEX, MEX 1, 17"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {/* Mobile: search + compact team selector inline */}
        <div className={`${styles.filterControls} ${styles.filterControlsMobile}`}>
          <div className={styles.searchWithIcon}>
            <SearchIcon />
            <input
              type="search"
              className={styles.searchInputInline}
              placeholder="MEX, MEX 1, 17"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
          <div className={styles.mobileTeamDropdown} ref={mobileDropdownRef}>
            <button
              type="button"
              className={`${styles.teamCodeBtn} ${hasTeamFilter ? styles.teamCodeBtnActive : ""}`}
              onClick={() => setMobileDropdownOpen(v => !v)}
              aria-expanded={mobileDropdownOpen}
            >
              {hasTeamFilter ? selectedTeamCode : "ALL"}
            </button>
            {hasTeamFilter && (
              <button
                type="button"
                className={styles.clearFilterBtnMobile}
                onClick={() => { onTeamSelect("Todos"); setMobileDropdownOpen(false); }}
                aria-label="Quitar filtro de país"
              >
                ✕
              </button>
            )}
            {mobileDropdownOpen && (
              <div className={styles.mobileDropdownMenu}>
                <button
                  type="button"
                  className={!hasTeamFilter ? styles.mobileOptionActive : styles.mobileOption}
                  onClick={() => { onTeamSelect("Todos"); setMobileDropdownOpen(false); }}
                >
                  ALL
                </button>
                {visibleTeams.map(t => (
                  <button
                    key={t.code}
                    type="button"
                    className={selectedTeamCode === t.code ? styles.mobileOptionActive : styles.mobileOption}
                    onClick={() => { onTeamSelect(t.code); setMobileDropdownOpen(false); }}
                  >
                    {t.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticker grid ──────────────────────────────────────────────────── */}
      <div className={styles.stickerGrid}>
        {stickerGroups.map(group => (
          <>
            <div key={`header-${group.label}`} className={styles.stickerGroupHeader}>
              <span>{group.label}</span>
              <hr />
            </div>
            {group.stickers.map(sticker => {
              const status = statusMap.get(sticker.stickerCode) ?? "no_tengo";
              const isSelected = selection.has(sticker.stickerCode);
              const isDisabled = !readOnlyAlbum && selectionGroup !== null && getSelectionGroup(status) !== selectionGroup;
              return (
                <article
                  key={sticker.id}
                  className={[
                    styles.sticker,
                    styles[`sticker_${status}`],
                    readOnlyAlbum ? styles.stickerReadOnly : "",
                    isSelected ? styles.stickerSelected : "",
                    isDisabled ? styles.stickerDisabled : "",
                  ].join(" ")}
                  onClick={readOnlyAlbum ? undefined : () => onStickerClick(sticker.stickerCode)}
                  title={`${sticker.stickerCode} · ${sticker.teamName ?? "Especial"}`}
                >
                  {!readOnlyAlbum && isSelected && <span className={styles.checkmark}>✓</span>}
                  <strong className={styles.stickerCode}>{sticker.stickerCode}</strong>
                  <span className={styles.stickerMeta}>{sticker.teamCode ?? "SP"}</span>
                  {(repeatedMap.get(sticker.stickerCode) ?? 0) > 0 && (
                    <span className={styles.repeatedBadge}>Rep. {repeatedMap.get(sticker.stickerCode)}</span>
                  )}
                  <span className={styles[`label_${status}`]}>{STATUS_LABEL[status]}</span>
                </article>
              );
            })}
          </>
        ))}
        {visibleStickers.length === 0 && <p className={styles.empty}>No hay figuritas para mostrar.</p>}
      </div>
    </section>
  );
}
