import { useCallback, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/TestPage.css";

const VARIANTS = [
  "Tugevalt vastu",
  "Vastu",
  "Neutraalne",
  "Poolt",
  "Tugevalt poolt",
] as const;
const QUESTION_COUNT = 20;

const QUESTIONS: string[] = [
  "Government should increase spending on public healthcare.",
  "Taxes on the wealthy should be raised to support social programs.",
  "Private businesses should have fewer regulations.",
  "The state should provide free higher education.",
  "Military spending should be increased.",
  "Environmental protection should take priority over economic growth.",
  "Immigration should be made easier for most people.",
  "Law enforcement should have stronger powers for public safety.",
  "Same-sex marriage should be legal and protected.",
  "The government should prioritize renewable energy investments.",
  "Unions and workers' rights should be strengthened.",
  "Religion should play a larger role in public life.",
  "Foreign trade should be more restricted to protect local industries.",
  "Healthcare should remain mostly privatized.",
  "The voting age should be lowered.",
  "Welfare benefits should be reduced to encourage work.",
  "Technology companies should be more tightly regulated.",
  "The death penalty should be legal.",
  "Public transport should be heavily subsidized.",
  "National sovereignty should take priority over international cooperation.",
];

function mapIndexToValue(index: number): number {
  return [-1, -0.5, 0, 0.5, 1][index] ?? 0;
}
function valueToIndex(value: number | null): number | null {
  if (value === null) return null;
  switch (value) {
    case -1:
      return 0;
    case -0.5:
      return 1;
    case 0:
      return 2;
    case 0.5:
      return 3;
    case 1:
      return 4;
    default:
      return null;
  }
}

export default function TestPage() {
  const navigate = useNavigate()  
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(QUESTION_COUNT).fill(null)
  );
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [allAnswered, setAllAnswered] = useState(false);

  const selectedIndexForCurrent = useMemo(
    () => valueToIndex(answers[currentQuestion] ?? null),
    [answers, currentQuestion]
  );

  const progressPercent = useMemo(() => {
    const answered = answers.filter((a) => a !== null).length;
    return Math.round((answered / QUESTIONS.length) * 100);
  }, [answers]);

  useEffect(() => {
    setAllAnswered(answers.every((a) => a !== null));
  }, [answers]);

  const handleVariantClick = useCallback(
    (variantIndex: number) => {
      setAnswers((prev) => {
        const next = prev.slice();
        next[currentQuestion] = mapIndexToValue(variantIndex);
        return next;
      });
    },
    [currentQuestion]
  );

  const handlePrev = useCallback(
    () => setCurrentQuestion((i) => Math.max(0, i - 1)),
    []
  );
  const handleNext = useCallback(
    () => setCurrentQuestion((i) => Math.min(QUESTIONS.length - 1, i + 1)),
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!answers.every((a) => a !== null)) {
      alert("Palun vasta kõikidele küsimustele enne saatmist.");
      return;
    }
    const finalAnswers = answers as number[];
    const res = await axios.post(import.meta.env.VITE_BACKEND_URL + '/api/evaluate', {answers: finalAnswers})
    console.log(res);
    if (res.status === 200) {
        navigate('/results', {replace: true, state: { result: res.data }})
    }
  }, [answers]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        handleVariantClick(Number(e.key) - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePrev, handleNext, handleVariantClick]);

  return (
    <div className="test-page">
      <h2>
        Küsimus {currentQuestion + 1} / {QUESTIONS.length}
      </h2>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="Progress of questionnaire"
        className="bar-container"
      >
        <div className="bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="progress" style={{ marginBottom: 8 }}>
        Progress: {progressPercent}% ({answers.filter((a) => a !== null).length}
        /{QUESTIONS.length})
      </div>

      <p className="question-text">{QUESTIONS[currentQuestion]}</p>

      <div
        className="test-variants"
        role="radiogroup"
        aria-label={`Vastuse variandid küsimusele ${currentQuestion + 1}`}
      >
        {VARIANTS.map((label, i) => {
          const selected = selectedIndexForCurrent === i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? "variant-btn selected" : "variant-btn"}
              onClick={() => handleVariantClick(i)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="nav-row" style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentQuestion === 0}
        >
          Tagasi
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentQuestion === QUESTIONS.length - 1}
          style={{ marginLeft: 8 }}
        >
          Järgmine
        </button>

        <button
          disabled={!allAnswered}
          type="button"
          onClick={handleSubmit}
          style={{ marginLeft: 16 }}
        >
          Kontrolli
        </button>
      </div>
    </div>
  );
}
