import styles from "./Loader.module.css";

function Loader({ size = "md", fullScreen = false }) {
  const spinner = <div className={`${styles.spinner} ${styles[size]}`} />;

  return fullScreen ? (
    <div className={styles.fullScreen}>{spinner}</div>
  ) : (
    spinner
  );
}

export default Loader;
