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
