import styles from "./StatusBadge.module.css";

const STATUS_LABELS = {
  wishlist: "Wishlist",
  owned: "Owned",
  playing: "Playing",
  completed: "Completed",
  dropped: "Dropped",
};

function StatusBadge({ status, size = "md" }) {
  return (
    <span className={`${styles.badge} ${styles[status]} ${styles[size]}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
export default StatusBadge;
