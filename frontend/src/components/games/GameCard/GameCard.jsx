import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./GameCard.module.css";

function GameCard({ game, showStatus = false, actions, onClick }) {
  const imageUrl =
    game.image_url ||
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png";

  function getMetacriticClass(score) {
    if (score >= 75) return styles.metacriticGreen;
    if (score >= 50) return styles.metacriticYellow;
    return styles.metacriticRed;
  }

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageWrapper}>
        <img
          src={imageUrl}
          alt={game.title}
          className={styles.image}
          loading="lazy"
        />
        {showStatus && game.status && (
          <div className={styles.statusWrapper}>
            <StatusBadge status={game.status} size="sm" />
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{game.title}</h3>

        <div className={styles.meta}>
          {game.released && (
            <span
              className={`${styles.metacritic} ${getMetacriticClass(
                game.metacritic
              )}`}
            >
              {game.metacritic}
            </span>
          )}
        </div>

        {game.genres && <p className={styles.genres}>{game.genres}</p>}

        {(game.hours_played > 0 || game.rating) && (
          <div className={styles.stats}>
            {game.hours_played > 0 && <span>🕐 {game.hours_played}h</span>}
            {game.rating && <span>⭐ {game.rating}/10</span>}
          </div>
        )}

        {actions && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
export default GameCard;
