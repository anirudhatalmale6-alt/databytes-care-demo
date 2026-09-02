/* ------------------------------------------------------------------
   SPTC Passenger Care - demo data
   ------------------------------------------------------------------
   Everything in this file is INVENTED. The staff names, the passenger
   names and the phone numbers are made up. Route numbers and fleet
   numbers are illustrative and will need replacing with SPTC's real
   ones before this is shown as anything other than a demonstration.

   Ticket ages are stored as "hours ago", not as fixed dates, so the
   service-level clocks are genuinely running whenever the page is
   opened rather than showing a frozen moment.
   ------------------------------------------------------------------ */

const HOUR = 3600 * 1000;

/* Bumped whenever the seed data changes shape. Anybody who opened an
   earlier build has the old data sitting in their browser storage and
   would otherwise never see the corrections. */
const SEED_VERSION = 3;

/* --- how quickly each kind of report has to be answered ---------- */
const PRIORITIES = {
  P1: { code: 'P1', label: 'Safety',  respondH: 2,  resolveH: 24  },
  P2: { code: 'P2', label: 'Service', respondH: 8,  resolveH: 72  },
  P3: { code: 'P3', label: 'General', respondH: 24, resolveH: 120 },
  NA: { code: '-',  label: 'No target', respondH: null, resolveH: null }
};

const CATEGORIES = [
  { id: 'reckless',   name: 'Dangerous driving',        pri: 'P1', group: 'Safety' },
  { id: 'access',     name: 'Accessibility refused',    pri: 'P1', group: 'Safety' },
  { id: 'conduct',    name: 'Driver or conductor conduct', pri: 'P2', group: 'Staff' },
  { id: 'nostop',     name: 'Bus did not stop',         pri: 'P2', group: 'Service' },
  { id: 'norun',      name: 'Service did not run',      pri: 'P2', group: 'Service' },
  { id: 'late',       name: 'Late running',             pri: 'P2', group: 'Service' },
  { id: 'crowding',   name: 'Overcrowding',             pri: 'P2', group: 'Service' },
  { id: 'fare',       name: 'Fare or change dispute',   pri: 'P3', group: 'Money' },
  { id: 'condition',  name: 'Vehicle condition',        pri: 'P3', group: 'Fleet'   },
  { id: 'lost',       name: 'Lost property',            pri: 'P3', group: 'Other'   },
  { id: 'stop',       name: 'Bus stop or shelter',      pri: 'P3', group: 'Fleet'   },
  { id: 'timetable',  name: 'Timetable or route request', pri: 'P3', group: 'Other' },
  { id: 'compliment', name: 'Compliment',               pri: 'NA', group: 'Praise'  }
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

/* --- invented staff ---------------------------------------------- */
const STAFF = [
  { id: 'u1', name: 'Marie-Claire Rose',  title: 'Customer Care Agent',       role: 'agent',      initials: 'MR' },
  { id: 'u2', name: 'Terry Confait',      title: 'Customer Care Agent',       role: 'agent',      initials: 'TC' },
  { id: 'u3', name: 'Wilna Adrienne',     title: 'Customer Care Agent',       role: 'agent',      initials: 'WA' },
  { id: 'u4', name: 'Clifford Servina',   title: 'Customer Care Agent',       role: 'agent',      initials: 'CS' },
  { id: 'u5', name: 'Roselyn Labiche',    title: 'Complaints Desk Supervisor', role: 'supervisor', initials: 'RL' },
  { id: 'u6', name: 'Bernard Esparon',    title: 'Head of Customer Care',     role: 'supervisor', initials: 'BE' },
  { id: 'u7', name: 'Gerard Radegonde',   title: 'Route Supervisor',          role: 'ops',        initials: 'GR' }
];
const AGENTS = STAFF.filter(s => s.role === 'agent');

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
    fare: 4, lost: 4, reckless: 3, stop: 3, compliment: 4, access: 2, timetable: 2
  };
  const bag = [];
  Object.keys(weights).forEach(k => { for (let i = 0; i < weights[k]; i++) bag.push(k); });

  const tickets = [];
  let n = 0;

  /* 21 days of history, busier on weekdays and in the morning peak  */
  for (let day = 20; day >= 0; day--) {
    const dow = new Date(now - day * 24 * HOUR).getDay();
    const base = (dow === 0) ? 1 : (dow === 6) ? 2 : 3;
    const count = base + Math.floor(rng() * 3);

    for (let k = 0; k < count; k++) {
      const catId = pick(bag);
      const cat = CATEGORIES.find(c => c.id === catId);
      const route = pick(ROUTES);
      const [pname, pphone] = pick(PASSENGERS);
      const hourOfDay = pick([6, 7, 7, 8, 8, 9, 11, 13, 15, 16, 17, 17, 18, 19]);
      const created = now - day * 24 * HOUR - (rng() * 6) * HOUR
                      + (hourOfDay - 12) * HOUR;
      if (created > now) continue;

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

      const assignee = status === 'New' ? null : pick(AGENTS).id;

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

  return tickets;
}
