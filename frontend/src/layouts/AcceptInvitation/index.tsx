import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { albumsService, type InvitationResponse } from "@backend";
import styles from "./index.module.scss";

export default function AcceptInvitation() {
  const { albumId, invitationId } = useParams<{ albumId: string; invitationId: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationResponse | null | undefined>(undefined);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!albumId || !invitationId) return;
    albumsService.getInvitation(albumId, invitationId)
      .then(setInvitation)
      .catch(() => setInvitation(null));
  }, [albumId, invitationId]);

  const handleAccept = async () => {
    if (!albumId || !invitationId) return;
    setAccepting(true);
    setError("");
    try {
      await albumsService.acceptInvitation(albumId, invitationId);
      setAccepted(true);
      setTimeout(() => navigate("/"), 2000);
    } catch {
      setError("No se pudo aceptar la invitación. Verificá que el email de tu cuenta coincida con el de la invitación.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Figuritas <strong>Mundial 2026</strong></span>
      </header>

      <main className={styles.main}>
        {invitation === undefined && (
          <div className={styles.card}>
            <p className={styles.loading}>Cargando invitación...</p>
          </div>
        )}

        {invitation === null && (
          <div className={styles.card}>
            <h2>Invitación no encontrada</h2>
            <p>Este link de invitación no es válido o ya expiró.</p>
            <button type="button" className={styles.btn} onClick={() => navigate("/")}>
              Ir al inicio
            </button>
          </div>
        )}

        {invitation && !accepted && (
          <div className={styles.card}>
            <div className={styles.badge}>Invitación al album</div>
            <h2>Te invitaron a unirte</h2>
            <p>
              Recibiste una invitación para ser parte de un album compartido de figuritas del Mundial 2026.
            </p>
            {invitation.status !== "pending" && (
              <p className={styles.warn}>
                Esta invitación ya fue {invitation.status === "accepted" ? "aceptada" : "usada o expiró"}.
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {invitation.status === "pending" && (
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={() => navigate("/")}>
                  Cancelar
                </button>
                <button type="button" className={styles.btnPrimary} onClick={handleAccept} disabled={accepting}>
                  {accepting ? "Uniéndose..." : "Aceptar invitación"}
                </button>
              </div>
            )}
            {invitation.status !== "pending" && (
              <button type="button" className={styles.btn} onClick={() => navigate("/")}>
                Ir al inicio
              </button>
            )}
          </div>
        )}

        {accepted && (
          <div className={styles.card}>
            <div className={styles.success}>¡Te uniste al album!</div>
            <p>Redirigiendo al inicio...</p>
          </div>
        )}
      </main>
    </div>
  );
}
