import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { albumsService, meService, type MyAlbumMembershipResponse, type MyInvitationResponse } from "@backend";
import { useUserLogged } from "@/context";
import { useApiCall } from "@/hooks";
import { BookSpinner } from "@/components";
import styles from "./index.module.scss";

function getInitials(fullname?: string, email?: string): string {
  if (fullname) {
    const parts = fullname.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.trophyIcon}>
      <path d="M20 8h24v22c0 11-8 19-12 19S20 41 20 30V8z" fill="#f7d719" stroke="#101214" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 14H8c0 12 5 18 12 20" stroke="#101214" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 14h12c0 12-5 18-12 20" stroke="#101214" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="26" y="49" width="12" height="7" fill="#f7d719" stroke="#101214" strokeWidth="2.5" />
      <rect x="18" y="56" width="28" height="5" rx="2" fill="#f7d719" stroke="#101214" strokeWidth="2.5" />
      <path d="M32 19v12M26 25h12" stroke="#101214" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useUserLogged();

  const [memberships, setMemberships] = useState<MyAlbumMembershipResponse[]>([]);
  const [invitations, setInvitations] = useState<MyInvitationResponse[]>([]);
  const [albumName, setAlbumName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [openingAlbumId, setOpeningAlbumId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const { execute: fetchMyAlbums, loading } = useApiCall(meService.getMyAlbums, { initialLoading: true });
  const { execute: createAlbumCall, loading: creating } = useApiCall(albumsService.createAlbum);

  useEffect(() => {
    fetchMyAlbums().then(setMemberships).catch(() => setMemberships([]));
    meService.getMyInvitations().then(setInvitations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

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

  const handleOpen = (albumId: string) => {
    if (openingAlbumId) return;
    setOpeningAlbumId(albumId);
    setTimeout(() => navigate(`/album/${albumId}`), 480);
  };

  const initials = getInitials(user?.fullname, user?.email);
  const hasAlbums = memberships.length > 0;

  if (loading) return <BookSpinner overlay />;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Figuritas <strong>Mundial 2026</strong></span>

        <div className={styles.profileArea} ref={userMenuRef}>
          <button
            type="button"
            className={styles.profileBtn}
            onClick={() => setShowUserMenu(v => !v)}
            aria-label="Menú de usuario"
          >
            {initials ? (
              <span className={styles.profileInitials}>{initials}</span>
            ) : (
              <ProfileIcon />
            )}
          </button>

          {showUserMenu && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuName}>{user?.fullname || user?.email}</div>
              <button
                type="button"
                className={styles.userMenuLogout}
                onClick={() => { setShowUserMenu(false); logout(); }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          {hasAlbums && (
            <section>
              <h2 className={styles.sectionTitle}>Mis albums</h2>
              <div className={styles.albumShelf}>
                {memberships.map(m => (
                  <div key={m.albumId} className={styles.bookWrapper}>
                    <div
                      className={`${styles.book} ${openingAlbumId === m.albumId ? styles.opening : ""}`}
                      onClick={() => handleOpen(m.albumId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && handleOpen(m.albumId)}
                      aria-label={`Abrir album ${m.albumName}`}
                    >
                      <div className={styles.coverInner}>
                        <div className={styles.coverContent}>
                          <div className={styles.coverHeader}>
                            <span className={styles.coverBrand}>Figuritas</span>
                            <strong className={styles.coverYear}>Mundial 2026</strong>
                            <div className={styles.stars}>
                              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                            </div>
                          </div>
                          <div className={styles.coverArt}>
                            <TrophyIcon />
                          </div>
                          <div className={styles.coverFooter}>
                            <div className={styles.coverAlbumName}>{m.albumName}</div>
                            <span className={styles.roleTag}>{m.isOwner ? "Propietario" : m.roleName}</span>
                            <div className={styles.openBtn}>
                              Abrir →
                            </div>
                          </div>
                        </div>
                      </div>
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

          <section className={styles.createSection}>
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
