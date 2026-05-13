import { useState } from "react";
import type { MemberResponse, AlbumRoleResponse } from "@backend";
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
  onExport: () => void;
  onOpenInvite: () => void;
  onOpenMember: (m: MemberResponse) => void;
};

export function MembersSection({ members, roles, onExport, onOpenInvite, onOpenMember }: Props) {
  const [expanded, setExpanded] = useState(() => window.matchMedia("(min-width: 760px)").matches);

  const getDisplayName = (m: MemberResponse) =>
    m.fullname ? `${m.fullname}${m.surname ? ` ${m.surname}` : ""}` : m.email;
  const getRoleName = (m: MemberResponse) => roles.find(r => r.id === m.roleId)?.name ?? "—";

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
          <span>{members.length} miembro{members.length !== 1 ? "s" : ""}</span>
        </div>
        <Chevron expanded={expanded} />
      </div>

      {expanded && (
        <>
          <div className={styles.memberActions}>
            <button type="button" className={styles.exportBtn} onClick={onExport}>Exportar</button>
            <button type="button" className={styles.inviteBtn} onClick={onOpenInvite}>+ Invitar</button>
          </div>
          <div className={styles.memberList}>
            {members.map(m => (
              <button key={m.id} type="button" className={styles.memberCard} onClick={() => onOpenMember(m)}>
                <div className={styles.memberAvatar}>{(m.fullname ?? m.email).charAt(0).toUpperCase()}</div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{getDisplayName(m)}</span>
                  <span className={styles.memberRole}>{getRoleName(m)}</span>
                </div>
                <span className={styles.memberChevron}>›</span>
              </button>
            ))}
            {members.length === 0 && <p className={styles.emptyMembers}>Sin miembros cargados.</p>}
          </div>
        </>
      )}
    </div>
  );
}
