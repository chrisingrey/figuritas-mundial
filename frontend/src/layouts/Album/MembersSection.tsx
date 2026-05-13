import { useState } from "react";
import type { MemberResponse, AlbumRoleResponse, AlbumRequestResponse } from "@backend";
import { CircleSpinner } from "@/components";
import styles from "./MembersSection.module.scss";

const Chevron = ({ expanded }: { expanded: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

type Props = {
  members: MemberResponse[];
  roles: AlbumRoleResponse[];
  membersLoading: boolean;
  rolesLoading: boolean;
  onExport: () => void;
  onOpenInvite: () => void;
  onOpenMember: (m: MemberResponse) => void;
  requests: AlbumRequestResponse[];
  requestsLoading: boolean;
  canManageRequests: boolean;
  onAcceptRequest: (request: AlbumRequestResponse) => void;
  onRejectRequest: (request: AlbumRequestResponse) => void;
};

export function MembersSection({
  members,
  roles,
  membersLoading,
  rolesLoading,
  onExport,
  onOpenInvite,
  onOpenMember,
  requests,
  requestsLoading,
  canManageRequests,
  onAcceptRequest,
  onRejectRequest,
}: Props) {
  const [expanded, setExpanded] = useState(() => window.matchMedia("(min-width: 760px)").matches);

  const getDisplayName = (m: MemberResponse) =>
    m.fullname ? `${m.fullname}${m.surname ? ` ${m.surname}` : ""}` : m.email;

  const getRoleName = (m: MemberResponse) => roles.find(r => r.id === m.roleId)?.name ?? "—";
  const getRequestDisplayName = (request: AlbumRequestResponse) =>
    request.requesterFullname
      ? `${request.requesterFullname}${request.requesterSurname ? ` ${request.requesterSurname}` : ""}`
      : request.requesterEmail;

  return (
    <div className={styles.sectionBlock}>
      <div
        className={styles.accordionHeader}
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => e.key === "Enter" && setExpanded(v => !v)}
      >
        <div>
          <h2>Miembros</h2>
          <span>
            {membersLoading
              ? "Cargando..."
              : `${members.length} miembro${members.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Chevron expanded={expanded} />
      </div>

      {expanded && (
        <>
          <div className={styles.memberActions}>
            <button type="button" className={styles.exportBtn} onClick={onExport}>Exportar</button>
            <button type="button" className={styles.inviteBtn} onClick={onOpenInvite}>+ Invitar</button>
          </div>

          {membersLoading ? (
            <div className={styles.memberList}>
              {[0, 1, 2].map(i => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonAvatar} />
                  <div className={styles.skeletonLines}>
                    <div className={styles.skeletonName} />
                  </div>
                  <div className={styles.skeletonRole} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.memberList}>
              {requests.map(request => (
                <div key={request.id} className={styles.requestCard}>
                  <div className={styles.memberAvatar}>{(request.requesterFullname ?? request.requesterEmail).charAt(0).toUpperCase()}</div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{getRequestDisplayName(request)}</span>
                    <span className={styles.requestText}>quiere unirse como Viewer</span>
                  </div>
                  {canManageRequests && (
                    <div className={styles.requestActions}>
                      <button type="button" className={styles.rejectRequestBtn} onClick={() => onRejectRequest(request)} aria-label="Rechazar solicitud">×</button>
                      <button type="button" className={styles.acceptRequestBtn} onClick={() => onAcceptRequest(request)} aria-label="Aceptar solicitud">✓</button>
                    </div>
                  )}
                </div>
              ))}
              {members.map(m => (
                <button key={m.id} type="button" className={styles.memberCard} onClick={() => onOpenMember(m)}>
                  <div className={styles.memberAvatar}>{(m.fullname ?? m.email).charAt(0).toUpperCase()}</div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{getDisplayName(m)}</span>
                  </div>
                  <div className={styles.memberRoleTag}>
                    {rolesLoading
                      ? <CircleSpinner size={14} />
                      : <span className={styles.roleLabel}>{getRoleName(m)}</span>
                    }
                  </div>
                  <span className={styles.memberChevron}>›</span>
                </button>
              ))}
              {requestsLoading && <p className={styles.emptyMembers}>Cargando solicitudes...</p>}
              {members.length === 0 && requests.length === 0 && <p className={styles.emptyMembers}>Sin miembros cargados.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
