import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import axios from "axios";

type ResultShape = Record<string, number | null> | null | undefined;

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithPopup, isAuthenticated, getAccessTokenSilently, getAccessTokenWithPopup } = useAuth0()
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const result = (location.state as { result?: ResultShape } | null)?.result;

  // If there is no result in state, tell the user to take the test first
  if (!result || Object.keys(result).length === 0) {
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

  // Convert to entries and sort by percent desc
  const sorted = Object.entries(result).sort((a, b) => {
    const va = typeof a[1] === "number" ? (a[1] as number) : -Infinity;
    const vb = typeof b[1] === "number" ? (b[1] as number) : -Infinity;
    return vb - va;
  });

  async function signUpAndSave() {
    setError(null);
    setIsSaving(true);
    let token = ''

    try {
      if (!isAuthenticated) {
        await loginWithPopup();
      }
      try {
        token = await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUDIENCE }});
      } catch (error) {
        const popUpToken = await getAccessTokenWithPopup({ authorizationParams: { audience: import.meta.env.VITE_AUDIENCE }})
        if (popUpToken){
          token = popUpToken
        };
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/results`, 
        { result },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to save results');
      }

      navigate('/saved-results');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Resultaat</h1>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      <p>Top matches (sorted by percent):</p>

      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map(([name, percent]) => {
          const percentText =
            typeof percent === "number" && Number.isFinite(percent)
              ? `${percent.toFixed(2)}%`
              : "N/A";
          return (
            <div
              key={name}
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
              <div style={{ fontWeight: 700 }}>{name}</div>
              <div style={{ minWidth: 80, textAlign: "right", color: "#333" }}>
                {percentText}
              </div>
            </div>
          );
        })}
      </div>
      <button 
        onClick={signUpAndSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : isAuthenticated ? 'Save Results' : 'Sign Up to Share Results'}
      </button>
    </div>
  );
}
