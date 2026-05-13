import { useState } from "react";
import styles from "./ProgressSection.module.scss";

const Chevron = ({ expanded }: { expanded: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

type TeamStat = { code: string; name: string; owned: number; total: number; complete: boolean };

type Props = {
  ownedCount: number;
  totalCount: number;
  kpiData: { teamStats: TeamStat[]; completedCount: number };
  modeCounts: { noTengo: number; tengo: number; pegado: number; repetidas: number };
};

export function ProgressSection({ ownedCount, totalCount, kpiData, modeCounts }: Props) {
  const [expanded, setExpanded] = useState(() => window.matchMedia("(min-width: 760px)").matches);
  const pct = Math.round((ownedCount / totalCount) * 100);

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
          <h2>Progreso</h2>
          <span>{ownedCount} / {totalCount} ({pct}%)</span>
        </div>
        <Chevron expanded={expanded} />
      </div>

      {expanded && (
        <>
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
        </>
      )}
    </div>
  );
}
