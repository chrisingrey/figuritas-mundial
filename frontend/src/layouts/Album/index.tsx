import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { albumsService, type AlbumResponse, type AlbumRoleResponse, type MemberResponse, type StickerStatus } from "@backend";
import { useUserLogged } from "@/context";
import { worldCupAlbum } from "@/data/worldCupAlbum";
import type { WorldCupSticker } from "@/types/album";
import { useApiCall } from "@/hooks";
import { BookSpinner, CircleSpinner } from "@/components";
import styles from "./index.module.scss";
import { MembersSection } from "./MembersSection";
import { ProgressSection } from "./ProgressSection";
import { StickersSection } from "./StickersSection";

const INVITE_PERMISSION = "create-albumInvitation";
const UPDATE_ALBUM_PERMISSION = "updateById-album";
const VIEW_MEMBERS_PERMISSION = "getAll-member";
const MANAGE_MEMBER_PERMISSION = "updateById-member";
const DELETE_MEMBER_PERMISSION = "deleteById-member";

type StickerMode = "all" | "no_tengo" | "owned" | "tengo" | "pegado" | "repetidas" | "viewer_needs_my_repeated";
type SelectionGroup = "missing" | "owned";

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
  const { execute: fetchAlbum, loading } = useApiCall(albumsService.getAlbum, { initialLoading: true });
  const [selectedTeamCode, setSelectedTeamCode] = useState("Todos");
  const [stickerMode, setStickerMode] = useState<StickerMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [myAlbum, setMyAlbum] = useState<AlbumResponse | null>(null);

  // Bulk selection
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [selectionGroup, setSelectionGroup] = useState<SelectionGroup | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkRepeatedModal, setShowBulkRepeatedModal] = useState(false);
  const [bulkRepeatedDrafts, setBulkRepeatedDrafts] = useState<Map<string, number>>(new Map());
  const [bulkRepeatedSaving, setBulkRepeatedSaving] = useState(false);
  const [bulkRepeatedError, setBulkRepeatedError] = useState("");

  // Members state
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const { execute: fetchMembersCall, loading: membersLoading } = useApiCall(albumsService.getMembers);
  const { execute: fetchRolesCall, loading: rolesLoading } = useApiCall(albumsService.getRoles);
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

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTengo, setExportTengo] = useState(true);
  const [exportFaltan, setExportFaltan] = useState(true);
  const [exportRepetidas, setExportRepetidas] = useState(true);

  useEffect(() => {
    if (!albumId) return;
    fetchAlbum(albumId)
      .then(a => {
        setAlbum(a);
        if (a.permissions) setAlbumPermissions(albumId, a.permissions);
      })
      .catch(() => navigate("/"));
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

  useEffect(() => {
    if (!albumId || membersLoaded || !canViewMembers) return;
    fetchMembersCall(albumId)
      .then(list => { setMembers(list); setMembersLoaded(true); })
      .catch(() => {});
  }, [albumId, canViewMembers]);

  useEffect(() => {
    if (!albumId || !canViewMembers || roles.length > 0) return;
    fetchRolesCall(albumId)
      .then(fetched => { setRoles(fetched); })
      .catch(() => {});
  }, [albumId, canViewMembers]);

  const openInviteModal = async () => {
    if (!albumId) return;
    setInviteError(""); setInviteSent(false); setInviteEmail("");
    setShowInvite(true);
    if (canInvite) {
      const list = roles.length > 0 ? roles : await fetchRolesCall(albumId).then(f => { setRoles(f); return f; }).catch(() => [] as AlbumRoleResponse[]);
      if (list.length > 0 && !inviteRoleId) setInviteRoleId(list[0].id);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumId || !inviteEmail) return;
    setInviteSending(true); setInviteError("");
    try {
      if (canInvite && inviteRoleId) {
        await albumsService.inviteMember(albumId, { invitedEmail: inviteEmail, roleId: inviteRoleId });
      } else {
        await albumsService.shareAlbum(albumId, inviteEmail.trim());
      }
      setInviteSent(true); setInviteEmail("");
      setTimeout(() => { setShowInvite(false); setInviteSent(false); }, 2200);
    } catch {
      setInviteError("No se pudo enviar la invitación. Verificá que el email sea correcto.");
    } finally { setInviteSending(false); }
  };

  const openMemberModal = async (member: MemberResponse) => {
    setSelectedMember(member); setMemberRoleId(member.roleId); setMemberError("");
    if (albumId && roles.length === 0) {
      fetchRolesCall(albumId).then(setRoles).catch(() => {});
    }
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
        if (stickerMode === "repetidas") return (repeatedMap.get(sticker.stickerCode) ?? 0) > 0;
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

  const handleOpenBulkRepeated = () => {
    const drafts = new Map<string, number>();
    selection.forEach(code => {
      if ((statusMap.get(code) ?? "no_tengo") === "pegado") {
        drafts.set(code, repeatedMap.get(code) ?? 0);
      }
    });
    setBulkRepeatedDrafts(drafts);
    setBulkRepeatedError("");
    setShowBulkRepeatedModal(true);
  };

  const handleSaveBulkRepeated = async () => {
    if (!albumId || !album) return;
    setBulkRepeatedSaving(true);
    setBulkRepeatedError("");

    const prevAlbum = album;
    setAlbum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stickers: prev.stickers.map(s =>
          bulkRepeatedDrafts.has(s.code)
            ? { ...s, repeated: bulkRepeatedDrafts.get(s.code) ?? 0 }
            : s,
        ),
      };
    });

    try {
      let lastUpdated = prevAlbum;
      for (const [code, count] of Array.from(bulkRepeatedDrafts.entries())) {
        lastUpdated = await albumsService.updateStickerRepeated(albumId, code, Math.max(0, Math.floor(count)));
      }
      setAlbum(prev => ({
        ...lastUpdated,
        permissions: lastUpdated.permissions ?? prev?.permissions ?? currentPermissions,
      }));
      if (lastUpdated.permissions) setAlbumPermissions(albumId, lastUpdated.permissions);
      setShowBulkRepeatedModal(false);
      clearSelection();
    } catch {
      setAlbum(prevAlbum);
      setBulkRepeatedError("No se pudo guardar. Intentá de nuevo.");
    } finally {
      setBulkRepeatedSaving(false);
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    if (!album) return;
    const lines: string[] = [];
    for (const team of worldCupAlbum.teams) {
      const teamStickers = worldCupAlbum.stickers.filter(s => s.teamCode === team.code);
      const teamLines: string[] = [team.code];
      if (exportTengo) {
        const tengo = teamStickers.filter(s => (statusMap.get(s.stickerCode) ?? "no_tengo") !== "no_tengo").map(s => s.stickerCode);
        teamLines.push(`Tengo: ${tengo.length > 0 ? tengo.join(", ") : "-"}`);
      }
      if (exportFaltan) {
        const faltan = teamStickers.filter(s => (statusMap.get(s.stickerCode) ?? "no_tengo") === "no_tengo").map(s => s.stickerCode);
        teamLines.push(`Faltan: ${faltan.length > 0 ? faltan.join(", ") : "-"}`);
      }
      if (exportRepetidas) {
        const repetidas = teamStickers
          .filter(s => (repeatedMap.get(s.stickerCode) ?? 0) > 0)
          .map(s => `${s.stickerCode} (x${repeatedMap.get(s.stickerCode)})`);
        teamLines.push(`Repetidas: ${repetidas.length > 0 ? repetidas.join(", ") : "-"}`);
      }
      lines.push(...teamLines);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `figuritas-${album.name.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
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
    let noTengo = 0, tengo = 0, pegado = 0, repetidas = 0;
    statusMap.forEach((st, code) => {
      if (st === "no_tengo") noTengo++;
      else if (st === "tengo") tengo++;
      else pegado++;
      if ((repeatedMap.get(code) ?? 0) > 0) repetidas++;
    });
    return { noTengo, tengo, pegado, repetidas };
  }, [statusMap, repeatedMap]);

  const visibleTeam = worldCupAlbum.teams.find(t => t.code === selectedTeamCode);
  const ownedCount = album?.ownedCount ?? 0;
  const totalCount = album?.totalCount ?? 980;
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

  const canEditRepeatedBulk = useMemo(() => {
    if (selection.size === 0) return false;
    return Array.from(selection).every(code => (statusMap.get(code) ?? "no_tengo") === "pegado");
  }, [selection, statusMap]);

  if (loading) return <BookSpinner overlay />;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate("/")}>← Volver</button>
        <span className={styles.title}>{album?.name ?? "Mi Album"}</span>
      </header>

      <div className={showManagementSections ? styles.workspace : `${styles.workspace} ${styles.readOnlyWorkspace}`}>
        {showManagementSections && (
          <section className={styles.sidebar}>
            <MembersSection
              members={members}
              roles={roles}
              membersLoading={membersLoading}
              rolesLoading={rolesLoading}
              onExport={handleExport}
              onOpenInvite={openInviteModal}
              onOpenMember={openMemberModal}
            />
            <ProgressSection
              ownedCount={ownedCount}
              totalCount={totalCount}
              kpiData={kpiData}
              modeCounts={modeCounts}
            />
          </section>
        )}

        <StickersSection
          visibleStickers={visibleStickers}
          visibleTeams={visibleTeams}
          visibleTeam={visibleTeam}
          statusMap={statusMap}
          repeatedMap={repeatedMap}
          selection={selection}
          selectionGroup={selectionGroup}
          stickerMode={stickerMode}
          modeCounts={modeCounts}
          selectedTeamCode={selectedTeamCode}
          searchQuery={searchQuery}
          readOnlyAlbum={readOnlyAlbum}
          hasMyAlbum={!!myAlbum}
          onStickerClick={handleStickerClick}
          onTeamSelect={code => { setSelectedTeamCode(code); clearSelection(); }}
          onModeChange={mode => { setStickerMode(mode); clearSelection(); }}
          onSearchChange={query => { setSearchQuery(query); clearSelection(); }}
        />
      </div>

      {!readOnlyAlbum && selection.size > 0 && bulkActions && (
        <div className={styles.selectionActions}>
          <button
            type="button"
            className={styles.selectionClearBtn}
            onClick={clearSelection}
            disabled={bulkLoading}
          >
            Limpiar selección
          </button>
          <div className={styles.selectionButtons}>
            {bulkActions.map(action => (
              <button
                key={action.targetStatus}
                type="button"
                className={`${styles.bulkBtn} ${styles[`bulkBtn_${action.variant}`]}`}
                onClick={() => handleBulkAction(action.targetStatus)}
                disabled={bulkLoading}
              >
                {action.label} ({selection.size})
              </button>
            ))}
            {canEditRepeatedBulk && (
              <button
                type="button"
                className={`${styles.bulkBtn} ${styles.bulkBtn_primary}`}
                onClick={handleOpenBulkRepeated}
                disabled={bulkLoading}
              >
                Repetidas
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Share modal ────────────────────────────────────────────────────────── */}
      {/* ── Invite modal ───────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className={styles.overlay} onClick={() => setShowInvite(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Invitar al album</h3>
            {inviteSent ? (
              <p className={styles.inviteSuccess}>¡Invitación enviada correctamente!</p>
            ) : (
              <form onSubmit={handleInvite} className={styles.inviteForm}>
                <p className={styles.inviteHint}>
                  {canInvite
                    ? "Ingresá el email de la persona a invitar."
                    : "Ingresá el email de un usuario de la plataforma. Va a poder ver las figuritas del álbum."}
                </p>
                <input
                  type="email" placeholder="email@ejemplo.com" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} required autoFocus
                />
                {canInvite && roles.length > 1 && (
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
            <h3>{selectedMember.fullname ? `${selectedMember.fullname}${selectedMember.surname ? ` ${selectedMember.surname}` : ""}` : selectedMember.email}</h3>
            <p className={styles.inviteHint}>{selectedMember.email}</p>
            {(canManageMembers || canDeleteMembers) ? (
              <div className={styles.inviteForm}>
                {canManageMembers && (
                  <div className={styles.roleRow}>
                    <label className={styles.fieldLabel}>Rol</label>
                    {rolesLoading
                      ? <CircleSpinner size={18} />
                      : (
                        <select value={memberRoleId} onChange={e => setMemberRoleId(e.target.value)} className={styles.roleSelect}>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      )
                    }
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

      {/* ── Export modal ───────────────────────────────────────────────────────── */}
      {showExportModal && (
        <div className={styles.overlay} onClick={() => setShowExportModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Exportar figuritas</h3>
            <p className={styles.inviteHint}>Seleccioná qué información querés incluir en el archivo.</p>
            <div className={styles.exportOptions}>
              <label className={styles.exportOption}>
                <input type="checkbox" checked={exportTengo} onChange={e => setExportTengo(e.target.checked)} />
                <span>Tengo</span>
              </label>
              <label className={styles.exportOption}>
                <input type="checkbox" checked={exportFaltan} onChange={e => setExportFaltan(e.target.checked)} />
                <span>Faltan</span>
              </label>
              <label className={styles.exportOption}>
                <input type="checkbox" checked={exportRepetidas} onChange={e => setExportRepetidas(e.target.checked)} />
                <span>Repetidas</span>
              </label>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowExportModal(false)}>Cancelar</button>
              <button
                type="button"
                className={styles.inviteSend}
                onClick={handleExportConfirm}
                disabled={!exportTengo && !exportFaltan && !exportRepetidas}
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkRepeatedModal && (
        <div className={styles.overlay} onClick={() => setShowBulkRepeatedModal(false)}>
          <div className={styles.bulkRepeatedModal} onClick={e => e.stopPropagation()}>
            <h3>Editar repetidas ({bulkRepeatedDrafts.size})</h3>
            <div className={styles.bulkRepeatedList}>
              {Array.from(bulkRepeatedDrafts.entries()).map(([code, count]) => (
                <div key={code} className={styles.bulkRepeatedRow}>
                  <span className={styles.bulkRepeatedCode}>{code}</span>
                  <div className={styles.repeatedEditor}>
                    <button
                      type="button"
                      onClick={() => setBulkRepeatedDrafts(prev => { const next = new Map(prev); next.set(code, Math.max(0, (next.get(code) ?? 0) - 1)); return next; })}
                      disabled={bulkRepeatedSaving || count <= 0}
                    >-</button>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={count}
                      onChange={e => setBulkRepeatedDrafts(prev => { const next = new Map(prev); next.set(code, Math.max(0, Number(e.target.value) || 0)); return next; })}
                    />
                    <button
                      type="button"
                      onClick={() => setBulkRepeatedDrafts(prev => { const next = new Map(prev); next.set(code, (next.get(code) ?? 0) + 1); return next; })}
                      disabled={bulkRepeatedSaving}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
            {bulkRepeatedError && <p className={styles.inviteError}>{bulkRepeatedError}</p>}
            <div className={styles.bulkRepeatedFooter}>
              <button type="button" onClick={() => setShowBulkRepeatedModal(false)}>Cancelar</button>
              <button type="button" className={styles.inviteSend} onClick={handleSaveBulkRepeated} disabled={bulkRepeatedSaving}>
                {bulkRepeatedSaving ? "Guardando..." : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
