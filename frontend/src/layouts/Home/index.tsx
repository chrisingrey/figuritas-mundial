import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { albumsService, type AlbumResponse, type MemberResponse } from "@backend";
import { useUserLogged } from "@/context";
import { worldCupAlbum } from "@/data/worldCupAlbum";
import styles from "./index.module.scss";

const GROUPS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

function groupProgress(album: AlbumResponse, group: string) {
  const teamCodes = worldCupAlbum.teams
    .filter(t => t.group === group)
    .map(t => t.code);
  const groupStickers = album.stickers.filter(s =>
    teamCodes.some(c => s.code.startsWith(`${c} `))
  );
  const owned = groupStickers.filter(s => s.owned).length;
  return { owned, total: groupStickers.length };
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useUserLogged();
  const [album, setAlbum] = useState<AlbumResponse | null | undefined>(undefined);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [creating, setCreating] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    albumsService.getMyAlbum().then(setAlbum).catch(() => setAlbum(null));
  }, []);

  useEffect(() => {
    if (album?.id) {
      albumsService.getMembers(album.id).then(setMembers).catch(() => {});
    }
  }, [album?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumName.trim()) return;
    setCreating(true);
    try {
      const newAlbum = await albumsService.createAlbum({ name: albumName });
      setAlbum(newAlbum);
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album) return;
    setInviteError("");
    try {
      await albumsService.inviteMember(album.id, {
        invitedEmail: inviteEmail,
        roleId: inviteRoleId || (members[0]?.roleId ?? ""),
      });
      setInviteSent(true);
      setInviteEmail("");
      setTimeout(() => { setShowInvite(false); setInviteSent(false); }, 2000);
    } catch {
      setInviteError("No se pudo enviar la invitación.");
    }
  };

  const pct = album ? Math.round((album.ownedCount / album.totalCount) * 100) : 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Figuritas <strong>Mundial 2026</strong></span>
        <div className={styles.userArea}>
          <span>{user?.fullname || user?.email}</span>
          <button type="button" className={styles.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </header>

      <main className={styles.main}>
        {album === undefined && (
          <div className={styles.loading}>Cargando...</div>
        )}

        {album === null && (
          <div className={styles.empty}>
            <div className={styles.emptyCard}>
              <h2>Todavía no tenés un album</h2>
              <p>Creá tu album para empezar a coleccionar las 980 figuritas del Mundial 2026.</p>
              <form onSubmit={handleCreate} className={styles.createForm}>
                <input
                  type="text"
                  placeholder="Nombre de tu album"
                  value={albumName}
                  onChange={e => setAlbumName(e.target.value)}
                  required
                />
                <button type="submit" disabled={creating}>
                  {creating ? "Creando..." : "Crear mi album"}
                </button>
              </form>
            </div>
          </div>
        )}

        {album && (
          <div className={styles.content}>
            <div className={styles.albumCard}>
              <div className={styles.albumHeader}>
                <div>
                  <h2>{album.name}</h2>
                  <p className={styles.albumSub}>Album de figuritas · FIFA World Cup 2026</p>
                </div>
                <button
                  type="button"
                  className={styles.openBtn}
                  onClick={() => navigate(`/album/${album.id}`)}
                >
                  Abrir album
                </button>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>Progreso total</span>
                  <span className={styles.progressCount}>
                    <strong>{album.ownedCount}</strong> / {album.totalCount} figuritas ({pct}%)
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className={styles.groupGrid}>
                {GROUPS.map(g => {
                  const { owned, total } = groupProgress(album, g);
                  const gPct = total > 0 ? Math.round((owned / total) * 100) : 0;
                  return (
                    <div key={g} className={styles.groupItem}>
                      <div className={styles.groupLabel}>G{g}</div>
                      <div className={styles.groupBar}>
                        <div className={styles.groupFill} style={{ width: `${gPct}%` }} />
                      </div>
                      <div className={styles.groupCount}>{owned}/{total}</div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.inviteBtn}
                  onClick={() => setShowInvite(true)}
                >
                  + Invitar miembro
                </button>
              </div>
            </div>

            <div className={styles.membersCard}>
              <h3>Miembros del album</h3>
              {members.length === 0 ? (
                <p className={styles.noMembers}>Solo vos por ahora.</p>
              ) : (
                <ul className={styles.memberList}>
                  {members.map(m => (
                    <li key={m.id} className={styles.memberRow}>
                      <div className={styles.memberAvatar}>
                        {(m.fullname || m.email || "?")[0].toUpperCase()}
                      </div>
                      <div className={styles.memberInfo}>
                        <strong>{m.fullname || m.username || m.email}</strong>
                        <span>{m.email}</span>
                      </div>
                      <span className={styles.memberStatus}>{m.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      {showInvite && (
        <div className={styles.overlay} onClick={() => setShowInvite(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Invitar miembro</h3>
            <p>Enviá una invitación por email para que se sumen a tu album.</p>
            {inviteSent ? (
              <p className={styles.inviteSuccess}>¡Invitación enviada!</p>
            ) : (
              <form onSubmit={handleInvite} className={styles.inviteForm}>
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                />
                {inviteError && <p className={styles.inviteError}>{inviteError}</p>}
                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowInvite(false)}>Cancelar</button>
                  <button type="submit" className={styles.inviteSend}>Enviar invitación</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
