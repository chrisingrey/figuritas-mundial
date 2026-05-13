import styles from "./index.module.scss";

interface BookSpinnerProps {
  overlay?: boolean;
  label?: string;
}

export function BookSpinner({ overlay = false, label = "Cargando..." }: BookSpinnerProps) {
  const content = (
    <div className={styles.container}>
      <div className={styles.bookScene}>
        <div className={styles.book}>
          <div className={styles.backCover} />
          <div className={`${styles.page} ${styles.p4}`} />
          <div className={`${styles.page} ${styles.p3}`} />
          <div className={`${styles.page} ${styles.p2}`} />
          <div className={`${styles.page} ${styles.p1}`} />
          <div className={styles.frontCover}>
            <strong>26</strong>
            <em>FIFA</em>
            <b>WORLD CUP 2026</b>
          </div>
          <div className={styles.spine} />
        </div>
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );

  if (overlay) {
    return <div className={styles.overlay}>{content}</div>;
  }
  return content;
}
