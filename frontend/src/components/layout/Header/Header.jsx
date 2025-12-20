import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./../../../hooks/useAuth";
import Button from "../../common/Button/Button";
import styles from "./Header.module.css";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          GameLibrary
        </Link>

        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>
            Dashboard
          </Link>
          <Link to="/library" className={styles.navLink}>
            Library
          </Link>
          <Link to="/search" className={styles.navLink}>
            Search
          </Link>
        </nav>

        <div className={styles.user}>
          <span className={styles.userName}>{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
export default Header;
