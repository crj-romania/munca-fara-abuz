# Brief — traduceri pentru „Muncă Fără Abuz”: secțiunea „Informații”

Lucrezi în `G:\CRJ\Aplicatie`, o aplicație Android (Expo / React Native) pentru lucrătorii migranți din România. Toate textele aplicației sunt în `content/<cod>/strings.json`. Lista limbilor e în `content/index.json`.

- `en` este sursa de traducere, iar `ro` este varianta verificată juridic. Pe acestea două nu le modifici.
- Limbile de lucru sunt: `ne` (nepaleză), `hi` (hindi), `bn` (bengali), `si` (sinhala), `ta` (tamilă), `ur` (urdu, de la dreapta la stânga), `ar` (arabă, de la dreapta la stânga), `tl` (tagalog), `vi` (vietnameză).
- Nu modifici codul aplicației și nici `content/info.json`. Lucrezi doar în fișierele `strings.json` ale limbilor de lucru, în `scripts/translation-allowlist.json` și în raport.

## Ce ai de făcut

Prima rundă de traduceri (interfața, plângerea, PDF-ul) e gata și verificată. Acum am adăugat secțiunea „Informații”, scrisă după broșura CRJ despre legea nouă (OUG nr. 32/2026): 8 categorii și 41 de întrebări cu răspuns. Sunt **202 chei noi `info.*` în fiecare limbă**, care deocamdată au textul în engleză.

1. **Traduci toate cheile semnalate de `npm run check:translations`.** Acum sunt exact cele 202 chei `info.*` din fiecare limbă de lucru.
    - `info.<categorie>.title` sunt numele categoriilor și ale subgrupurilor. Le păstrezi scurte, pentru că apar ca butoane într-o listă.
    - `info.<categorie>.<întrebare>.title` sunt întrebările, formulate de lucrător: „Pot fi plătit cash?”. Rămân întrebări scurte, la persoana I.
    - `….body` sunt răspunsurile, adresate lucrătorului.
    - `….step1`, `….step2` etc. sunt pașii „Ce poți face”. Încep cu un verb la imperativ.
2. **Lucrezi limbă cu limbă.** După fiecare limbă rulezi `node scripts/check-translations.mjs <cod>` (de exemplu `node scripts/check-translations.mjs ne`) și treci la următoarea doar când limba respectivă e „OK”.
3. **Adaugi în `docs/TRADUCERI_RAPORT.md` o secțiune „Runda 2 — Informații”.** Pentru fiecare limbă: termenii aleși pentru glosarul nou de mai jos și cel mult 10 formulări nesigure, pe care să le verifice un vorbitor nativ. Notezi acolo și orice greșeală găsită în `en` sau `ro`, fără să o corectezi.

## Sensul: engleza, verificată cu româna

- Traduci din engleză. Dacă o frază din engleză e ambiguă, te uiți la aceeași cheie în `ro`.
- Dacă engleza și româna par să spună lucruri diferite, urmezi româna (e varianta verificată juridic) și notezi diferența în raport.

## Reguli speciale: sunt texte juridice

- **Cifrele și termenele rămân exacte:** 6 luni, 2 ani, 90 de zile, 10 zile, 15 zile, 30 de zile, 60 de zile, 3 luni, 25%, 10%, 12 ore, 48 de ore, 75%, 20 de zile lucrătoare, 4.325 lei, 2.699 lei, 300 de euro, 6.000 lei. Poți scrie numerele în formatul limbii tale, dar nu schimbi valoarea și păstrezi „lei” și „euro”.
- **Nu atenuezi și nu întărești afirmațiile.** „Poate”, „de regulă”, „cel mult”, „cel puțin”, „doar” și „din proprie inițiativă” rămân exact așa. Nu adaugi explicații sau sfaturi proprii.
- **Rămân neschimbate:** WorkinRomania.gov.ro, REGES, REGES-ONLINE, D/AM2, OUG nr. 32/2026, adresele de email (`bns@bns.ro`, `info@eliberare.com`, `adpare@adpare.eu`), numerele de telefon (112, 0800 800 678) și exemplul de număr de înregistrare „Nr. 23/03.07.2026”.
- **Termenii românești din paranteză rămân în română** (de exemplu „aviz de muncă” sau „bilet de trimitere”). Lucrătorul îi va vedea scriși așa pe documente.
- **Instituțiile:** denumirea tradusă, urmată de acronimul românesc în paranteză, ca în prima rundă: ITM, IGI, CNCD, ANITP, ANOFM.
- **Butonul citat „I have a problem”** se scrie exact ca valoarea lui `home.problem` din aceeași limbă. Cuvântul „foundation” se traduce la fel ca `inst.foundation`.
- **Păstrezi bulinele „•” și rândurile noi (`\n`)** din răspunsuri, în aceleași locuri.
- **Temeiul juridic nu se traduce.** Stă în `content/info.json` (câmpul `refs`) și rămâne în română.

## Reguli generale (aceleași ca în prima rundă)

- **Cine citește:** un lucrător migrant, cu nivel de școlarizare variabil, adesea stresat. Limbaj simplu (nivel A2–B1), propoziții scurte, termenii pe care oamenii îi folosesc efectiv.
- **Adresarea:** forma politicoasă standard a limbii (de exemplu तपाईं, आप, آپ, bạn). Pentru arabă e acceptat masculinul generic. În tagalog folosește adresarea obișnuită dintr-o aplicație, fără „po”.
- **Rămân exact cum sunt:** cheile, numele aplicației („Muncă Fără Abuz”), acronimele românești (CNP, CUI, TRC, ITM, IGI, CNCD, ANITP, ANOFM, REGES), numele de produse (WhatsApp, Google Translate, PDF).
- **Urdu și arabă:** fără caractere invizibile de control al direcției. Acronimele și adresele latine rămân cu litere latine.
- **Formatul fișierelor:**
    - nu adaugi și nu ștergi chei, iar ordinea lor rămâne cea din `en`;
    - JSON valid, UTF-8 fără BOM, indentare de 2 spații, același tip de sfârșit de rând ca fișierul primit.
- **Când un text rămâne identic cu engleza:** doar dacă e cu adevărat cea mai bună alegere pentru cititor, adaugi cheia în `scripts/translation-allowlist.json`, la limba respectivă, și explici în raport.

## Glosar

**Termenii din prima rundă.** Îi păstrezi consecvent.

| Termen | ne | hi | bn | si | ta | ur | ar | tl | vi |
|---|---|---|---|---|---|---|---|---|---|
| plângere | उजुरी | शिकायत | অভিযোগ | පැමිණිල්ල | புகார் | شکایت | شكوى | reklamo | khiếu nại |
| angajator | रोजगारदाता | नियोक्ता | নিয়োগকর্তা | සේවා යෝජකයා | முதலாளி | آجر | صاحب العمل | employer | người sử dụng lao động |
| agenție de recrutare | भर्ना एजेन्सी | भर्ती एजेंसी | নিয়োগ এজেন্সি | බඳවා ගැනීමේ ආයතනය | ஆட்சேர்ப்பு முகவர் | بھرتی ایجنسی | وكالة التوظيف | recruitment agency | công ty môi giới tuyển dụng |
| fundația | फाउन्डेसन | फ़ाउंडेशन | ফাউন্ডেশন | පදනම | அறக்கட்டளை | فاؤنڈیشن | المؤسسة | foundation | quỹ |
| permis de ședere | आवास अनुमति | निवास परमिट | বসবাসের অনুমতিপত্র | පදිංචි බලපත්‍රය | வசிப்பிட அனுமதி | رہائشی اجازت نامہ | تصريح الإقامة | residence permit | giấy phép cư trú |

Dacă în `docs/TRADUCERI_RAPORT.md` ai ales alt termen în prima rundă, îl folosești pe acela.

**Termenii noi.** Alegi echivalentul în fiecare limbă, îl folosești consecvent în toate cele 202 chei și îl treci în raport.

| Română | Engleză (sursa) | Observații |
|---|---|---|
| cerere unică | single application | cererea depusă pe WorkinRomania.gov.ro |
| permis unic | single permit | permisul de ședere și de muncă |
| aviz de muncă | work permit (aviz de muncă) | nu mai există; păstrezi și termenul românesc |
| agenție de plasare (autorizată) | (authorised) placement agency | aceeași „agenție” ca în glosarul vechi |
| contract de plasare | placement contract | contract în trei: lucrător, angajator, agenție |
| angajator înregistrat / autorizat | registered / authorised employer | două categorii diferite; nu le amesteci |
| decizie de încetare a contractului | termination decision | |
| încetare prin acordul părților | mutual agreement | |
| demisie / preaviz | resignation / notice period | |
| fluturaș de salariu | payslip | |
| ore suplimentare / spor | overtime / extra pay | |
| decizie de returnare | return decision | |
| ajutor public judiciar | state legal aid | avocat plătit de stat |
| lista ocupațiilor deficitare | list of shortage occupations | |
| reîntregirea familiei | family reunification | |
| număr de înregistrare | registration number | |
| perioadă de recuperare și reflecție | recovery and reflection period | pentru victimele traficului |

## Verificare (obligatorie la final)

1. `npm run check:translations` afișează „All languages are real text.”
2. `npm run check:phase4` are toate liniile „OK”. Dacă pică doar la `typecheck` din cauza unor module lipsă, rulezi întâi `npm install`.
3. Crești `contentVersion` în `content/index.json`. Acum este `2026-11-14.1`; următorul e `2026-11-14.2` sau data zilei în care termini, cu `.1`.

## Pe viitor

- Orice cheie nouă sau modificată în `en` ori `ro` se traduce în toate limbile, în aceeași modificare.
- Când adaugi o limbă nouă, adaugi și intrarea ei în `content/index.json`. Câmpul `mt` e `mlkit:<cod>` dacă ML Kit suportă limba; altfel e `none`.
