import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { albumsService, meService, type MyAlbumMembershipResponse, type MyInvitationResponse } from "@backend";
import { useUserLogged } from "@/context";
import { useApiCall } from "@/hooks";
import { BookSpinner } from "@/components";
import styles from "./index.module.scss";

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useUserLogged();

  const [memberships, setMemberships] = useState<MyAlbumMembershipResponse[]>([]);
  const [invitations, setInvitations] = useState<MyInvitationResponse[]>([]);
  const [albumName, setAlbumName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");

  const { execute: fetchMyAlbums, loading } = useApiCall(meService.getMyAlbums, { initialLoading: true });
  const { execute: createAlbumCall, loading: creating } = useApiCall(albumsService.createAlbum);

  useEffect(() => {
    fetchMyAlbums().then(setMemberships).catch(() => setMemberships([]));
    meService.getMyInvitations().then(setInvitations).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!albumName.trim()) return;
    setCreateError("");
    try {
      const newAlbum = await createAlbumCall({ name: albumName });
      navigate(`/album/${newAlbum.id}`);
    } catch {
      setCreateError("No se pudo crear el album. Intentá de nuevo.");
    }
  };

  const hasAlbums = memberships.length > 0;

  if (loading) return <BookSpinner overlay />;

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
        <div className={styles.content}>
          {hasAlbums && (
            <section>
              <h2 className={styles.sectionTitle}>Mis albums</h2>
              <div className={styles.albumGrid}>
                {memberships.map(m => (
                  <div key={m.albumId} className={styles.albumCard}>
                    <div className={styles.albumCardTop}>
                      <div>
                        <h3>{m.albumName}</h3>
                        <span className={styles.roleTag}>{m.isOwner ? "Propietario" : m.roleName}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.openBtn}
                        onClick={() => navigate(`/album/${m.albumId}`)}
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {invitations.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Invitaciones pendientes</h2>
              <div className={styles.invitationList}>
                {invitations.map(inv => (
                  <div key={inv.id} className={styles.invitationCard}>
                    <div className={styles.invitationInfo}>
                      <strong>{inv.albumName}</strong>
                      <span>Vence {new Date(inv.expiresAt).toLocaleDateString("es-AR")}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.inviteActionBtn}
                      onClick={() => navigate(`/albums/${inv.albumId}/invitations/${inv.id}`)}
                    >
                      Ver invitación
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!hasAlbums && invitations.length === 0 && (
            <div className={styles.emptyHint}>
              <p>Todavía no sos parte de ningún album.</p>
            </div>
          )}

          <section>
            {!showCreate ? (
              <button
                type="button"
                className={styles.createToggleBtn}
                onClick={() => setShowCreate(true)}
              >
                + Crear nuevo album
              </button>
            ) : (
              <div className={styles.createCard}>
                <h2>Crear album</h2>
                <p>Creá tu propio album del Mundial 2026 e invitá amigos.</p>
                <form onSubmit={handleCreate} className={styles.createForm}>
                  <input
                    type="text"
                    placeholder="Nombre de tu album"
                    value={albumName}
                    onChange={e => setAlbumName(e.target.value)}
                    required
                  />
                  {createError && <p className={styles.createError}>{createError}</p>}
                  <div className={styles.createActions}>
                    <button type="button" onClick={() => { setShowCreate(false); setCreateError(""); }}>
                      Cancelar
                    </button>
                    <button type="submit" className={styles.createSubmit} disabled={creating}>
                      {creating ? "Creando..." : "Crear album"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
