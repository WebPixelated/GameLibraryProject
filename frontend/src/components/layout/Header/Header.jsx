import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./../../../hooks/useAuth";
import Button from "../../common/Button/Button";
import styles from "./Header.module.css";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route chane
  useEffect(() => {
    queueMicrotask(() => setIsMenuOpen(false));
  }, [location.pathname]);

  // Block scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/library", label: "Library" },
    { to: "/search", label: "Search" },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          GameLibrary
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${
                location.pathname === link.to ? styles.navLinkActive : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop User Section */}
        <div className={styles.user}>
          <span className={styles.userName}>{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Hamburger Button (Mobile Only) */}
        <button
          className={`${styles.hamburger} ${
            isMenuOpen ? styles.hamburgerOpen : ""
          }`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.overlay} ${
          isMenuOpen ? styles.overlayVisible : ""
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Modal */}
      <div
        className={`${styles.mobileMenu} ${
          isMenuOpen ? styles.mobileMenuOpen : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Mobile Navigation */}
        <nav className={styles.mobileNav}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.mobileNavLink} ${
                location.pathname === link.to ? styles.mobileNavLinkActive : ""
              }`}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile User Section */}
        <div className={styles.mobileUser}>
          <div className={styles.mobileUserInfo}>
            <div className={styles.mobileUserAvatar}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className={styles.mobileUserName}>{user?.name}</span>
          </div>
          <Button
            variant="secondary"
            onClick={handleLogout}
            className={styles.mobileLogoutBtn}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
