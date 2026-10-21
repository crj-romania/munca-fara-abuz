# Muncă Fără Abuz — Faza 4

## Stare — 9 octombrie 2026 (preluare de către Claude)

Problemele din predarea din 17 septembrie ([rezumat](SUMAR_editare_templateuri.md))
sunt remediate: validatorul acceptă schema 2 (snapshotul anterior nu putea
încărca nici conținutul împachetat), validarea structurii `complaint.json` și a
rutării a fost reconstituită (inclusiv condițiile pe fapte), câmpurile opționale
nu mai sunt tratate drept obligatorii, iar perioadele salariale separate au teste.
`npm run check:phase4` trece integral. Nu s-a construit un APK nou și nu s-a
testat pe telefon după aceste remedieri.

Tot pe 9 octombrie: fraze factuale cu completări condiționate, corelarea
categoriei cu situația muncii, copia contractului întrebată o singură dată,
indicații pentru textul liber și Google Translate precompletat — vezi SPEC §12.

**Upgrade Expo SDK 54 → 57** (React Native 0.86): după actualizarea sursei,
rulează o dată `npm install` înainte de `npx expo start`. Expo Go trebuie să fie
versiunea pentru SDK 57 (și cere autentificare cu contul Expo). Modulul nativ
ML Kit nu a fost încă recompilat pe SDK 57 — se verifică la următorul build EAS.
`expo-modules-core` nu mai este dependență directă (importul vine din `expo`);
`react-native-reanimated`/`react-native-worklets` sunt fixate la versiunile
SDK 57, fiind cerute de `expo-router`.

Aplicație Expo (React Native + TypeScript). Livrarea curentă conține Fazele 1–4
din SPEC §9: motorul de conținut, fluxul de informații și urgență, formularul de
plângere cu text liber și traducere, PDF local, atașamente, mail composer,
share sheet, rutare pe județ și „Documentele mele”. Modulul nativ ML Kit Android
este compilat în APK-ul Fazei 4 (build 2); funcționarea efectivă pe telefon rămâne
de verificat. Compilarea iOS nu a fost efectuată. Expo Go folosește alternativa
manuală de traducere.

## Formularul de plângere

Ordinea curentă este: categorie → date personale → muncă → fapte → text liber /
traducere → persoane/firme implicate → atașamente → verificare → generare PDF.
Butoanele de modificare din verificare
revin la secțiunea aleasă și păstrează răspunsurile în memorie.

`content/complaint.json` definește câmpurile personale (`commonFields`), munca
(`workFields`), faptele fiecărei categorii și persoanele/firmele (`partyTypes`).
`suggestedPartyIds` propune participanți, fără să împiedice corectarea selecției.
`visibleWhen`, `requiredWhen`, `requiredAnyOf` și `validation` controlează
afișarea și validarea. `employerFields` este păstrat ca structură legacy, dar
formularul folosește datele angajatorului din `partyTypes`.

Situația efectivă a muncii este distinctă de contract. Se întreabă doar dacă
lucrătorul a primit copia contractului, nu dacă l-a semnat sau dacă munca este
declarată. Datele de muncă au precizie lună/an, pot fi aproximative sau
necunoscute; PDF-ul nu inventează o zi. Câmpurile ascunse și participanții
deselectați nu sunt incluși în PDF.

Telefonul și emailul sunt alternative (cel puțin unul); CNP este obligatoriu
numai pentru TRC. Un singur nume este acceptat. Pentru firme se pot oferi alte
detalii de identificare dacă denumirea nu este cunoscută. Județul necunoscut
nu blochează salvarea PDF-ului, dar o rută nerezolvată blochează trimiterea pe email.

Noua structură folosește `schemaVersion: 2`; cache-urile și actualizările cu o
schemă incompatibilă nu înlocuiesc conținutul valid împachetat. Textele NE/UR
rămân variante de test, nu traduceri validate. Nu au fost schimbate modelele
juridice prin această reorganizare.

Verificare manuală pe telefon (cu date fictive, după reîncărcare completă):

1. La pașaport, continuă fără CNP; la TRC verifică cererea celor 13 cifre.
   Încearcă un telefon internațional și, separat, numai o adresă de email.
2. Verifică toate cele trei situații ale muncii, date aproximative și „Nu știu”.
   Schimbă din „nu mai lucrez” în „lucrez”: sfârșitul nu trebuie să apară în PDF.
3. Selectează angajator și agenție, apoi deselectează unul. Datele celui
   deselectat nu trebuie să apară în verificare sau în PDF.
4. Lasă denumirea firmei goală și oferă alte detalii de identificare; alege
   județ necunoscut. PDF-ul trebuie să poată fi generat, fără destinatar ghicit.
5. Revino din verificare la o secțiune, modifică și continuă. Butonul Înapoi
   trebuie să urmărească traseul fără duplicarea ecranelor.

## Text liber, traducere și atașamente

Fiecare categorie permite text liber (maximum 1.000 de caractere). Este
opțional dacă s-a bifat o faptă predefinită și obligatoriu dacă nu s-a bifat
niciuna sau în categoria „Altele”. Textul introdus direct în română nu se
traduce. Pentru celelalte limbi, PDF-ul nu poate fi generat până când fiecare
text suplimentar are o traducere în română corespunzătoare originalului curent.
Modificarea originalului sau a limbii sale invalidează traducerea anterioară.

- În Expo Go: copiază originalul, deschide Google Translate, lipește-l pe site
  și adu traducerea română înapoi în aplicație. Deschiderea site-ului nu
  include textul în URL. Trimiterea către Google se face numai când utilizatorul
  lipește textul acolo, după avertizarea de confidențialitate.
- Într-un build nativ nou: limbile cu `mt: "mlkit:<cod>"` sunt verificate și
  în lista reală a SDK-ului. Modelele se descarcă numai când se apasă traducerea,
  pe Wi-Fi; după descărcare traducerea poate rula fără internet. La schimbarea
  limbii se șterge vechiul model-sursă; modelul țintă română se păstrează.
  Nu există predescărcare la alegerea limbii și nici API plătit/proxy.
- O limbă dinamică fără `mt`, cu `mt: "none"` sau neacoperită de SDK folosește
  alternativa Google Translate. Limba textului poate fi schimbată separat de UI.
- PDF-ul include traducerea în corp, avertizarea că este automată și originalul
  într-o anexă pe pagină separată. Se păstrează aceeași regulă pentru ML Kit și
  Google Translate. Fonturile Noto necesare sunt încorporate în PDF-ul nativ.

Atașamente: PDF, JPG/JPEG, PNG sau WEBP, cel mult 5 fișiere, 10 MiB per fișier
și 15 MiB total, înainte de PDF. Sunt selectate explicit din telefon, copiate
local și nu modifică originalele. Nu există OCR sau traducere a atașamentelor.
Emailul include PDF-ul și toate fișierele; dacă unul lipsește, compunerea
emailului este blocată. Furnizorul de email poate avea alte limite de mărime.

„Salvează PDF” exportă doar plângerea. Atașamentele se salvează/distribuie
individual, din previzualizare sau „Documentele mele”. Copiile persistente stau
într-un director companion al PDF-ului; ștergerea documentului le elimină și
pe ele, dar nu șterge originalele sau fișierele deja exportate/trimise.
Formularul și traducerile există numai în memorie; PDF-ul și copiile
atașamentelor conțin date personale și rămân locale până sunt șterse.

Teste suplimentare pe telefon, cu date fictive:

1. Selectează o faptă, adaugă text opțional și verifică apariția lui în PDF.
2. Nu selecta nicio faptă: continuarea trebuie să ceară o descriere.
3. În EN/UR/NE, copiază și lipește o traducere. Modifică originalul: traducerea
   trebuie refăcută. Verifică diacriticele, scriptul original și pagina anexei.
4. Adaugă o imagine și un PDF, elimină unul și verifică lista finală. Încearcă
   anularea selectorului, un fișier prea mare și mai mult de 5 fișiere.
5. Redeschide aplicația: PDF-ul și anexele salvate trebuie să poată fi deschise
   separat. Ștergerea documentului nu trebuie să atingă fișierele originale.
6. În buildul ML Kit: prima traducere pe Wi-Fi, apoi încă una în modul avion.
   Schimbă limba; nu trebuie pornită o descărcare până la o nouă traducere.

## Cerințe

- Windows cu PowerShell;
- Node.js minimum 20.19 (preferabil o versiune LTS);
- telefon Android cu Expo Go;
- calculatorul și telefonul conectate la aceeași rețea Wi-Fi.

## Instalare și pornire

Deschide PowerShell și execută, pe rând:

```powershell
Set-Location -LiteralPath 'G:\CRJ\Aplicatie'
npm install
npm run check:phase4
npx expo start --go --clear
```

După apariția codului QR:

1. Deschide Expo Go pe telefonul Android.
2. Alege scanarea unui cod QR.
3. Scanează codul afișat în PowerShell.
4. La prima pornire apare ecranul de selectare a limbii.

Oprești serverul din PowerShell cu `Ctrl+C`.

## Verificarea Fazei 1

Comanda următoare verifică TypeScript și integritatea conținutului:

```powershell
npm run check:phase1
```

Pentru Faza 2:

```powershell
npm run check:phase2
```

Pentru Faza 3 (include automat verificările Fazelor 1 și 2):

```powershell
npm run check:phase3
```

Pentru verificările complete, inclusiv traduceri și atașamente:

```powershell
npm run check:phase4
```

Testele automate acoperă logica JavaScript și modulele prin dubluri de test;
nu înlocuiesc compilarea Kotlin/Swift sau verificarea selectorului, emailului
și vizualizatorului PDF pe telefon.

## Conținut remote prin GitHub Pages

Aplicația folosește întotdeauna conținutul împachetat ca fallback. Pentru
actualizări fără release, setează în `.env`:

```text
EXPO_PUBLIC_CONTENT_BASE_URL=https://vadim-chiriac.github.io/migratie
```

Poți copia `.env.example`. Workflow-ul
`.github/workflows/deploy-content-pages.yml` publică folderul `content/` la
fiecare modificare pe `main`. În repository-ul GitHub trebuie selectat o singură
dată **Settings → Pages → Source: GitHub Actions**.

Pentru o actualizare de conținut:

1. modifică JSON-urile și dicționarele;
2. mărește `contentVersion` din `content/index.json`;
3. rulează `npm run check:phase4` înainte de publicarea conținutului.

Aplicația descarcă întregul set într-un staging cache și îl activează numai
dacă toate fișierele sunt valide.

Pentru verificarea compatibilității Expo și a bundle-ului Android:

```powershell
npx expo install --check
npx expo export --platform android --output-dir dist
```

## APK de test fără server local

Profilul EAS `preview` produce un APK instalabil care rulează fără Expo Go și
fără serverul Metro de pe calculator:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

După finalizarea buildului, deschide pe telefon linkul sau codul QR afișat de
EAS și instalează APK-ul. Android poate cere permisiunea de instalare din sursa
folosită pentru descărcare. Buildul include conținutul local și încearcă în plus
să preia versiuni mai noi de la GitHub Pages.

Un APK mai vechi nu primește codul noilor funcții prin actualizarea JSON-urilor.
Pentru ML Kit trebuie refăcut buildul. Profilul `development` include clientul
de dezvoltare și permite testarea schimbărilor JS cu Metro:

```powershell
npx eas-cli@latest build --platform android --profile development
npm run start:dev-client
```

Aceste comenzi pornesc un build în EAS numai când le execuți. Alternativa locală Android necesită
Android Studio/SDK și `npx expo run:android`. iOS necesită macOS/Xcode sau EAS;
ținta minimă este 15.5, conform dependenței ML Kit.

### APK Faza 4 — build 2 (2026-09-08)

- Build EAS finalizat: `1c08b464-36a6-4a97-af82-a771ff472b40`, profil `preview`,
  aplicație `ro.crj.muncafaraabuz`, versiune `0.1.0`, `versionCode: 2`.
- [Descarcă APK-ul](https://expo.dev/artifacts/eas/ItfDJOmRMGrhQjxeoLGsoA-L87WY8_QbfuyNZa9PEdM.apk)
  sau [deschide pagina buildului](https://expo.dev/accounts/midoc/projects/munca-fara-abuz/builds/1c08b464-36a6-4a97-af82-a771ff472b40).
- Copie locală: `dist-apk/MuncaFaraAbuz-faza4-build2.apk` (159.172.356 bytes).
  Directorul este exclus din Git și din arhivele de build prin `.gitignore`.
- SHA-256: `cffbde24bab334c6dd3ca9d201bb34e3b4a348acf3bc0027d0bdb46272758a13`.
- APK universal: arm64-v8a, armeabi-v7a, x86 și x86_64. Dimensiunea este încă
  peste ținta de 60 MB; optimizarea/distribuția pe arhitecturi rămâne pentru Faza 5.
- Compilarea Kotlin a modulului ML Kit a trecut. În APK au fost verificate
  prezența modulului, SDK-ului de traducere, selectorului de documente,
  clipboardului și a codului pentru text liber/atașamente.
- EAS a refolosit cheia Android existentă. Instalează ca actualizare peste APK-ul
  anterior; nu dezinstala aplicația dacă vrei să păstrezi documentele locale.
- Buildul rulează fără Metro/Expo Go. Prima traducere ML Kit necesită Wi-Fi
  pentru modele; apoi trebuie verificată traducerea în modul avion.
- Expo Doctor: 17/18 verificări trecute; avertismentul despre dependența directă
  `expo-modules-core` nu a blocat compilarea. Corectarea importului/dependenței
  rămâne în lista de finisare tehnică, fără modificarea acestui APK deja generat.
- Nu este publicat în Google Play. Conținutul juridic rămâne DRAFT și emailul
  către autorități rămâne dezactivat până la validarea template-urilor.

## Criteriul limbii dinamice

Lista din S1 și S13 este citită din `content/index.json`. Fișierele
`content/<cod>/strings.json` sunt descoperite recursiv de Metro; codurile de
test `ro`, `ne` și `ur` nu sunt declarate în sursa runtime.

Pentru a adăuga o limbă fără modificarea codului:

1. Creează `content/<cod>/strings.json` cu același set de chei ca EN.
2. Adaugă limba în `languages` din `content/index.json`.
3. Repornește Metro cu `npx expo start --clear`.

Noua limbă apare automat în S1 și S13. Pentru conținut remote, aceiași pași se
fac în repo-ul de conținut și se mărește `contentVersion`; această livrare are
`CONTENT_BASE_URL` gol, deci folosește numai conținutul împachetat.

## Test RTL

1. În S1 selectează `[UR] اردو`.
2. Verifică indicatorul `[UR] Applying language…`.
3. Aplicația se reîncarcă automat și întoarce layout-ul în RTL.
4. Din S13 selectează English sau Română și verifică revenirea în LTR.

Reload-ul de direcție este apelat numai de selectorul folosit în S1 și S13.

## Limitele livrării curente

- Formularul, textul liber, PDF-ul și documentele locale sunt implementate.
  Datele formularului există numai în memoria React și sunt șterse după
  generarea PDF-ului; documentele și anexele rămân locale până sunt șterse.
- Cele 6 template-uri juridice sunt încă DRAFT.
  Cât timp template-ul categoriei nu este validat, trimiterea prin email este
  dezactivată; PDF-ul DRAFT poate fi deschis și partajat pentru testare.
- Cele 42 de adrese ITM și emailul public al fundației sunt configurate.
  Adresele IGI/CNCD și WhatsApp-ul fundației rămân placeholder-e.
- Categoria „Altele” este disponibilă pentru PDF, dar nu are o autoritate
  configurată. Aplicația nu ghicește destinatarul și nu trimite plângerea fundației.
- ML Kit și acțiunile native pentru fișiere/email necesită testare pe telefon.
  În Expo Go, traducerea automată locală nu este disponibilă.
- Analytics Aptabase și polish-ul final rămân pentru Faza 5.
- Auditul npm din 2026-09-08 raportează 31 constatări în arborele de dependențe
  (10 de severitate ridicată, 21 moderată), inclusiv instrumentele Expo/Metro.
  Acesta nu este un diagnostic de exploatabilitate a APK-ului. Actualizarea
  SDK-ului și remedierea dependențelor trebuie planificate înainte de publicare;
  nu s-a aplicat automat o migrare majoră cu `audit fix --force`.

## Structura livrată

```text
app/
  _layout.tsx
  home.tsx
  index.tsx
  language.tsx
  settings.tsx
  complaint/          # S7–S11
  documents.tsx       # S14
  emergency.tsx
  info/
assets/
  fonts/
    README.md
content/
  en/strings.json
  ne/strings.json
  ro/strings.json
  ur/strings.json
  complaint.json
  emergency.json
  index.json
  info.json
  institutions.json
scripts/
  check-content.mjs
  generate-test-locales.mjs
  check-phase2.mjs
  check-phase3.mjs
src/
  complaint/
    ComplaintProvider.tsx
    documents.ts
    pdf.ts
    routing.ts
    types.ts
  components/
    AppButton.tsx
    AppScreen.tsx
    AppText.tsx
    ChoiceCard.tsx
    ComplaintFieldInput.tsx
    ComplaintFieldsStep.tsx
    HomeAction.tsx
    LanguageGrid.tsx
    SectionCard.tsx
  config/
    content.ts
  content/
    bundledContent.ts
    contentCache.ts
    ContentProvider.tsx
    contentValidation.ts
    complaintContent.ts
  i18n/
    i18n.ts
  storage/
    preferences.ts
  theme/
    colors.ts
    fonts.ts
    spacing.ts
  types/
    content.ts
    metro.d.ts
.gitignore
app.json
babel.config.js
expo-env.d.ts
package-lock.json
package.json
README.md
tsconfig.json
```

`node_modules/`, `.expo/` și `dist/` sunt generate și nu fac parte din sursă.
