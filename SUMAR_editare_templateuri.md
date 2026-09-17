# Predare pentru continuarea editării template-urilor

Actualizat la 17 septembrie 2026. Rezumat al taskului „Editare template-uri juridice — aplicația…” (ID `01a07d5a-6f89-71c3-8d67-96706db8ed26`), confruntat cu fișierele actuale din proiect.

## De unde continuăm

Ultima cerință a lui Vadim, din 9 septembrie:

> daca bifam mai multe afirmatii, trebuie sa putem pune perioada pt fiecare. asta e valabil la plata partiala/plata lipsa.

Modificarea a fost începută, dar taskul s-a întrerupt înainte de finalizarea verificărilor. **Snapshotul de predare păstrează această lucrare neterminată; nu este o versiune stabilă.**

Primul pas al următorului task este finalizarea și verificarea perioadelor salariale separate, inclusiv remedierea regresiilor descrise mai jos. Apoi reluăm discuția despre câmpuri, ecran cu ecran, direct în conversație. Nu s-a aprobat încă redactarea juridică finală a celor șase modele.

## Decizii deja luate

- Nu mai întrebăm statutul legal al șederii/documentelor și nu îl includem în plângere. Eliminarea a vizat formularul, starea aplicației, avertismentul aferent, PDF-ul și textele aferente în toate limbile. Acest lucru nu elimină tipul actului de identificare: pașaport/TRC rămân distincte.
- Au fost eliminate patru categorii de plângere, cu încălcările, template-urile și textele aferente: imposibilitatea schimbării angajatorului, munca periculoasă, problemele cu locuința și tratamentul discriminatoriu. Nu le reintroducem automat.
- Munca efectivă nu se confundă cu existența unui contract individual de muncă. Întrebăm dacă lucrătorul **a primit o copie a contractului**, nu dacă l-a semnat sau dacă muncește „la negru”.
- CNP: obligatoriu pentru TRC, opțional pentru pașaport. Validările de identificare/contact trebuie să permită nume unice și telefoane internaționale.
- Fundația este un canal separat de contact, nu destinatarul plângerii și nu un substitut pentru depunerea la autorități.
- Text liber suplimentar la toate categoriile: opțional dacă există cel puțin o faptă bifată; obligatoriu dacă nu există nicio faptă bifată, inclusiv la „Altă problemă”.
- Conținutul juridic rămâne DRAFT până la discutarea și validarea cu colegii. Nu schimbăm automat destinațiile juridice și nu activăm emailul doar pentru că redactăm un text de lucru.
- Preferința de lucru: afișăm în conversație câmpurile ecranului analizat, cu condițiile de afișare și obligativitate, apoi decidem incremental. Inventarul anterior a fost o prezentare a implementării existente, nu o aprobare finală a fiecărui câmp.

## Categoriile rămase și faptele predefinite

| Categoria / ID | Fapte disponibile în configurația actuală |
| --- | --- |
| Salariul meu lipsește sau este greșit / `unpaid_wages` | Salariu neplătit; plată parțială; ore suplimentare neplătite; lipsa dovezii plății |
| Program, repaus și concediu / `working_time` | Program excesiv; lipsa repausului săptămânal; lipsa concediului |
| Cineva îmi reține documentele / `documents_withheld` | Pașaport reținut; permis reținut; copia contractului neprimită |
| Contractul meu a încetat în condiții incorecte / `termination` | Lipsa documentelor la încetare; demisie forțată; plata finală lipsă |
| Probleme cu agenția de recrutare / `agency` | Taxe; condiții diferite de cele promise; refuzul costurilor de întoarcere |
| Altă problemă / `other` | Fără fapte predefinite; descriere liberă obligatorie |

Acestea descriu conținutul de lucru, nu o verificare a încadrărilor juridice sau a competenței instituțiilor. Primele cinci categorii au în prezent ITM ca destinație configurată. „Altele” păstrează încă valoarea legacy `foundation` în JSON, dar codul de rutare o exclude explicit: rezultatul este lipsa unui destinatar, nu trimiterea către fundație. Pentru agenție există suprascrierea județului de rutare cu `agencyCounty`.

## Inventarul ecranelor de reluat împreună

Regulile de mai jos sunt cele intenționate în JSON și în discuție. Regresia de obligativitate descrisă ulterior afectează comportamentul actual al codului.

1. **Categoria problemei.** Selectarea uneia dintre cele șase categorii de mai sus.
2. **Date personale.** Nume; folosește un singur nume (da/nu); prenume, afișat și obligatoriu numai dacă nu folosește un singur nume; cetățenie; tip act (pașaport/TRC); serie/număr act; CNP condiționat de TRC; domiciliu; județul domiciliului. Telefon și email sunt alternative: trebuie completat cel puțin unul.
3. **Munca.** Situație (lucrează / a lucrat, dar nu mai lucrează / trebuia să lucreze, dar nu a început); ocupația sau munca promisă; începutul pentru cei care lucrează/au lucrat; încetarea numai pentru cei care nu mai lucrează; începutul promis pentru cei care nu au început. Datele sunt lună/an, pot fi necunoscute, iar precizia exactă/aproximativă este o selecție opțională în JSON. Se întreabă dacă a primit copia contractului: da/nu/nu știe.
4. **Faptele.** Bife pentru categoria aleasă; se pot bifa simultan mai multe afirmații. Cazurile descrise doar prin text liber sunt permise.
5. **Detaliile specifice.** Deocamdată numai categoria salariu are câmpuri structurate suplimentare: cele două perioade separate și suma aproximativă. Acesta este punctul ultimei modificări, încă nefinalizate.
6. **Textul liber și traducerea.** Detalii suplimentare, maximum 1.000 de caractere pentru original. Limba textului poate fi diferită de limba interfeței. Textul străin necesită o traducere română actuală înainte de generarea PDF-ului.
7. **Persoanele/firmele implicate.** Angajator, agenție/recrutor și/sau altă persoană/firmă. Pentru fiecare: nume ori alte detalii de identificare, cel puțin unul; județ obligatoriu, cu opțiune „necunoscut”; adresă opțională. CUI și registrul comerțului sunt opționale la angajator/agenție; nu există aceste două câmpuri pentru „altă persoană”. Se pot corecta participanții sugerați de categorie.
8. **Atașamente.** Opționale: maximum 5 PDF/JPEG/PNG/WEBP, 10 MiB per fișier și 15 MiB cumulat, înaintea PDF-ului generat.
9. **Revizuire și PDF.** Verificarea răspunsurilor, corectarea secțiunilor, generare și acțiuni asupra documentului. Emailul rămâne blocat pentru template-uri DRAFT sau rută nerezolvată.

## Perioadele salariale: cerință și stadiu real

În `content/complaint.json` sunt deja adăugate:

- `noSalaryPeriod`: vizibil și obligatoriu numai la bifarea `no_salary`;
- `partialPayPeriod`: vizibil și obligatoriu numai la bifarea `partial_pay`;
- `amount`: vizibil numai la `partial_pay`, intenționat opțional;
- `freeText`: păstrat pentru completări.

Au fost introduse proprietățile `visibleWhenViolationIds` și `requiredWhenViolationIds` în tipul `ComplaintField` și au fost transmise selecțiile către formular, revizuire, text liber și PDF. Dicționarele conțin etichetele pentru noile perioade. Frazele românești folosesc separat `{noSalaryPeriod}` și `{partialPayPeriod}`.

Ambele perioade sunt încă de tip `text`. Nu există o decizie de a le transforma în intervale cu selectoare lună/an. Nu s-a cerut încă adăugarea unor perioade separate pentru toate celelalte fapte.

### Probleme constatate la predarea din 17 septembrie

1. **Verificarea completă eșuează.** `npm run check:phase4` ajunge la `scripts/check-complaint-flow.mjs` și se oprește cu `Error: Unsupported content index.`. În fișierul actual `src/content/contentValidation.ts`, `validateIndex` acceptă și returnează schema **1**, în timp ce `content/index.json` declară schema **2**. În plus, validatorul actual nu mai conține validarea structurii plângerii; nu trebuie presupus că simpla schimbare a cifrei repară totul.
2. **Câmpuri opționale tratate drept obligatorii.** `isComplaintFieldRequired` apelează `matchesViolationCondition` și când `requiredWhenViolationIds` lipsește. Helperul întoarce atunci `true` (comportament potrivit pentru lipsa unei condiții de vizibilitate, dar nu pentru obligativitate). Un test izolat pe codul actual a confirmat că un câmp `required: false` fără condiții devine obligatoriu și produce `complaint.validation.required` dacă este gol. Trebuie protejate, între altele, CNP-ul la pașaport, contactele alternative și câmpurile opționale ale firmelor.
3. **Testele perioadelor trebuie completate.** Fixture-ul cu JSON-ul real din `scripts/check-complaint-flow.mjs` bifează `no_salary`, dar nu completează noul `noSalaryPeriod`. După repararea validatorului și a obligativității, trebuie actualizate fixture-urile și adăugate cazurile: numai salariu lipsă; numai plată parțială; ambele, cu perioade diferite; deselectarea unei fapte; suma lăsată goală; originalele și câmpurile ascunse absente din PDF unde trebuie.

La această predare nu s-a modificat logica aplicației pentru a ascunde sau repara aceste probleme. S-a păstrat starea lucrării și s-au adăugat documentația și avertismentul din README.

Rezultatele verificărilor executate la predare:

- TypeScript și verificările statice de conținut/Faza 2/Faza 3: trecute; 4 limbi, 339 chei, 5 categorii cu fapte, 6 template-uri DRAFT, 42 rute ITM.
- Verificarea completă `check:phase4`: **eșuată**, din cauza validatorului de schemă.
- Rulate separat, `check-phase4.mjs`, `check-translation-engine.mjs` și `check-attachments.mjs`: trecute. Aceste rezultate nu anulează eșecul verificării complete.
- Nu s-a efectuat testare pe telefon și nu s-a construit un APK nou în această predare.

## Unde se editează

- `content/complaint.json`: categorii, câmpuri, condiții, fapte, participanți și destinații.
- `content/ro/strings.json`: `complaint.tpl.*` pentru solicitarea juridică a categoriei; `complaint.v.*.ro` pentru frazele factuale românești; `complaint.f.*` pentru etichete; `complaint.pdf.*` pentru textele comune din document.
- `content/en/strings.json`, `content/ne/strings.json`, `content/ur/strings.json`: păstrarea acelorași chei. NE/UR sunt încă variante de test, nu traduceri validate.
- `src/content/contentValidation.ts`, `src/content/complaintContent.ts`, `src/types/content.ts`: schemă, validări și condiții ale câmpurilor.
- `src/components/ComplaintFieldsStep.tsx`, `app/complaint/review.tsx`, `src/complaint/freeText.ts`, `src/complaint/pdf.ts`: integrarea condițiilor în flux și document.
- `src/complaint/routing.ts`: alegerea destinatarului; `content/institutions.json`: datele instituțiilor.
- `scripts/check-complaint-flow.mjs`: regresii ale formularului și ale PDF-ului, inclusiv rularea pe JSON-ul real.
- `SPEC_aplicatie_lucratori_migranti.md`: specificația de bază; `DRAFT_categorii_plangeri.md`: schița de conținut. Deciziile ulterioare explicite ale utilizatorului trebuie păstrate și reflectate coerent în documentație.

**Atenție la activarea template-urilor:** codul actual deduce starea DRAFT din textul placeholder-ului, nu dintr-un flux separat de aprobare juridică. Înlocuirea placeholder-ului cu text obișnuit poate face modelul eligibil pentru email dacă ruta este validă. Nu echivala o primă redactare cu aprobarea juridică.

## Limite de păstrat

- Fără backend, autentificare sau transfer al datelor personale către fundație. Formularul și traducerile sunt în memorie; PDF-urile și copiile atașamentelor sunt păstrate local.
- Traducere ML Kit locală, cu modele descărcate la nevoie; alternativă manuală Google Translate Web. Nu introducem API plătit/proxy. Originalul rămâne în anexă, traducerea română în corp, marcată automat; editarea originalului invalidează traducerea.
- Nu folosim existența unui act de identificare pentru a reintroduce întrebarea despre legalitatea șederii.
- Nu validăm în bloc cele șase modele juridice și nu completăm automat alte categorii înainte de discutarea lor cu Vadim/colegii.
- Analytics Aptabase, optimizarea dimensiunii și verificările de publicare rămân pentru etapa ulterioară; nu sunt obiectivul acestui task de template-uri.

## Continuarea pe alt calculator / remote

Repo: `https://github.com/vadim-chiriac/migratie`, privat, ramura `main`. Este necesar accesul GitHub al utilizatorului. Modificările relevante sunt în acest repo, nu în vechiul worktree separat al taskului.

După clonare sau actualizare în directorul proiectului:

```sh
npm ci
npm run check:phase4
```

Al doilea pas reproduce în acest snapshot eroarea cunoscută: repararea și reverificarea sunt primul obiectiv tehnic. După remediere, pentru verificarea interfeței se poate folosi `npx expo start --go --clear`; traducerea nativă ML Kit necesită buildul nativ, nu Expo Go.

APK-ul Fazei 4 din 8 septembrie nu include modificările ulterioare ale perioadelor. Nu este inclus în Git; linkul buildului se găsește în README. Un push al sursei nu actualizează automat un APK deja instalat.

Există un workflow GitHub Pages pentru `content/` și o adresă de conținut în configurația EAS. Separarea conținutului într-un repo public rămâne o discuție distinctă; acest push nu schimbă vizibilitatea repo-ului sursă. Nu publica deliberat conținut nou înainte de repararea validării și rularea suitei complete.
