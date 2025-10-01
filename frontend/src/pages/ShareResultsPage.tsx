import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styles from "./styles/ShareResultsPage.module.css";

type PoliticianMatch = {
  party: string;
  name: string;
  candidateNumber: string;
  percent: number | null;
};

type ResultData = {
  result: Record<string, PoliticianMatch>;
};

export default function ShareResultsPage() {
  const { resultId } = useParams<{ resultId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Determine if the user just completed the test via sessionStorage
  const cameFromCompletion =
    Boolean((location as any)?.state?.fromCompletion) ||
    (resultId ? sessionStorage.getItem(`justCompletedResult-${resultId}`) === "1" : false);

  // Clear sessionStorage flag if we used it
  useEffect(() => {
    if (cameFromCompletion && resultId) {
      sessionStorage.removeItem(`justCompletedResult-${resultId}`);
    }
  }, [cameFromCompletion, resultId]);

  // Fetch results
  useEffect(() => {
    async function getData() {
      if (!resultId) {
        setError("No result ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/public-results`,
          { resultId }
        );
        setData(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }

    getData();
  }, [resultId]);

  async function copyToClipboard(text: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // fallback: textarea + execCommand
        const textarea = document.createElement("textarea");
        textarea.value = text;
        // avoid showing on page
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
      }
    } catch {
      return false;
    }
  }

  // Build the share URL
  const fullShareUrl = resultId ? `${window.location.origin}/results/${resultId}` : "";

  // Main share handler: prefer Web Share API then clipboard
  async function handleShareOrCopy() {
    if (!fullShareUrl) return;

    try {
      // feature-detect share method using typeof to satisfy TS
      const hasShare =
        typeof navigator !== "undefined" && typeof (navigator as any).share === "function";

      if (hasShare) {
        // Web Share (mobile browsers)
        await (navigator as any).share({ title: "My test results", url: fullShareUrl });
        setCopied(true);
      } else {
        // fallback to clipboard copy
        const ok = await copyToClipboard(fullShareUrl);
        setCopied(ok);
      }
    } catch {
      // on failure, indicate not-copied
      setCopied(false);
    } finally {
      // reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Secondary handler copy only
  async function handleCopyOnly() {
    if (!fullShareUrl) return;
    const ok = await copyToClipboard(fullShareUrl);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTakeTest() {
    navigate("/test");
  }

  if (!resultId) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>No result ID</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Loading...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Error</h1>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!data?.result) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>No results found</h1>
      </div>
    );
  }

  // Sorting logic preserved
  const entries = Object.entries(data.result).map(([key, match]) => ({ key, match }));
  const sorted = entries.sort((a, b) => {
    const pa =
      typeof a.match.percent === "number" && Number.isFinite(a.match.percent)
        ? a.match.percent
        : -Infinity;
    const pb =
      typeof b.match.percent === "number" && Number.isFinite(b.match.percent)
        ? b.match.percent
        : -Infinity;
    return pb - pa;
  });

  const shareButtonLabel = copied
    ? "Link copied!"
    : typeof navigator !== "undefined" && typeof (navigator as any).share === "function"
    ? "Share"
    : "Copy link / Share";

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Jagatud tulemused</h1>

      <div className={styles.shareBanner}>
        {cameFromCompletion ? (
          <>
            <div className={styles.shareText}>Jaga tulemusi oma sõpradega</div>
            <div className={styles.shareActions}>
              <button className={styles.button} onClick={handleShareOrCopy}>
                {shareButtonLabel}
              </button>
              <button className={styles.buttonSecondary} onClick={handleCopyOnly}>
                Copy link
              </button>
            </div>
            <h2 className={styles.h2}>Sinu Narva kandidaadid:</h2>
          </>
        ) : (
          <>
            <div className={styles.shareText}>Sinu sõber tegi selle testi <br />Proovi sina ka!</div>
            <div className={styles.shareActions}>
              <button className={styles.button} onClick={handleTakeTest}>
                Alusta testi
              </button>
            </div>
            <h2 className={styles.h2}>Sinu sõbra Narva kandidaadid:</h2>
          </>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.list}>
          {sorted.map(({ key, match }) => {
            const percentText =
              typeof match?.percent === "number" && Number.isFinite(match.percent)
                ? `${match.percent.toFixed(2)}%`
                : "N/A";
            return (
              <div key={key} className={styles.card}>
                <div className={styles.cardLeft}>
                  <div className={styles.name}>{match?.name || key}</div>
                  <div className={styles.meta}>
                    {match?.party || ""}
                    {match?.candidateNumber ? ` • ${match.candidateNumber}` : ""}
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
