import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./styles/TestPage.module.css";
import { useAuth0 } from "@auth0/auth0-react";

const VARIANTS = [
  "Ei nõustu üldse/ Полностью не согласен",
  "Ei nõustu/ Не согласен",
  "Neutraalne/ Нейтрально",
  "Nõustun osaliselt/ Скорее согласен",
  "Nõustun täielikult/ Полностью согласен",
] as const;

type QuestionsResponse = {
  questions: string[];
};

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
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, logout } = useAuth0();
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setQuestionsError(null);
    try {
      const res = await axios.get<QuestionsResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/questions`
      );
      const fetchedQuestions = res.data?.questions;

      if (
        !Array.isArray(fetchedQuestions) ||
        fetchedQuestions.length === 0 ||
        fetchedQuestions.some((q) => typeof q !== "string")
      ) {
        throw new Error("Server tagastas vigased küsimused.");
      }

      if (!isMountedRef.current) return;

      setQuestions(fetchedQuestions);
      setAnswers(Array(fetchedQuestions.length).fill(null));
      setCurrentQuestion(0);
    } catch (err: any) {
      console.error(err);
      if (!isMountedRef.current) return;

      setQuestions([]);
      setAnswers([]);
      setCurrentQuestion(0);
      setQuestionsError(
        err?.response?.data?.message ??
          "Küsimuste laadimine ebaõnnestus. Kontrolli internetiühendust ja proovi uuesti."
      );
    } finally {
      if (isMountedRef.current) setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      logout({ logoutParams: { returnTo: window.location.href } });
    }
  }, [isLoading, isAuthenticated, logout]);

  useEffect(() => {
    setAllAnswered(
      questions.length > 0 &&
        answers.length === questions.length &&
        answers.every((a) => a !== null)
    );
  }, [answers, questions.length]);

  const answeredCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );

  const selectedIndexForCurrent = useMemo(
    () => valueToIndex(answers[currentQuestion] ?? null),
    [answers, currentQuestion]
  );

  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions.length]);

  const handleVariantClick = useCallback(
    (variantIndex: number) => {
      setAnswers((prev) => {
        if (currentQuestion >= questions.length) return prev;
        const next = prev.slice();
        next[currentQuestion] = mapIndexToValue(variantIndex);
        return next;
      });
    },
    [currentQuestion, questions.length]
  );

  const handlePrev = useCallback(
    () => setCurrentQuestion((i) => Math.max(0, i - 1)),
    []
  );
  const handleNext = useCallback(
    () =>
      setCurrentQuestion((i) => Math.min(Math.max(questions.length - 1, 0), i + 1)),
    [questions.length]
  );

  const handleSubmit = useCallback(async () => {
    if (
      questions.length === 0 ||
      answers.length !== questions.length ||
      !answers.every((a) => a !== null)
    ) {
      alert("Palun vasta kõikidele küsimustele enne saatmist.");
      return;
    }
    const finalAnswers = answers as number[];
    setLoading(true);
    try {
      const res = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/evaluate",
        { answers: finalAnswers }
      );
      if (res.status === 200 && isMountedRef.current) {
        navigate("/results", { replace: true, state: { result: res.data } });
      } else {
        alert("Serveri vastus ei olnud ootuspärane.");
      }
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          "Tekkis viga saatmisel. Kontrolli internetiühendust ja proovi uuesti."
      );
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [answers, navigate, questions.length]);

  useEffect(() => {
    if (loadingQuestions || loading || questions.length === 0) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        handleVariantClick(Number(e.key) - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    handlePrev,
    handleNext,
    handleVariantClick,
    loadingQuestions,
    loading,
    questions.length,
  ]);

  const showKontrolli =
    questions.length > 0 && allAnswered && currentQuestion === questions.length - 1;

  return (
    <>
      {loading && <div className={styles.loadingOverlay}>Ootame teie tulemusi!</div>}
      <h1 className={styles.title}>Valimiskompassi test</h1>

      {loadingQuestions ? (
        <div className={styles.testPage}>
          <p className={styles.loadingOverlay}>Laen küsimusi...</p>
        </div>
      ) : questionsError ? (
        <div className={styles.testPage}>
          <p className={styles.loadingOverlay}>{questionsError}</p>
          <button
            type="button"
            onClick={fetchQuestions}
            className={`${styles.btn} ${styles.nextBtn}`}
          >
            Proovi uuesti
          </button>
        </div>
      ) : (
        <div className={styles.testPage} aria-busy={loading}>
          <div className={styles.progress}>
            {answeredCount}/{questions.length} väidet
          </div>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Progress of questionnaire"
            className={styles.barContainer}
          >
            <div
              className={styles.barFill}
              style={{
                width: `${progressPercent}%`,
                borderRight:
                  progressPercent === 0 || progressPercent === 100
                    ? "none"
                    : "2px solid var(--text-color)",
              }}
            />
          </div>

          <h2 className={styles.h2}>Väide number {currentQuestion + 1}:</h2>

          <p className={styles.questionText}>{questions[currentQuestion] ?? ""}</p>

          <div
            className={styles.testVariants}
            role="radiogroup"
            aria-label={`Vastuse variandid küsimusele ${currentQuestion + 1}`}
          >
            {VARIANTS.map((label, i) => {
              const selected = selectedIndexForCurrent === i;
              const parts = label.split("/");
              const estonian = parts[0];
              const russian = parts[1];
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`${styles.variantBtn} ${selected ? styles.selected : ""}`}
                  onClick={() => handleVariantClick(i)}
                  disabled={loading}
                >
                  <p className={styles.estonian_choice}>{estonian}/</p>
                  <p className={styles.russian_choice}>{russian}</p>
                </button>
              );
            })}
          </div>

          <div className={styles.navRow}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentQuestion === 0 || loading}
              className={`${styles.btn} ${styles.prevBtn}`}
            >
              Tagasi
            </button>

            {showKontrolli ? (
              <button
                type="button"
                onClick={handleSubmit}
                className={`${styles.btn} ${styles.kontrolli} ${styles.nextBtn}`}
                disabled={loading}
                aria-busy={loading}
              >
                Kontrolli
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  currentQuestion === questions.length - 1 ||
                  answers[currentQuestion] === null ||
                  loading
                }
                className={`${styles.btn} ${styles.nextBtn}`}
              >
                Järgmine
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
