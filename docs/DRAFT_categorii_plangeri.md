# DRAFT — Categorii de plângere și încălcări predefinite

**Statut: DRAFT DE LUCRU pentru dezvoltare.** Formulările românești (`sentenceKey`) și rutarea destinatarilor NU sunt validate juridic. Lista finală se redactează de echipa juridică după ce aplicația e funcțională, pe baza broșurii. Implementatorul le folosește ca date realiste de test, în schema din SPEC §2.6.

Placeholder-ele `{...}` se completează din câmpurile formularului. Etichetele afișate userului (`labelKey`) vor fi traduse în toate limbile; aici doar sensul lor în engleză simplă (limbaj B1, fără jargon).

---

## 1. `unpaid_wages` — My salary is missing or wrong

Angajator: da. Destinatar draft: **ITM** (județ angajator).

| id | Eticheta (EN draft) | Propoziție RO draft (sentenceKey) |
|---|---|---|
| no_salary | I did not receive my salary | Angajatorul nu mi-a plătit salariul pentru perioada {period}. |
| partial_pay | I received only part of my salary | Am primit doar o parte din salariul convenit; diferența neplătită este de aproximativ {amount} lei. |
| no_overtime | I was not paid for extra hours | Am prestat ore suplimentare care nu mi-au fost plătite și nici compensate cu timp liber. |
| no_payslip | I get no proof of payment | Nu primesc dovada plății salariului (fluturaș de salariu) și nu pot verifica sumele plătite. |

Câmpuri specifice: `period` (req), `amount` (opt).

## 2. `working_time` — Hours, rest and holidays

Angajator: da. Destinatar draft: **ITM**.

| id | EN draft | RO draft |
|---|---|---|
| excessive_hours | I must work too many hours | Sunt obligat să lucrez peste durata maximă legală a timpului de muncă. |
| no_weekly_rest | I get no weekly rest days | Nu mi se acordă repausul săptămânal prevăzut de lege. |
| no_leave | I get no paid holiday | Nu mi s-a acordat concediul de odihnă la care am dreptul. |

## 3. `documents_withheld` — Someone keeps my documents

Angajator: da. Destinatar draft: **ITM** — ⚠ de validat (posibil indicator de trafic → aplicația afișează și banner-ul de Urgență când e bifată `passport_kept`).

| id | EN draft | RO draft |
|---|---|---|
| passport_kept | My passport is kept from me | Angajatorul sau agenția îmi reține pașaportul și nu mi-l dă înapoi la cerere. |
| permit_kept | My permit/ID is kept from me | Îmi este reținut permisul de ședere sau alt document de identitate. |
| no_contract_copy | I never got my contract | Nu mi s-a înmânat un exemplar al contractului individual de muncă. |

## 4. `termination` — My contract ended badly

Angajator: da. Destinatar draft: **ITM**.

| id | EN draft | RO draft |
|---|---|---|
| ended_without_consent | It was ended without my knowledge or agreement | Contractul meu de muncă a încetat fără știrea și fără acordul meu. |
| nothing_signed | I never signed any paper to end it | Nu am semnat niciun document privind încetarea contractului meu de muncă (de exemplu, o demisie sau un acord de încetare). |
| no_docs_on_exit | I got no papers when it ended | La încetarea contractului nu mi s-au eliberat documentele prevăzute de lege. |
| forced_resignation | I was pushed to resign | Am fost presat să semnez o cerere de demisie împotriva voinței mele. |
| final_pay_missing | I was not paid what was owed | La încetarea contractului nu mi-au fost plătite drepturile salariale restante. |

## 5. `agency` — Problems with my recruitment agency

Angajator: nu (câmpuri agenție: denumire req, județ req, CUI opt). Destinatar draft: **ITM** — ⚠ de validat (posibil ANOFM/AJOFM).

| id | EN draft | RO draft |
|---|---|---|
| illegal_fees | The agency charged me money | Agenția de plasare mi-a perceput tarife sau comisioane, contrar legii. |
| different_conditions | The real job is not what was promised | Condițiile reale de muncă diferă esențial de oferta pe baza căreia am acceptat contractul. |
| return_cost_refused | The agency refuses return costs | Agenția refuză să suporte costurile de întoarcere, deși legea o obligă. |

## 6. `other` — Something else

Angajator: opțional. **Text liber obligatoriu** (nu există încălcări predefinite). Destinatar draft: sugestie de contact cu fundația pentru orientare + opțiune de trimitere generică — ⚠ de definit.

---

**NU sunt categorii de plângere** (rutare directă la ecranul Urgență, nu formular): violență fizică, sechestrare, amenințări grave, trafic de persoane, pericol imediat.

**De validat juridic la finalizare:** toate propozițiile RO, rutarea fiecărei categorii și competența pentru agenții.
