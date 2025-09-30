import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useState, useMemo } from "react";
import axios from "axios";
import styles from "./styles/ResultsPage.module.css";

type PoliticianMatch = {
  party: string;
  name: string;
  candidateNumber: string;
  percent: number | null;
};

type ResultShape =
  | PoliticianMatch[]
  | Record<string, PoliticianMatch>
  | null
  | undefined;

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    loginWithPopup,
    isAuthenticated,
    getAccessTokenSilently,
    getAccessTokenWithPopup,
  } = useAuth0();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const raw = (location.state as { result?: ResultShape } | null)?.result;
  const resultArray: PoliticianMatch[] | undefined = Array.isArray(raw)
    ? raw
    : raw
    ? Object.values(raw)
    : undefined;

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const sorted = useMemo(() => {
    if (!resultArray) return [];
    return [...resultArray].sort((a, b) => {
      const va =
        typeof a.percent === "number" && Number.isFinite(a.percent)
          ? a.percent
          : -Infinity;
      const vb =
        typeof b.percent === "number" && Number.isFinite(b.percent)
          ? b.percent
          : -Infinity;
      return sortOrder === "desc" ? vb - va : va - vb;
    });
  }, [resultArray, sortOrder]);

  if (!resultArray || resultArray.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h1 className={styles.title}>Sa pead tegema testi esiteks!</h1>
        <p>
          <button
            className={styles.ghostBtn}
            onClick={() => navigate("/", { replace: true })}
          >
            Mine testi
          </button>
        </p>
      </div>
    );
  }

  async function signUpAndSave() {
    setError(null);
    setIsSaving(true);
    let token = "";

    try {
      if (!isAuthenticated) {
        await loginWithPopup();
      }
      try {
        token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUDIENCE },
        });
      } catch (err) {
        const popUpToken = await getAccessTokenWithPopup({
          authorizationParams: { audience: import.meta.env.VITE_AUDIENCE },
        });
        if (popUpToken) {
          token = popUpToken as string;
        }
      }

      const payload = { result: sorted };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/results`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to save results");
      }
      const resultId = response.data.resultId;

      sessionStorage.setItem(`justCompletedResult-${resultId}`, "1");
      navigate(`/results/${resultId}`, { state: { fromCompletion: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Resultaat</h1>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.topRow}>
          <p className={styles.lead}>Kõik resultaadid (protsendi järgi):</p>

          <div
            className={styles.sortRow}
            role="toolbar"
            aria-label="Sort results"
          >
            <span className={styles.sortLabel}>Sorteeri:</span>
            <button
              className={`${styles.sortBtn} ${
                sortOrder === "desc" ? styles.activeSort : ""
              }`}
              onClick={() => setSortOrder("desc")}
              aria-pressed={sortOrder === "desc"}
              title="Most percent first"
            >
              Kõige suurem
            </button>
            <button
              className={`${styles.sortBtn} ${
                sortOrder === "asc" ? styles.activeSort : ""
              }`}
              onClick={() => setSortOrder("asc")}
              aria-pressed={sortOrder === "asc"}
              title="Least percent first"
            >
              Kõige väiksem
            </button>
          </div>
        </div>
        <button
          className={styles.saveBtn}
          onClick={signUpAndSave}
          disabled={isSaving}
        >
          {isSaving
            ? "Salvestan..."
            : isAuthenticated
            ? "Salvesta ja jaga oma sõpradega"
            : "Registreeri ja jaga oma sõpradega"}
        </button>
        <div className={styles.list}>
          {sorted.map((match, idx) => {
            const percent = match?.percent;
            const percentText =
              typeof percent === "number" && Number.isFinite(percent)
                ? `${percent.toFixed(2)}%`
                : "N/A";
            const key = match.candidateNumber || `${match.name}_${idx}`;
            return (
              <div key={key} className={styles.card}>
                <div className={styles.cardLeft}>
                  <div className={styles.name}>{match?.name || key}</div>
                  <div className={styles.meta}>
                    {match?.party || ""}{" "}
                    {match?.candidateNumber ? `• ${match.candidateNumber}` : ""}
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <div className={styles.percent}>{percentText}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
