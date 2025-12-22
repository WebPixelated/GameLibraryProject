import styles from "./LibraryPage.module.css";
import { useCallback, useEffect, useState } from "react";
import { libraryAPI } from "../../api/index";
import Button from "./../../components/common/Button/Button";
import GameCard from "./../../components/games/GameCard/GameCard";
import Loader from "./../../components/common/Loader/Loader";
import Modal from "./../../components/games/Modal/Modal";
import StatusSelect from "./../../components/games/StatusSelect/StatusSelect";

const FILTER_OPTIONS = [
  { value: "", label: "All Games" },
  { value: "wishlist", label: "Wishlist" },
  { value: "owned", label: "Owned" },
  { value: "playing", label: "Playing" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const SORT_OPTIONS = [
  { value: "updated_at", label: "Recently Updated" },
  { value: "created_at", label: "Date Added" },
  { value: "title", label: "Title" },
  { value: "rating", label: "Rating" },
  { value: "hours_played", label: "Hours Played" },
];

function LibraryPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Edit modal
  const [editGame, setEditGame] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteGame, setDeleteGame] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Import Steam modal
  const [importSession, setImportSession] = useState(null); // Acts as "isOpen" and data store
  const [importing, setImporting] = useState(false); // Acts as loading state

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await libraryAPI.getLibrary({
        status: statusFilter || undefined,
        sort: sortBy,
        order: sortOrder,
      });
      setGames(res.data.games);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.error || "Failed to load library");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const openEditModal = (game) => {
    setEditGame(game);
    setEditForm({
      status: game.status,
      rating: game.rating || "",
      hours_played: game.hours_played || 0,
      notes: game.notes || "",
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editGame) return;

    setSaving(true);
    try {
      const res = await libraryAPI.updateGame(editGame.id, {
        status: editForm.status,
        rating: editForm.rating ? Number(editForm.rating) : null,
        hours_played: Number(editForm.hours_played),
        notes: editForm.notes || null,
      });

      // Update locally
      setGames((prev) =>
        prev.map((g) => (g.id === editGame.id ? { ...g, ...res.data } : g))
      );

      setEditGame(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update game");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGame) return;

    setDeleting(true);
    try {
      await libraryAPI.deleteGame(deleteGame.id);
      setGames((prev) => prev.filter((g) => g.id !== deleteGame.id));
      setDeleteGame(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete game");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "DESC" ? "ASC" : "DESC"));
  };

  // Steam Import
  const openImportModal = () => {
    setImportSession({
      step: "form", // "form", "progress", "results"
      form: {
        steamId: "",
        limit: 50,
        minPlaytime: 60,
      },
      results: null,
    });
    setError("");
  };

  const closeImportModal = () => {
    setImportSession(null);
  };

  const handleImportFormChange = (field, value) => {
    setImportSession((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
    }));
  };

  const handleSteamImport = async () => {
    if (!importSession) return;

    setImporting(true);
    setError("");
    setImportSession((prev) => ({ ...prev, step: "progress" }));

    try {
      const res = await libraryAPI.importFromSteam(importSession.form);
      setImportSession((prev) => ({
        ...prev,
        results: res.data,
        step: "results",
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to import Steam games");
      setImportSession((prev) => ({ ...prev, step: "form" }));
    } finally {
      setImporting(false);
    }
  };

  const completeImport = () => {
    closeImportModal();
    fetchLibrary();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>My Library</h1>
          <span className={styles.count}>{games.length} games</span>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="primary"
            onClick={() => (window.location.href = "/search")}
          >
            + Add Game
          </Button>
          <Button variant="secondary" onClick={openImportModal}>
            📥 Import
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.select}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Button variant="ghost" size="sm" onClick={toggleSortOrder}>
          {sortOrder === "DESC" ? "↓ Desc" : "↑ Asc"}
        </Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loaderWrapper}>
          <Loader size="lg" />
        </div>
      ) : games.length > 0 ? (
        <div className={styles.grid}>
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              showStatus
              onClick={() => openEditModal(game)}
              actions={
                <div className={styles.cardActions}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => openEditModal(game)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteGame(game)}
                  >
                    Remove
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>No games in your library yet.</p>
          <Button onClick={() => (window.location.href = "/search")}>
            Search & Add Games
          </Button>
        </div>
      )}

      {/* Edit Modal */}

      <Modal
        isOpen={!!editGame}
        onClose={() => setEditGame(null)}
        title="Edit Game"
      >
        {editGame && (
          <div className={styles.editForm}>
            <div className={styles.editHeader}>
              <img
                src={editGame.image_url}
                alt={editGame.title}
                className={styles.editImage}
              />
              <div>
                <h3>{editGame.title}</h3>
                <p className={styles.editGenres}>{editGame.genres}</p>
              </div>
            </div>

            <div className={styles.editField}>
              <label>Status</label>
              <StatusSelect
                value={editForm.status}
                onChange={(v) => handleEditChange("status", v)}
              />
            </div>

            <div className={styles.editRow}>
              <div className={styles.editField}>
                <label>Rating (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editForm.rating}
                  onChange={(e) => handleEditChange("rating", e.target.value)}
                  className={styles.input}
                  placeholder="—"
                />
              </div>

              <div className={styles.editField}>
                <label>Hours Played</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.hours_played}
                  onChange={(e) =>
                    handleEditChange("hours_played", e.target.value)
                  }
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.editField}>
              <label>Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => handleEditChange("notes", e.target.value)}
                className={styles.textarea}
                rows={3}
                placeholder="Your thoughts about the game..."
              />
            </div>

            <div className={styles.editActions}>
              <Button variant="secondary" onClick={() => setEditGame(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteGame}
        onClose={() => setDeleteGame(null)}
        title="Remove Game"
      >
        {deleteGame && (
          <div className={styles.deleteConfirm}>
            <p>
              Are you sure you want to remove{" "}
              <strong>{deleteGame.title}</strong> from your library?
            </p>
            <div className={styles.deleteActions}>
              <Button variant="secondary" onClick={() => setDeleteGame(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Steam Import Modal */}
      <Modal
        isOpen={!!importSession}
        onClose={closeImportModal}
        title="Import from Steam"
      >
        {importSession && importSession.step === "form" && (
          <div className={styles.importForm}>
            <div className={styles.importField}>
              <label>Steam ID or Vanity URL</label>
              <input
                type="text"
                value={importSession.form.steamId}
                onChange={(e) =>
                  handleImportFormChange("steamId", e.target.value)
                }
                className={styles.input}
                placeholder="steam_id"
              />
              <p className={styles.importHint}>
                Enter your Steam ID or custom URL name.
              </p>
            </div>

            <div className={styles.importRow}>
              <div className={styles.importField}>
                <label>Max Games</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={importSession.form.limit}
                  onChange={(e) =>
                    handleImportFormChange("limit", e.target.value)
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.importField}>
                <label>Min Playtime (min)</label>
                <input
                  type="number"
                  min="0"
                  value={importSession.form.minPlaytime}
                  onChange={(e) =>
                    handleImportFormChange("minPlaytime", e.target.value)
                  }
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.importActions}>
              <Button variant="secondary" onClick={closeImportModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSteamImport}
                loading={importing}
                disabled={!importSession.form.steamId.trim()}
              >
                Start Import
              </Button>
            </div>
          </div>
        )}

        {importSession && importSession.step === "progress" && (
          <div className={styles.importProgress}>
            <Loader size="lg" />
            <p>Importing your Steam games...</p>
          </div>
        )}

        {importSession &&
          importSession.step === "results" &&
          importSession.results && (
            <div className={styles.importResults}>
              <div className={styles.importResultStats}>
                <div className={styles.importStat}>
                  <span className={styles.importStatValue}>
                    {importSession.results.total_in_steam}
                  </span>
                  <span className={styles.importStatLabel}>Total</span>
                </div>
                <div className={styles.importStat}>
                  <span className={styles.importStatValue}>
                    {importSession.results.imported.length}
                  </span>
                  <span className={styles.importStatLabel}>Imported</span>
                </div>
                <div className={styles.importStat}>
                  <span className={styles.importStatValue}>
                    {importSession.results.failed.length}
                  </span>
                  <span className={styles.importStatLabel}>Failed</span>
                </div>
              </div>

              <div className={styles.importActions}>
                <Button variant="secondary" onClick={openImportModal}>
                  Import More
                </Button>
                <Button onClick={completeImport}>Done</Button>
              </div>
            </div>
          )}
      </Modal>
    </div>
  );
}
export default LibraryPage;
