# Muncă Fără Abuz — Faza 2

Aplicație Expo (React Native + TypeScript). Livrarea curentă conține Faza 1 și
Faza 2 din SPEC §9: motorul de conținut, S1–S6, S12 minim și S13. Fluxul de
plângere rămâne pentru fazele următoare.

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
npm run check:phase1
npx expo start
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
3. rulează `npm run check:phase2` și publică schimbarea pe `main`.

Aplicația descarcă întregul set într-un staging cache și îl activează numai
dacă toate fișierele sunt valide.

Pentru verificarea compatibilității Expo și a bundle-ului Android:

```powershell
npx expo install --check
npx expo export --platform android --output-dir dist
```

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

- Acțiunile Home pentru informații și urgență sunt active. Plângerea și
  documentele rămân inactive până la fazele lor.
- Textele juridice și contactele sunt placeholder-e.
- Numerele 112 și TelVerde ANITP sunt singurele contacte de urgență reale din
  conținutul curent; restul contactelor rămân placeholder-e.
- `complaint.json` conține exclusiv datele DRAFT de test; nu există încă flux
  de formular, PDF, email, traducere sau analytics.

## Structura livrată

```text
app/
  _layout.tsx
  home.tsx
  index.tsx
  language.tsx
  settings.tsx
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
src/
  components/
    AppButton.tsx
    AppScreen.tsx
    AppText.tsx
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
