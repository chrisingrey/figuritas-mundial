import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { albumsService, type AlbumResponse, type AlbumRoleResponse, type MemberResponse, type StickerStatus } from "@backend";
import { useUserLogged } from "@/context";
import { worldCupAlbum } from "@/data/worldCupAlbum";
import type { WorldCupSticker } from "@/types/album";
import { TeamCodeDropdown } from "./TeamCodeDropdown";
import styles from "./index.module.scss";

const INVITE_PERMISSION = "create-albumInvitation";
const UPDATE_ALBUM_PERMISSION = "updateById-album";
const VIEW_MEMBERS_PERMISSION = "getAll-member";
const MANAGE_MEMBER_PERMISSION = "updateById-member";
const DELETE_MEMBER_PERMISSION = "deleteById-member";

type StickerMode = "all" | "no_tengo" | "owned" | "tengo" | "pegado" | "viewer_needs_my_repeated";
type SelectionGroup = "missing" | "owned";

const STATUS_LABEL: Record<StickerStatus, string> = {
  no_tengo: "No tengo",
  tengo: "Tengo",
  pegado: "Pegado",
};

type BulkAction = { label: string; targetStatus: StickerStatus; variant: "primary" | "danger" | "yellow" };
const BULK_ACTIONS: Record<StickerStatus, BulkAction[]> = {
  no_tengo: [
    { label: "Tengo",  targetStatus: "tengo",    variant: "yellow"  },
    { label: "Pegar",  targetStatus: "pegado",   variant: "primary" },
  ],
  tengo: [
    { label: "Eliminar", targetStatus: "no_tengo", variant: "danger"  },
    { label: "Pegar",    targetStatus: "pegado",   variant: "primary" },
  ],
  pegado: [
    { label: "Eliminar", targetStatus: "no_tengo", variant: "danger"  },
    { label: "Tengo",    targetStatus: "tengo",    variant: "yellow"  },
  ],
};

const MIXED_OWNED_ACTIONS: BulkAction[] = [
  { label: "Eliminar", targetStatus: "no_tengo", variant: "danger"  },
  { label: "Tengo",    targetStatus: "tengo",    variant: "yellow"  },
  { label: "Pegar",    targetStatus: "pegado",   variant: "primary" },
];

const getSelectionGroup = (status: StickerStatus): SelectionGroup =>
  status === "no_tengo" ? "missing" : "owned";

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

export default function Album() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { getAlbumPermissions, setAlbumPermissions } = useUserLogged();

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeamCode, setSelectedTeamCode] = useState("Todos");
  const [stickerMode, setStickerMode] = useState<StickerMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [myAlbum, setMyAlbum] = useState<AlbumResponse | null>(null);

  // Bulk selection
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [selectionGroup, setSelectionGroup] = useState<SelectionGroup | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedRepeatedSticker, setSelectedRepeatedSticker] = useState<string | null>(null);
  const [repeatedDraft, setRepeatedDraft] = useState(0);
  const [repeatedSaving, setRepeatedSaving] = useState(false);
  const [repeatedError, setRepeatedError] = useState("");

  // Members state
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [memberRoleId, setMemberRoleId] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError] = useState("");

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [roles, setRoles] = useState<AlbumRoleResponse[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  // KPIs
  const [kpiExpanded, setKpiExpanded] = useState(false);

  // Share
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareError, setShareError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (!albumId) return;
    albumsService.getAlbum(albumId)
      .then(a => {
        setAlbum(a);
        if (a.permissions) setAlbumPermissions(albumId, a.permissions);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [albumId, navigate, setAlbumPermissions]);

  const currentPermissions = albumId ? (album?.permissions ?? getAlbumPermissions(albumId)) : [];
  const canInvite = currentPermissions.some(p => p.name === INVITE_PERMISSION);
  const canUpdateAlbum = currentPermissions.some(p => p.name === UPDATE_ALBUM_PERMISSION);
  const canViewMembers = currentPermissions.some(p => p.name === VIEW_MEMBERS_PERMISSION);
  const canManageMembers = currentPermissions.some(p => p.name === MANAGE_MEMBER_PERMISSION);
  const canDeleteMembers = currentPermissions.some(p => p.name === DELETE_MEMBER_PERMISSION);
  const readOnlyAlbum = !canUpdateAlbum;
  const showManagementSections = canViewMembers || canInvite || canUpdateAlbum;

  useEffect(() => {
    if (!readOnlyAlbum || !album) return;
    albumsService.getMyAlbum()
      .then(myAlbumData => {
        if (myAlbumData?.id !== album.id) setMyAlbum(myAlbumData);
      })
      .catch(() => setMyAlbum(null));
  }, [album, readOnlyAlbum]);

  const loadMembers = async () => {
    if (!albumId || membersLoaded || !canViewMembers) return;
    try {
      const list = await albumsService.getMembers(albumId);
      setMembers(list);
      setMembersLoaded(true);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadMembers(); }, [albumId, canViewMembers]);

  const loadRoles = async () => {
    if (!albumId || roles.length > 0) return roles;
    try {
      const fetched = await albumsService.getRoles(albumId);
      setRoles(fetched);
      return fetched;
    } catch { return []; }
  };

  const openInviteModal = async () => {
    if (!albumId) return;
    setInviteError(""); setInviteSent(false); setInviteEmail("");
    setShowInvite(true);
    const fetched = await loadRoles();
    const list = fetched.length > 0 ? fetched : roles;
    if (list.length > 0 && !inviteRoleId) setInviteRoleId(list[0].id);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumId || !inviteEmail || !inviteRoleId) return;
    setInviteSending(true); setInviteError("");
    try {
      await albumsService.inviteMember(albumId, { invitedEmail: inviteEmail, roleId: inviteRoleId });
      setInviteSent(true); setInviteEmail("");
      setTimeout(() => { setShowInvite(false); setInviteSent(false); }, 2200);
    } catch {
      setInviteError("No se pudo enviar la invitación. Verificá que el email sea correcto.");
    } finally { setInviteSending(false); }
  };

  const openMemberModal = async (member: MemberResponse) => {
    setSelectedMember(member); setMemberRoleId(member.roleId); setMemberError("");
    await loadRoles();
  };

  const handleUpdateMemberRole = async () => {
    if (!albumId || !selectedMember) return;
    setMemberSaving(true); setMemberError("");
    try {
      const updated = await albumsService.updateMemberRole(albumId, selectedMember.id, memberRoleId);
      setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
      setSelectedMember(null);
    } catch { setMemberError("No se pudo actualizar el rol."); }
    finally { setMemberSaving(false); }
  };

  const handleRemoveMember = async () => {
    if (!albumId || !selectedMember) return;
    if (!confirm(`¿Eliminar a ${selectedMember.fullname ?? selectedMember.email} del álbum?`)) return;
    setMemberSaving(true); setMemberError("");
    try {
      await albumsService.removeMember(albumId, selectedMember.id);
      setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
      setSelectedMember(null);
    } catch { setMemberError("No se pudo eliminar el miembro."); }
    finally { setMemberSaving(false); }
  };

  const handleShare = async () => {
    if (!albumId) return;
    const normalizedEmail = shareEmail.trim();
    if (!normalizedEmail) return;

    setShareLoading(true); setShareError("");
    try {
      await albumsService.shareAlbum(albumId, normalizedEmail);
      setShareCopied(true); setShareEmail("");
      setTimeout(() => { setShowShare(false); setShareCopied(false); }, 2200);
    } catch {
      setShareError("No se pudo compartir. Verificá que el email pertenezca a un usuario de la plataforma y que no tenga una invitación pendiente.");
    }
    finally { setShareLoading(false); }
  };

  const statusMap = useMemo(() => {
    if (!album) return new Map<string, StickerStatus>();
    return new Map(album.stickers.map(s => [s.code, s.status]));
  }, [album]);

  const repeatedMap = useMemo(() => {
    if (!album) return new Map<string, number>();
    return new Map(album.stickers.map(s => [s.code, s.repeated ?? 0]));
  }, [album]);

  const myRepeatedMap = useMemo(() => {
    if (!myAlbum) return new Map<string, number>();
    return new Map(myAlbum.stickers.map(s => [s.code, s.repeated ?? 0]));
  }, [myAlbum]);

  const visibleTeams = worldCupAlbum.teams;

  const visibleStickers = useMemo((): WorldCupSticker[] => {
    return worldCupAlbum.stickers
      .filter(sticker => {
        if (selectedTeamCode !== "Todos") return sticker.teamCode === selectedTeamCode;
        return true;
      })
      .filter(sticker => {
        if (!matchesStickerSearch(sticker, searchQuery)) return false;
        const st = statusMap.get(sticker.stickerCode) ?? "no_tengo";
        if (stickerMode === "viewer_needs_my_repeated") {
          return st === "no_tengo" && (myRepeatedMap.get(sticker.stickerCode) ?? 0) > 0;
        }
        if (stickerMode === "all") return true;
        if (stickerMode === "owned") return st === "tengo" || st === "pegado";
        return st === stickerMode;
      });
  }, [myRepeatedMap, searchQuery, selectedTeamCode, stickerMode, statusMap]);

  // ── Bulk select ──────────────────────────────────────────────────────────────
  const clearSelection = useCallback(() => {
    setSelection(new Set());
    setSelectionGroup(null);
  }, []);

  const handleStickerClick = (code: string) => {
    if (readOnlyAlbum) return;
    const status = statusMap.get(code) ?? "no_tengo";
    const group = getSelectionGroup(status);
    if (selectionGroup !== null && group !== selectionGroup) return;

    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
        if (next.size === 0) setSelectionGroup(null);
      } else {
        next.add(code);
        setSelectionGroup(group);
      }
      return next;
    });
  };

  const handleBulkAction = async (targetStatus: StickerStatus) => {
    if (!albumId || !album || readOnlyAlbum || selection.size === 0) return;
    const codes = Array.from(selection);
    setBulkLoading(true);

    // Optimistic update
    const prevAlbum = album;
    setAlbum(prev => {
      if (!prev) return prev;
      let delta = 0;
      const stickers = prev.stickers.map(s => {
        if (!selection.has(s.code)) return s;
        const wasOwned = s.status !== "no_tengo";
        const willBeOwned = targetStatus !== "no_tengo";
        delta += (willBeOwned ? 1 : 0) - (wasOwned ? 1 : 0);
        return { ...s, status: targetStatus, owned: willBeOwned, repeated: targetStatus === "pegado" ? s.repeated ?? 0 : 0 };
      });
      return { ...prev, stickers, ownedCount: prev.ownedCount + delta };
    });
    clearSelection();

    try {
      const updated = await albumsService.bulkUpdateStickers(albumId, codes, targetStatus);
      setAlbum(prev => ({
        ...updated,
        permissions: updated.permissions ?? prev?.permissions ?? currentPermissions,
      }));
      if (updated.permissions) setAlbumPermissions(albumId, updated.permissions);
    } catch {
      setAlbum(prevAlbum);
    } finally {
      setBulkLoading(false);
    }
  };

  const openRepeatedModal = (code: string) => {
    setSelectedRepeatedSticker(code);
    setRepeatedDraft(repeatedMap.get(code) ?? 0);
    setRepeatedError("");
  };

  const handleRepeatedAction = () => {
    const [code] = Array.from(selection);
    if (!code || (statusMap.get(code) ?? "no_tengo") !== "pegado") return;
    openRepeatedModal(code);
  };

  const handleSaveRepeated = async () => {
    if (!albumId || !album || !selectedRepeatedSticker) return;
    const nextRepeated = Math.max(0, Math.floor(repeatedDraft));
    setRepeatedSaving(true);
    setRepeatedError("");

    const prevAlbum = album;
    setAlbum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stickers: prev.stickers.map(s =>
          s.code === selectedRepeatedSticker ? { ...s, repeated: nextRepeated } : s,
        ),
      };
    });

    try {
      const updated = await albumsService.updateStickerRepeated(albumId, selectedRepeatedSticker, nextRepeated);
      setAlbum(prev => ({
        ...updated,
        permissions: updated.permissions ?? prev?.permissions ?? currentPermissions,
      }));
      setSelectedRepeatedSticker(null);
      clearSelection();
    } catch {
      setAlbum(prevAlbum);
      setRepeatedError("No se pudo guardar la cantidad.");
    } finally {
      setRepeatedSaving(false);
    }
  };

  const handleExport = () => {
    if (!album) return;
    const lines: string[] = [];
    for (const team of worldCupAlbum.teams) {
      const teamStickers = worldCupAlbum.stickers.filter(s => s.teamCode === team.code);
      const tengo = teamStickers.filter(s => (statusMap.get(s.stickerCode) ?? "no_tengo") !== "no_tengo").map(s => s.stickerCode);
      const faltan = teamStickers.filter(s => (statusMap.get(s.stickerCode) ?? "no_tengo") === "no_tengo").map(s => s.stickerCode);
      lines.push(team.code);
      lines.push(`Tengo: ${tengo.length > 0 ? tengo.join(", ") : "-"}`);
      lines.push(`Faltan: ${faltan.length > 0 ? faltan.join(", ") : "-"}`);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `figuritas-${album.name.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI calculations
  const kpiData = useMemo(() => {
    const countByTeam = new Map<string, number>();
    statusMap.forEach((status, code) => {
      const parts = code.split(" ");
      if (parts.length < 2) return;
      const teamCode = parts[0];
      if (status !== "no_tengo") countByTeam.set(teamCode, (countByTeam.get(teamCode) ?? 0) + 1);
    });
    const teamStats = worldCupAlbum.teams.map(t => ({
      code: t.code, name: t.name,
      owned: countByTeam.get(t.code) ?? 0, total: 20,
      complete: (countByTeam.get(t.code) ?? 0) === 20,
    }));
    return { teamStats, completedCount: teamStats.filter(t => t.complete).length };
  }, [statusMap]);

  const modeCounts = useMemo(() => {
    let noTengo = 0, tengo = 0, pegado = 0;
    statusMap.forEach(st => { if (st === "no_tengo") noTengo++; else if (st === "tengo") tengo++; else pegado++; });
    return { noTengo, tengo, pegado };
  }, [statusMap]);

  const visibleTeam = worldCupAlbum.teams.find(t => t.code === selectedTeamCode);
  const ownedCount = album?.ownedCount ?? 0;
  const totalCount = album?.totalCount ?? 980;
  const pct = Math.round((ownedCount / totalCount) * 100);

  const getMemberDisplayName = (m: MemberResponse) =>
    m.fullname ? `${m.fullname}${m.surname ? ` ${m.surname}` : ""}` : m.email;
  const getMemberRole = (m: MemberResponse) => roles.find(r => r.id === m.roleId)?.name ?? "—";

  const selectedStatuses = useMemo(() => {
    const statuses = new Set<StickerStatus>();
    selection.forEach(code => statuses.add(statusMap.get(code) ?? "no_tengo"));
    return statuses;
  }, [selection, statusMap]);

  const bulkActions = useMemo(() => {
    if (selectedStatuses.size === 0) return null;
    const statuses = Array.from(selectedStatuses);
    if (statuses.length === 1) return BULK_ACTIONS[statuses[0]];
    return MIXED_OWNED_ACTIONS;
  }, [selectedStatuses]);

  const canEditRepeatedSelection = useMemo(() => {
    if (selection.size !== 1) return false;
    const [code] = Array.from(selection);
    return (statusMap.get(code) ?? "no_tengo") === "pegado";
  }, [selection, statusMap]);

  if (loading) return <div className={styles.loading}>Cargando album...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate("/")}>← Volver</button>
        <span className={styles.title}>{album?.name ?? "Mi Album"}</span>
      </header>

      <div className={showManagementSections ? styles.workspace : `${styles.workspace} ${styles.readOnlyWorkspace}`}>
        {showManagementSections && (
        <section className={styles.sidebar}>

          {/* ── Members ─────────────────────────────────────── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Miembros</h2>
                <span>{members.length} miembro{members.length !== 1 ? "s" : ""}</span>
              </div>
              <div className={styles.memberActions}>
                <button type="button" className={styles.shareBtn} onClick={() => { setShareError(""); setShareCopied(false); setShareEmail(""); setShowShare(true); }} disabled={shareLoading}>
                  {shareLoading ? "..." : shareCopied ? "¡Invitado!" : "Compartir"}
                </button>
                <button type="button" className={styles.exportBtn} onClick={handleExport}>Exportar</button>
                {canInvite && (
                  <button type="button" className={styles.inviteBtn} onClick={openInviteModal}>+ Invitar</button>
                )}
              </div>
            </div>
            <div className={styles.memberList}>
              {members.map(m => (
                <button key={m.id} type="button" className={styles.memberCard} onClick={() => openMemberModal(m)}>
                  <div className={styles.memberAvatar}>{(m.fullname ?? m.email).charAt(0).toUpperCase()}</div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{getMemberDisplayName(m)}</span>
                    <span className={styles.memberRole}>{getMemberRole(m)}</span>
                  </div>
                  <span className={styles.memberChevron}>›</span>
                </button>
              ))}
              {members.length === 0 && <p className={styles.emptyMembers}>Sin miembros cargados.</p>}
            </div>
          </div>

          {/* ── KPIs ────────────────────────────────────────── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <div><h2>Progreso</h2></div>
              <span className={styles.progress}>{ownedCount} / {totalCount} ({pct}%)</span>
            </div>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>{ownedCount}/{totalCount}</span>
                <span className={styles.kpiLabel}>Total figuritas</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>{kpiData.completedCount}/48</span>
                <span className={styles.kpiLabel}>Países completos</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>{modeCounts.pegado}</span>
                <span className={styles.kpiLabel}>Pegadas</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>{modeCounts.tengo}</span>
                <span className={styles.kpiLabel}>Tengo (sin pegar)</span>
              </div>
            </div>
            {kpiExpanded && (
              <div className={styles.kpiCountryList}>
                {kpiData.teamStats.map(t => (
                  <div key={t.code} className={`${styles.kpiCountryRow} ${t.complete ? styles.kpiCountryComplete : ""}`}>
                    <span className={styles.kpiCountryCode}>{t.code}</span>
                    <div className={styles.kpiCountryBar}>
                      <div className={styles.kpiCountryBarFill} style={{ width: `${(t.owned / t.total) * 100}%` }} />
                    </div>
                    <span className={styles.kpiCountryStat}>{t.owned}/{t.total}</span>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className={styles.verMasBtn} onClick={() => setKpiExpanded(v => !v)}>
              {kpiExpanded ? "Ver menos ▲" : "Ver más ▼"}
            </button>
          </div>
        </section>
        )}

        <section className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>
                {visibleTeam ? visibleTeam.name : "Figuritas"}
              </h2>
              <p>
                {visibleTeam
                  ? `Grupo ${visibleTeam.group} · ${visibleTeam.confederation}`
                  : `${visibleStickers.length} figuritas`}
              </p>
            </div>
            <div className={styles.panelHeaderRight}>
              <div className={styles.modeSwitch}>
                {([
                  "all",
                  "no_tengo",
                  "owned",
                  "tengo",
                  "pegado",
                  ...(readOnlyAlbum && myAlbum ? ["viewer_needs_my_repeated" as const] : []),
                ] as StickerMode[]).map(mode => (
                  <button
                    type="button" key={mode}
                    className={mode === stickerMode ? `${styles.modeBtn} ${styles.modeBtnActive}` : styles.modeBtn}
                    onClick={() => { setStickerMode(mode); clearSelection(); }}
                  >
                    {mode === "all" ? "Todas"
                      : mode === "no_tengo" ? `No tengo (${modeCounts.noTengo})`
                      : mode === "owned" ? `Tengo y pegado (${modeCounts.tengo + modeCounts.pegado})`
                      : mode === "tengo" ? `Tengo (${modeCounts.tengo})`
                      : mode === "pegado" ? `Pegado (${modeCounts.pegado})`
                      : "Mis repetidas que necesita"}
                  </button>
                ))}
              </div>
              {!readOnlyAlbum && selection.size > 0 && (
                <button type="button" className={styles.clearSelectionBtn} onClick={clearSelection}>
                  Limpiar ({selection.size})
                </button>
              )}
            </div>
          </div>

          <div className={styles.albumFilters}>
            <div className={styles.filterHeader}>
              <span>Paises y busqueda</span>
              <strong>{visibleTeams.length} paises</strong>
            </div>
            <div className={styles.filterControls}>
              <TeamCodeDropdown
                teams={visibleTeams} selectedTeamCode={selectedTeamCode}
                selectedGroup="Todos" onSelect={setSelectedTeamCode}
              />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Buscar por codigo: MEX, MEX 1, 17"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); clearSelection(); }}
              />
            </div>
          </div>

          <div className={styles.stickerGrid}>
            {visibleStickers.map(sticker => {
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
                  onClick={readOnlyAlbum ? undefined : () => handleStickerClick(sticker.stickerCode)}
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
            {visibleStickers.length === 0 && <p className={styles.empty}>No hay figuritas para mostrar.</p>}
          </div>
        </section>
      </div>

      {!readOnlyAlbum && selection.size > 0 && bulkActions && (
        <div className={styles.selectionActions}>
          <span className={styles.selectionCount}>
            {selection.size} seleccionada{selection.size !== 1 ? "s" : ""}
          </span>
          <div className={styles.selectionButtons}>
            {bulkActions.map(action => (
              <button
                key={action.targetStatus}
                type="button"
                className={`${styles.bulkBtn} ${styles[`bulkBtn_${action.variant}`]}`}
                onClick={() => handleBulkAction(action.targetStatus)}
                disabled={bulkLoading}
              >
                {action.label}
              </button>
            ))}
            {canEditRepeatedSelection && (
              <button
                type="button"
                className={`${styles.bulkBtn} ${styles.bulkBtn_primary}`}
                onClick={handleRepeatedAction}
                disabled={bulkLoading}
              >
                Repetida
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Share modal ────────────────────────────────────────────────────────── */}
      {showShare && (
        <div className={styles.overlay} onClick={() => setShowShare(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Compartir album</h3>
            {shareCopied ? (
              <p className={styles.inviteSuccess}>¡Invitación enviada correctamente!</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleShare(); }} className={styles.inviteForm}>
                <p className={styles.inviteHint}>Ingresá el email de un usuario de la plataforma. Va a poder ver las figuritas del álbum.</p>
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                  required
                  autoFocus
                />
                {shareError && <p className={styles.inviteError}>{shareError}</p>}
                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowShare(false)}>Cancelar</button>
                  <button type="submit" className={styles.inviteSend} disabled={shareLoading}>
                    {shareLoading ? "Enviando..." : "Enviar invitación"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Invite modal ───────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className={styles.overlay} onClick={() => setShowInvite(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Invitar al album</h3>
            {inviteSent ? (
              <p className={styles.inviteSuccess}>¡Invitación enviada correctamente!</p>
            ) : (
              <form onSubmit={handleInvite} className={styles.inviteForm}>
                <p className={styles.inviteHint}>Ingresá el email de la persona a invitar.</p>
                <input
                  type="email" placeholder="email@ejemplo.com" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} required autoFocus
                />
                {roles.length > 1 && (
                  <select value={inviteRoleId} onChange={e => setInviteRoleId(e.target.value)} className={styles.roleSelect}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                )}
                {inviteError && <p className={styles.inviteError}>{inviteError}</p>}
                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowInvite(false)}>Cancelar</button>
                  <button type="submit" className={styles.inviteSend} disabled={inviteSending}>
                    {inviteSending ? "Enviando..." : "Enviar invitación"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Member modal ───────────────────────────────────────────────────────── */}
      {selectedMember && (
        <div className={styles.overlay} onClick={() => setSelectedMember(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{getMemberDisplayName(selectedMember)}</h3>
            <p className={styles.inviteHint}>{selectedMember.email}</p>
            {(canManageMembers || canDeleteMembers) ? (
              <div className={styles.inviteForm}>
                {canManageMembers && roles.length > 0 && (
                  <div>
                    <label className={styles.fieldLabel}>Rol</label>
                    <select value={memberRoleId} onChange={e => setMemberRoleId(e.target.value)} className={styles.roleSelect}>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                )}
                {memberError && <p className={styles.inviteError}>{memberError}</p>}
                <div className={styles.modalActions}>
                  {canDeleteMembers && (
                    <button type="button" className={styles.removeMemberBtn} onClick={handleRemoveMember} disabled={memberSaving}>
                      Eliminar
                    </button>
                  )}
                  <button type="button" onClick={() => setSelectedMember(null)}>Cancelar</button>
                  {canManageMembers && (
                    <button type="button" className={styles.inviteSend} onClick={handleUpdateMemberRole} disabled={memberSaving}>
                      {memberSaving ? "Guardando..." : "Guardar"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setSelectedMember(null)}>Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRepeatedSticker && (
        <div className={styles.overlay} onClick={() => setSelectedRepeatedSticker(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Repetida {selectedRepeatedSticker}</h3>
            <div className={styles.repeatedEditor}>
              <button
                type="button"
                onClick={() => setRepeatedDraft(value => Math.max(0, value - 1))}
                disabled={repeatedSaving || repeatedDraft <= 0}
              >
                -
              </button>
              <input
                type="number"
                min="0"
                step="1"
                value={repeatedDraft}
                onChange={e => setRepeatedDraft(Math.max(0, Number(e.target.value) || 0))}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setRepeatedDraft(value => value + 1)}
                disabled={repeatedSaving}
              >
                +
              </button>
            </div>
            {repeatedError && <p className={styles.inviteError}>{repeatedError}</p>}
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setSelectedRepeatedSticker(null)}>Cancelar</button>
              <button type="button" className={styles.inviteSend} onClick={handleSaveRepeated} disabled={repeatedSaving}>
                {repeatedSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
