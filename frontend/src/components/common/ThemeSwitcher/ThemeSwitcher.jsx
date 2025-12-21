import { useTheme } from "../../../hooks/useTheme";
import Button from "../Button/Button";

function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button onClick={toggleTheme} variant="primary" size="md">
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </Button>
  );
}
export default ThemeSwitcher;
