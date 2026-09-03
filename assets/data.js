/* ------------------------------------------------------------------
   SPTC Passenger Care - demo data
   ------------------------------------------------------------------
   No real person appears in this file. The staff are DataBytes' own
   placeholder directory (confirmed by the client as dummy names, not
   SPTC employees); the passengers and telephone numbers are invented.
   Route numbers and fleet numbers are illustrative and will need
   replacing with SPTC's real ones before this is shown as anything
   other than a demonstration.

   Ticket ages are stored as "hours ago", not as fixed dates, so the
   service-level clocks are genuinely running whenever the page is
   opened rather than showing a frozen moment.
   ------------------------------------------------------------------ */

const HOUR = 3600 * 1000;

/* Bumped whenever the seed data changes shape. Anybody who opened an
   earlier build has the old data sitting in their browser storage and
   would otherwise never see the corrections.
   6 = the stored session also carries the look and the brand colour. Without
   this bump every earlier visitor keeps theme:'dark' and reports, quite
   reasonably, that the restyle never arrived. */
const SEED_VERSION = 6;

/* --- how quickly each kind of report has to be answered ---------- */
const PRIORITIES = {
  P1: { code: 'P1', label: 'Safety',  respondH: 2,  resolveH: 24  },
  P2: { code: 'P2', label: 'Service', respondH: 8,  resolveH: 72  },
  P3: { code: 'P3', label: 'General', respondH: 24, resolveH: 120 },
  NA: { code: '-',  label: 'No target', respondH: null, resolveH: null }
};

/* --- the sections that actually fix things -----------------------
   A complaint desk does not repair a bus or discipline a driver. It
   owns the passenger and chases whoever does. So every subject has a
   section it belongs to, and choosing the subject is what sends it
   there - the agent does not have to know who deals with what.

   `head` is the person told the moment a case lands. Customer Care
   keeps the case throughout: the section does the work, but nobody
   is allowed to hand the passenger away and forget them.            */
const SECTIONS = [
  { id: 'care',   name: 'Customer Care',           short: 'Care',      head: 'u6',
    what: 'Owns the passenger from first contact to closing letter. Keeps the case even when the work is done elsewhere.' },
  { id: 'ops',    name: 'Operations and Scheduling', short: 'Operations', head: 'u10',
    what: 'Running boards, timetables, cancellations, duplicate workings, timing reviews.' },
  { id: 'crew',   name: 'Crew and Conduct',        short: 'Crew',      head: 'u12',
    what: 'Anything naming a driver or conductor. Identification from the duty roster, interview, retraining, record.' },
  { id: 'fleet',  name: 'Fleet Engineering',       short: 'Fleet',     head: 'u14',
    what: 'Vehicle defects, roadworthiness, anything that takes a bus off the road.' },
  { id: 'infra',  name: 'Stops and Shelters',      short: 'Infra',     head: 'u7',
    what: 'Bus stops, shelters, lighting, timetable boards and the pavement around them.' },
  { id: 'fin',    name: 'Finance and Fares',       short: 'Finance',   head: 'u15',
    what: 'Fare disputes, refunds, reconciliation against the conductor float.' },
  { id: 'safety', name: 'Safety and Compliance',   short: 'Safety',    head: 'u8',
    what: 'Every safety report, investigated independently of the depot that is being complained about.' }
];

const CATEGORIES = [
  { id: 'reckless',   name: 'Dangerous driving',        pri: 'P1', group: 'Safety',  section: 'safety' },
  { id: 'access',     name: 'Accessibility refused',    pri: 'P1', group: 'Safety',  section: 'safety' },
  { id: 'conduct',    name: 'Driver or conductor conduct', pri: 'P2', group: 'Staff', section: 'crew' },
  { id: 'nostop',     name: 'Bus did not stop',         pri: 'P2', group: 'Service', section: 'ops' },
  { id: 'norun',      name: 'Service did not run',      pri: 'P2', group: 'Service', section: 'ops' },
  { id: 'late',       name: 'Late running',             pri: 'P2', group: 'Service', section: 'ops' },
  { id: 'crowding',   name: 'Overcrowding',             pri: 'P2', group: 'Service', section: 'ops' },
  { id: 'fare',       name: 'Fare or change dispute',   pri: 'P3', group: 'Money',   section: 'fin' },
  { id: 'condition',  name: 'Vehicle condition',        pri: 'P3', group: 'Fleet',   section: 'fleet' },
  { id: 'lost',       name: 'Lost property',            pri: 'P3', group: 'Other',   section: 'care' },
  { id: 'stop',       name: 'Bus stop or shelter',      pri: 'P3', group: 'Fleet',   section: 'infra' },
  { id: 'timetable',  name: 'Timetable or route request', pri: 'P3', group: 'Other', section: 'ops' },
  { id: 'compliment', name: 'Compliment',               pri: 'NA', group: 'Praise',  section: 'crew' }
];

const CHANNELS = [
  { id: 'phone',    name: 'Telephone' },
  { id: 'walkin',   name: 'Walk-in, Victoria' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'email',    name: 'Email' },
  { id: 'web',      name: 'Website form' },
  { id: 'letter',   name: 'Letter' }
];

const STATUSES = ['New', 'Assigned', 'In progress', 'Awaiting passenger', 'Resolved', 'Closed'];
const OPEN_STATUSES = ['New', 'Assigned', 'In progress', 'Awaiting passenger'];

/* --- illustrative route list, Mahe -------------------------------
   dest is the far end of the route and mid a point along it. The
   narratives below refer to places through {dest} and {mid} tokens
   rather than naming them outright, so a complaint never mentions a
   village the route does not actually serve. Somebody from SPTC would
   spot that in the first thirty seconds.                             */
const ROUTES = [
  { no: '20', name: 'Victoria - Bel Ombre - Beau Vallon', dest: 'Beau Vallon',      mid: 'Bel Ombre' },
  { no: '21', name: 'Victoria - Glacis - North East Point', dest: 'North East Point', mid: 'Glacis' },
  { no: '22', name: 'Victoria - Anse Etoile',              dest: 'Anse Etoile',     mid: 'Saint Louis' },
  { no: '25', name: 'Victoria - Cascade - Pointe Larue',   dest: 'Pointe Larue',    mid: 'Cascade' },
  { no: '26', name: 'Victoria - Anse aux Pins - Anse Royale', dest: 'Anse Royale',  mid: 'Anse aux Pins' },
  { no: '30', name: 'Victoria - La Misere - Port Glaud',   dest: 'Port Glaud',      mid: 'La Misere' },
  { no: '31', name: 'Victoria - Sans Souci - Grand Anse',  dest: 'Grand Anse',      mid: 'Sans Souci' },
  { no: '32', name: 'Victoria - Baie Lazare - Takamaka',   dest: 'Takamaka',        mid: 'Baie Lazare' },
  { no: '34', name: 'Victoria - Anse Boileau',             dest: 'Anse Boileau',    mid: 'Grand Anse' },
  { no: '37', name: 'Victoria - Les Mamelles - Roche Caiman', dest: 'Roche Caiman', mid: 'Les Mamelles' },
  { no: '40', name: 'Victoria - Providence - Au Cap',      dest: 'Au Cap',          mid: 'Providence' },
  { no: '44', name: 'Beau Vallon - Bel Ombre local',       dest: 'Bel Ombre',       mid: 'Beau Vallon' }
];

/* --- staff -------------------------------------------------------
   These are DataBytes' own placeholder people, taken from the staff
   directory in the demo database, so this screen agrees with anything
   else shown in the same meeting. Confirmed with the client as dummy
   names, not real SPTC employees.

   Joanna Freminot is recorded as on leave, and that is not decoration:
   an agent who is away must not collect new work. The queue will not
   offer her, and the workload panel says why. It is the sort of thing
   an operations manager asks about in the first five minutes.        */
const STAFF = [
  { id: 'u1', name: 'Alvin Servina',    title: 'Customer Care Agent',        role: 'agent',      initials: 'AS', available: true,  sec: 'care' },
  { id: 'u2', name: 'Bernard Athanase', title: 'Customer Care Agent',        role: 'agent',      initials: 'BA', available: true,  sec: 'care' },
  { id: 'u3', name: 'Tessa Cadeau',     title: 'Customer Care Agent',        role: 'agent',      initials: 'TC', available: true,  sec: 'care' },
  { id: 'u4', name: 'Joanna Freminot',  title: 'Customer Care Agent',        role: 'agent',      initials: 'JF', available: false, why: 'on leave', sec: 'care' },
  { id: 'u5', name: 'Régine Vidot',     title: 'Complaints Desk Supervisor', role: 'supervisor', initials: 'RV', available: true,  sec: 'care' },
  { id: 'u6', name: 'Terence Bristol',  title: 'Head of Customer Care',      role: 'supervisor', initials: 'TB', available: true,  sec: 'care' },
  { id: 'u7', name: 'Clara Mancienne',  title: 'Route Supervisor',           role: 'ops',        initials: 'CM', available: true,  sec: 'infra' },
  { id: 'u8', name: 'Ronny Adrienne',   title: 'Quality Auditor',            role: 'ops',        initials: 'RA', available: true,  sec: 'safety' },

  /* the rest of the operator - the people a complaint is actually
     sent to. Same placeholder directory as above.                   */
  { id: 'u9',  name: 'Nadine Hoareau',  title: 'Director of Operations',     role: 'exec',       initials: 'NH', available: true,  sec: 'ops'   },
  { id: 'u10', name: 'Jean-Paul Rose',  title: 'Bus Operations Manager',     role: 'head',       initials: 'JR', available: true,  sec: 'ops'   },
  { id: 'u11', name: 'Marcel Payet',    title: 'Chief Executive Officer',    role: 'exec',       initials: 'MP', available: true,  sec: 'care'  },
  { id: 'u12', name: 'Sylvia Dugasse',  title: 'HR Director',                role: 'head',       initials: 'SD', available: true,  sec: 'crew'  },
  { id: 'u13', name: 'Fabienne Larue',  title: 'HR Officer',                 role: 'member',     initials: 'FL', available: true,  sec: 'crew'  },
  { id: 'u14', name: 'Marie Confait',   title: 'Fleet Maintenance Manager',  role: 'head',       initials: 'MC', available: true,  sec: 'fleet' },
  { id: 'u15', name: 'Georges Marie',   title: 'Finance Manager',            role: 'head',       initials: 'GM', available: true,  sec: 'fin'   },
  { id: 'u16', name: 'Elsie Nourrice',  title: 'Workshop Scheduler',         role: 'member',     initials: 'EN', available: true,  sec: 'fleet' },
  { id: 'u17', name: 'Dora Esparon',    title: 'Training Coordinator',       role: 'member',     initials: 'DE', available: true,  sec: 'crew'  }
];
const AGENTS = STAFF.filter(s => s.role === 'agent');
/* who can actually be given a new case right now */
const ASSIGNABLE = AGENTS.filter(s => s.available);

/* --- who gets told, and when -------------------------------------
   SPTC's own words: the case should go straight to the section that
   resolves it, and a few managers should be told so they can keep
   track. These are the rules that do that. Each one is a sentence a
   manager can read, agree with or cross out - which is the point,
   because this table is the thing to argue about in the next
   meeting, not the software.

   `who` is written in job terms rather than names, so the rule
   survives somebody leaving. Tokens are resolved in app.js.        */
const NOTIFY_RULES = [
  { id: 'R1', on: 'logged',   label: 'Routed to a section',
    who: ['section-head'], how: 'Email and in-system',
    what: 'The head of the receiving section is told the moment a case lands with them.' },

  { id: 'R2', on: 'logged',   label: 'Care keeps oversight',
    who: ['care-head', 'complaints-supervisor'], how: 'In-system',
    what: 'Customer Care is copied on everything, including work it does not do itself, because it still owns the passenger.' },

  { id: 'R3', on: 'logged',   only: 'P1', label: 'Safety report received',
    who: ['safety-head', 'ops-director'], how: 'SMS and email',
    what: 'A safety report reaches the Safety Officer and the Director of Operations immediately, at any hour.' },

  { id: 'R4', on: 'due-soon', label: 'Reply falling due',
    who: ['owner', 'section-head'], how: 'In-system',
    what: 'Sent once three quarters of the reply time has gone and the passenger still has no answer.' },

  { id: 'R5', on: 'breached', label: 'Past target',
    who: ['section-head', 'care-head'], how: 'Email and in-system',
    what: 'The reply target has been missed. This is the escalation, and it goes one level above the person holding the case.' },

  { id: 'R6', on: 'breached', only: 'P1', label: 'Safety case overdue',
    who: ['ops-director', 'ceo'], how: 'SMS and email',
    what: 'A safety case past its target goes to the Director of Operations and the Chief Executive. Nothing sits quietly.' },

  { id: 'R7', on: 'redirected', label: 'Moved between sections',
    who: ['section-head', 'previous-section-head', 'care-head'], how: 'In-system',
    what: 'Both sections are told when a case is redirected, so it cannot be dropped in the gap between them.' },

  { id: 'R8', on: 'resolved',  label: 'Case settled',
    who: ['care-head', 'section-head'], how: 'In-system',
    what: 'The closing answer is copied to Customer Care so what the passenger is told stays consistent.' }
];

/* --- invented passengers ----------------------------------------- */
/* Seychelles mobile numbers are seven digits beginning with 2, written
   as 2 xxx xxx. These are invented but at least they are the right
   shape - a wrongly formatted local number is the sort of small thing
   that makes a demo feel imported from somewhere else. */
const PASSENGERS = [
  ['Danielle Morel', '2 514 407'],   ['Jean-Paul Sinon', '2 721 988'],
  ['Anita Freminot', '2 633 041'],   ['Kevin Nourrice', '2 587 725'],
  ['Lisette Bonne', '2 810 263'],    ['Sylvain Athanase', '2 549 130'],
  ['Nadia Zialor', '2 661 572'],     ['Justine Larue', '2 794 816'],
  ['Bernard Onezime', '2 526 390'],  ['Sabrina Belle', '2 682 154'],
  ['Terence Mancienne', '2 740 937'],['Wilma Savy', '2 598 211'],
  ['Colin Lafortune', '2 614 728'],  ['Marguerite Julie', '2 773 560'],
  ['Dorothy Contoret', '2 551 893'], ['Ronny Uranie', '2 832 604'],
  ['Elsie Camille', '2 627 019'],    ['Patrick Melanie', '2 715 382'],
  ['Georgette Rassool', '2 570 466'],['Ivan Pillay', '2 699 145']
];

/* --- the words that make it feel real ----------------------------- */
const NARRATIVES = {
  reckless: [
    'Driver overtook a lorry on the bend approaching {mid} with passengers standing. Several people were thrown against the rail. I have been using this route for eleven years and I have never been frightened on a bus before.',
    'Bus was travelling far too fast down the hill into {dest}. The driver braked so hard at the stop that an elderly lady fell forward into the step well.',
    'Driver was holding a phone to his ear from {mid} all the way to {dest}. He was steering with one hand the whole way.'
  ],
  access: [
    'My mother uses a wheelchair. The driver said he did not have time to lower the ramp and told us to wait for the next one. The next one was fifty minutes later and did the same thing.',
    'I had my baby in a pram and the conductor told me prams are not allowed at that time of day. Nobody has ever told me this before and it is not written at the stop.',
    'I am registered blind. The driver did not call the stop and did not answer when I asked which stop we were at.'
  ],
  conduct: [
    'The conductor was extremely rude when I asked for a receipt. He said something under his breath to the driver and they both laughed. There were school children on the bus.',
    'Driver refused to wait ten seconds for an old man who was clearly walking towards the stop and could be seen in the mirror. He pulled away deliberately.',
    'I asked politely if the air conditioning could be turned on and was told to get off if I did not like it.'
  ],
  nostop: [
    'I was standing at the shelter with my hand out in clear daylight and the bus drove straight past. It was not full. This is the third time this month at the same stop.',
    'Bus passed the stop at {mid} without slowing. Four of us were waiting.',
    'Driver looked directly at me and carried on. I had to pay for a taxi to get to work and I was still late.'
  ],
  norun: [
    'The 07:15 simply did not come. No notice at the stop, nothing on Facebook. I waited forty minutes and then walked.',
    'Two services in a row cancelled on Sunday morning. People going to church were left standing in the rain.',
    'Last bus of the evening did not run and I was stranded at {dest} with my daughter.'
  ],
  late: [
    'Bus arrived twenty-six minutes after the timetable. This has happened every morning this week and I have had a warning at work.',
    'Consistently late in the afternoon peak. The timetable says every twenty minutes and it is closer to forty.',
    'Departed Victoria nine minutes early, which meant I missed it despite arriving before the printed time.'
  ],
  crowding: [
    'Completely full by {mid} and still picking up. People were pressed against the door. This cannot be safe.',
    'Standing room only for the whole journey with children on board. A second bus is needed on this timing.',
    'So crowded that the conductor could not move through to collect fares.'
  ],
  fare: [
    'I gave a fifty rupee note for a seven rupee fare and was told there was no change and I would have to come back for it. I have not been able to get it back.',
    'Charged twice because the conductor did not remember issuing my ticket. I still have the first ticket.',
    'Was asked for full fare for my six year old, who has always travelled free on this route.'
  ],
  condition: [
    'Water coming through the roof onto the seats on the left hand side. Passengers were standing rather than sit in it.',
    'Seat cushion torn with the metal frame exposed. It caught my leg and tore my trousers.',
    'No working lights inside the bus after dark. Impossible to see the step when getting off.'
  ],
  lost: [
    'Left a black canvas bag with school books and a laptop charger on the seat behind the driver. Getting off at {dest}.',
    'Lost a set of house keys with a small blue dolphin keyring, somewhere between Victoria and {dest}.',
    'My reading glasses in a brown case were left in the overhead rail.'
  ],
  stop: [
    'The shelter roof at this stop has been broken since the last heavy rain. There is nowhere to stand out of the weather.',
    'No lighting at the stop and the pavement is broken. Two people have tripped there in the last month.',
    'The timetable board has faded completely and cannot be read at all.'
  ],
  timetable: [
    'Could an earlier service be considered for the hospital shift change? Staff finishing at 06:00 have no way home.',
    'Requesting a Sunday service on this route. There are now many households along it with no car.',
    'The last bus is too early for anyone working an evening shift in Victoria.'
  ],
  compliment: [
    'I want to record that the driver on this service went out of his way to help my mother with her shopping bags and waited until she was seated before moving off. Please pass this on to him.',
    'The conductor noticed I was unwell and made sure I got off at the clinic rather than my usual stop. Very kind.',
    'Bus was spotless and left exactly on time, three days running. Somebody is doing their job properly and should be told so.'
  ]
};

const RESOLUTIONS = {
  reckless:   'Driver identified from the duty roster and stood down from service pending investigation. Interviewed with union representative present. Retraining on defensive driving scheduled and a written warning placed on file. Passenger telephoned by the Head of Customer Care.',
  access:     'Ramp confirmed serviceable on inspection, so this was a crew decision rather than a fault. Crew briefed. Accessibility obligations re-issued to all depots as a standing notice. Passenger contacted and offered an apology.',
  conduct:    'Crew identified and interviewed. Apology issued to the passenger in writing. Note placed on the crew record and customer-facing conduct raised at the depot briefing.',
  nostop:     'Duty crew identified from the running board. Crew states the bus was at capacity; the load sheet does not support this. Counselled and reminded of the requirement to record a full bus. Passenger contacted.',
  norun:      'Confirmed as a cancellation caused by a vehicle defect with no spare available at that depot. Spare vehicle allocation reviewed. Passenger contacted and the cancellation published retrospectively.',
  late:       'Running times reviewed against the recorded data for the period. Timetable found to be unachievable in the morning peak on this section. Referred to Operations for a timing review at the next timetable change.',
  crowding:   'Loadings surveyed for one week. Peak departure confirmed to be over capacity. Duplicate working requested for the affected timing.',
  fare:       'Change reconciled against the conductor float for that duty. Amount refunded to the passenger in cash at the Victoria office and receipted.',
  condition:  'Vehicle taken out of service and passed to the workshop. Defect rectified and vehicle returned to service. Daily walk-round check re-emphasised with the depot.',
  lost:       'Item recovered at the depot and matched to the description. Passenger notified and collected it from the Victoria office.',
  stop:       'Referred to the infrastructure team with photographs. Works order raised. Passenger informed of the expected date.',
  timetable:  'Logged as a service request and passed to Operations for consideration in the next timetable review. Passenger advised of the process and timescale.',
  compliment: 'Passed to the depot manager and read out at the morning briefing. Recorded on the crew member\'s file as a commendation. Passenger thanked for taking the time to write.'
};

/* --- a small deterministic generator ------------------------------
   Fixed seed, so the demo looks identical every time it is opened.
   Nothing is worse than a demonstration whose numbers move about
   between one showing and the next.                                 */
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

function buildSeed() {
  const rng = makeRng(20260902);
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const now = Date.now();

  /* Weighted so the mix looks like a real transport operator's
     postbag - mostly service and staff issues, a steady trickle of
     money and fleet, and a genuine handful of compliments.          */
  const weights = {
    late: 9, nostop: 8, conduct: 8, norun: 6, crowding: 5, condition: 5,
    fare: 5, lost: 4, reckless: 3, stop: 5, compliment: 4, access: 2, timetable: 2
  };
  const bag = [];
  Object.keys(weights).forEach(k => { for (let i = 0; i < weights[k]; i++) bag.push(k); });

  const tickets = [];
  let n = 0;

  /* --- pass one: when the cases arrived ---------------------------
     How many cases exist depends on which weekdays fall in the last
     21 days, so it changes from one day to the next. The times are
     worked out first, on their own, so that the subjects can then be
     dealt across however many there turn out to be.                 */
  const slots = [];
  for (let day = 20; day >= 0; day--) {
    const dow = new Date(now - day * 24 * HOUR).getDay();
    const base = (dow === 0) ? 1 : (dow === 6) ? 2 : 3;
    const count = base + Math.floor(rng() * 3);

    for (let k = 0; k < count; k++) {
      const hourOfDay = pick([6, 7, 7, 8, 8, 9, 11, 13, 15, 16, 17, 17, 18, 19]);
      const created = now - day * 24 * HOUR - (rng() * 6) * HOUR
                      + (hourOfDay - 12) * HOUR;
      if (created > now) continue;
      slots.push(created);
    }
  }

  /* --- pass two: what each case is about --------------------------
     A weighted draw alone let a section end up holding two cases on
     some dates, because three of the seven sections are reachable
     from a single subject. A board with a 2 on it reads as broken
     software rather than a quiet week, and which day it happens on
     is pure luck - so every section is dealt a floor first and the
     rest of the deck is filled from the weighted bag.               */
  const FLOOR = 4;
  const deck = [];
  SECTIONS.forEach(s => {
    const own = CATEGORIES.filter(c => c.section === s.id).map(c => c.id);
    for (let i = 0; i < FLOOR; i++) deck.push(own[i % own.length]);
  });
  while (deck.length < slots.length) deck.push(bag[Math.floor(rng() * bag.length)]);
  /* shuffled with the same seeded stream, so the guaranteed cases are
     spread over the three weeks instead of parked in the oldest days */
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }

  {
    for (let si = 0; si < slots.length; si++) {
      const created = slots[si];
      const catId = deck[si];
      const cat = CATEGORIES.find(c => c.id === catId);
      const route = pick(ROUTES);
      const [pname, pphone] = pick(PASSENGERS);

      const ageH = (now - created) / HOUR;
      const pri = PRIORITIES[cat.pri];

      /* Older things are more likely to be finished. Anything still
         open after a fortnight is the sort of case that ought to
         embarrass somebody, and a few of those are deliberately left
         in - a demo where everything is tidy proves nothing.        */
      let status;
      const r = rng();
      if (catId === 'compliment')      status = ageH > 48 ? 'Closed' : 'Assigned';
      else if (ageH > 14 * 24)         status = r < 0.90 ? 'Closed' : 'In progress';
      else if (ageH > 5 * 24)          status = r < 0.72 ? 'Closed' : (r < 0.88 ? 'Resolved' : 'Awaiting passenger');
      else if (ageH > 48)              status = r < 0.40 ? 'Resolved' : (r < 0.72 ? 'In progress' : 'Awaiting passenger');
      else if (ageH > 8)               status = r < 0.55 ? 'In progress' : 'Assigned';
      else                             status = r < 0.45 ? 'Assigned' : 'New';

      const assignee = status === 'New' ? null : pick(ASSIGNABLE).id;

      /* first response: usually inside target, sometimes not        */
      let firstResponseAt = null;
      if (status !== 'New') {
        const target = pri.respondH;
        const late = rng() < (cat.pri === 'P1' ? 0.10 : cat.pri === 'P2' ? 0.18 : 0.24);
        const factor = late ? (1.15 + rng() * 1.4) : (0.15 + rng() * 0.7);
        const respH = (target || 12) * factor;
        if (respH < ageH) firstResponseAt = created + respH * HOUR;
      }

      let resolvedAt = null;
      if (status === 'Resolved' || status === 'Closed') {
        const target = pri.resolveH || 72;
        const late = rng() < 0.17;
        const factor = late ? (1.1 + rng() * 1.1) : (0.2 + rng() * 0.72);
        const resH = Math.max(target * factor, (firstResponseAt ? (firstResponseAt - created) / HOUR : 1) + 0.5);
        resolvedAt = created + Math.min(resH, ageH - 0.2) * HOUR;
      }

      n++;
      tickets.push({
        id: 'T' + n,
        ref: 'SPTC-' + new Date(created).getFullYear() + '-' + String(1000 + n).slice(1),
        createdAt: created,
        channel: pick(CHANNELS).id,
        category: catId,
        priority: cat.pri,
        /* where the subject sent it. Held on the case rather than
           looked up, because a case can be redirected by hand and
           must then remember where it actually is.                 */
        section: cat.section,
        routedBy: 'rule',
        routeNo: route.no,
        fleetNo: 'BUS-' + (100 + Math.floor(rng() * 78)),
        incidentAt: created - (rng() * 20) * HOUR,
        passenger: pname,
        phone: pphone,
        summary: null,
        detail: pick(NARRATIVES[catId])
                  .replace(/\{dest\}/g, route.dest)
                  .replace(/\{mid\}/g, route.mid),
        status,
        assignee,
        firstResponseAt,
        resolvedAt,
        resolution: (status === 'Resolved' || status === 'Closed') ? RESOLUTIONS[catId] : null,
        notes: []
      });
    }
  }

  /* Give every ticket a one-line summary built from its own facts,
     which is what an agent scanning a queue actually reads.         */
  tickets.forEach(t => {
    const cat = CATEGORIES.find(c => c.id === t.category);
    t.summary = cat.name + ' - route ' + t.routeNo;
  });

  /* A handful of notes on the older ones so the audit trail is not
     empty when somebody clicks in.                                  */
  tickets.forEach(t => {
    if (t.firstResponseAt) {
      t.notes.push({
        at: t.firstResponseAt, by: t.assignee, kind: 'reply',
        text: 'Telephoned the passenger, apologised and confirmed we are investigating. Reference given.'
      });
    }
    if (t.status === 'In progress' || t.status === 'Awaiting passenger') {
      t.notes.push({
        at: t.createdAt + ((t.firstResponseAt ? (t.firstResponseAt - t.createdAt) / HOUR : 2) + 3) * HOUR,
        by: t.assignee, kind: 'internal',
        text: 'Duty and running board requested from the depot to identify the crew on this working.'
      });
    }
    if (t.resolvedAt) {
      t.notes.push({ at: t.resolvedAt, by: t.assignee, kind: 'resolution', text: t.resolution });
    }
    t.notes.sort((a, b) => a.at - b.at);
  });

  /* A few cases were sent to the wrong section by the subject chosen
     and moved by hand afterwards. Rules get things mostly right and
     never entirely right, and a demo that hides that is selling
     something dishonest. Each redirection is recorded, with a reason,
     on the case itself.                                             */
  const MISROUTES = [
    { from: 'ops',   to: 'fleet',  why: 'Cancellation was caused by a vehicle defect, not a crew or scheduling failure. Passed to the workshop.' },
    { from: 'crew',  to: 'ops',    why: 'Crew acted on a controller instruction. This is a scheduling matter, not a conduct one.' },
    { from: 'fin',   to: 'crew',   why: 'Float reconciled and correct. The issue is how the passenger was spoken to, so it belongs with Crew.' },
    { from: 'infra', to: 'ops',    why: 'Shelter is serviceable. The complaint is really about the timetable displayed on it.' }
  ];
  tickets.forEach(t => {
    if (t.priority === 'P1' || t.category === 'compliment') return;   /* never reroute a safety report by accident */
    /* pick the rule that starts where this case actually is, rather
       than walking the list in order - stepping through the list only
       ever matched its first entry and produced a single misroute */
    const m = MISROUTES.filter(x => x.from === t.section)[0];
    if (!m) return;
    if (rng() > 0.12) return;
    const at = t.createdAt + (0.5 + rng() * 4) * HOUR;
    if (at > Date.now()) return;
    t.redirected = { at, from: m.from, to: m.to, by: 'u5', why: m.why };
    t.section = m.to;
    t.routedBy = 'hand';
    t.notes.push({ at, by: 'u5', kind: 'routing', text: m.why });
    t.notes.sort((a, b) => a.at - b.at);
  });

  return tickets;
}

/* --- the notifications those rules would have sent ---------------
   Built from the cases themselves rather than invented separately,
   so every line in the alert log points at a case that exists and
   says which rule produced it. If somebody asks "why was I told
   about this", there is an answer on the screen.                   */
function buildAlerts(tickets) {
  const out = [];
  const now = Date.now();
  let n = 0;
  const add = (at, ruleId, t, extra) => {
    if (at > now) return;
    n++;
    out.push({ id: 'A' + n, at, rule: ruleId, ticketId: t.id, ref: t.ref, section: t.section, priority: t.priority, extra: extra || null });
  };

  tickets.forEach(t => {
    const pri = PRIORITIES[t.priority];
    add(t.createdAt, 'R1', t);
    add(t.createdAt + 1000, 'R2', t);
    if (t.priority === 'P1') add(t.createdAt + 2000, 'R3', t);

    if (t.redirected) add(t.redirected.at, 'R7', t, { from: t.redirected.from, to: t.redirected.to });

    if (pri.respondH != null) {
      const due = t.createdAt + pri.respondH * HOUR;
      const answered = t.firstResponseAt;
      /* the warning only fires if nobody had answered by then */
      const warnAt = t.createdAt + pri.respondH * 0.75 * HOUR;
      if (!answered || answered > warnAt) add(warnAt, 'R4', t);
      if (!answered || answered > due) {
        add(due, 'R5', t);
        if (t.priority === 'P1') add(due + 1000, 'R6', t);
      }
    }

    if (t.resolvedAt) add(t.resolvedAt, 'R8', t);
  });

  out.sort((a, b) => b.at - a.at);
  /* Everything older than a day is treated as already seen, otherwise
     the unread badge reads like a broken inbox rather than a desk. */
  out.forEach(a => { a.read = a.at < now - 24 * HOUR; });
  return out;
}
