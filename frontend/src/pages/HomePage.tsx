import styles from "./styles/HomePage.module.css";
import { useNavigate } from "react-router-dom";

const CARDS1 = [
  {
    icon: "/icons/Questions.svg",
    title: "Vasta küsimustele",
    text: "15 lühikest väidet kohaliku elu kohta",
  },
  {
    icon: "/icons/Profile.svg",
    title: "Saada oma profiil",
    text: "Tulemuseks skoor ja edetabel, kes on Sinu väärtustega kõige lähemal",
  },
];

const CARDS2 = [
  {
    icon: "/icons/Shield.svg",
    title: "Andmed kontrollitud: kandidaatide ametlikud vastused",
  },
  {
    icon: "/icons/No Money.svg",
    title: "Mittetulunduslik ja sõltumatu projekt",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header>
        <div className={styles.hero_photo_container}>
          <img
            className={styles.hero_photo}
            src="/images/photo1.jpg"
            alt="Purskkaev ja loss"
            loading="lazy"
          />
          <h1 className={styles.heading_hero}>
            Narva
            <br />
            Valimiskompass
          </h1>
        </div>
      </header>

      <main>
        <section className={styles.cta_page}>
          <h2>
            Kes esindab Narva <br />
            väärtusi kõige <br />
            paremini?
          </h2>
          <p>
            Lühike valimiskompass — kes jagab sinu väärtusi? <br /> Vaata kohe.
          </p>
          <div className={styles.cta_row}>
            <button
              onClick={() => navigate("/test")}
              className={styles.cta_button}
              aria-label="Alusta testi"
            >
              Alusta testi
            </button>
            <span className={styles.time_hint}>~10–15 min</span>
          </div>
        </section>

        <section className={styles.data_page}>
          <div className={styles.container}>
            <p>
              Narva valimiskompass aitab sul kiiresti ja lihtsalt mõista,
              millised kohalikud kandidaadid jagavad sinu seisukohti. Vastades
              lühikesele küsimustikule saad isikliku tulemuskaard. See on mugav
              ja neutraalne tööriist, mis aitab sul teha teadlikuma valiku
              kohalikel valimistel.
            </p>
          </div>
        </section>

        <section className={styles.kuidasToimib_page}>
          <h1>Kuidas see toimib?</h1>

          <div className={styles.kuidasToimibCards}>
            {CARDS1.map((c) => (
              <article key={c.title} className={styles.kuidasToimibCard}>
                <div className={styles.iconWrapper} aria-hidden="true">
                  <img src={c.icon} alt="" />
                </div>
                <h2>{c.title}</h2>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.info_section}>
          <h1>Miks usaldada seda tööriista?</h1>
          <div className={styles.container}>
            <ul>
              <li>
                Kohalik fookus — küsimused ja kandidaadid on spetsiifilised
                Narvale.
              </li>
              <li>
                Läbipaistev metodoloogia — kuidas skoorid arvutatakse ja kust
                vastused pärinevad.
              </li>
              <li>
                Privaatsus — sinu vastused jäävad anonüümseks ja ei jagata ilma
                nõusolekuta.
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.trust_section}>
          <h1>Usaldus- ja kontroll</h1>
          <div className={styles.kuidasToimibCards2}>
            {CARDS2.map((c) => (
              <article key={c.title} className={styles.kuidasToimibCard2}>
                <div className={styles.iconWrapper2} aria-hidden="true">
                  <img src={c.icon} alt="" />
                </div>
                <h2>{c.title}</h2>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        Tee oma valik teadlikult — Narva jaoks.
      </footer>
    </div>
  );
}
