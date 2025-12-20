import { forwardRef } from "react";
import styles from "./Input.module.css";

const Input = forwardRef(function Input(
  { label, error, type = "text", ...props },
  ref
) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        ref={ref}
        type={type}
        className={`${styles.input} ${error ? styles.error : ""}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});
export default Input;
