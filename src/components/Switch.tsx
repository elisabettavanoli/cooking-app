import styles from "./Switch.module.css";

export function Switch({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      className={[styles.track, value ? styles.trackOn : ""].join(" ")}
      onClick={() => onValueChange(!value)}
    >
      <span className={styles.thumb} />
    </button>
  );
}
