import styles from "./index.module.scss";

interface CircleSpinnerProps {
  size?: number;
  className?: string;
}

export function CircleSpinner({ size = 16, className }: CircleSpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
