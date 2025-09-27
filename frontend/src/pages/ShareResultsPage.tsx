import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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
  const { resultId } = useParams<{ resultId: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!resultId) {
    return <div>No result Id</div>;
  }

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/public-results`, { resultId });
        setData(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, [resultId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data?.result) return <div>No results found</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Shared Results</h1>
      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(data.result).map(([key, match]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 12px",
              border: "1px solid #eee",
              borderRadius: 4,
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{match?.name || key}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {match?.party || ""} {match?.candidateNumber ? `• ${match.candidateNumber}` : ""}
              </div>
            </div>
            <div style={{ minWidth: 80, textAlign: "right" }}>
              {typeof match?.percent === "number" && Number.isFinite(match.percent) ? `${match.percent.toFixed(2)}%` : "N/A"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}