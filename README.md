# SPTC — working demonstration

Prepared for DataBytes Consulting. Two modules of one system for a bus
operator, built to be shown in a meeting:

- **Passenger Care** — complaints in, routed to the section that resolves
  them, answered inside an agreed time.
- **Human Resources** — the establishment register, and recruitment on
  Form PM/05.

They share one shell, one menu and one look on purpose. "Centralised ERP"
is a claim; a module switch that keeps everything else identical is the
demonstration of it.

**Live:** https://anirudhatalmale6-alt.github.io/databytes-care-demo/

---

## Human Resources

### Form PM/05 is the spine

`PM/05 (Annex 5)` is the **Government of Seychelles Employment Application
Form**, used across the Seychelles Public Service — it is not SPTC's own
form. Building to it means the module fits any ministry or parastatal that
uses PM/05, not only this customer.

All fourteen numbered sections are reproduced, in the order the paper form
prints them, with the same section numbers, so somebody working from a
completed sheet can go straight down it.

Two things to say plainly about that form:

- **It is an application, not an employee record.** It describes somebody
  who wants a job. An employee record needs a dozen fields the form has no
  box for — employee number, date joined, the grade actually awarded,
  section, reporting line, leave entitlement, Pension Fund number, bank
  details, probation or confirmed. Those live on the employee side and are
  labelled *not on the application form* on screen.
- **Its section 15 is its section 14 again.** The whole block, including
  the declaration above it, is printed twice. It looks like a copy and
  paste when the form was drawn up in Word in 2017. It is shown once here,
  with a note.

### One page, or step by step

The form offers both, chosen by a switch at the top of it. **One page is
the default**, because that is the version already approved and because it
is the one that matches the paper: somebody transcribing a completed sheet
wants to go straight down it without pressing Next four times.

The stepped version groups the thirteen sections into five:

| Step | Sections |
| --- | --- |
| 1 — Post and personal | 1, 2 |
| 2 — Education and skills | 3, 4, 5 |
| 3 — Experience | 6, 7, 8 |
| 4 — References and kin | 9, 10 |
| 5 — Declaration | 11, 12, 13 |

**This is not a second form.** `renderApplyForm()` builds every field
exactly as it always did; `applyStepper()` in `assets/hr2.js` then groups
the sections it produced and hides all but one group. There is one set of
inputs, one *Fill it in for me*, one submit and one set of validation
rules, so the two views cannot drift apart. A stepped form that carried its
own copy of the fields would mean fixing every bug twice.

Two consequences worth knowing:

- Validation reaches across steps. Submitting from step 5 with an empty
  surname does not complain about a field you cannot see — it moves to
  step 1, shows the field and focuses it.
- The choice is stored on `state.applyMode`, deliberately **not** inside
  `state.hr`, because bumping `HR_SEED_VERSION` rebuilds `state.hr` from
  the seed and would throw the choice away.

### What it does

- **Register** of the establishment, filterable by section, grade and
  status, searchable by name, number, position or identity number.
- **Employee record** — the employment side, then the PM/05 side: personal
  details, education and training, languages, driving licences, employment
  before joining, next of kin.
- **Vacancies**, with the count of applications each has attracted and how
  many nobody has opened yet.
- **Applications** through their stages: received, shortlisted,
  interviewed, offered, hired, not taken forward.
- **Hiring** an applicant creates the employee record *from the form*.
  Nothing is typed twice — that is the only honest reason to capture
  fourteen sections at intake.

### Two things it checks that paper cannot

- A Seychelles **National Identity Number encodes the date of birth** in
  its first six digits. The form checks the two against each other and asks
  before saving a pair that disagrees. It is the cheapest possible catch
  for a mistyped number, and it is a rule the registry already applies.
- **Leave entitlement is computed, not typed** — 21 days by statute plus
  one for every five years of service — so the number can never drift away
  from the service it is based on.

### Leave, and the arithmetic that has to be right

`LEAVE APPLICATION MODULE` in the specification, plus the medical block
it carries. Three decisions in it are worth stating, because each one is
a way a real system quietly gets somebody's leave wrong:

- **Days are counted from the dates, never typed.** Weekends and
  Seychelles public holidays are skipped. A Friday-to-Monday request is
  **two** days, not four, and the week containing Independence Day is
  four days, not five. A typed "number of days requesting" field
  disagrees with its own dates eventually, and the disagreement is
  invisible.
- **The balance moves on APPROVAL, not on submission.** The
  specification says days remaining is calculated from days *requested*.
  Doing it that way means a declined or cancelled application has
  already eaten the entitlement, and nobody finds out until somebody is
  refused leave they are owed. Pending days are shown separately —
  "if everything pending is approved this becomes N" — so the supervisor
  still sees what is coming.
- **Entitlement is pro-rated in the joining year.** "Auto calculate from
  the date joined" hides two rules: service raises the entitlement
  (21 days plus one for every five years, capped at five), and *when* in
  the year somebody joined lowers it. Somebody who started in October
  has not earned twenty-one days by December. That second rule is the
  one normally missed, and it is the one that causes the argument in
  January.

Leave taken **beyond** the year's entitlement is recorded as *unpaid*
rather than pushing the balance negative. That is what actually happens
when somebody has used the year up and still needs the time, and it
means no balance on any screen can ever be a negative number.

Only a supervisor or manager can approve or decline — the Agent /
Supervisor switch in the top bar demonstrates it. Public holidays are on
the **Tables** screen; the movable feasts are *computed* from Easter, so
the table is right for any year. **The fixed dates are my list, not a
gazette** — confirm them before a balance is relied on.

### Discipline

The identity number is the way in: type it and the photograph, name,
department and position appear. Nothing about the person is retyped onto
a disciplinary record, and it is the cheapest guard against a warning
letter being filed against the wrong member of staff. A record is never
deleted — a withdrawn allegation is marked withdrawn.

### Announcements

The audience is stored as a **rule** — all staff, named departments, or
named people — and not as a frozen list of names, so a notice addressed
to Operations reaches whoever is in Operations on the day it goes out.
The recipient count is worked out live, before it is saved. Nothing is
actually sent; there is no server to send it from, and the screen says
so.

### The two reference tables

`Department` and `Position`, as the specification asks. The department
table is also **the join between the two modules**: Passenger Care routes
a complaint to a department and HR employs people into the same one. One
list, maintained in one place.

- Closing a department that still has people or open cases in it is
  **refused**, with the counts, because closing it would leave them
  pointing at somewhere that no longer accepts work.
- A closed department stops being offered when a case is routed, but is
  still *shown* on the cases already in it. An old case labelled with a
  closed department is honest; one labelled `undefined` is not.
- Position codes are generated and forced unique. Two positions sharing
  a code is what sends a payroll line to the wrong cost centre, and
  nothing on screen would ever show it.

### Pay: gross and net are two numbers

The specification has one field, "Gross net". Gross is basic plus
allowances; net is gross less deductions, and nothing can work out net
without knowing which deductions apply. Both are shown as separate
lines. **The deduction rates are placeholders** — the income tax bands
and the Pension Fund rate must be confirmed.

Basic salary, monthly hours and rate per hour are three numbers that can
contradict each other, so only two are inputs: the **hourly rate is
derived** from basic pay and hours. If SPTC sets the hourly rate and
works the salary out from it, `payBreakdown()` in `assets/hr-data.js` is
the one calculation to turn around.

### Photographs and documents

A photograph is shrunk in the browser to 160×160 before it is kept, and
is really there on the next screen and after a refresh. **Any other file
is recorded by name, type and size, and the bytes are not kept** — there
is no server to keep them in, and storing scanned PDFs for fifty
employees would fill the few megabytes of local storage a browser gives
a page and lose the whole session.

Saving now *reports* a storage failure rather than swallowing it. That
mattered less when the state was text; with photographs in it, a save
that quietly fails leaves the screen looking correct while nothing has
been written, and the first anybody knows is a refresh in the middle of
a meeting.

### Invented, and where the figures are not real

Every person, identity number, telephone number, bank detail and salary
figure in the HR module is invented. **The salary grade bands are a
plausible shape, not the published public service scale**, and must be
replaced before anybody quotes a figure from those screens. A banner on the
HR dashboard says so.

---

## Everything here is invented

No real data is in this repository. Specifically:

- **Staff** — DataBytes' own placeholder directory, carried over so this
  screen agrees with the rest of the pitch. Confirmed by the client as dummy
  names. They are not SPTC employees.
- **Passengers** — made up, with invented telephone numbers.
- **Routes** — the numbers and corridors are illustrative. Replace them with
  SPTC's real route list before this is called anything but a demonstration.
- **Fleet numbers** — invented.
- **The cases themselves** — written to be representative of a bus operator's
  postbag. None of them happened.

A banner saying so sits at the top of the dashboard.

## What it demonstrates

The thing an operator actually buys: a complaint arriving, being owned by
somebody, and being answered inside an agreed time.

- **Intake** — log a case against a route, a vehicle and a subject, from any
  of seven channels including WhatsApp and walk-in.
- **Routing.** Choosing the subject sends the case to the section that
  resolves it — Operations, Crew, Fleet, Finance, Stops and Shelters, Safety
  or Customer Care. The agent sees where it is going, and who is about to be
  told, *before* saving. It can be overridden by hand, and an override is
  labelled as one.
- **Notification rules.** Eight rules decide who is told and when: the
  receiving section head on arrival, Customer Care on everything, an SMS to
  the Safety Officer and the Director of Operations on a safety report, an
  escalation when a target is missed, and the Chief Executive when a safety
  case goes past its target. Every notification is logged against the case
  that produced it and says which rule fired.
- **Redirection.** A case can be moved between sections. A reason is
  required, kept on the case, shown in the timeline, and both section heads
  are told — because a case dropped in the gap between two departments is
  the failure this whole system exists to prevent.
- **A queue that sorts itself** by what will run out of time first, not by
  what arrived first.
- **Live service-level clocks.** While a case is unanswered the clock shown is
  the *reply* clock, because that is the one a passenger feels. Once somebody
  has replied, it becomes the *resolution* clock. Both are running in real
  time — leave the page open and they move.
- **Two jobs, one system.** The Agent / Supervisor switch in the top bar shows
  the same data as an agent sees it and as the Head of Customer Care sees it.
- **Availability is respected.** An agent recorded as on leave still appears in
  the workload panel, labelled, but cannot be given a new case.
- **Audit trail** — every case keeps who did what and when, separating
  internal notes from what was said to the passenger.
- **Management view** — volumes over 21 days, subject mix, busiest routes,
  agent workload, and safety reports called out separately.

## Look and feel

It opens in the **HCIS house style**, so that this and HCIS read as two
modules of one platform rather than two unrelated purchases: navy rail with
a coloured brand header, near-white page, white cards, soft corners,
coloured icon chips on the figures. Those values were measured off the HCIS
build itself rather than matched by eye.

The theme button in the top bar cycles three looks — **as HCIS**, and the
original **control room** in dark and light. The control-room looks are
denser and were built for a projector; they are kept because a meeting room
is unpredictable.

**Brand colour.** Read out of SPTC's own logo file, not chosen: their mark
carries the Seychelles flag palette — blue `#2d3283`, green `#049351`, red
`#ed1b24`, yellow `#fcdb2e`, on black `#211f20`. The blue is the default
because it is the one of the four that works as an interface colour, and it
happens to sit comfortably against the HCIS navy rail.

That one value drives the rail header, the active menu item, primary buttons,
avatars, focus rings and the chart bars. All four logo colours are in a
picker at the bottom of the rail, so the interface can be recoloured in front
of the customer rather than in a follow-up email.

Their red is in the picker but is worth avoiding as the house colour: past
target is also red, and the two would be hard to tell apart on a busy board.

The text colour that sits on the brand is not a guess either: it is chosen by
comparing the contrast of white and near-black against the chosen colour and
taking the better one. A fixed rule put white on amber, which scores 2.0
against 10.4 and leaves a button nobody can read.

Colours that carry **meaning** — red for past target, amber for a warning
clock, the seven section colours — are deliberately *not* tied to the brand,
so changing the house colour cannot quietly change what a colour tells you.

### The service-level model

| Priority | Subjects | Reply within | Settle within |
|---|---|---|---|
| P1 Safety | dangerous driving, accessibility refused | 2 hours | 24 hours |
| P2 Service | crew conduct, did not stop, did not run, late, overcrowding | 8 hours | 72 hours |
| P3 General | fares, vehicle condition, lost property, stops, timetable | 24 hours | 120 hours |
| — | compliments | no clock — passed to the depot manager | |

These are a starting proposal, not a rule. They are the first thing to agree
with the customer, and they live in one place in `assets/data.js`.

## Running it

There is no build step, no framework and no external request of any kind —
the fonts are in the repository. Open `index.html` in a browser, or serve the
folder. **It works with no internet at all**, which matters if the meeting
room wifi does not.

## Changing it

| What | Where |
|---|---|
| Routes, staff, categories, service targets, sample text | `assets/data.js` |
| **Which section a subject goes to** | `section:` on each entry in `CATEGORIES`, `assets/data.js` |
| **The sections themselves, and who heads them** | `SECTIONS`, `assets/data.js` |
| **Who is notified, and when** | `NOTIFY_RULES`, `assets/data.js` |
| Screens and behaviour | `assets/app.js` |
| **Departments and positions** | the **Tables** screen, on screen — no code |
| **Public holidays** | `FIXED_HOLIDAYS`, `assets/hr-data.js` |
| **Leave types and what deducts** | `LEAVE_TYPES`, `assets/hr-data.js` |
| **Allowances and deductions** | `ALLOWANCES` and `DEDUCTIONS`, `assets/hr-data.js` |
| **Salary grade bands** | `GRADES`, `assets/hr-data.js` — currently invented |
| Appearance, all three looks | `assets/app.css` |
| **The brand colour, once SPTC's is known** | `--brand` in `:root[data-theme=hcis]`, `assets/app.css` |
| The five colours in the picker | `data-brand` on the buttons in `index.html` |

The three rows in bold are the workflow. They are deliberately written as
data rather than buried in code, and the **Routing rules** screen renders
them straight out of those tables — so what is on screen in a meeting cannot
drift from what the system actually does. Recipients are named by job
(`section-head`, `ops-director`, `ceo`) rather than by person, so a rule
survives somebody leaving; the jobs are resolved to people in `WHO_TOKENS`
in `app.js`.

State is kept in the browser's local storage, so anything logged during a
meeting survives a refresh. **Reset the demonstration** in the bottom left
puts it back to the starting data.

`SEED_VERSION` in `data.js` and `HR_SEED_VERSION` in `hr-data.js` must be
incremented whenever the sample data changes shape, **and the `?v=` on
every asset in `index.html` bumped with them** — GitHub Pages serves
`max-age=600`, so a guard inside a cached file can never fire. They
change together or not at all. Otherwise anyone who has opened an
earlier build otherwise anyone who has opened an keeps the old data in their browser and never sees the
correction.

## What this is not

It is a front end with realistic behaviour, not a deployed product. There is
no server, no database, no authentication, no email or SMS out, and nothing
is shared between two people looking at it — each browser holds its own copy.

**The notifications are not sent.** The rules run, the recipients are worked
out properly and everything is logged exactly as it would be, but no email
or SMS leaves the browser. Say so plainly if anyone asks in a meeting; the
routing logic is the hard part and it is real, whereas actually delivering
the message is a day's work once there is a server to do it from.
Those are the things that turn this into a system, and they are the next
conversation, not this one.
