# Narva Valimiskompass

**Narva Valimiskompass** on veebirakendus, mis aitab Narva elanikel leida kohalike valimiste kandidaatide seast need, kelle seisukohad ühtivad kõige paremini kasutaja vastustega.
Projekt on mittetulunduslik ja sõltumatu ning rõhutab läbipaistvust ja privaatsust.

---

## Projekti struktuur

### `backend/`

Node.js / Express server, mis:

* arvutab vastavuse protsendid,
* salvestab tulemusi MongoDB andmebaasi,
* pakub REST-API liideseid.

### `frontend/`

React + TypeScript kliendirakendus, mis:

* kuvab küsimused ja kandidaatide profiilid,
* arvutab tulemusi reaalajas,
* võimaldab tulemusi jagada.

### `wasm/`

Rusti teek, mis kompileeritakse WebAssembly-ks.
Sisaldab performantset funktsiooni kasutaja ja kandidaatide vastuste sarnasuse arvutamiseks.

---

## Kasutatud tehnoloogiad

| Tehnoloogia        | Eesmärk                                   |
| ------------------ | ----------------------------------------- |
| Node.js & Express  | Serveripoolne loogika ja API              |
| MongoDB            | Tulemuste salvestamine                    |
| React + Vite       | Kliendirakenduse loomine                  |
| TypeScript         | Tüübiturvalisus nii serveris kui kliendis |
| Rust & WebAssembly | Kiire vastuste võrdlemise algoritm        |
| Auth0              | Autentimine ja turvalisus                 |

---

## Kuidas käivitada

### Eeldused

* Node.js (soovitavalt versioon 16 või uuem)
* npm
* MongoDB instants (kohalik või pilves)
* Auth0 konto (domain ja clientId)
* AWS S3 ligipääs kandidaatide CSV-failile

---

### Keskkonnamuutujad

Loo fail `backend/.env` järgmiste sätetega (täida oma andmetega):

```
MONGODB_URI=...
S3_BUCKET=...
S3_REGION=...
S3_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AUTH0_AUDIENCE=...
AUTH0_ISSUER_URL=...
```

---

### Installimine

```bash
npm install
```

---

### Arenduskeskkonnas käivitamine

See skript käivitab backend’i, frontend’i ja koostab wasm-koodi paralleelselt:

```bash
npm run dev
```

* Backend jookseb aadressil: [http://localhost:3000](http://localhost:3000)
* Frontend jookseb aadressil: [http://localhost:5173](http://localhost:5173)

---

### Build

Valmis paketi loomiseks:

```bash
npm run build
```

See loob optimeeritud kliendi ja transpileerib serveri koodi.

---

## Märkused

* Kasutaja vastused jäävad anonüümseks ning neid ei jagata ilma kasutaja loata.
* Projekt on mõeldud eelkõige õppe- ja demoeesmärkidel ning võib vajada kohandamist tootmiskeskkonnas.