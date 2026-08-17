# Kickoff pentru implementare (ChatGPT)

## A. Promptul de kickoff (copiază-l în ChatGPT împreună cu SPEC + DRAFT)

---

Ești dezvoltatorul unei aplicații mobile Expo (React Native + TypeScript). Primești două documente: SPECIFICAȚIA (autoritatea finală) și un DRAFT de conținut pentru date de test.

Reguli de lucru:

1. Specificația e obligatorie. NU iei decizii de arhitectură. Dacă ceva e neclar, ambiguu sau pare greșit — întrebi ÎNAINTE să implementezi altceva.
2. Lucrezi strict în fazele din SPEC §9, în ordine. Acum livrezi DOAR Faza 1 (schelet + motor de conținut). Nu scrii cod pentru fazele următoare.
3. Nu inventezi conținut juridic. Textele juridice sunt placeholder-e cu chei i18next; datele de test vin din DRAFT.
4. Tot ce afișează UI-ul vine din strings.json prin i18next — zero stringuri hardcodate în componente.
5. La final de fază livrezi: structura completă de fișiere, codul integral (nu fragmente), instrucțiuni de rulare pas cu pas pentru un non-programator (comenzi exacte), și demonstrezi criteriul de acceptare al fazei.
6. Cod simplu și lizibil are prioritate față de cod "deștept". Comentarii în engleză, scurte.

Decizii de lucru deja luate (nu le rediscuta):
- Nume de lucru: "Muncă Fără Abuz" (placeholder, se schimbă ușor).
- Slug/package: `munca-fara-abuz` / `ro.fundatie.muncafaraabuz` (placeholder).
- CONTENT_BASE_URL: constantă într-un singur fișier de config, deocamdată goală → aplicația merge doar pe conținutul împachetat până există repo-ul GitHub Pages (Faza 2).
- Limbi de start în conținutul de test: `en` (complet), `ro` (complet) + o limbă de test `ne` (nepali, poate fi copie a EN cu prefix "[NE] ") ca să demonstrezi limbile dinamice, plus `ur` (copie EN cu prefix "[UR] ", `rtl: true`) ca să demonstrezi RTL de la început.
- Temă vizuală: neutră, albastru închis pe alb, fără branding — se decide ulterior.

Începe prin a-mi confirma în maximum 10 rânduri: ce livrezi în Faza 1, structura de foldere propusă și ce întrebări ai. Apoi așteaptă OK-ul meu.

---

## B. Ordinea documentelor date lui ChatGPT

1. Promptul de mai sus
2. `SPEC_aplicatie_lucratori_migranti.md` (integral)
3. `DRAFT_categorii_plangeri.md` (integral)

La fiecare sesiune nouă de ChatGPT: re-dă SPEC-ul + promptul + codul curent (sau folosește un Project ca să rămână atașate).

## C. Checklist setup Vadim — ce îți trebuie și când

| Când | Ce | Note |
|---|---|---|
| Acum (Faza 1) | Node.js LTS + Git instalate pe PC | singurele instalări locale |
| Acum (Faza 1) | Aplicația **Expo Go** pe telefon (Play Store) | testezi scanând un QR |
| Faza 2 | Cont GitHub + repo public `content` + GitHub Pages activat | URL-ul devine CONTENT_BASE_URL |
| Faza 3 | Emailurile reale ale instituțiilor (măcar ITM-urile) + emailul/WhatsApp-ul fundației | pot rămâne placeholder-e în dev |
| Faza 4 | Cont Expo (gratuit) pentru EAS — dev build cu ML Kit | Expo Go nu mai ajunge din acest punct |
| Faza 5 | Cont Aptabase (gratuit) → cheia aplicației | |
| La final | Cont Google Play Developer (25$ o dată) + eventual Apple Developer (99$/an) | publicare |

## D. Semnale că ChatGPT a luat-o razna (când să te oprești și să mă întrebi)

- Propune server, backend, bază de date, Firebase, conturi de utilizator sau notificări push.
- Hardcodează texte în componente în loc de chei i18next.
- Pune limbile în cod în loc să le citească din index.json.
- Adaugă librării mari nediscutate în SPEC (Redux, UI kit-uri complexe).
- Colectează sau trimite orice dată în afara evenimentelor Aptabase din SPEC §7.
- Scrie conținut juridic „de la el".

Oricare din astea = încalcă specificația; cere-i să revină la SPEC sau adu discuția înapoi la mine.
