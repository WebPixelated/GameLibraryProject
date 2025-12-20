import styles from "./DashBoardPage.module.css";
import { useEffect, useState } from "react";
import { useAuth } from "./../../hooks/useAuth";
import { libraryAPI } from "../../api/index";
import { Link } from "react-router-dom";
import Loader from "./../../components/common/Loader/Loader";
import StatusBadge from "./../../components/games/StatusBadge/StatusBadge";

function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await libraryAPI.getDashboard();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader fullScreen />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    );
  }

  const {
    stats,
    recently_added,
    recently_completed,
    currently_playing,
    two_weeks,
  } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back, {user?.name}!</h1>
        <p className={styles.subtitle}>Here's your gaming overview</p>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Games" value={stats.total_games} icon="🎮" />
        <StatCard label="Completed" value={stats.completed} icon="✅" />
        <StatCard label="Playing" value={stats.playing} icon="▶️" />
        <StatCard
          label="Hours Played"
          value={Math.round(stats.total_hours)}
          icon="⏱️"
        />
        <StatCard
          label="Avg Rating"
          value={stats.avg_rating || "—"}
          icon="⭐"
        />
        <StatCard
          label="Backlog"
          value={Number(stats.owned) + Number(stats.wishlist)}
          icon="📚"
        />
      </div>

      {/* Two Weeks Activity */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📅 Last 2 Weeks</h2>
        <div className={styles.activityGrid}>
          <div className={styles.activityCard}>
            <span className={styles.activityValue}>
              {two_weeks.games_added}
            </span>
            <span className={styles.activityLabel}>Games Added</span>
          </div>
          <div className={styles.activityCard}>
            <span className={styles.activityValue}>
              {two_weeks.games_completed}
            </span>
            <span className={styles.activityLabel}>Games Completed</span>
          </div>
          <div className={styles.activityCard}>
            <span className={styles.activityValue}>
              {two_weeks.games_completed_week}
            </span>
            <span className={styles.activityLabel}>Completed This Week</span>
          </div>
        </div>
      </div>

      <div className={styles.columns}>
        {/* Currently Playing */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>▶️ Currently Playing</h2>
            <Link to="/library?status=playing" className={styles.sectionLink}>
              View all →
            </Link>
          </div>
          {currently_playing.length > 0 ? (
            <div className={styles.gameList}>
              {currently_playing.map((game) => (
                <GameListItem key={game.id} game={game} showHours />
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Not playing anything right now</p>
          )}
        </div>

        {/* Recently Completed */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>✅ Recently Completed</h2>
            <Link to="/library?status=completed" className={styles.sectionLink}>
              View all →
            </Link>
          </div>
          {recently_completed.length > 0 ? (
            <div className={styles.gameList}>
              {recently_completed.map((game) => (
                <GameListItem key={game.id} game={game} showRating />
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No games completed yet</p>
          )}
        </div>
      </div>

      {/* Recently Added */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🆕 Recently Added</h2>
          <Link to="/library" className={styles.sectionLink}>
            View library →
          </Link>
        </div>
        {recently_added.length > 0 ? (
          <div className={styles.recentGrid}>
            {recently_added.map((game) => (
              <div key={game.id} className={styles.recentCard}>
                <img
                  src={
                    game.image_url ||
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png"
                  }
                  alt={game.title}
                  className={styles.recentImage}
                />
                <div className={styles.recentInfo}>
                  <span className={styles.recentTitle}>{game.title}</span>
                  <StatusBadge status={game.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>
            No games added yet. <Link to="/search">Start searching!</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statIcon}>{icon}</span>
      <div className={styles.statContent}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

function GameListItem({ game, showHours, showRating }) {
  return (
    <div className={styles.gameListItem}>
      <img
        src={
          game.image_url ||
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png"
        }
        alt={game.title}
        className={styles.gameListImage}
      />
      <div className={styles.gameListInfo}>
        <span className={styles.gameListTitle}>{game.title}</span>
        <div className={styles.gameListMeta}>
          {showHours && game.hours_played > 0 && (
            <span>🕐 {game.hours_played}h</span>
          )}
          {showRating && game.rating && <span>⭐ {game.rating}/10</span>}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
