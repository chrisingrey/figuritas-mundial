import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { albumsService, type AlbumResponse, type AlbumRoleResponse, type MemberResponse, type StickerStatus } from "@backend";
import { worldCupAlbum } from "@/data/worldCupAlbum";
import type { WorldCupSticker } from "@/types/album";
import { TeamCodeDropdown } from "./TeamCodeDropdown";
import styles from "./index.module.scss";

const INVITE_PERMISSION = "create-albumInvitation";
const UPDATE_ALBUM_PERMISSION = "updateById-album";
const VIEW_MEMBERS_PERMISSION = "getAll-member";
const MANAGE_MEMBER_PERMISSION = "updateById-member";
const DELETE_MEMBER_PERMISSION = "deleteById-member";

type StickerMode = "all" | "no_tengo" | "owned" | "tengo" | "pegado";
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

export default function Album() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedTeamCode, setSelectedTeamCode] = useState("Todos");
  const [stickerMode, setStickerMode] = useState<StickerMode>("all");

  // Bulk selection
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [selectionGroup, setSelectionGroup] = useState<SelectionGroup | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

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
      .then(setAlbum)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [albumId, navigate]);

  const canInvite = album?.permissions?.some(p => p.name === INVITE_PERMISSION) ?? false;
  const canUpdateAlbum = album?.permissions?.some(p => p.name === UPDATE_ALBUM_PERMISSION) ?? false;
  const canViewMembers = album?.permissions?.some(p => p.name === VIEW_MEMBERS_PERMISSION) ?? false;
  const canManageMembers = album?.permissions?.some(p => p.name === MANAGE_MEMBER_PERMISSION) ?? false;
  const canDeleteMembers = album?.permissions?.some(p => p.name === DELETE_MEMBER_PERMISSION) ?? false;
  const readOnlyAlbum = !canUpdateAlbum;
  const showManagementSections = canViewMembers || canInvite || canUpdateAlbum;

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

  const groups = useMemo(
    () => ["Todos", ...Array.from(new Set(worldCupAlbum.teams.map(t => t.group))).sort((a, b) => Number(a) - Number(b))],
    [],
  );

  const visibleTeams = useMemo(
    () => worldCupAlbum.teams.filter(t => selectedGroup === "Todos" || t.group === selectedGroup),
    [selectedGroup],
  );

  const visibleStickers = useMemo((): WorldCupSticker[] => {
    return worldCupAlbum.stickers
      .filter(sticker => {
        if (selectedTeamCode !== "Todos") return sticker.teamCode === selectedTeamCode;
        if (selectedGroup !== "Todos") {
          if (sticker.type === "special") return false;
          const team = worldCupAlbum.teams.find(t => t.code === sticker.teamCode);
          return team?.group === selectedGroup;
        }
        return true;
      })
      .filter(sticker => {
        const st = statusMap.get(sticker.stickerCode) ?? "no_tengo";
        if (stickerMode === "all") return true;
        if (stickerMode === "owned") return st === "tengo" || st === "pegado";
        return st === stickerMode;
      });
  }, [selectedGroup, selectedTeamCode, stickerMode, statusMap]);

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
        return { ...s, status: targetStatus, owned: willBeOwned };
      });
      return { ...prev, stickers, ownedCount: prev.ownedCount + delta };
    });
    clearSelection();

    try {
      const updated = await albumsService.bulkUpdateStickers(albumId, codes, targetStatus);
      setAlbum(updated);
    } catch {
      setAlbum(prevAlbum);
    } finally {
      setBulkLoading(false);
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

          {/* ── Groups ──────────────────────────────────────── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <div><h2>Grupos</h2><span>{visibleTeams.length} países</span></div>
            </div>
            <div className={styles.segmented}>
              {groups.map(group => (
                <button
                  type="button" key={group}
                  className={group === selectedGroup ? styles.segBtnActive : styles.segBtn}
                  onClick={() => { setSelectedGroup(group); setSelectedTeamCode("Todos"); }}
                >
                  {group === "Todos" ? "Todos" : `G${group}`}
                </button>
              ))}
            </div>
            <TeamCodeDropdown
              teams={visibleTeams} selectedTeamCode={selectedTeamCode}
              selectedGroup={selectedGroup} onSelect={setSelectedTeamCode}
            />
          </div>
        </section>
        )}

        <section className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>
                {visibleTeam ? visibleTeam.name : selectedGroup !== "Todos" ? `Grupo ${selectedGroup}` : "Figuritas"}
              </h2>
              <p>
                {visibleTeam
                  ? `Grupo ${visibleTeam.group} · ${visibleTeam.confederation}`
                  : `${visibleStickers.length} figuritas`}
              </p>
            </div>
            <div className={styles.panelHeaderRight}>
              <div className={styles.modeSwitch}>
                {(["all", "no_tengo", "owned", "tengo", "pegado"] as StickerMode[]).map(mode => (
                  <button
                    type="button" key={mode}
                    className={mode === stickerMode ? `${styles.modeBtn} ${styles.modeBtnActive}` : styles.modeBtn}
                    onClick={() => { setStickerMode(mode); clearSelection(); }}
                  >
                    {mode === "all" ? "Todas"
                      : mode === "no_tengo" ? `No tengo (${modeCounts.noTengo})`
                      : mode === "owned" ? `Tengo y pegado (${modeCounts.tengo + modeCounts.pegado})`
                      : mode === "tengo" ? `Tengo (${modeCounts.tengo})`
                      : `Pegado (${modeCounts.pegado})`}
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
    </div>
  );
}
