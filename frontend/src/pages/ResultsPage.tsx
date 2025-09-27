import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import axios from "axios";

type PoliticianMatch = {
  party: string;
  name: string;
  candidateNumber: string;
  percent: number | null;
};

type ResultShape = PoliticianMatch[] | Record<string, PoliticianMatch> | null | undefined;

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithPopup, isAuthenticated, getAccessTokenSilently, getAccessTokenWithPopup } = useAuth0();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const raw = (location.state as { result?: ResultShape } | null)?.result;
  const resultArray: PoliticianMatch[] | undefined = Array.isArray(raw)
    ? raw
    : raw
    ? Object.values(raw)
    : undefined;

  if (!resultArray || resultArray.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Sa pead tegema testi esiteks!</h1>
        <p>
          <button onClick={() => navigate("/", { replace: true })}>
            Mine testi
          </button>
        </p>
      </div>
    );
  }

  const sorted = [...resultArray].sort((a, b) => {
    const va = typeof a.percent === "number" && Number.isFinite(a.percent) ? a.percent : -Infinity;
    const vb = typeof b.percent === "number" && Number.isFinite(b.percent) ? b.percent : -Infinity;
    return vb - va;
  });

  async function signUpAndSave() {
    setError(null);
    setIsSaving(true);
    let token = "";

    try {
      if (!isAuthenticated) {
        await loginWithPopup();
      }
      try {
        token = await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUDIENCE }});
      } catch (error) {
        const popUpToken = await getAccessTokenWithPopup({ authorizationParams: { audience: import.meta.env.VITE_AUDIENCE }});
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

      navigate("/results/" + response.data.resultId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Resultaat</h1>
      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
      <p>Top matches (sorted by percent):</p>

      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map((match, idx) => {
          const percent = match?.percent;
          const percentText = typeof percent === "number" && Number.isFinite(percent) ? `${percent.toFixed(2)}%` : "N/A";
          const key = match.candidateNumber || `${match.name}_${idx}`;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #eee",
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 700 }}>{match?.name || key}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {match?.party || ""} {match?.candidateNumber ? `• ${match.candidateNumber}` : ""}
                </div>
              </div>
              <div style={{ minWidth: 80, textAlign: "right", color: "#333" }}>
                {percentText}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={signUpAndSave} disabled={isSaving}>
        {isSaving ? "Saving..." : isAuthenticated ? "Save Results" : "Sign Up to Share Results"}
      </button>
    </div>
  );
}
