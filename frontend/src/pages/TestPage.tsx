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
const QUESTION_COUNT = 15;

const QUESTIONS: string[] = [
  "Narva linn peab looma tasuta lasteaiakohad, selle asemel et arendada noorte huvitegevuse võimalusi / Город Нарва должен создать бесплатные места в детских садах вместо того, чтобы развивать возможности для молодежных кружков и занятий",
  "Narva peaks eelistama noortele mõeldud üritusi eakatele suunatud ürituste asemel / Нарва должна отдавать приоритет мероприятиям для молодежи вместо мероприятий для пожилых людей",
  "Narva linn peaks keskenduma elanike küttearvete subsideerimisele külmal hooajal, selle asemel et toetada vanade majade renoveerimist / Городская власть Нарвы должна сосредоточиться на субсидировании счетов за отопление в холодный сезон, вместо того чтобы поддерживать ремонт старых домов",
  "Narva peaks arendama maksimaalset multikultuursust, selle asemel et keskenduda ainult eesti keele üleminekule / Нарва должна развивать максимальную мультикультурность вместо того, чтобы сосредоточиться только на переходе на эстонский язык",
  "Narva linnavalitsuse kohustus on tegeleda linna positiivse maine kujundamisega Eesti meedias / Формирование положительного имиджа города в эстонских СМИ является обязанностью городской власти Нарвы",
  "Narva peaks eelistama kergliiklusteede arendamist autoteede parandamisele / Нарва должна отдавать приоритет развитию велодорожек и пешеходных маршрутов вместо ремонта автомобильных дорог",
  "Linna prioriteet peaks olema noorte perede toetuse suurendamine isegi siis, kui see tähendab väiksemat tuge pensionäridele / Приоритетом города должно стать увеличение поддержки молодых семей, даже если это приведёт к снижению помощи пенсионерам",
  "Narva peaks sulgema ajutise piiripunkti Venemaaga, selle asemel et tagada piiriületajatele paremad tingimused (nt WC, varjualused, järjekorra korraldus, jms) / Нарва должна закрыть временный пограничный пункт с Россией вместо того, чтобы обеспечивать пересекающим границу улучшенные условия (например, туалеты, навесы, организацию очередей и т.д.)",
  "Narva linn peaks eelistama ajaloolise arhitektuuripärandi säilitamist ja taastamist, selle asemel et keskenduda linna moderniseerimisele / Городская власть Нарвы должна отдавать приоритет сохранению и восстановлению исторического архитектурного наследия вместо сосредоточения на модернизации города",
  "Narva peaks prioritiseerima tööstuse arendamist turismi arendamise asemel / Нарва должна отдавать приоритет развитию промышленности вместо развития туризма",
  "Narva linn peaks rohkem toetama kohalikke väikeettevõtteid, selle asemel et meelitada suuri välisinvestoreid / Городская власть Нарвы должна больше поддерживать местные малые предприятия вместо привлечения крупных иностранных инвесторов",
  "Narva peaks suurendama kodanike võimalusi osaleda otsustusprotsessides (nt rahvahääletused, avalikud arutelud), selle asemel et keskenduda rohkem tsentraliseerimisele ja efektiivsele juhtimisele / Нарва должна расширять возможности граждан участвовать в процессах принятия решений (например, референдумы, публичные обсуждения) вместо того, чтобы сосредоточиться на централизации и эффективном управлении",
  "Narva peaks panustama vaid tippnoorte arendamisse (talendid, sportlased), kuna nad esindavad linna riigi ja Euroopa tasandil, selle asemel et toetada kõiki lapsi võrdselt / Нарва должна инвестировать только в развитие талантливой молодёжи (таланты, спортсмены), поскольку они представляют город на национальном и европейском уровне, вместо того чтобы поддерживать всех детей одинаково",
  "Narva peaks eelistama linna kaunistamist avaliku kunsti ja kultuuriprojektidega, selle asemel et rajada rohkem parke ja tavainfrastruktuuri / Нарва должна отдавать приоритет украшению города с помощью публичного искусства и культурных проектов вместо строительства дополнительных парков и обычной инфраструктуры",
  "Narva edu tulevik sõltub traditsioonilisest põlevkivitööstusest, mitte rohelisest energiast / Будущий успех Нарвы зависит от традиционной сланцевой промышленности, а не от зелёной энергетики",
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
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, logout } = useAuth0();
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(QUESTION_COUNT).fill(null)
  );
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      logout({ logoutParams: { returnTo: window.location.href } });
    }
  }, [isLoading, isAuthenticated, logout]);

  useEffect(() => {
    setAllAnswered(answers.every((a) => a !== null));
  }, [answers]);

  const selectedIndexForCurrent = useMemo(
    () => valueToIndex(answers[currentQuestion] ?? null),
    [answers, currentQuestion]
  );

  const progressPercent = useMemo(() => {
    const answered = answers.filter((a) => a !== null).length;
    return Math.round((answered / QUESTIONS.length) * 100);
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

  const handlePrev = useCallback(() => setCurrentQuestion((i) => Math.max(0, i - 1)), []);
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
  }, [answers, navigate]);

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

  const showKontrolli = allAnswered && currentQuestion === QUESTIONS.length - 1;

  return (
    <>
      {loading && <div className={styles.loadingOverlay}>Ootame teie tulemusi!</div>}
      <h1 className={styles.title}>Valimiskompassi test</h1>
      <div className={styles.testPage} aria-busy={loading}>
        <div className={styles.progress}>
          {answers.filter((a) => a !== null).length}/{QUESTIONS.length} väidet
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

        <p className={styles.questionText}>{QUESTIONS[currentQuestion]}</p>

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
                currentQuestion === QUESTIONS.length - 1 ||
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
    </>
  );
}
