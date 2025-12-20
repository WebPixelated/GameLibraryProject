import styles from "./SearchPage.module.css";
import { useState } from "react";
import { libraryAPI } from "../../api/index";
import StatusSelect from "../../components/games/StatusSelect/StatusSelect";
import Button from "../../components/common/Button/Button";
import Modal from "./../../components/games/Modal/Modal";
import Loader from "../../components/common/Loader/Loader";
import Input from "./../../components/common/Input/Input";
import GameCard from "./../../components/games/GameCard/GameCard";

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [selectedGame, setSelectedGame] = useState(null);
  const [addStatus, setAddStatus] = useState("owned");
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    if (query.trim().length < 2) {
      setError("Query must be at least 2 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await libraryAPI.search(query, "rawg");
      setResults(res.data.rawg || []);
    } catch (err) {
      setError(err.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (game) => {
    setSelectedGame(game);
    setAddStatus("owned");
    setAddSuccess("");
  };

  const closeModal = () => {
    setSelectedGame(null);
    setAddSuccess("");
  };

  const handleAddGame = async () => {
    if (!selectedGame) return;

    setAdding(true);
    try {
      await libraryAPI.addGame({
        rawg_id: selectedGame.rawg_id,
        status: addStatus,
      });
      setAddSuccess(`"${selectedGame.title}" added to library!`);

      // Remove from results
      setResults((prev) =>
        prev.filter((g) => g.rawg_id !== selectedGame.rawg_id)
      );

      setTimeout(closeModal, 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        setAddSuccess("Game already in library");
      } else {
        setError(err.response?.data?.error || "Failed to add game");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Search Games</h1>
      <p className={styles.subtitle}>
        Find games from RAWG database and add to your library
      </p>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <Input
          placeholder="Search for games..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" loading={loading}>
          Search
        </Button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loaderWrapper}>
          <Loader size="lg" />
        </div>
      ) : results.length > 0 ? (
        <div className={styles.results}>
          <p className={styles.resultsCount}>{results.length} games found</p>
          <div className={styles.grid}>
            {results.map((game) => (
              <GameCard
                key={game.rawg_id}
                game={game}
                actions={
                  <Button
                    size="sm"
                    fullWidth
                    onClick={() => openAddModal(game)}
                  >
                    + Add to Library
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      ) : query && !loading ? (
        <p className={styles.noResults}>
          No games found. Try a different search.
        </p>
      ) : null}

      {/* Add Game Modal */}
      <Modal
        isOpen={!!selectedGame}
        onClose={closeModal}
        title="Add to Library"
      >
        {selectedGame && (
          <div className={styles.modalContent}>
            {addSuccess ? (
              <div className={styles.success}>{addSuccess}</div>
            ) : (
              <>
                <div className={styles.modalGame}>
                  <img
                    src={selectedGame.image_url}
                    alt={selectedGame.title}
                    className={styles.modalImage}
                  />
                  <div>
                    <h3>{selectedGame.title}</h3>
                    <p className={styles.modalGenres}>{selectedGame.genres}</p>
                  </div>
                </div>

                <div className={styles.modalField}>
                  <label>Status</label>
                  <StatusSelect value={addStatus} onChange={setAddStatus} />
                </div>

                <div className={styles.modalActions}>
                  <Button variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddGame} loading={adding}>
                    Add Game
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
export default SearchPage;
