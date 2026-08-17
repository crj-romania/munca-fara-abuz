# DRAFT — Categorii de plângere și încălcări predefinite

**Statut: DRAFT DE LUCRU pentru dezvoltare.** Formulările românești (`sentenceKey`) și rutarea destinatarilor NU sunt validate juridic. Lista finală se redactează de echipa juridică după ce aplicația e funcțională, pe baza broșurii. Implementatorul le folosește ca date realiste de test, în schema din SPEC §2.6.

Placeholder-ele `{...}` se completează din câmpurile formularului. Etichetele afișate userului (`labelKey`) vor fi traduse în toate limbile; aici doar sensul lor în engleză simplă (limbaj B1, fără jargon).

---

## 1. `unpaid_wages` — My pay is missing or wrong

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

## 4. `housing` — Problems with housing from my employer

Angajator: da. Destinatar draft: **ITM** — ⚠ de validat.

| id | EN draft | RO draft |
|---|---|---|
| rent_over_limit | Rent taken is too high | Suma reținută pentru cazare depășește 25% din remunerația mea netă, contrar legii. |
| rent_no_consent | Money taken without my agreement | Mi se rețin din salariu sume pentru cazare fără acordul meu scris. |
| bad_conditions | Housing is not decent | Cazarea pusă la dispoziție nu îndeplinește condiții decente de locuit. |

## 5. `termination` — My contract ended badly

Angajator: da. Destinatar draft: **ITM**; card info asociat despre perioada legală de ședere după încetare (IGI).

| id | EN draft | RO draft |
|---|---|---|
| no_docs_on_exit | I got no papers when it ended | La încetarea contractului nu mi s-au eliberat documentele prevăzute de lege. |
| forced_resignation | I was pushed to resign | Am fost presat să semnez o cerere de demisie împotriva voinței mele. |
| final_pay_missing | I was not paid what was owed | La încetarea contractului nu mi-au fost plătite drepturile salariale restante. |

## 6. `employer_change` — I cannot change my employer

Angajator: da. Destinatar draft: **IGI** (județ lucrător) — ⚠ de validat.

| id | EN draft | RO draft |
|---|---|---|
| change_blocked | My employer blocks my transfer | Angajatorul refuză să îmi permită schimbarea angajatorului, deși legea îmi dă acest drept. |
| threat_status | I am threatened about my permit | Sunt amenințat că îmi va fi anulat dreptul de ședere dacă îmi schimb angajatorul. |

## 7. `health_safety` — My work is dangerous

Angajator: da. Destinatar draft: **ITM**.

| id | EN draft | RO draft |
|---|---|---|
| no_equipment | I got no protective equipment | Nu mi s-a asigurat echipamentul individual de protecție necesar. |
| no_training | I got no safety training | Nu am primit instruirea de securitate și sănătate în muncă. |
| accident_hidden | My work accident was hidden | Am suferit un accident de muncă ce nu a fost înregistrat sau raportat de angajator. |

## 8. `discrimination` — I am treated worse than others

Angajator: da. Destinatar draft: **CNCD** (național, `perCounty: false`) — ⚠ de validat dacă mergem și paralel la ITM.

| id | EN draft | RO draft |
|---|---|---|
| worse_conditions | I get worse pay/conditions | Sunt tratat mai puțin favorabil decât alți lucrători în privința salariului sau condițiilor de muncă, din cauza originii mele. |
| harassment | I am harassed at work | Sunt supus unui comportament ostil și degradant repetat la locul de muncă. |

## 9. `agency` — Problems with my recruitment agency

Angajator: nu (câmpuri agenție: denumire req, județ req, CUI opt). Destinatar draft: **ITM** — ⚠ de validat (posibil ANOFM/AJOFM).

| id | EN draft | RO draft |
|---|---|---|
| illegal_fees | The agency charged me money | Agenția de plasare mi-a perceput tarife sau comisioane, contrar legii. |
| different_conditions | The real job is not what was promised | Condițiile reale de muncă diferă esențial de oferta pe baza căreia am acceptat contractul. |
| return_cost_refused | The agency refuses return costs | Agenția refuză să suporte costurile de întoarcere, deși legea o obligă. |

## 10. `other` — Something else

Angajator: opțional. **Text liber obligatoriu** (nu există încălcări predefinite). Destinatar draft: sugestie de contact cu fundația pentru orientare + opțiune de trimitere generică — ⚠ de definit.

---

**NU sunt categorii de plângere** (rutare directă la ecranul Urgență, nu formular): violență fizică, sechestrare, amenințări grave, trafic de persoane, pericol imediat.

**De validat juridic la finalizare:** toate propozițiile RO, rutarea fiecărei categorii, dublarea ITM/CNCD la discriminare, competența la cazare și agenții, formulările „PC" pentru statutul de ședere.
