import styles from "./StatusSelect.module.css";

const STATUSES = [
  { value: "wishlist", label: "Wishlist" },
  { value: "owned", label: "Owned" },
  { value: "playing", label: "Playing" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

function StatusSelect({ value, onChange, disabled = false }) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}
export default StatusSelect;
