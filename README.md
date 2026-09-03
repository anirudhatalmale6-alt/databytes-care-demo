# SPTC Passenger Care — working demonstration

Prepared for DataBytes Consulting. A clickable customer care and complaints
system for a bus operator, built to be shown in a meeting.

**Live:** https://anirudhatalmale6-alt.github.io/databytes-care-demo/

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

**Brand colour.** SPTC's own colours are not in this yet. Rather than guess
them, the brand colour is a single value driving the rail header, the active
menu item, primary buttons, avatars, focus rings and the chart bars, with a
picker at the bottom of the rail. One click recolours the interface, which
answers "will it be in our colours" in the room instead of in a follow-up
email. When the logo arrives its hex becomes the default and the picker can
go.

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

`SEED_VERSION` in `data.js` must be incremented whenever the sample data
changes shape, otherwise anyone who has opened an earlier build keeps the old
data in their browser and never sees the correction.

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
