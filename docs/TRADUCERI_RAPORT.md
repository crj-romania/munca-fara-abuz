# Raport de traducere — Muncă Fără Abuz

Data: 2026-11-09. Versiunea conținutului: `2026-11-09.1`.

## Rezultat și limite

- Au fost parcurse toate cele 396 de intrări din fiecare dintre cele nouă limbi de lucru, comparând textele existente cu sursa engleză. Identificatorii tehnici au fost păstrați, nu traduși.
- Au fost traduse cele 68 de valori rămase în engleză în fiecare limbă: **612 traduceri completate**. Suplimentar, au fost corectate **193 de valori existente**, inclusiv marcajele provizorii comune.
- Revizia urmărește sensul, adresarea politicoasă, persoana I în bife, termenii consecvenți și instrucțiunile ușor de urmat. Nu reprezintă validare de către vorbitori nativi sau aviz juridic. Formulările de mai jos sunt priorități concrete pentru verificarea nativă, nu o garanție că restul textului nu mai necesită verificare.
- Fișierele `content/en/strings.json` și `content/ro/strings.json` sunt identice cu versiunile citite la începutul lucrării. Nu au fost modificate ecranele, logica aplicației, datele instituțiilor sau șabloanele juridice.
- Excepțiile explicite cerute la finalul brief-ului au fost aplicate: numai completarea comenzii `check:phase4` din `package.json` și schimbarea `contentVersion` în `content/index.json`.
- Nu s-a efectuat o probă vizuală pe Android: lungimea butoanelor, fonturile și afișarea RTL trebuie verificate separat pe dispozitiv.

| Limbă | Chei | Traduceri lipsă completate | Alte valori corectate | Total valori schimbate |
|---|---:|---:|---:|---:|
| `ne` | 396 | 68 | 22 | 90 |
| `hi` | 396 | 68 | 20 | 88 |
| `bn` | 396 | 68 | 13 | 81 |
| `si` | 396 | 68 | 16 | 84 |
| `ta` | 396 | 68 | 63 | 131 |
| `ur` | 396 | 68 | 17 | 85 |
| `ar` | 396 | 68 | 10 | 78 |
| `tl` | 396 | 68 | 22 | 90 |
| `vi` | 396 | 68 | 10 | 78 |
| **Total** | **3564** | **612** | **193** | **805** |

## Decizii comune

- Bifele descriu situația lucrătorului, prin persoana I sau prin posesivele „meu/mi”. Au fost corectate și bifele despre condițiile promise și costurile revenirii care sunau ca afirmații generale despre agenție.
- Categoria despre încetarea contractului nu mai introduce, prin traducere, o concluzie că încetarea este ilegală sau nedreaptă. Textul descrie o problemă cu încetarea, ca în engleză.
- Eticheta `complaint.v.termination.ended_without_consent` urmează sensul englezesc cu **sau**. Fraza omonimă cu sufixul `.ro` urmează separat sursa engleză cu **și**; neconcordanța surselor este semnalată mai jos, nu reparată în `en`/`ro`.
- Toate marcajele vizibile provizorii au fost localizate, inclusiv `common.placeholder`. Nu au fost traduse valorile tehnice delimitate prin `<…>`.
- În frazele cu sufixul `.ro` au fost păstrate și variabilele cu o singură pereche de acolade: `{period}`, `{partialPayPeriod}`, `{amount}`. Acestea trebuie protejate chiar dacă verificatorul existent urmărește doar `{{…}}`.
- Au fost păstrate numele aplicației, mărcile, acronimele, formatele și unitățile tehnice. „Sent” rămâne numele folderului de email. Sumele în lei sunt identificate ca monedă românească unde transliterarea putea fi ambiguă.
- Denumirile ITM, IGI și CNCD sunt traduse și urmate de acronimul românesc în paranteză. În tagalog nu mai sunt denumiri întregi în engleză.
- Au fost verificate trimiterile la butoanele Google Translate, „Nu știu”, Setări și Documentele mele. În nepaleză și sinhala titlul confirmării de ștergere este chiar eticheta butonului, fără reformularea verbului; corpul dialogului explică efectul definitiv.
- „Annex” pentru textul original este deosebit, unde era necesar, de fișierele atașate separat. Confirmările de ștergere explică și copiile asociate PDF-ului, fără să sugereze că ar fi șterse fișierele originale sau copiile deja trimise.

## Nepaleză — `ne`

**Terminologie și registru.** Se păstrează `उजुरी` pentru plângere, `रोजगारदाता` pentru angajator, `भर्ना एजेन्सी` pentru agenție, `फाउन्डेसन` pentru fundație, `आवास अनुमति` pentru permis și `संलग्न फाइलहरू` pentru atașamente. Adresarea este cu `तपाईं` și verbe politicoase. Meniurile rămân `मेरा कागजातहरू` și `सेटिङ`. Pentru salvarea unui fișier este folosit consecvent împrumutul `सेभ`, evitând confuzia dintre „salvat” și „sigur/protejat”. Lunile sunt cele gregoriene; nu au fost înlocuite cu luni ale calendarului nepalez.

**De verificat cu un vorbitor nativ — 3 formulări:**
1. `complaint.f.idType.trc`: `आवास अनुमति / TRC` — cât de cunoscut este „आवास अनुमति” pentru permisul românesc, față de o formulare cu „बसोबास”.
2. `complaint.f.addressCounty`: `बसोबास गरेको काउन्टी` — dacă transliterarea pentru județ are nevoie de o explicație pentru lucrătorii nou-veniți.
3. `complaint.pdf.originalAnnex`: `अनुसूची — अनुवादअघिको मूल पाठ` — dacă „अनुसूची” este suficient de accesibil pentru anexa documentului.

## Hindi — `hi`

**Terminologie și registru.** Se păstrează `शिकायत`, `नियोक्ता`, `भर्ती एजेंसी`, `फ़ाउंडेशन`, `निवास परमिट` și `संलग्न फ़ाइलें`. Adresarea este cu `आप` și imperative politicoase. „Mुक्त पाठ/तैयार तथ्य” au fost înlocuite, în instrucțiunile relevante, cu descrieri ale textului scris în propriile cuvinte și ale declarațiilor deja oferite. Statisticile sunt explicate ca date trimise fără dezvăluirea identității, nu ca „numărători anonime”. Răspunsurile despre angajarea actuală/anterioară folosesc formulări cu `मेरी नौकरी`, fără acord masculin/feminin al vorbitorului.

**De verificat cu un vorbitor nativ — 3 formulări:**
1. `complaint.f.addressCounty`: `निवास का काउंटी` — accesibilitatea termenului pentru județ.
2. `inst.igi`: `आप्रवासन महानिरीक्षणालय (IGI)` — denumire instituțională corectă, dar posibil dificilă la nivel A2–B1.
3. `complaint.pdf.originalAnnex`: `परिशिष्ट — अनुवाद से पहले का मूल पाठ` — dacă „परिशिष्ट” trebuie explicat mai simplu în context.

## Bengali — `bn`

**Terminologie și registru.** Se păstrează `অভিযোগ`, `নিয়োগকর্তা`, `নিয়োগ এজেন্সি`, `ফাউন্ডেশন`, `বসবাসের অনুমতিপত্র` și `সংযুক্তি`. Adresarea este cu `আপনি`. Categoria despre salariu a fost reparată gramatical; categoria despre încetare nu mai declară automat o nedreptate. „Informație gata făcută” și „scriere liberă” au fost înlocuite cu declarații oferite anterior și scriere în propriile cuvinte. Confirmarea ștergerii folosește aceeași formă verbală ca butonul `সব মুছুন`.

**De verificat cu un vorbitor nativ — 3 formulări:**
1. `complaint.f.addressCounty`: `বসবাসের কাউন্টি` — înțelegerea județului românesc.
2. `inst.igi`: `অভিবাসন সাধারণ পরিদর্শন দপ্তর (IGI)` — naturalețea traducerii instituției.
3. `complaint.v.common.no_contract_copy.ro`: `ব্যক্তিগত চাকরির চুক্তি` — să nu fie înțeles ca un contract „privat/confidențial”, ci ca un contract individual de muncă.

## Sinhala — `si`

**Terminologie și registru.** Se păstrează `පැමිණිල්ල`, `සේවා යෝජකයා`, `බඳවා ගැනීමේ ආයතනය`, `පදනම`, `පදිංචි බලපත්‍රය` și `ඇමුණුම්`. Adresarea este cu `ඔබ`; comenzile au forma politicoasă obișnuită. Textul de confidențialitate a fost refăcut pentru acord gramatical și pentru a nu alătura „date” și „fundație” într-o expresie care putea fi citită ca „bază de date”. CNCD este explicit despre tratament discriminatoriu, nu despre „schimbări”. `උපග්‍රන්ථය` denumește anexa textului original, spre deosebire de fișierele atașate.

**De verificat cu un vorbitor nativ — 3 formulări:**
1. `complaint.f.addressCounty`: `පදිංචි ප්‍රාන්තය (County)` — „ප්‍රාන්තය” poate sugera provincie; trebuie ales termenul cel mai clar pentru județ, fără a-l confunda cu o unitate locală din Sri Lanka.
2. `complaint.pdf.originalAnnex`: `උපග්‍රන්ථය — පරිවර්තනයට පෙර මුල් පෙළ` — accesibilitatea termenului pentru anexă.
3. `complaint.pdf.draftBanner`: `නීතිමය ආකෘතිය ... තහවුරු කර නැත` — dacă avertizarea transmite clar „șablon juridic nevalidat”, fără să pară o respingere a plângerii.

## Tamilă — `ta`

**Terminologie și registru.** Se păstrează `புகார்`, `முதலாளி`, `அறக்கட்டளை`, `வசிப்பிட அனுமதி` și `இணைப்புகள்`. Pentru agenție se folosește consecvent **`ஆட்சேர்ப்பு நிறுவனம்`**, iar pentru recrutorul individual `ஆட்சேர்ப்பாளர்`; vechiul `முகவர்` putea transforma o agenție în persoană fizică. Adresarea este cu `நீங்கள்`, iar comenzile au fost uniformizate în forma politicoasă cu `-வும்`, inclusiv eticheta Google Translate și citarea ei. „Inspectorat” nu mai este tradus prin `ஆய்வகம்` („laborator”), ci prin `ஆய்வு அலுவலகம்`. „Date sensibile” nu mai sugerează capacitate de percepție, ci informații personale importante. `பின்னிணைப்பு` distinge anexa textului de atașamente.

**De verificat cu un vorbitor nativ — 4 formulări:**
1. `inst.itm`: `பிராந்திய தொழிலாளர் ஆய்வு அலுவலகம் (ITM)` — denumirea instituțională cea mai firească pentru publicul tamil din România.
2. `complaint.party.agency`: `ஆட்சேர்ப்பு நிறுவனம் / ஆட்சேர்ப்பாளர்` — dacă terminologia funcționează atât pentru vorbitori din Sri Lanka, cât și din India.
3. `complaint.pdf.originalAnnex`: `பின்னிணைப்பு — மொழிபெயர்ப்புக்கு முன் இருந்த மூல உரை` — dacă „பின்னிணைப்பு” este înțeles fără explicație.
4. `complaint.v.termination.ended_without_consent` — verificarea lungimii și clarității bifei după păstrarea distincției „nu am știut sau nu am fost de acord”.

## Urdu — `ur`

**Terminologie și registru.** Se păstrează `شکایت`, `آجر`, `بھرتی ایجنسی`, `فاؤنڈیشن`, `رہائشی اجازت نامہ` și `منسلکات`. `میرے کاغذات` rămâne denumirea simplă a meniului de documente. Adresarea este cu `آپ`; răspunsurile despre locul de muncă actual/trecut evită, unde a fost posibil, acordul de gen. Pentru statistici se explică lipsa identificării prin `شناخت ظاہر کیے بغیر`, în locul unei formulări nefirești despre „numărătoare anonimă”. Nu au fost introduse caractere invizibile de control al direcției.

**De verificat cu un vorbitor nativ — 4 formulări:**
1. `complaint.f.addressCounty`: `رہائش کی کاؤنٹی` — înțelegerea termenului pentru județ.
2. `emergency.contact.anitp.description`: `انسانی اسمگلنگ` — termen uzual, dar trebuie verificat că publicul înțelege traficul/exploatarea persoanelor, nu doar trecerea ilegală a frontierei.
3. `complaint.pdf.originalAnnex`: `ضمیمہ — ترجمے سے پہلے کا اصل متن` — nivelul de familiaritate cu termenul pentru anexă.
4. `complaint.v.documents.permit_kept.employer.ro` — naturalețea acordului într-o frază care poate desemna fie permisul, fie alt document de identitate.

## Arabă — `ar`

**Terminologie și registru.** Se păstrează `شكوى`, `صاحب العمل`, `وكالة التوظيف`, `المؤسسة`, `تصريح الإقامة` și `المرفقات`. Araba este standard, cu masculin generic în adresare; nu s-a introdus dialect regional. Bifele folosesc persoana I sau posesivele acesteia. S-au simplificat descrierea încetării, instrucțiunea despre numere internaționale și confirmarea ștergerii copiilor asociate. Anexa este `ملحق`. Acronimele latine rămân latine și nu sunt înconjurate de caractere invizibile de control al direcției.

**De verificat cu un vorbitor nativ — 3 formulări:**
1. `complaint.f.addressCounty`: `المقاطعة (County) التي تسكن فيها` — dacă termenul pentru județ este clar pentru lucrători din țări arabe diferite.
2. `complaint.pdf.petitioner`: `بيانات مقدم الشكوى` — accesibilitatea etichetei față de o formulare și mai simplă.
3. `complaint.v.documents.permit_kept.ro` și variantele sale — acordul și pronumele când obiectul poate fi permisul sau o altă وثيقة; verificare lingvistică și de lizibilitate RTL pe telefon.

## Tagalog — `tl`

**Terminologie și registru.** Se păstrează `reklamo`, `employer`, `recruitment agency`, `foundation` și `attachment`, împrumuturi uzuale în aplicații. Adresarea este cu `ikaw/mo/iyong`, fără „po”. Eticheta permisului devine `Permiso sa paninirahan / TRC`, iar CNP este explicat în tagalog, nu lăsat ca propoziție englezească. Au fost corectate construcții precum `Mga taong at organisasyong`, formulările despre date aproximative și referințele neclare la sfârșitul contractului. Pentru anexă, `kalakip` este însoțit de explicația „text original”, spre deosebire de fișierele `attachment`.

**De verificat cu un vorbitor nativ — 3 formulări:**
1. `inst.itm`: `Inspektorat ng Paggawa sa Teritoryo (ITM)` — denumire tradusă, dar de verificat naturalețea administrativă.
2. `complaint.f.addressCounty`: `County ng tirahan` — împrumutul „county” și eventuala nevoie de explicație pentru județ.
3. `complaint.pdf.originalAnnex`: `Kalakip — orihinal na teksto bago isalin` — dacă se distinge suficient de atașamentele separate.

## Vietnameză — `vi`

**Terminologie și registru.** Se păstrează `khiếu nại`, `người sử dụng lao động`, `công ty môi giới tuyển dụng`, `quỹ`, `giấy phép cư trú` și `tệp đính kèm`. Adresarea este cu `bạn`. Etichetele persoanelor sau companiilor suplimentare nu mai folosesc „bên kia”, care putea suna adversarial. Categoria despre încetarea contractului nu mai declară că încetarea a fost nelegală. Anexa textului este `phụ lục`. `Email` rămâne împrumutul uzual din interfață.

**De verificat cu un vorbitor nativ — 3 formulări:**
1. `complaint.f.addressCounty`: `Hạt (county) nơi ở` — „hạt” poate fi mai puțin familiar decât o explicație a județului românesc.
2. `inst.igi`: `Tổng Thanh tra Nhập cư (IGI)` — să fie înțeles ca instituție, nu ca titlul persoanei care o conduce.
3. `complaint.v.common.no_contract_copy.ro`: `hợp đồng lao động cá nhân` — să fie înțeles ca un contract individual de muncă, fără sensul de document confidențial.

## Allowlist: ce rămâne intenționat în engleză

- Pentru toate limbile: `app.name` și `contact.whatsapp`, nume protejate.
- Pentru tagalog: `home.header` = Home; `home.emergency` și `emergency.title` = Emergency; `home.settings` și `settings.title` = Settings; `contact.email` = Email; `inst.foundation` = Foundation; `complaint.f.email` = Email address; `complaint.party.employer` = Employer. Sunt etichete/împrumuturi curente, iar textele din jur sunt în tagalog.
- Pentru vietnameză: `contact.email` = Email, termen uzual.
- Au fost eliminate excepțiile pentru `common.placeholder` și, în tagalog, pentru `complaint.f.idType.trc` și `complaint.f.cnp`: acum au traduceri reale. Nu au fost adăugate excepții pentru a ascunde texte netraduse.

## Probleme observate în sursele `en` / `ro` — necorectate

1. **Prioritate mare: „sau” în bifă, „și” în afirmația PDF.** `complaint.v.termination.ended_without_consent` spune în engleză „without my knowledge or agreement”, iar în română „fără știrea sau acordul meu”. Varianta cu sufixul `.ro` spune în ambele surse „fără știrea și fără acordul meu”. Bifarea unei situații cu o singură condiție poate produce o afirmație mai puternică în PDF. Este necesară o decizie de produs/juridică asupra sursei, urmată de actualizarea simultană a tuturor limbilor.
2. **Texte care par rămase din faze anterioare.** `complaint.category.translationRequired` și `complaint.violations.requiredPhase3` anunță că textul liber/traducerea vor veni ulterior, deși sursele conțin deja ecranele pentru text suplimentar și traducere. Trebuie verificat dacă aceste mesaje mai pot fi afișate; nu am schimbat promisiunea sursei în traduceri.
3. **Rezumat de confidențialitate prea general.** `settings.privacy.summary` spune că datele introduse rămân pe telefon; `complaint.text.googlePrivacy` explică separat că folosirea Google Translate trimite textul la Google. Nu este neapărat o contradicție, deoarece există o acțiune explicită a utilizatorului, dar rezumatul poate fi înțeles ca o garanție absolută. Recomand clarificarea excepției în surse, nu o schimbare unilaterală a traducerilor.
4. **Avertizarea despre dimensiunea fișierelor poate fi citită incomplet.** `attachment.limits` numește limita de 10 MB numai pentru PDF, iar `attachment.error.tooLarge` o aplică fiecărui atașament. De clarificat în surse dacă o imagine după prelucrare poate atinge această limită; nu am modificat limitele sau sensul numeric al textelor.

## Verificări tehnice

- `npm run check:translations`: **OK** pentru toate cele nouă limbi; mesaj final `All languages are real text.`
- `npm run check:phase4`: **NU trece integral**. Se oprește în `npm run typecheck`, cu cod de ieșire 2, înainte să ajungă la verificările de conținut. Erorile sunt în cod/dependențe din afara domeniului acestei lucrări; nu au fost mascate prin schimbarea verificatoarelor și nu au fost corectate prin modificări nepermise ale aplicației.
- Controalele care urmau după TypeScript au fost rulate separat: **toate OK** — `check-content.mjs`, `check-phase2.mjs`, `check-phase3.mjs`, `check-complaint-flow.mjs`, `check-phase4.mjs`, `check-translation-engine.mjs`, `check-attachments.mjs`. Ele confirmă integrarea conținutului, fluxul plângerii, traducerea și atașamentele, dar nu înlocuiesc un typecheck reușit. Cele șase șabloane juridice sunt în continuare marcate draft/test, conform stării existente.
- Audit suplimentar în memorie: **OK** — aceleași 396 de chei, în ordinea din `en`; JSON valid, UTF-8 fără BOM, indentare de două spații; variabile simple și duble neschimbate; identificatori tehnici neschimbați; termeni protejați păstrați; două separatoare de paragraf `\n\n` în fiecare email; etichete citate conforme; fără controale invizibile de direcție în `ur`/`ar`; fără excepții allowlist devenite inutile.
- Sursele `en` și `ro` au fost comparate cu copiile citite la început și sunt neschimbate. Modificările preexistente din proiect nu au fost resetate sau incluse ca intervenții ale acestei lucrări.
- Verificatoarele tehnice nu măsoară corectitudinea idiomatică sau potrivirea textelor pe ecran. Verificarea nativă și proba pe Android rămân necesare înaintea publicării pentru lucrători.

### Erorile care blochează `check:phase4`

| Fișier și poziție | Eroare TypeScript |
|---|---|
| `app/complaint/preview.tsx:1:31` | TS2307: nu este găsit modulul `expo-router/react-navigation` sau tipurile sale. |
| `src/analytics/analytics.ts:1:38` | TS2307: nu este găsit modulul `@aptabase/react-native` sau tipurile sale. |
| `src/complaint/attachments.ts:3:46` | TS2307: nu este găsit modulul `expo-image-manipulator` sau tipurile sale. |
| `src/complaint/attachments.ts:4:30` | TS2307: nu este găsit modulul `expo-image-picker` sau tipurile sale. |
| `src/components/LanguageGrid.tsx:124:5` | TS2698: „Spread types may only be created from object types.” |

Nu au fost instalate/actualizate dependențe și nu a fost modificat `package-lock.json`. După remedierea separată a acestor probleme, trebuie rerulat `npm run check:phase4`; verificarea traducerilor va fi executată automat la sfârșitul lui.

## Pentru modificările următoare

Orice cheie nouă sau modificată în `en` ori `ro` trebuie actualizată în toate limbile în aceeași modificare. O limbă nouă trebuie înregistrată în `content/index.json`, cu `mt` potrivit suportului ML Kit. Verificarea traducerilor este acum inclusă permanent la sfârșitul `check:phase4`.

## Runda 2 — Informații

Data: 2026-11-14. Domeniu: cele 202 de chei noi `info.*`, în nouă limbi; 1.818 valori de tradus. Fișierele au acum 582 de chei. Celelalte 380 de valori din fiecare limbă trebuie păstrate fără modificări.

### Reguli și verificare independentă

Traducerea pornește din engleză, cu verificare pe aceeași cheie în română. La diferențe de sens se urmează româna, conform brief-ului. Nu se completează sau corectează independent conținutul juridic după alte surse. Limbajul simplu nu justifică eliminarea excepțiilor, condițiilor, termenelor sau modalităților precum „poate”, „de regulă”, „cel mult”, „cel puțin” și „din proprie inițiativă”.

Cu aprobarea utilizatorului, traducerile sunt lucrate cu agenți secundari, succesiv, câte o limbă. După fiecare limbă se rulează verificatorul individual, apoi un audit separat de domeniu, structură, numere și termeni protejați, înainte de trecerea la următoarea limbă. Verificările automate nu înlocuiesc verificarea nativă sau validarea juridică.

Auditul urmărește: numai cele 202 de valori permise; cheile și ordinea din `en`; UTF-8 fără BOM și indentare de două spații; tipul original de sfârșit de rând (CRLF pentru `ne` și `ur`, LF pentru celelalte); structura rândurilor și bulinelor; variabilele; cifrele și termenele; monedele `lei`/`euro`; identificatorii, emailurile, telefoanele și termenii românești protejați; eticheta citată `home.problem`; lipsa controalelor invizibile de direcție în arabă și urdu. Sursele `en`, `ro` și `content/info.json` sunt comparate cu copiile de la începutul rundei.

### Diferențe și ambiguități în surse

1. **Diferență EN–RO, urmată româna:** `info.job_loss.after_deadline.body` spune în engleză „lose your status because of your employer”, dar în română „rămâi fără loc de muncă din cauza angajatorului”. În traduceri se păstrează pierderea locului de muncă; nu se înlocuiește cu pierderea statutului de ședere.
2. **Ambiguitate engleză, lămurită de română:** `info.complaints.union_strike.body`, „Taking part in a strike is free”, înseamnă participare voluntară/liberă, nu participare gratuită. Se păstrează și condiția participării legale la grevă.
3. **Neconcordanță internă în ambele surse:** `info.job_loss.how_long_stay.step1` cere compararea datei încetării contractului cu data expirării permisului și alegerea primei date. Corpul explică însă comparația dintre limita de 90 de zile de la înregistrarea încetării și expirarea permisului. Pasul este tradus fidel, nu recalculat sau corectat unilateral. Este o prioritate pentru revizuirea juridică a sursei, fiindcă poate sugera pierderea imediată a termenului.
4. **Punctul de pornire al termenului:** `info.change_job.resignation.body` vorbește despre 90 de zile din ziua încetării, iar `info.job_loss.how_long_stay.body` despre înregistrarea încetării. Nu s-au uniformizat prin traducere cele două formulări.
5. **Stilul pașilor și păstrarea modalității:** unele surse `step*` încep cu o condiție sau cu „You can / Poți”, de exemplu `info.change_job.first_6_months.step3` și `info.complaints.evidence.step3`. Se preferă construcții practice cu verb, dar o posibilitate nu trebuie transformată într-o obligație doar pentru a obține imperativul.

Sursele și temeiurile juridice din `content/info.json` nu se modifică. Observațiile sunt despre coerența textelor furnizate, nu constituie o reevaluare juridică independentă a OUG nr. 32/2026.

### Rezultatele rundei 2

Toate cele nouă limbi au fost traduse și verificate individual, în ordine: `ne`, `hi`, `bn`, `si`, `ta`, `ur`, `ar`, `tl`, `vi`. Rezultat: **202/202 pe limbă, 1.818 valori traduse în total**. Celelalte **3.420 de valori** (380 pe limbă) sunt neschimbate. Versiunea conținutului este **`2026-11-14.2`**.

**Dependențe și TypeScript.** Conform noului brief, s-a rulat `npm install` (cu cache temporar, fără audit/fund). Instalarea a adăugat 53, a eliminat 175 și a schimbat 150 de pachete în `node_modules`. `package.json` și `package-lock.json` au rămas identice cu copiile de la începutul rundei. `npm run typecheck` trece acum, fără modificări în codul aplicației. Cele cinci erori consemnate în runda 1 nu se mai reproduc după instalare.

### Nepaleză — `ne` — runda 2

202/202 valori traduse; verificatorul individual și auditul independent: OK. Cele 380 de valori anterioare sunt neschimbate; CRLF păstrat. Fără excepții noi în allowlist. Cele două diferențe din comparația numerică sunt doar scrierea în cifre a lui „two” și „one year”: 2 oferte și cel puțin 1 an, fără schimbarea valorilor.

| Termen românesc | Echivalent ales |
|---|---|
| cerere unică | एकल आवेदन |
| permis unic | एकल अनुमति |
| aviz de muncă | काम गर्ने अनुमति (aviz de muncă) |
| agenție de plasare autorizată | अधिकारप्राप्त भर्ना एजेन्सी |
| contract de plasare | काममा लगाउने करार |
| angajator înregistrat / autorizat | दर्ता भएको रोजगारदाता / अधिकारप्राप्त रोजगारदाता |
| decizie de încetare | करार अन्त्य गर्ने निर्णय |
| acordul părților | दुवै पक्षको सहमति |
| demisie / preaviz | राजीनामा / पूर्वसूचना अवधि |
| fluturaș de salariu | तलब पर्ची |
| ore suplimentare / spor | अतिरिक्त काम / थप रकम |
| decizie de returnare | फर्काउने निर्णय |
| ajutor public judiciar | राज्यबाट कानुनी सहायता |
| lista ocupațiilor deficitare | कामदार अभाव भएका पेसाहरूको सूची |
| reîntregirea familiei | परिवार पुनर्मिलन |
| număr de înregistrare | दर्ता नम्बर |
| perioadă de recuperare și reflecție | पुनः स्वस्थ हुने र सोचविचार गर्ने अवधि |

Pentru verificare nativă — 7 formulări:
1. `info.new_law.single_application.body`: `एकल अनुमति` — să fie clar că este permisul comun de ședere și muncă.
2. `info.new_law.check_agency.body`: `अधिकारप्राप्त भर्ना एजेन्सी` — agenție autorizată, nu doar una înregistrată.
3. `info.contract_pay.contracts_needed.body`: `काममा लगाउने करार` — contractul de plasare, distinct de contractul individual de muncă.
4. `info.change_job.resignation.body`: `पूर्वसूचना अवधि` — accesibilitatea termenului pentru preaviz.
5. `info.job_loss.return_decision.body`: `फर्काउने निर्णय` — decizie administrativă de returnare, nu o recomandare de a reveni acasă.
6. `info.work_time.overtime.body`: `नियन्त्रणबाहिरको असाधारण परिस्थिति` — echivalența cu forța majoră fără a extinde excepția.
7. `info.complaints.trafficking.body`: `पुनः स्वस्थ हुने र सोचविचार गर्ने अवधि` — denumirea perioadei de protecție pentru victime.

S-au urmat româna la pierderea locului de muncă și sensul voluntar al grevei. Ambiguitățile termenului de 90 de zile rămân semnalate în secțiunea comună, fără corectarea unilaterală a sursei.

### Hindi — `hi`

Modificat numai `content/hi/strings.json`: **202 valori traduse**, celelalte **380 păstrate integral**, aceeași ordine a cheilor.

| Termen | Alegere hindi |
|---|---|
| cerere unică | एकल आवेदन |
| permis unic | एकल परमिट |
| aviz de muncă | कार्य परमिट (aviz de muncă) |
| agenție de plasare (autorizată) | भर्ती एजेंसी / अधिकृत भर्ती एजेंसी |
| contract de plasare | नौकरी दिलाने का अनुबंध |
| angajator înregistrat / autorizat | पंजीकृत नियोक्ता / अधिकृत नियोक्ता |
| decizie de încetare a contractului | अनुबंध समाप्त करने का निर्णय |
| încetare prin acordul părților | आपसी सहमति से अनुबंध समाप्त करना |
| demisie / preaviz | इस्तीफ़ा / नोटिस अवधि |
| fluturaș de salariu | वेतन पर्ची |
| ore suplimentare / spor | अतिरिक्त काम के घंटे / अतिरिक्त भुगतान |
| decizie de returnare | वापस भेजने का निर्णय |
| ajutor public judiciar | सरकारी कानूनी सहायता |
| lista ocupațiilor deficitare | कामगारों की कमी वाले पेशों की सूची |
| reîntregirea familiei | परिवार का पुनर्मिलन |
| număr de înregistrare | पंजीकरण संख्या |
| perioadă de recuperare și reflecție | उबरने और विचार करने की अवधि |

**Pentru verificare nativă — 5 formulări:**

- `info.contract_pay.contracts_needed.body`: „नौकरी दिलाने का अनुबंध” — claritatea contractului de plasare între trei părți.
- `info.work_time.overtime.body`: „ऐसी असाधारण स्थिति … जो किसी के नियंत्रण में न हो” — echivalența accesibilă pentru forță majoră.
- `info.change_job.resignation.body`: „बिना नोटिस अवधि के इस्तीफ़ा” — claritatea demisiei fără preaviz.
- `info.complaints.trafficking.body`: „उबरने और विचार करने की अवधि” — naturalețea termenului juridic.
- `info.health_family.family.body`: „परिवार के पुनर्मिलन का परमिट” — înțelegerea permisului pentru reîntregirea familiei.

**Surse:** La `info.job_loss.after_deadline.body` am urmat RO: pierderea **locului de muncă**, nu a statutului; pentru EN „lawyer” / RO „jurist” am folosit „कानूनी सलाहकार”. La `info.complaints.union_strike.body`, participarea este voluntară. Am păstrat neconcordanța dintre `info.job_loss.how_long_stay.step1` și corpul răspunsului, precum și calcularea diferită a celor 90 de zile în `info.change_job.resignation.body`. Formulările „august 2026” și „8 august 2026” rămân distincte. Identificatorul este exact `OUG nr. 32/2026`.

**Verificări:** `node scripts/check-translations.mjs hi` — **OK**, 0 valori identice cu engleza, 0 alte probleme. Audit propriu **OK** pentru numere, date, `24/7`, variabile, paragrafe, buline, termeni protejați și denumiri instituționale. UTF-8 fără BOM, indentare de 2 spații, **LF păstrat**; fără normalizare EOL și fără excepții allowlist noi.

### Bengali — `bn`

**Fișier:** `content/bn/strings.json`. Traduse exact **202 valori**; cele 380 de valori existente și ordinea cheilor sunt intacte.

**Glosar nou — 17 rânduri:**

| Română | Bengali |
|---|---|
| cerere unică | একক আবেদন |
| permis unic | একক অনুমতিপত্র |
| aviz de muncă | কাজের অনুমতিপত্র (aviz de muncă) |
| agenție de plasare autorizată | অনুমোদিত নিয়োগ এজেন্সি |
| contract de plasare | চাকরিতে নিয়োগের চুক্তি |
| angajator înregistrat / autorizat | নিবন্ধিত নিয়োগকর্তা / অনুমোদিত নিয়োগকর্তা |
| decizie de încetare a contractului | চুক্তি শেষ করার সিদ্ধান্ত |
| încetare prin acordul părților | দুই পক্ষের সম্মতিতে চুক্তি শেষ করা |
| demisie / preaviz | পদত্যাগ / নোটিশের সময়কাল |
| fluturaș de salariu | বেতনের হিসাবপত্র |
| ore suplimentare / spor | অতিরিক্ত কাজের সময় / বাড়তি বেতন |
| decizie de returnare | দেশে ফেরত পাঠানোর সিদ্ধান্ত |
| ajutor public judiciar | সরকারি আইনি সহায়তা |
| lista ocupațiilor deficitare | শ্রমিকের ঘাটতি আছে এমন পেশার তালিকা |
| reîntregirea familiei | পরিবারের পুনর্মিলন |
| număr de înregistrare | নিবন্ধন নম্বর |
| perioadă de recuperare și reflecție | সুস্থ হয়ে ওঠা ও ভেবে দেখার সময় |

**De verificat cu un vorbitor nativ — 5 formulări:**

1. `info.contract_pay.contracts_needed.body`: `চাকরিতে নিয়োগের চুক্তি` — distincția față de contractul individual de muncă.
2. `info.work_time.overtime.body`: `নিয়ন্ত্রণের বাইরে অনিবার্য পরিস্থিতি` — exprimarea simplă a forței majore.
3. `info.job_loss.return_decision.body`: `আপিল আদালতে তা চ্যালেঞ্জ করতে পারেন` — naturalețea formulării despre contestare.
4. `info.complaints.where_complain.body`: `সরকারি কৌঁসুলির দপ্তর` — înțelegerea denumirii Parchetului.
5. `info.complaints.trafficking.body`: `সুস্থ হয়ে ওঠা ও ভেবে দেখার সময়` — claritatea termenului juridic.

**Diferențe și ambiguități ale sursei:**

- `info.job_loss.after_deadline.body`: „lose your status” diferă de română; traducerea spune **pierderea locului de muncă**, conform `ro`.
- `info.complaints.union_strike.body`: „free” este redat ca participare voluntară, conform „liberă”.
- `info.job_loss.how_long_stay.step1`: păstrată comparația datelor din sursă, fără adăugarea celor 90 de zile explicate în corp.
- `info.change_job.resignation.body`: păstrate cele 90 de zile de la încetare; `how_long_stay.body` le calculează de la înregistrarea încetării.
- Păstrate diferențele dintre „înainte de august 2026” și data specifică „8 august 2026”. Denumirea actului este exact `OUG nr. 32/2026`.

**Validare:** `node scripts/check-translations.mjs bn` → **OK**, 0 valori identice cu engleza, 0 alte probleme. Verificate cifrele și datele, `24/7`, tokenurile, textele protejate, rândurile noi și bulinele. Fără caractere de control bidi și fără modificări în allowlist.

**Format:** UTF-8 fără BOM, indentare de 2 spații, **LF păstrat**; `apply_patch` nu a schimbat tipul EOL.

### Sinhala — `si`

Modificat doar `content/si/strings.json`: exact **202 valori traduse**, celelalte **380 păstrate**, fără schimbarea ordinii cheilor.

**Validare:** `node scripts/check-translations.mjs si` → **OK**, 0 valori identice cu engleza, 0 alte probleme. Verificate cifrele, datele, textele protejate, variabilele, paragrafele și bulinele. Fără modificări necesare în allowlist.

**Format:** UTF-8 fără BOM, indentare de 2 spații, LF păstrat. `apply_patch` nu a schimbat tipul EOL. Fără caractere bidi de control.

**Glosar — toate cele 17 poziții:**

| Română | Sinhala |
|---|---|
| cerere unică | ඒකාබද්ධ අයදුම්පත |
| permis unic | ඒකාබද්ධ බලපත්‍රය |
| aviz de muncă | වැඩ බලපත්‍රය (aviz de muncă) |
| agenție de plasare autorizată | අවසර ලත් බඳවා ගැනීමේ ආයතනය |
| contract de plasare | රැකියාවට යොමු කිරීමේ ගිවිසුම |
| angajator înregistrat / autorizat | ලියාපදිංචි සේවා යෝජකයා / අවසර ලත් සේවා යෝජකයා |
| decizie de încetare a contractului | ගිවිසුම අවසන් කිරීමේ තීරණය |
| încetare prin acordul părților | දෙපාර්ශ්වයේ එකඟතාවෙන් ගිවිසුම අවසන් කිරීම |
| demisie / preaviz | ඉල්ලා අස්වීම / පෙර දැනුම් දීමේ කාලය |
| fluturaș de salariu | වැටුප් පත්‍රිකාව |
| ore suplimentare / spor | අතිකාල / අමතර දීමනාව |
| decizie de returnare | ආපසු යැවීමේ තීරණය |
| ajutor public judiciar | රජයේ නීති ආධාර |
| lista ocupațiilor deficitare | සේවක හිඟයක් ඇති රැකියා ලැයිස්තුව |
| reîntregirea familiei | පවුල නැවත එක් කිරීම |
| număr de înregistrare | ලියාපදිංචි අංකය |
| perioadă de recuperare și reflecție | සුවය ලැබීමට සහ සිතා බැලීමට දෙන කාලය |

**Pentru verificare nativă — 7 formulări:**

- `info.new_law.single_application.body`: `ඒකාබද්ධ අයදුම්පත` / `ඒකාබද්ධ බලපත්‍රය` — naturalețea și diferențierea celor două documente.
- `info.contract_pay.contracts_needed.body`: `රැකියාවට යොමු කිරීමේ ගිවිසුම` — claritatea termenului pentru contractul de plasare.
- `info.work_time.overtime.body`: `පාලනය කළ නොහැකි අනිවාර්ය අවස්ථා` — echivalența cu „forță majoră”.
- `info.documents.residence_permit.body`: `සෘතුමය සේවකයන්` — accesibilitatea termenului „lucrători sezonieri”.
- `info.job_loss.return_decision.body`: `රජයේ නීති ආධාර` — înțelegerea ca ajutor juridic finanțat de stat.
- `info.work_time.second_job.body`: `සේවක හිඟයක් ඇති රැකියා ලැයිස්තුව` — naturalețea denumirii listei ocupațiilor deficitare.
- `info.complaints.trafficking.body`: `සුවය ලැබීමට සහ සිතා බැලීමට` — sensul juridic al recuperării și reflecției.

**Observații asupra surselor:**

- `info.job_loss.after_deadline.body`: EN spune pierderea statutului; RO spune pierderea **locului de muncă**. Traducerea urmează RO.
- `info.job_loss.how_long_stay.step1`: indică data cea mai apropiată dintre încetarea contractului și expirarea permisului; corpul explică însă înregistrarea încetării **+90 de zile** versus expirarea permisului. Formulările au fost păstrate, fără corectare.
- `info.change_job.resignation.body`: cele 90 de zile pornesc de la încetarea contractului, spre deosebire de înregistrarea încetării din `job_loss`. Distincția sursei este păstrată.
- `info.complaints.union_strike.body`: „free” a fost tradus ca participare **voluntară**, conform RO, fără sensul „gratuit”.
- `info.new_law.what_changed.step2` păstrează „înainte de august 2026”; `info.change_job.old_law_workers.body` păstrează data exactă **8 august 2026**.
- Referința ordonanței urmează forma română exactă **OUG nr. 32/2026**.

### Tamilă — `ta` — runda 2

**Fișier:** `content/ta/strings.json`. Traduse exact **202 valori**; cele 380 de valori anterioare și ordinea cheilor sunt intacte.

**Glosar — toate cele 17 poziții:**

| Română | Tamilă |
|---|---|
| cerere unică | ஒற்றை விண்ணப்பம் |
| permis unic | ஒற்றை அனுமதி |
| aviz de muncă | வேலை அனுமதி (aviz de muncă) |
| agenție de plasare (autorizată) | (அங்கீகாரம் பெற்ற) ஆட்சேர்ப்பு நிறுவனம் |
| contract de plasare | வேலைவாய்ப்பு ஏற்பாட்டு ஒப்பந்தம் |
| angajator înregistrat / autorizat | பதிவு செய்யப்பட்ட முதலாளி / அங்கீகாரம் பெற்ற முதலாளி |
| decizie de încetare a contractului | ஒப்பந்தத்தை முடிக்கும் முடிவு |
| încetare prin acordul părților | இரு தரப்பினரின் ஒப்புதல் |
| demisie / preaviz | பணி விலகல் / முன்னறிவிப்புக் காலம் |
| fluturaș de salariu | சம்பள விவரச் சீட்டு |
| ore suplimentare / spor | கூடுதல் வேலை நேரம் / கூடுதல் ஊதியம் |
| decizie de returnare | திருப்பி அனுப்பும் முடிவு |
| ajutor public judiciar | அரசு வழங்கும் சட்ட உதவி |
| lista ocupațiilor deficitare | ஆள் பற்றாக்குறை உள்ள தொழில்களின் பட்டியல் |
| reîntregirea familiei | குடும்பத்தை ஒன்றுசேர்த்தல் |
| număr de înregistrare | பதிவு எண் |
| perioadă de recuperare și reflecție | மீண்டுவரவும் சிந்திக்கவுமான காலம் |

**De verificat cu un vorbitor nativ — 6 formulări:**

1. `info.new_law.single_application.body`: `ஒற்றை விண்ணப்பம் / ஒற்றை அனுமதி` — naturalețea perechii de termeni.
2. `info.contract_pay.contracts_needed.body`: `வேலைவாய்ப்பு ஏற்பாட்டு ஒப்பந்தம்` — distingerea contractului de plasare de contractul de muncă.
3. `info.change_job.resignation.step3`: `ஒப்பந்தத்தை முடிக்கும் முடிவு` — naturalețea denumirii deciziei administrative.
4. `info.work_time.overtime.body`: `தவிர்க்க முடியாத நிகழ்வுகள்` — precizia echivalentului pentru „forță majoră”.
5. `info.complaints.trafficking.body`: `மீண்டுவரவும் சிந்திக்கவுமான காலம்` — accesibilitatea termenului juridic.
6. `info.health_family.family.body`: `திருமணமாகாத சிறார்களான உங்கள் குழந்தைகள்` — claritatea condiției „copii minori necăsătoriți”.

**Observații despre surse:**

- `info.job_loss.after_deadline.body`: urmată româna — pierderea **locului de muncă**, nu a statutului de ședere; „jurist” redat prin „specialist juridic”.
- `info.complaints.union_strike.body`: „free” redat ca participare voluntară, conform „liberă”.
- `info.job_loss.how_long_stay.step1`: păstrată ambiguitatea datei mai apropiate; nu s-au adăugat 90 de zile. Corpul explică separat înregistrarea încetării + 90 de zile.
- `info.change_job.resignation.body`: păstrat calculul de la încetarea contractului, deși `info.job_loss.how_long_stay.body` pornește de la înregistrarea încetării.
- Păstrate distinct „înainte de august 2026” în `info.new_law.what_changed.step2` și „8 august 2026” în `info.change_job.old_law_workers.body`.
- `info.new_law.what_changed.body`: folosită denumirea exactă **OUG nr. 32/2026**.

**Verificare:** `node scripts/check-translations.mjs ta` → **OK**, 0 valori identice cu engleza, 0 alte probleme. Verificate cifrele, datele, `24/7`, tokenurile, șirurile protejate, paragrafele și bulinele. Sursele `en`/`ro` sunt intacte; fără intrări noi în allowlist.

**Format:** UTF-8 fără BOM, indentare de 2 spații, LF păstrat. `apply_patch` nu a schimbat EOL. Fără caractere bidi de control.

### Urdu — `ur` — Runda 2

**Fișier modificat:** `content/ur/strings.json`. Traduse exact **202 valori**; celelalte **380**, cheile și ordinea sunt intacte.

**Validare:** `node scripts/check-translations.mjs ur` — **OK**, zero texte identice nepermise, zero probleme. Auditul cifrelor, datelor, variabilelor, termenilor protejați, rândurilor și bulinelor — **OK**. `git diff --check` — **OK**. Fără controale bidi sau excepții allowlist noi.

**Format:** UTF-8 fără BOM, indentare de 2 spații; toate cele 584 de sfârșituri de rând au rămas **CRLF**. `apply_patch` nu le-a normalizat.

**Glosar nou — 17 rânduri:**

| Română | Urdu |
|---|---|
| cerere unică | واحد درخواست |
| permis unic | واحد اجازت نامہ |
| aviz de muncă | کام کا اجازت نامہ (aviz de muncă) |
| agenție de plasare / autorizată | بھرتی ایجنسی / مجاز بھرتی ایجنسی |
| contract de plasare | ملازمت دلانے کا معاہدہ |
| angajator înregistrat / autorizat | رجسٹرڈ آجر / مجاز آجر |
| decizie de încetare a contractului | معاہدہ ختم کرنے کا فیصلہ |
| încetare prin acordul părților | باہمی رضامندی سے معاہدہ ختم کرنا |
| demisie / preaviz | استعفیٰ / نوٹس کی مدت |
| fluturaș de salariu | تنخواہ کی پرچی |
| ore suplimentare / spor | اضافی کام کے گھنٹے / اضافی اجرت |
| decizie de returnare | واپسی کا فیصلہ |
| ajutor public judiciar | سرکاری قانونی مدد |
| lista ocupațiilor deficitare | کارکنوں کی کمی والے پیشوں کی فہرست |
| reîntregirea familiei | خاندان کو یکجا کرنا |
| număr de înregistrare | رجسٹریشن نمبر |
| perioadă de recuperare și reflecție | بحالی اور غور و فکر کی مدت |

**De verificat cu un vorbitor nativ — 6 formulări:**

- `info.new_law.single_application.body`: `واحد درخواست` / `واحد اجازت نامہ` — claritatea distincției.
- `info.new_law.employer_types.body`: `رجسٹرڈ آجر` / `مجاز آجر` — înțelegerea celor două categorii.
- `info.work_time.overtime.body`: `قابو سے باہر غیر معمولی حالات` — redarea accesibilă a forței majore.
- `info.complaints.where_complain.body`: `سرکاری وکیل کا دفتر` — identificarea clară a Parchetului.
- `info.complaints.trafficking.body`: `بحالی اور غور و فکر کی مدت` — naturalețea termenului juridic.

- `info.job_loss.return_decision.body`: `امیگریشن کا جنرل انسپکٹوریٹ (IGI) سے` — verificarea construcției cu postpoziții și a acordului denumirii instituției.

**Diferențe și ambiguități ale sursei:**

- `info.job_loss.after_deadline.body`: urmat RO — pierderea **locului de muncă**, nu a statutului de ședere; „jurist” redat prin „expert juridic”.
- `info.complaints.union_strike.body`: „free” înseamnă participare **voluntară**, conform RO, nu gratuitate.
- `info.job_loss.how_long_stay.step1`: păstrată comparația datelor din sursă, deși corpul explică înregistrarea încetării +90 de zile; nu s-au adăugat 90 de zile în pas.
- `info.change_job.resignation.body`: păstrat termenul de la încetarea contractului, distinct de înregistrarea încetării din `job_loss`.
- `info.new_law.what_changed.step2` păstrează „înainte de august 2026”; `info.change_job.old_law_workers.body` păstrează data exactă **8 august 2026**.
- Denumirea engleză a ordonanței a fost redată cu identificatorul exact **OUG nr. 32/2026**, conform RO și brief-ului.

### Arabă — `ar` — Runda 2

**Fișier modificat:** `content/ar/strings.json`. Traduse exact **202 valori**; celelalte **380**, cheile și ordinea sunt intacte.

| Termen românesc | Echivalent ales |
|---|---|
| cerere unică | الطلب الموحد |
| permis unic | التصريح الموحد |
| aviz de muncă | تصريح العمل (aviz de muncă) |
| agenție de plasare (autorizată) | وكالة التوظيف (المرخّصة) |
| contract de plasare | عقد التوظيف عن طريق الوكالة |
| angajator înregistrat / autorizat | صاحب العمل المسجّل / صاحب العمل المرخّص له |
| decizie de încetare a contractului | قرار إنهاء العقد |
| încetare prin acordul părților | إنهاء العقد باتفاق الطرفين |
| demisie / preaviz | الاستقالة / فترة الإشعار |
| fluturaș de salariu | كشف الراتب |
| ore suplimentare / spor | ساعات العمل الإضافية / زيادة في الأجر |
| decizie de returnare | قرار الإعادة |
| ajutor public judiciar | المساعدة القضائية على نفقة الدولة |
| lista ocupațiilor deficitare | قائمة المهن التي تعاني نقصًا في العمال |
| reîntregirea familiei | لمّ شمل الأسرة |
| număr de înregistrare | رقم التسجيل |
| perioadă de recuperare și reflecție | فترة التعافي والتفكير |

**Pentru verificare nativă — 8 formulări:**

- `info.new_law.check_agency.body`: `إلحاق العمال الأجانب بالعمل` — claritatea rolului de intermediere al agenției.
- `info.contract_pay.contracts_needed.body`: `عقد التوظيف عن طريق الوكالة` — distingerea contractului tripartit de contractul individual de muncă.
- `info.new_law.employer_types.body`: `المسجّل / المرخّص له` — diferența dintre înregistrare și autorizare.
- `info.change_job.resignation.body`: `فترة الإشعار` — naturalețea termenului pentru preaviz.
- `info.change_job.release_letter.title`: `خطاب إخلاء طرف` — echivalența scrisorii de eliberare.
- `info.job_loss.return_decision.body`: `قرار الإعادة` — înțelegerea deciziei administrative de returnare.
- `info.work_time.second_job.body`: `قائمة المهن التي تعاني نقصًا في العمال` — accesibilitatea denumirii listei.
- `info.complaints.trafficking.body`: `فترة للتعافي والتفكير` — sensul perioadei de protecție.

**Surse și ambiguități păstrate:**

- `info.job_loss.after_deadline.body`: urmat RO — pierderea **locului de muncă**, nu a statutului; „jurist” redat prin `مختص قانوني`, fără restrângerea la avocat din EN.
- `info.complaints.union_strike.body`: „free” înseamnă participare **voluntară**, nu gratuită; condiția participării legale este păstrată.
- `info.job_loss.how_long_stay.step1`: păstrată comparația datelor din pas, fără adăugarea celor 90 de zile explicate în corp.
- `info.change_job.resignation.body`: păstrat calculul de la încetarea contractului, distinct de înregistrarea încetării din `job_loss`.
- Păstrate distinct „înainte de august 2026” și „8 august 2026”. Identificatorul ordonanței este exact `OUG nr. 32/2026`.

**Validare:** `node scripts/check-translations.mjs ar` — **OK**, zero valori identice nepermise și zero alte probleme. Audit separat **OK** pentru numere, date, `24/7`, variabile, șiruri protejate, eticheta `home.problem`, paragrafe și buline. „Two” și „one year” sunt redate numeric prin 2 și 1, fără schimbarea valorilor.

**Format:** UTF-8 fără BOM, indentare de 2 spații, **LF păstrat**; `apply_patch` nu a normalizat EOL. Fără controale bidi sau excepții allowlist noi. Sursele, raportul și allowlist-ul sunt neschimbate.

### Tagalog — `tl` — Runda 2

**Fișier modificat:** `content/tl/strings.json`. Traduse exact **202 valori**; celelalte **380**, cheile și ordinea sunt păstrate.

**Glosar nou — toate cele 17 poziții:**

| Română | Tagalog |
|---|---|
| cerere unică | iisang aplikasyon |
| permis unic | iisang permiso |
| aviz de muncă | permiso sa trabaho (aviz de muncă) |
| agenție de plasare / autorizată | recruitment agency / awtorisadong recruitment agency |
| contract de plasare | kontrata sa paglalagay sa trabaho |
| angajator înregistrat / autorizat | rehistradong employer / awtorisadong employer |
| decizie de încetare a contractului | desisyon sa pagwawakas ng kontrata |
| încetare prin acordul părților | pagwawakas ng kontrata sa kasunduan ng magkabilang panig |
| demisie / preaviz | pagbibitiw / panahon ng paunang abiso |
| fluturaș de salariu | payslip |
| ore suplimentare / spor | overtime / dagdag na bayad |
| decizie de returnare | desisyon sa pagpapabalik |
| ajutor public judiciar | tulong legal na sagot ng estado |
| lista ocupațiilor deficitare | listahan ng mga trabahong kulang sa manggagawa |
| reîntregirea familiei | muling pagsasama ng pamilya |
| număr de înregistrare | numero ng pagpaparehistro |
| perioadă de recuperare și reflecție | panahon para makabawi at mag-isip |

Păstrate: **Permiso sa paninirahan**, `reklamo`, `employer`, `recruitment agency`, `foundation`, adresarea fără „po”.

**Pentru verificare nativă — 7 formulări:**

- `info.new_law.single_application.body`: `iisang aplikasyon / iisang permiso` — distincția documentelor.
- `info.new_law.employer_types.body`: `rehistradong / awtorisadong employer` — diferența categoriilor juridice.
- `info.contract_pay.contracts_needed.body`: `kontrata sa paglalagay sa trabaho` — claritatea contractului tripartit.
- `info.work_time.overtime.body`: `mga pambihirang pangyayaring hindi makontrol` — echivalentul accesibil pentru forță majoră.
- `info.change_job.release_letter.title`: `liham ng pagpayag na umalis` — naturalețea termenului pentru scrisoarea de eliberare.
- `info.job_loss.return_decision.body`: `tulong legal na sagot ng estado` — înțelegerea finanțării de către stat.
- `info.complaints.trafficking.body`: `panahon para makabawi at mag-isip` — sensul juridic al recuperării și reflecției.

**Diferențe și ambiguități ale sursei:**

- `info.job_loss.after_deadline.body`: urmat RO — pierderea **locului de muncă**, nu a statutului; „jurist” redat prin `eksperto sa batas`, fără restrângerea la avocat din EN.
- `info.complaints.union_strike.body`: „free” redat prin **kusang-loob** — participare voluntară.
- `info.job_loss.how_long_stay.step1`: păstrată comparația datelor; nu s-au adăugat cele 90 de zile explicate în corp.
- `info.change_job.resignation.body`: păstrat calculul celor 90 de zile de la încetare, distinct de înregistrarea încetării din `job_loss`.
- Păstrate distinct „înainte de august 2026” și **8 august 2026**.
- Denumirea ordonanței este exact **OUG nr. 32/2026**.

**Validare:** `node scripts/check-translations.mjs tl` → **OK**, zero valori identice nepermise, zero alte probleme. Verificate cifrele, datele, `24/7`, variabilele, șirurile protejate, eticheta `home.problem`, paragrafele și bulinele. Fără excepții allowlist necesare.

**Format:** UTF-8 fără BOM, indentare de 2 spații, **LF păstrat** — 584 de sfârșituri de rând. `apply_patch` nu a normalizat EOL. Fără controale bidi. Sursele, raportul și allowlist-ul sunt neschimbate.

### Vietnameză (`vi`) — Runda 2

Fișier modificat: `content/vi/strings.json`. Exact **202 valori traduse**; celelalte 380 de valori și ordinea cheilor sunt intacte.

**Glosar — toate cele 17 rânduri:**

| Română | Vietnameză |
|---|---|
| cerere unică | đơn đề nghị chung |
| permis unic | giấy phép hợp nhất |
| aviz de muncă | giấy phép lao động (aviz de muncă) |
| agenție de plasare autorizată | công ty môi giới tuyển dụng được cấp phép |
| contract de plasare | hợp đồng môi giới tuyển dụng |
| angajator înregistrat / autorizat | người sử dụng lao động đã đăng ký / người sử dụng lao động được cấp phép |
| decizie de încetare a contractului | quyết định chấm dứt hợp đồng |
| încetare prin acordul părților | chấm dứt theo thỏa thuận giữa hai bên |
| demisie / preaviz | nghỉ việc theo nguyện vọng / thời gian báo trước |
| fluturaș de salariu | phiếu lương |
| ore suplimentare / spor | giờ làm thêm / khoản trả thêm |
| decizie de returnare | quyết định buộc rời Romania |
| ajutor public judiciar | trợ giúp pháp lý do nhà nước chi trả |
| lista ocupațiilor deficitare | danh sách nghề thiếu lao động |
| reîntregirea familiei | đoàn tụ gia đình |
| număr de înregistrare | số đăng ký |
| perioadă de recuperare și reflecție | thời gian phục hồi và cân nhắc |

**Pentru verificare nativă — 8 formulări în 6 puncte:**

- `info.new_law.single_application.body`: „đơn đề nghị chung” și „giấy phép hợp nhất” — naturalețea celor două noțiuni.
- `info.contract_pay.contracts_needed.body`: „hợp đồng môi giới tuyển dụng” — denumirea contractului tripartit.
- `info.change_job.resignation.body`: „nghỉ việc theo nguyện vọng” — să exprime demisia fără necesitatea aprobării angajatorului.
- `info.job_loss.return_decision.body`: „quyết định buộc rời Romania” și „khiếu kiện quyết định tại tòa phúc thẩm” — terminologia returnării și contestării.
- `info.complaints.trafficking.body`: „thời gian phục hồi và cân nhắc” — termenul pentru victimele traficului.
- `info.health_family.health.body`: „giấy giới thiệu” — echivalentul trimiterii medicale.

**Observații despre surse, necorectate:**

- `info.job_loss.after_deadline.body`: EN spune pierderea statutului, RO pierderea locului de muncă. Traducerea urmează RO. Tot aici, „lawyer”/„jurist” este redat conform RO prin „chuyên gia pháp lý”.
- `info.complaints.union_strike.body`: „free” înseamnă participare **voluntară**, tradusă „tự nguyện”.
- `info.job_loss.how_long_stay.step1`: compară încetarea contractului cu expirarea permisului; corpul explică înregistrarea încetării + 90 de zile. Pasul este păstrat fără adăugarea celor 90 de zile.
- `info.change_job.resignation.body`: cele 90 de zile curg de la încetare, spre deosebire de înregistrarea încetării din `job_loss`. Diferența este păstrată.
- `info.new_law.what_changed.step2` menționează „înainte de august 2026”; `info.change_job.old_law_workers.body` precizează 8 august 2026. Ambele repere sunt păstrate.

**Verificări:** `node scripts/check-translations.mjs vi` → **OK**, 0 valori identice cu engleza, 0 alte probleme. `git diff --check` a trecut. Cifrele, datele, tokenurile, șirurile protejate, paragrafele și bulinele au fost verificate. UTF-8 fără BOM, indentare de 2 spații, **LF → LF**; `apply_patch` nu a schimbat tipul EOL. Nu sunt necesare excepții noi în allowlist.

### Verificarea finală — runda 2

Versiune livrată: **`2026-11-14.2`**. Toate comenzile de mai jos au terminat cu **cod 0**:

- `npm run check:translations` — toate cele nouă limbi OK; mesaj final **All languages are real text.**
- `npm run check:phase4` — typecheck, conținut, fazele 2–4, fluxul plângerii, motorul de traducere, atașamentele și verificarea finală a traducerilor: **OK**.
- `git diff --check` pe fișierele din domeniul rundei — **OK**. Avertismentul Git despre eventuala conversie LF/CRLF a indexului nu este o eroare de conținut.

| Limbă | Traduse | Valori vechi păstrate | Texte englezești nepermise | EOL păstrat |
|---|---:|---:|---:|---|
| `ne` | 202 | 380 | 0 | CRLF |
| `hi` | 202 | 380 | 0 | LF |
| `bn` | 202 | 380 | 0 | LF |
| `si` | 202 | 380 | 0 | LF |
| `ta` | 202 | 380 | 0 | LF |
| `ur` | 202 | 380 | 0 | CRLF |
| `ar` | 202 | 380 | 0 | LF |
| `tl` | 202 | 380 | 0 | LF |
| `vi` | 202 | 380 | 0 | LF |
| **Total** | **1.818** | **3.420** | **0** | — |

Auditul independent final are **zero erori**: exact cele 202 de chei permise schimbate în fiecare limbă; toate cele 582 de chei păstrate în ordinea sursei; UTF-8 valid fără BOM; indentare și EOL originale; aceeași structură de rânduri și buline; variabile și șiruri protejate intacte; instituții cu acronime; butonul citat identic cu `home.problem`; fără controale invizibile de direcție. Distincția dintre zile lucrătoare și zile calendaristice a fost verificată separat pentru adeverințe, concediu, preaviz, programarea permisului, răspunsul instituțiilor și contestație.

Cele **33 de diferențe semnalate de comparația numerică brută** au fost revizuite: sunt scrierea cu cifre a unor numere care în engleză sunt cuvinte („once”, „two”, „one year”, „second”), fracția `1/4` în loc de „a quarter” și scrierea lunilor cu numere în vietnameză. Nu reprezintă schimbări ale valorilor, datelor sau termenelor.

Raportul conține toate cele **17 poziții de glosar pentru fiecare limbă** și cel mult 10 formulări pentru verificare nativă. Nu au fost necesare excepții noi în allowlist; numele și împrumuturile aprobate în runda 1 rămân exceptate, nu sunt contabilizate ca texte netraduse.

`en`, `ro`, `content/info.json`, `package.json`, `package-lock.json` și `scripts/translation-allowlist.json` sunt **identice byte cu byte** cu versiunile de la începutul rundei. În `content/index.json` s-a schimbat numai `contentVersion`. Partea anterioară a raportului a fost păstrată integral. Nu s-a modificat codul aplicației.

Pentru trasabilitatea surselor juridice, SHA-256 la final, identic cu cel de la început:

- `content/en/strings.json`: `5022a8d63c6d105b4c6ab9c14acecf2785121ff78e8c219f1f8c7c22eb0a169e`
- `content/ro/strings.json`: `1d6b5dea94d88deae9a6f4cda0af2ca776fa062466646b4265a9b44ca89abc5e`
- `content/info.json`: `97001f64657d5b327e45dace84bcdcbc0db5455fda4ce32219a04cb500b8709a`

Aceste rezultate confirmă verificările tehnice și fidelitatea verificată pe textele furnizate, **nu certifică validarea de către vorbitori nativi**. Nu a fost efectuat un test vizual pe Android. Observațiile despre surse, în special comparația greșită a datelor din `info.job_loss.how_long_stay.step1`, rămân pentru revizuirea autorului variantei juridice.

### Completare — corecțiile surselor (2026-11-14)

Versiune: `2026-11-14.3`. Actualizate cele 3 chei în toate cele 9 limbi: **27 de valori**, în glosarul existent.

- `info.change_job.resignation.body`: cel mult 90 de zile de la **înregistrarea încetării contractului**, sau mai puțin dacă permisul expiră mai devreme.
- `info.job_loss.how_long_stay.step1`: compararea datei la care se împlinesc cele 90 de zile cu data expirării permisului; se aplică data care vine prima.
- `info.job_loss.after_deadline.body`: pierderea **dreptului de ședere**, nu a locului de muncă; solicitarea sfatului unui consilier juridic.

Observațiile anterioare referitoare la aceste trei chei sunt rezolvate de sursele corectate de autor. Nu am modificat sursele `en`/`ro`, `content/info.json` sau allowlist-ul. Celelalte **579 de valori pe limbă**, ordinea cheilor și formatul original, inclusiv CRLF/LF, sunt păstrate.

Verificări: fiecare limbă individual **OK**; `npm run check:translations` — **All languages are real text.**; `npm run check:phase4` — **OK**. Auditul de domeniu, cifre, termene, variabile și controale de direcție: **OK**.
