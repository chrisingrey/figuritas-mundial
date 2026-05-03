import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { albumsService, type AlbumResponse, type AlbumRoleResponse } from "@backend";
import { worldCupAlbum } from "@/data/worldCupAlbum";
import type { WorldCupSticker } from "@/types/album";
import { TeamCodeDropdown } from "./TeamCodeDropdown";
import styles from "./index.module.scss";

const INVITE_PERMISSION = "create-albumInvitation";

type StickerMode = "all" | "owned" | "missing";

export default function Album() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedTeamCode, setSelectedTeamCode] = useState("Todos");
  const [stickerMode, setStickerMode] = useState<StickerMode>("all");
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [roles, setRoles] = useState<AlbumRoleResponse[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    if (!albumId) return;
    albumsService.getAlbum(albumId)
      .then(setAlbum)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [albumId, navigate]);

  const canInvite = album?.permissions?.some(p => p.name === INVITE_PERMISSION) ?? false;

  const openInviteModal = async () => {
    if (!albumId) return;
    setInviteError("");
    setInviteSent(false);
    setInviteEmail("");
    setShowInvite(true);
    if (roles.length === 0) {
      try {
        const fetched = await albumsService.getRoles(albumId);
        setRoles(fetched);
        setInviteRoleId(fetched[0]?.id ?? "");
      } catch {
        setInviteError("No se pudieron cargar los roles.");
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumId || !inviteEmail || !inviteRoleId) return;
    setInviteSending(true);
    setInviteError("");
    try {
      await albumsService.inviteMember(albumId, { invitedEmail: inviteEmail, roleId: inviteRoleId });
      setInviteSent(true);
      setInviteEmail("");
      setTimeout(() => { setShowInvite(false); setInviteSent(false); }, 2200);
    } catch {
      setInviteError("No se pudo enviar la invitación. Verificá que el email sea correcto.");
    } finally {
      setInviteSending(false);
    }
  };

  const ownedSet = useMemo(() => {
    if (!album) return new Set<string>();
    return new Set(album.stickers.filter(s => s.owned).map(s => s.code));
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
        if (stickerMode === "owned") return ownedSet.has(sticker.stickerCode);
        if (stickerMode === "missing") return !ownedSet.has(sticker.stickerCode);
        return true;
      });
  }, [selectedGroup, selectedTeamCode, stickerMode, ownedSet]);

  const handleToggle = async (code: string) => {
    if (!album || toggling.has(code)) return;

    setToggling(prev => new Set(prev).add(code));
    setAlbum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stickers: prev.stickers.map(s => s.code === code ? { ...s, owned: !s.owned } : s),
        ownedCount: prev.stickers.find(s => s.code === code)?.owned
          ? prev.ownedCount - 1
          : prev.ownedCount + 1,
      };
    });

    try {
      const updated = await albumsService.toggleSticker(album.id, code);
      setAlbum(updated);
    } catch {
      setAlbum(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stickers: prev.stickers.map(s => s.code === code ? { ...s, owned: !s.owned } : s),
          ownedCount: prev.stickers.find(s => s.code === code)?.owned
            ? prev.ownedCount - 1
            : prev.ownedCount + 1,
        };
      });
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(code); return n; });
    }
  };

  const visibleTeam = worldCupAlbum.teams.find(t => t.code === selectedTeamCode);
  const ownedCount = album?.ownedCount ?? 0;
  const totalCount = album?.totalCount ?? 980;
  const pct = Math.round((ownedCount / totalCount) * 100);

  if (loading) {
    return <div className={styles.loading}>Cargando album...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate("/")}>
          ← Volver
        </button>
        <span className={styles.title}>{album?.name ?? "Mi Album"}</span>
        <div className={styles.headerRight}>
          <span className={styles.progress}>
            {ownedCount} / {totalCount} ({pct}%)
          </span>
          {canInvite && (
            <button type="button" className={styles.inviteBtn} onClick={openInviteModal}>
              + Invitar
            </button>
          )}
        </div>
      </header>

      <div className={styles.workspace}>
        <section className={styles.sidebar}>
          <div className={styles.panelHeader}>
            <h2>Grupos</h2>
            <span>{visibleTeams.length} paises</span>
          </div>
          <div className={styles.segmented}>
            {groups.map(group => (
              <button
                type="button"
                key={group}
                className={group === selectedGroup ? styles.segBtnActive : styles.segBtn}
                onClick={() => { setSelectedGroup(group); setSelectedTeamCode("Todos"); }}
              >
                {group === "Todos" ? "Todos" : `G${group}`}
              </button>
            ))}
          </div>
          <TeamCodeDropdown
            teams={visibleTeams}
            selectedTeamCode={selectedTeamCode}
            selectedGroup={selectedGroup}
            onSelect={setSelectedTeamCode}
          />
        </section>

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
            <div className={styles.modeSwitch}>
              {(["all", "owned", "missing"] as StickerMode[]).map(mode => (
                <button
                  type="button"
                  key={mode}
                  className={mode === stickerMode ? `${styles.modeBtn} ${styles.modeBtnActive}` : styles.modeBtn}
                  onClick={() => setStickerMode(mode)}
                >
                  {mode === "all" ? "Todas" : mode === "owned" ? `Tengo (${ownedCount})` : "Faltan"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.stickerGrid}>
            {visibleStickers.map(sticker => {
              const owned = ownedSet.has(sticker.stickerCode);
              const busy = toggling.has(sticker.stickerCode);
              return (
                <article
                  key={sticker.id}
                  className={`${styles.sticker} ${owned ? styles.owned : ""} ${busy ? styles.busy : ""}`}
                  onClick={() => handleToggle(sticker.stickerCode)}
                  title={`${sticker.stickerCode} · ${sticker.teamName ?? "Especial"}`}
                >
                  <strong className={styles.stickerCode}>{sticker.stickerCode}</strong>
                  <span className={styles.stickerMeta}>{sticker.teamCode ?? "SP"}</span>
                  <span className={owned ? styles.labelOwned : styles.labelMissing}>
                    {owned ? "Tengo" : "Falta"}
                  </span>
                </article>
              );
            })}
            {visibleStickers.length === 0 && (
              <p className={styles.empty}>No hay figuritas para mostrar.</p>
            )}
          </div>
        </section>
      </div>

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
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  autoFocus
                />
                {roles.length > 1 && (
                  <select
                    value={inviteRoleId}
                    onChange={e => setInviteRoleId(e.target.value)}
                    className={styles.roleSelect}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
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
    </div>
  );
}
