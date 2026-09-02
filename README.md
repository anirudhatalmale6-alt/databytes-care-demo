# SPTC Passenger Care — working demonstration

Prepared for DataBytes Consulting. A clickable customer care and complaints
system for a bus operator, built to be shown in a meeting.

**Live:** https://anirudhatalmale6-alt.github.io/databytes-care-demo/

---

## Everything here is invented

No real data is in this repository. Specifically:

- **Staff** — the seven names are made up. They are not SPTC employees.
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
- **A queue that sorts itself** by what will run out of time first, not by
  what arrived first.
- **Live service-level clocks.** While a case is unanswered the clock shown is
  the *reply* clock, because that is the one a passenger feels. Once somebody
  has replied, it becomes the *resolution* clock. Both are running in real
  time — leave the page open and they move.
- **Two jobs, one system.** The Agent / Supervisor switch in the top bar shows
  the same data as an agent sees it and as the Head of Customer Care sees it.
- **Audit trail** — every case keeps who did what and when, separating
  internal notes from what was said to the passenger.
- **Management view** — volumes over 21 days, subject mix, busiest routes,
  agent workload, and safety reports called out separately.

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
| Screens and behaviour | `assets/app.js` |
| Appearance, light and dark themes | `assets/app.css` |

State is kept in the browser's local storage, so anything logged during a
meeting survives a refresh. **Reset the demonstration** in the bottom left
puts it back to the starting data.

`SEED_VERSION` in `data.js` must be incremented whenever the sample data
changes shape, otherwise anyone who has opened an earlier build keeps the old
data in their browser and never sees the correction.

## What this is not

It is a front end with realistic behaviour, not a deployed product. There is
no server, no database, no authentication, no email or SMS out, and nothing
is shared between two people looking at it — each browser holds its own copy.
Those are the things that turn this into a system, and they are the next
conversation, not this one.
