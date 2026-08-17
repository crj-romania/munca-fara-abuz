# Specificație tehnică — Aplicație mobilă pentru lucrători migranți (indicator I16)

**Versiune:** 1.0 — 5 august 2026
**Rol document:** specificație de implementare. Deciziile de arhitectură sunt luate; implementatorul (ChatGPT) NU ia decizii de arhitectură — dacă ceva e neclar sau lipsește, întreabă înainte de a improviza.

---

## 0. Context și principii obligatorii

Aplicație mobilă multilingvă pentru lucrători migranți non-UE din România: ghid practic pas cu pas privind drepturile de muncă + generator de plângeri către autorități. Dezvoltată de o fundație, într-un proiect cu finanțare; trebuie să rămână funcțională și actualizabilă după finalul proiectului.

Principii nenegociabile:

1. **Local-only.** Fără server propriu, fără backend, fără autentificare, fără cont. Fundația nu colectează și nu primește nicio dată personală prin aplicație.
2. **JSON-driven.** Tot conținutul (limbi, texte UI, arbore de informații, categorii de plângeri, câmpuri, instituții, template-uri) e definit în fișiere JSON, nu în cod. Aplicația e un motor generic care randează JSON-ul. Modificările de conținut și legislative NU trebuie să necesite release în app store.
3. **Offline-first.** Totul funcționează fără internet, pe conținutul împachetat/cache-uit. Internetul e necesar doar pentru: actualizarea conținutului, descărcarea modelului de traducere, trimiterea emailului.
4. **Datele formularului de plângere se șterg** din memorie după generarea PDF-ului. Singurul lucru persistat: PDF-urile generate (local, pe device, la alegerea userului) și preferința de limbă.
5. **Public cu alfabetizare juridică și digitală variabilă.** Un ecran = un pas = o decizie. Texte scurte, iconografie, fără jargon.

---

## 1. Stack tehnic

| Componentă | Alegere | Note |
|---|---|---|
| Framework | **Expo (React Native) + TypeScript** | Android prioritar, iOS din același cod |
| Navigație | expo-router sau React Navigation (stack) | la alegerea implementatorului |
| Stocare locală | AsyncStorage (preferințe) + expo-file-system (conținut cache-uit, PDF-uri) | |
| i18n | **i18next** + react-i18next, resurse încărcate dinamic din JSON | NU stringuri hardcodate |
| PDF | **expo-print** (HTML → PDF) | |
| Email | **expo-mail-composer** (destinatar, subiect, corp, atașament PDF precompletate) | fallback: share sheet |
| Salvare/partajare PDF | **expo-sharing** (share sheet nativ) | e și mecanismul pentru „Salvează PDF" |
| Traducere text liber | **Google ML Kit Translation, on-device**, prin librărie community RN + config plugin Expo | vezi §6; necesită development build (EAS), nu merge în Expo Go |
| Analytics | **@aptabase/react-native** | doar evenimente anonime, vezi §7 |
| Fonturi | **Noto Sans** + subseturile pentru: devanagari (nepali, hindi), sinhala, tamil, bengali, arab (urdu, arabă) | împachetate în aplicație |
| RTL | Suport complet de la început (urdu, arabă): layout-uri cu `I18nManager` / flexbox direction-aware | |

**Build & testare:** dezvoltare pe telefon real prin Expo Go cât timp nu e integrat ML Kit; după integrarea ML Kit se trece pe **development build** generat de EAS (cloud — nu e nevoie de Android Studio local). Build-uri finale: EAS Build + EAS Submit.

---

## 2. Arhitectura conținutului

### 2.1 Sursă și actualizare

- Conținutul stă într-un **repo Git publicat pe GitHub Pages** (hosting static, gratuit).
- O copie a conținutului e **împachetată în aplicație** (funcționare offline garantată din prima secundă).
- La pornire (cu timeout scurt, max 3s, fără blocarea UI): aplicația descarcă `index.json`, compară `contentVersion` cu versiunea locală; dacă e mai nouă, descarcă fișierele schimbate și le salvează în cache (expo-file-system). Cache-ul are prioritate față de versiunea împachetată.
- Dacă fetch-ul eșuează → se merge silențios pe conținutul local. Niciun mesaj de eroare pentru user.

### 2.2 Structura repo-ului de conținut

```
content/
  index.json              # versiuni + lista limbilor + manifest fișiere
  ro/strings.json         # română (limba plângerilor + fallback)
  en/strings.json
  ne/strings.json         # nepali
  si/strings.json         # sinhala
  ta/strings.json         # tamil
  ur/strings.json         # urdu (RTL)
  bn/strings.json         # bangla
  tl/strings.json         # tagalog
  vi/strings.json         # vietnameză
  hi/strings.json         # hindi
  ar/strings.json         # arabă (RTL)
  info.json               # arborele de informații (referă chei din strings)
  complaint.json          # categorii de plângere, câmpuri, rutare destinatari
  institutions.json       # instituții + emailuri pe județe
  emergency.json          # conținut ecran urgență
```

**Limbile sunt dinamice:** aplicația citește lista din `index.json` și afișează ce găsește. O limbă nouă = un fișier `strings.json` nou + o intrare în `index.json`. Zero cod, zero release. Aplicația nu are nicio limbă hardcodată în afară de fallback-ul `en` împachetat.

### 2.3 index.json — schemă

```json
{
  "schemaVersion": 1,
  "contentVersion": "2026-08-05.1",
  "legalUpdatedAt": "2026-08-05",
  "languages": [
    { "code": "en", "name": "English",    "rtl": false, "mt": "mlkit:en" },
    { "code": "ne", "name": "नेपाली",       "rtl": false, "mt": "none" },
    { "code": "si", "name": "සිංහල",       "rtl": false, "mt": "none" },
    { "code": "ta", "name": "தமிழ்",       "rtl": false, "mt": "mlkit:ta" },
    { "code": "ur", "name": "اردو",        "rtl": true,  "mt": "mlkit:ur" },
    { "code": "bn", "name": "বাংলা",       "rtl": false, "mt": "mlkit:bn" },
    { "code": "tl", "name": "Tagalog",    "rtl": false, "mt": "mlkit:tl" },
    { "code": "vi", "name": "Tiếng Việt", "rtl": false, "mt": "mlkit:vi" },
    { "code": "hi", "name": "हिन्दी",       "rtl": false, "mt": "mlkit:hi" },
    { "code": "ar", "name": "العربية",     "rtl": true,  "mt": "mlkit:ar" }
  ],
  "files": {
    "info": "info.json",
    "complaint": "complaint.json",
    "institutions": "institutions.json",
    "emergency": "emergency.json"
  }
}
```

Câmpul `mt` declară capabilitatea de traducere automată a limbii: `mlkit:<cod>` = traducere on-device disponibilă; `none` = se folosește fluxul manual Google Translate (§6.3). O limbă adăugată fără câmpul `mt` cade automat pe `none`.

### 2.4 strings.json

Dicționar plat de chei i18next: `{ "home.title": "...", "complaint.cat.unpaid_wages": "...", ... }`. TOATE textele vizibile în UI vin de aici, inclusiv etichetele câmpurilor de formular și textele template-ului de plângere. `ro/strings.json` conține în plus traducerile românești folosite la generarea plângerii.

### 2.5 info.json — arborele de informații

```json
{
  "categories": [
    {
      "id": "wages",
      "icon": "cash",
      "labelKey": "info.cat.wages",
      "items": [
        {
          "id": "unpaid",
          "labelKey": "info.wages.unpaid.title",
          "bodyKey": "info.wages.unpaid.body",
          "steps": ["info.wages.unpaid.step1", "info.wages.unpaid.step2"],
          "institutionIds": ["itm"],
          "refs": "OUG 32/2026 art. X; Codul muncii art. Y"
        }
      ]
    }
  ]
}
```

Cardul de informație afișează: dreptul (scurt), pașii concreți, instituția competentă (+contact din `institutions.json`), baza legală (`refs`, colapsată sub „Vezi baza legală"). Adâncimea arborelui e dată de JSON, nu limitată în cod. Conținutul juridic efectiv va fi furnizat separat (există deja o broșură verificată — nu inventa conținut juridic, folosește placeholder-e cu chei).

### 2.6 complaint.json

```json
{
  "statusQuestions": {
    "employment": {
      "labelKey": "complaint.q.employment",
      "options": ["employed", "contract_ended", "other"]
    },
    "residence": {
      "labelKey": "complaint.q.residence",
      "options": ["documented", "undocumented", "prefer_not_say"]
    }
  },
  "commonFields": [
    { "id": "lastName",      "type": "text",   "required": true,  "labelKey": "complaint.f.lastName" },
    { "id": "firstName",     "type": "text",   "required": true,  "labelKey": "complaint.f.firstName" },
    { "id": "citizenship",   "type": "text",   "required": true,  "labelKey": "complaint.f.citizenship" },
    { "id": "idType",        "type": "select", "required": true,  "labelKey": "complaint.f.idType",
      "options": [
        { "value": "passport", "labelKey": "complaint.f.idType.passport" },
        { "value": "trc",      "labelKey": "complaint.f.idType.trc" }
      ] },
    { "id": "idNumber",      "type": "text",   "required": true,  "labelKey": "complaint.f.idNumber" },
    { "id": "cnp",           "type": "text",   "required": false, "labelKey": "complaint.f.cnp", "hintKey": "complaint.f.cnp.hint" },
    { "id": "address",       "type": "text",   "required": true,  "labelKey": "complaint.f.address" },
    { "id": "addressCounty", "type": "county", "required": true,  "labelKey": "complaint.f.addressCounty" },
    { "id": "contact",       "type": "text",   "required": true,  "labelKey": "complaint.f.contact", "hintKey": "complaint.f.contact.hint" }
  ],
  "employerFields": [
    { "id": "employerName",    "type": "text",   "required": true,  "labelKey": "complaint.f.employerName", "hintKey": "complaint.f.employerName.hint" },
    { "id": "employerCounty",  "type": "county", "required": true,  "labelKey": "complaint.f.employerCounty" },
    { "id": "employerAddress", "type": "text",   "required": false, "labelKey": "complaint.f.employerAddress" },
    { "id": "employerRegCom",  "type": "text",   "required": false, "labelKey": "complaint.f.employerRegCom" },
    { "id": "employerCui",     "type": "text",   "required": false, "labelKey": "complaint.f.employerCui" }
  ],
  "categories": [
    {
      "id": "unpaid_wages",
      "labelKey": "complaint.cat.unpaid_wages",
      "requiresEmployer": true,
      "violations": [
        { "id": "no_salary",   "labelKey": "complaint.v.unpaid.no_salary",   "sentenceKey": "complaint.v.unpaid.no_salary.ro" },
        { "id": "partial_pay", "labelKey": "complaint.v.unpaid.partial_pay", "sentenceKey": "complaint.v.unpaid.partial_pay.ro" },
        { "id": "no_overtime", "labelKey": "complaint.v.unpaid.no_overtime", "sentenceKey": "complaint.v.unpaid.no_overtime.ro" }
      ],
      "fields": [
        { "id": "period",   "type": "text",     "required": true,  "labelKey": "complaint.f.period" },
        { "id": "amount",   "type": "text",     "required": false, "labelKey": "complaint.f.amount" },
        { "id": "freeText", "type": "freetext", "required": false, "labelKey": "complaint.f.freeText" }
      ],
      "destinations": {
        "default": ["itm"],
        "undocumented": "warning_then_choice"
      },
      "templateKey": "complaint.tpl.unpaid_wages"
    }
  ]
}
```

Tipuri de câmp suportate de motor: `text`, `date`, `select` (opțiuni din chei), `county` (dropdown județe RO), `freetext` (multiline, intră în fluxul de traducere §6). Setul e extensibil doar prin cod — restul e conținut.

**Câmpuri de identificare (commonFields).** Required: nume, prenume, cetățenie, tip act de identitate (pașaport sau permis de ședere/TRC valabil) + seria/numărul, domiciliu + județ, contact. Opțional dar cu hint că ajută: CNP (dacă există). `employerFields` se atașează automat categoriilor cu `requiresEmployer: true` — required doar denumirea (sau numele, dacă e persoană fizică) și județul sediului; adresa completă, nr. Reg. Com. și CUI sunt opționale.

**Încălcări predefinite (`violations`).** Fiecare categorie definește o listă de fapte tipice, afișate ca checklist multiselect în limba userului (`labelKey`); fiecare bifă e mapată pe o propoziție românească pre-redactată (`sentenceKey`, din `ro/strings.json`) care intră în situația de fapt a plângerii. **Regulă de validare: plângerea e validă doar cu cel puțin o încălcare bifată SAU text liber nevid** — situația de fapt nu poate fi goală. Textul liber e supliment, nu substitut. Listele reale de încălcări per categorie vin de la echipa juridică (sursa: broșura existentă); implementatorul folosește placeholder-e.

### 2.7 institutions.json

```json
{
  "institutions": [
    {
      "id": "itm",
      "nameRo": "Inspectoratul Teritorial de Muncă",
      "labelKey": "inst.itm",
      "perCounty": true,
      "countyBasis": "employer",
      "emails": { "AB": "itmalba@...", "B": "itmbucuresti@...", "...": "..." }
    },
    {
      "id": "igi",
      "nameRo": "Inspectoratul General pentru Imigrări",
      "labelKey": "inst.igi",
      "perCounty": true,
      "countyBasis": "worker",
      "emails": { "...": "..." }
    },
    {
      "id": "foundation",
      "nameRo": "<numele fundației>",
      "labelKey": "inst.foundation",
      "perCounty": false,
      "emails": { "*": "contact@..." },
      "whatsapp": "+40..."
    }
  ]
}
```

Emailurile reale vor fi completate de echipa de conținut — folosește placeholder-e. **Rutarea pe județ:** instituțiile `perCounty: true` declară prin `countyBasis` ce județ contează — `"employer"` (ex. ITM: județul sediului angajatorului) sau `"worker"` (ex. IGI: județul domiciliului lucrătorului). Aplicația NU pune o întrebare separată despre județ: folosește `employerCounty`, respectiv `addressCounty`, deja introduse în formular. Fail-safe legal: instituțiile sunt obligate (OG 27/2002) să redirecționeze petițiile greșit îndreptate către organul competent, deci o rutare imperfectă nu invalidează plângerea.

---

## 3. Ecrane

Un ecran per pas. Buton back vizibil peste tot. Numerotarea = ordinea în flux.

| # | Ecran | Conținut |
|---|---|---|
| S1 | **Selectare limbă** | Doar la prima deschidere (apoi persistată în AsyncStorage). Grid cu limbile din `index.json`, fiecare în propria scriere. Schimbabilă ulterior din Setări. |
| S2 | **Home** | 3 acțiuni mari: „Vreau informații" / „Am o problemă" / „Urgență" (vizual distinct, roșu). Jos: acces Setări, „Documentele mele", disclaimer scurt + data ultimei actualizări legislative (`legalUpdatedAt`). |
| S3 | **Urgență** | Din `emergency.json`: 112, linia ANITP (trafic de persoane), instrucțiuni minime. Fără colectare de date. Accesibil dintr-un tap de pe Home. |
| S4 | **Info: categorii** | Lista categoriilor din `info.json`, cu iconuri. |
| S5 | **Info: subiecte** | Item-urile categoriei alese. |
| S6 | **Info: card** | Drept + pași + instituție + bază legală (colapsată). Persistent pe S4–S6: link „Situația mea e mai complicată" → S12 Contact. |
| S7 | **Plângere: categorie** | Categoriile din `complaint.json`. |
| S8 | **Plângere: statut** | Cele două întrebări de statut (angajare, ședere) — una per ecran sau împreună, la alegerea implementatorului, dar cu opțiunile exact ca în JSON, inclusiv „Prefer să nu spun". |
| S8a | **Avertisment (condiționat)** | Doar dacă ședere = `undocumented` sau `prefer_not_say` și destinația e o autoritate: ecran de avertizare (text din chei — va fi redactat de echipă) + confirmare explicită „Înțeleg și vreau să continui" / alternativa „Contactează fundația" → S12. |
| S9 | **Plângere: încălcări + formular** | Întâi checklist-ul de încălcări predefinite al categoriei (multiselect, în limba userului), apoi `commonFields` (+ `employerFields` dacă `requiresEmployer`) + câmpurile categoriei. Doar câmpurile `required` blochează avansarea. Un grup logic per ecran (identificare / angajator / detalii). |
| S10 | **Plângere: text liber + traducere** | Fluxul din §6. Poate fi sărit DOAR dacă există cel puțin o încălcare bifată la S9 (validarea din §2.6); altfel e obligatoriu, cu explicație. |
| S11 | **Plângere: previzualizare + acțiuni** | Preview-ul PDF-ului (română). Două acțiuni: **„Trimite pe email"** (mail composer precompletat: destinatar din rutare, subiect, corp scurt, PDF atașat) și **„Salvează PDF"** (share sheet → Files/Drive/print). Sub ele, separat vizual: „Ai întrebări? Contactează-ne" → S12. După oricare acțiune: ecran de confirmare cu pașii următori + ștergerea datelor din memorie (PDF-ul rămâne în „Documentele mele"). |
| S12 | **Contact** | WhatsApp deep link + email fundație. Text obligatoriu despre limite: fundația NU depune plângerea în locul lucrătorului și contactarea ei NU echivalează cu o plângere depusă. |
| S13 | **Setări** | Schimbă limba (cu logica de modele §6.2), despre aplicație, politica de confidențialitate, versiunea conținutului. |
| S14 | **Documentele mele** | Lista PDF-urilor generate, stocate local în sandbox-ul aplicației. Acțiuni: deschide, re-partajează, șterge. Text scurt: „Documentele există doar pe telefonul tău." |

---

## 4. Generarea plângerii (PDF)

Template HTML → expo-print. **Corpul integral în română** (destinatarii sunt autorități române). Structura:

1. Antet: destinatar (instituție + județ), data.
2. Obiect: din template-ul categoriei (`templateKey`, textul RO din `ro/strings.json`).
3. Identificarea petentului: câmpurile comune.
4. Situația de fapt: propozițiile RO ale încălcărilor bifate (`sentenceKey`) + valorile câmpurilor structurate (etichete RO predefinite) + traducerea RO a textului liber (dacă există). Traducerea e întotdeauna automată (ML Kit sau Google Translate web — §6), deci ori de câte ori există text liber tradus se include mențiunea: *„Traducere generată automat; în caz de neconcordanță prevalează textul original anexat."*
5. Solicitarea: din template-ul categoriei.
6. Semnătură: nume + mențiune că plângerea e transmisă electronic.
7. **Anexă** (pagină separată, doar dacă există text liber): declarația în limba originală, marcată *„Anexă — declarația petentului în limba originală, pentru verificarea acurateței traducerii."*

Numele fișierului: `plangere_<categorie>_<data>.pdf`. Fără date personale în numele fișierului.

**Rutarea destinatarului:** `destinations.default` al categoriei → instituție → email după județul indicat de `countyBasis` (§2.7: `employerCounty` sau `addressCounty` din formular). Pentru `undocumented`/`prefer_not_say` se aplică S8a înainte.

---

## 5. Fluxul emailului

`expo-mail-composer`: recipients = emailul instituției rutate; subject = obiectul plângerii (RO); body = 2-3 rânduri de curtoazie în RO („Atașat vă transmit..."); attachment = PDF-ul. Userul apasă Trimite din clientul lui — plângerea pleacă de pe adresa LUI și rămâne în Sent ca dovadă. Dacă `MailComposer.isAvailableAsync()` = false (niciun cont de mail configurat): mesaj explicativ + fallback „Salvează PDF" prin share sheet.

---

## 6. Traducerea textului liber

Principiu: **minimizarea textului liber** — tot ce se poate structura se structurează în încălcări predefinite și câmpuri. Textul liber e scurt (limită soft ~1000 caractere, cu contor) și opțional doar dacă s-a bifat cel puțin o încălcare la S9; altfel devine obligatoriu (validarea din §2.6).

### 6.1 Alegerea motorului — la runtime, după `mt` din index.json

- `mlkit:<cod>` → fluxul 6.2.
- `none` → fluxul 6.3.
- Fluxul 6.3 e și **fallback universal** pentru 6.2 (model nedescărcabil, offline, eroare).

### 6.2 ML Kit on-device (lazy)

- Modelul NU se descarcă la selectarea limbii. Se descarcă **doar la prima traducere efectivă** (`downloadModelIfNeeded` echivalent), cu progress indicator și mesaj că e nevoie de internet o singură dată (~30MB).
- După descărcare: traducere 100% offline, permanent.
- La **schimbarea limbii** în Setări: modelul limbii vechi se șterge; modelul limbii noi NU se descarcă anticipat — tot lazy, la prima nevoie.
- Traducerea afișată userului înainte de includere (read-only), cu opțiunea de a reveni și scurta/simplifica textul original.

### 6.3 Flux manual Google Translate (web)

1. Aplicația afișează textul introdus + buton **„Deschide traducerea"**.
2. Butonul deschide browserul cu URL precompletat: `https://translate.google.com/?sl=<cod_limbă>&tl=ro&text=<text_urlencoded>&op=translate` — traducerea apare gata făcută.
3. Userul copiază rezultatul (instrucțiune vizuală pas cu pas pe ecran) și îl lipește într-un câmp dedicat „Lipește traducerea aici" în aplicație.
4. Textul lipit intră în corpul plângerii ca traducere; originalul merge în anexă, ca la 6.2.
- Buton secundar „Copiază textul meu" pentru cazul în care URL-ul depășește limita de lungime (atunci se deschide GT fără text precompletat).

---

## 7. Analytics (Aptabase)

Doar evenimente anonime, agregate. **Interzis:** orice text liber, valori de câmpuri, date personale, combinații care pot identifica o persoană. Evenimente:

| Eveniment | Proprietăți |
|---|---|
| `app_open` | — |
| `language_selected` | `{ lang }` |
| `info_item_viewed` | `{ categoryId, itemId }` |
| `complaint_started` | `{ categoryId }` |
| `complaint_generated` | `{ categoryId, action: "email" \| "saved" }` |
| `complaint_abandoned` | `{ categoryId, lastStep }` |
| `mt_used` | `{ engine: "mlkit" \| "manual" }` |
| `emergency_opened` | — |
| `contact_opened` | — |

NU se trimite statutul de ședere ca proprietate de eveniment.

---

## 8. Cerințe non-funcționale

- **RTL:** urdu și arabă întorc întregul layout. Testat de la primul ecran, nu adăugat la final.
- **Fonturi:** Noto pentru toate scripturile, împachetate; nicio limbă nu se afișează cu tofu (□).
- **Accesibilitate:** ținte de touch mari, contrast AA, texte scurte, iconuri lângă text (nu în loc de text).
- **Confidențialitate:** politică de confidențialitate (cerută de store-uri) — datele nu părăsesc device-ul, analytics anonim menționat explicit. Ecranul de formular nu permite screenshot-blocking exagerat, dar nu loghează nimic.
- **Disclaimer** (footer Home + ecran About): informare generală, nu consultanță juridică individuală.
- **Dimensiune:** aplicația sub 60MB fără modele ML (modelele sunt lazy).

---

## 9. Faze de dezvoltare (pentru implementator)

Livrează în această ordine; fiecare fază compilează și rulează:

1. **Schelet + motor de conținut:** Expo + TS, navigație, încărcare index.json/strings (bundled + fetch/cache), i18n dinamic, RTL, fonturi, S1–S2, S13. *Criteriu: adaug o limbă nouă doar din JSON și apare în app.*
2. **Fluxul de informații:** S4–S6 + emergency S3, randate din info.json/emergency.json. *Criteriu: modific info.json pe GitHub Pages și conținutul se actualizează fără release.*
3. **Fluxul de plângere fără traducere:** S7–S9, S11, S14 + generare PDF + mail composer + share sheet + rutare pe județ + S8a. *Criteriu: PDF corect generat în română, email precompletat, datele șterse după generare.*
4. **Traducerea:** S10, ML Kit lazy (dev build EAS) + fluxul manual GT + logica `mt`. *Criteriu: limbă cu mlkit traduce offline după prima descărcare; limbă cu none parcurge fluxul manual complet.*
5. **Analytics + polish:** Aptabase, evenimentele din §7, QA pe RTL, accesibilitate, dimensiune.

---

## 10. Ce NU face aplicația

- Nu trimite nimic către fundație automat; nu depune plângeri în numele userului.
- Nu are cont, login, notificări push, hartă, chat, AI conversațional.
- Nu stochează datele formularului după generare.
- Nu folosește API-uri plătite de traducere și niciun serviciu care cere cheie secretă în aplicație.
- Nu conține conținut juridic inventat de implementator — tot conținutul vine prin chei din JSON, redactat de echipa juridică.
