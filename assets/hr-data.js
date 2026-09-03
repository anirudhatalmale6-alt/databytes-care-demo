/* ==================================================================
   Human Resources - reference data and sample records

   Built around FORM PM/05 (ANNEX 5), the Government of Seychelles
   Employment Application Form used across the Seychelles Public
   Service. Every field on that form has a home in here.

   Two things the form is NOT, and this file keeps them apart:

     - it is an APPLICATION. It describes somebody who wants a job.
       An employee record needs a dozen things the form has no box
       for: employee number, date joined, the grade actually awarded,
       section, reporting line, leave entitlement, Pension Fund
       number, bank details, probation or confirmed.

     - it is not SPTC's. It is the standard public service form, so
       the shape below is deliberately generic. The employer name is
       a field on the form itself, not a constant in the code.

   EVERYTHING HERE IS INVENTED. The people, identity numbers,
   telephone numbers, bank details, salary figures and grade bands
   are sample data written to look plausible. None of it is real and
   none of it came from SPTC.
   ================================================================== */

const HR_SEED_VERSION = 1;

/* --- the form itself ---------------------------------------------
   Section numbers and titles exactly as printed on PM/05, including
   the fact that the form numbers its last block twice. That is their
   error, not a transcription slip - see the note on DUPLICATE. */
const PM05_SECTIONS = [
  { n: 1,  title: 'Position applied for' },
  { n: 2,  title: 'Personal information' },
  { n: 3,  title: 'Education and training record' },
  { n: 4,  title: 'Languages' },
  { n: 5,  title: 'Driving licence(s)' },
  { n: 6,  title: 'Employment history' },
  { n: 7,  title: 'Availability' },
  { n: 8,  title: 'Description of career' },
  { n: 9,  title: 'References' },
  { n: 10, title: 'Next of kin' },
  { n: 11, title: 'Other relevant particulars' },
  { n: 12, title: 'Interests in private business' },
  { n: 13, title: 'Declaration' },
  { n: 14, title: 'Comments of present employer' },
  { n: 15, title: 'Comments of present employer', duplicate: true }
];

/* Seychelles public service salary grades. The form asks for a grade
   (SG) and a gross annual figure (SR) in the employment history, so
   both have to exist. THE BANDS BELOW ARE ILLUSTRATIVE - they are a
   plausible shape, not the published scale, and must be replaced
   with the real one before anybody quotes a number from this. */
const GRADES = [
  { sg: 'SG3',  min: 78000,  max: 92000,  note: 'General worker, cleaner' },
  { sg: 'SG5',  min: 92000,  max: 112000, note: 'Conductor, storeman' },
  { sg: 'SG7',  min: 112000, max: 138000, note: 'Bus driver, clerk' },
  { sg: 'SG9',  min: 138000, max: 168000, note: 'Senior driver, mechanic' },
  { sg: 'SG11', min: 168000, max: 205000, note: 'Supervisor, technician' },
  { sg: 'SG13', min: 205000, max: 248000, note: 'Officer, senior technician' },
  { sg: 'SG15', min: 248000, max: 302000, note: 'Senior officer' },
  { sg: 'SG17', min: 302000, max: 372000, note: 'Manager' },
  { sg: 'SG19', min: 372000, max: 465000, note: 'Head of section' },
  { sg: 'SG21', min: 465000, max: 585000, note: 'Director' },
  { sg: 'SG23', min: 585000, max: 760000, note: 'Chief executive' }
];

const CONTRACTS = [
  { id: 'perm',  name: 'Permanent' },
  { id: 'fixed', name: 'Fixed term' },
  { id: 'prob',  name: 'Probation' },
  { id: 'casual', name: 'Casual' }
];

const EMP_STATUS = [
  { id: 'confirmed', name: 'Confirmed',   tone: 'ok' },
  { id: 'probation', name: 'On probation', tone: 'warn' },
  { id: 'notice',    name: 'Serving notice', tone: 'bad' },
  { id: 'left',      name: 'Left',        tone: 'off' }
];

const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed'];
const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr'];

/* Section 4 of the form prints these three and leaves two blank rows */
const FORM_LANGUAGES = ['Kreol', 'English', 'French'];
const LANG_LEVELS = ['Mother tongue', 'Fluent', 'Working knowledge', 'Basic', 'None'];

/* Section 5. Seychelles licence classes. */
const LICENCE_CLASSES = [
  { id: 'A',  name: 'A — motorcycle' },
  { id: 'B',  name: 'B — light vehicle' },
  { id: 'C',  name: 'C — goods vehicle' },
  { id: 'D',  name: 'D — bus, over 8 passengers' },
  { id: 'E',  name: 'E — with trailer' }
];

const QUALS = [
  'Primary certificate', 'IGCSE', 'A Level', 'NVQ Level 2', 'NVQ Level 3',
  'Diploma', 'Advanced Diploma', 'Bachelor degree', 'Postgraduate diploma', 'Masters degree'
];

const INSTITUTES = [
  ['Seychelles Institute of Technology', 'Providence, Mahé'],
  ['University of Seychelles', 'Anse Royale, Mahé'],
  ['Seychelles Business Studies Academy', 'Providence, Mahé'],
  ['Seychelles Institute of Agriculture and Horticulture', 'Anse Boileau, Mahé'],
  ['Guy Morel Institute', 'Ma Joie, Mahé'],
  ['Seychelles Maritime Academy', 'Providence, Mahé'],
  ['Belonie Secondary School', 'Belonie, Mahé'],
  ['Plaisance Secondary School', 'Plaisance, Mahé'],
  ['Anse Royale Secondary School', 'Anse Royale, Mahé']
];

const PAST_EMPLOYERS = [
  ['Seychelles Trading Company', 'Latanier Road, Victoria'],
  ['Cable and Wireless Seychelles', 'Francis Rachel Street, Victoria'],
  ['Seychelles Petroleum Company', 'New Port, Victoria'],
  ['Air Seychelles', 'Pointe Larue, Mahé'],
  ['Seychelles Ports Authority', 'New Port, Victoria'],
  ['Ministry of Education', 'Mont Fleuri, Mahé'],
  ['Islands Development Company', 'New Port, Victoria'],
  ['Seychelles Civil Aviation Authority', 'Pointe Larue, Mahé'],
  ['Public Utilities Corporation', 'Roche Caiman, Mahé'],
  ['Hilton Seychelles Northolme', 'Glacis, Mahé']
];

const REASONS_LEAVING = [
  'End of contract', 'Better prospects', 'Relocation', 'Restructuring',
  'Resigned', 'Studies', 'Company closed'
];

const DISTRICTS = [
  'Anse aux Pins', 'Anse Boileau', 'Anse Étoile', 'Anse Royale', 'Baie Lazare',
  'Baie Sainte Anne', 'Beau Vallon', 'Bel Air', 'Bel Ombre', 'Cascade',
  'Glacis', 'Grand Anse Mahé', 'La Digue', 'Les Mamelles', 'Mont Buxton',
  'Mont Fleuri', 'Plaisance', 'Pointe Larue', 'Port Glaud', 'Roche Caiman',
  'Saint Louis', 'Takamaka'
];

const SURNAMES = [
  'Hoareau', 'Payet', 'Confait', 'Adrienne', 'Servina', 'Athanase', 'Cadeau',
  'Freminot', 'Vidot', 'Rose', 'Marie', 'Dugasse', 'Mancienne', 'Bristol',
  'Larue', 'Esparon', 'Julienne', 'Morel', 'Barbé', 'Sinon', 'Nourrice',
  'Alcindor', 'Bonne', 'Camille', 'Denis', 'Ernesta', 'Fanchette', 'Gappy',
  'Hollanda', 'Labiche', 'Melanie', 'Onezime', 'Pool', 'Radegonde',
  'Samson', 'Tirant', 'Valentin', 'Zialor', 'Bibi', 'Chetty'
];
const MALE_NAMES = [
  'Jean-Paul', 'Terence', 'Marcel', 'Georges', 'Ronny', 'Bernard', 'Alvin',
  'Steve', 'Dominic', 'Michel', 'Patrick', 'Andre', 'Wilson', 'Bertrand',
  'Colin', 'Egbert', 'Francis', 'Herve', 'Ivan', 'Joachim', 'Kevin', 'Lloyd'
];
const FEMALE_NAMES = [
  'Régine', 'Sylvia', 'Marie', 'Nadine', 'Clara', 'Tessa', 'Joanna', 'Danielle',
  'Adele', 'Berthe', 'Cynthia', 'Doris', 'Elvina', 'Fabiola', 'Gina', 'Helena',
  'Ingrid', 'Jacqueline', 'Karen', 'Lucie', 'Merna', 'Nella'
];

/* Jobs, and which section each sits in. A bus operator is mostly
   drivers and conductors, and a register that does not look like
   that does not look like a bus operator. */
const JOBS = [
  { title: 'Bus Driver',                   sec: 'ops',    sg: 'SG7',  n: 14, lic: 'D' },
  { title: 'Conductor',                    sec: 'ops',    sg: 'SG5',  n: 6 },
  { title: 'Depot Supervisor',             sec: 'ops',    sg: 'SG11', n: 2 },
  { title: 'Scheduling Officer',           sec: 'ops',    sg: 'SG13', n: 1 },
  { title: 'Bus Operations Manager',       sec: 'ops',    sg: 'SG17', n: 1, head: true },
  { title: 'Director of Operations',       sec: 'ops',    sg: 'SG21', n: 1 },
  { title: 'Mechanic',                     sec: 'fleet',  sg: 'SG9',  n: 5, lic: 'C' },
  { title: 'Auto Electrician',             sec: 'fleet',  sg: 'SG11', n: 1 },
  { title: 'Fleet Maintenance Manager',    sec: 'fleet',  sg: 'SG17', n: 1, head: true },
  { title: 'Customer Care Agent',          sec: 'care',   sg: 'SG9',  n: 3 },
  { title: 'Complaints Desk Supervisor',   sec: 'care',   sg: 'SG13', n: 1 },
  { title: 'Head of Customer Care',        sec: 'care',   sg: 'SG17', n: 1, head: true },
  { title: 'HR Officer',                   sec: 'crew',   sg: 'SG13', n: 2 },
  { title: 'HR Director',                  sec: 'crew',   sg: 'SG19', n: 1, head: true },
  { title: 'Accounts Clerk',               sec: 'fin',    sg: 'SG9',  n: 2 },
  { title: 'Payroll Officer',              sec: 'fin',    sg: 'SG13', n: 1 },
  { title: 'Finance Manager',              sec: 'fin',    sg: 'SG17', n: 1, head: true },
  { title: 'Stops Maintenance Hand',       sec: 'infra',  sg: 'SG3',  n: 3 },
  { title: 'Route Supervisor',             sec: 'infra',  sg: 'SG11', n: 1, head: true },
  { title: 'Safety Officer',               sec: 'safety', sg: 'SG13', n: 1 },
  { title: 'Quality Auditor',              sec: 'safety', sg: 'SG13', n: 1, head: true },
  { title: 'Chief Executive Officer',      sec: 'care',   sg: 'SG23', n: 1 }
];

/* --- helpers ------------------------------------------------------ */
function hrRng(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const DAY = 24 * 3600 * 1000;

function grade(sg) { return GRADES.find(g => g.sg === sg) || GRADES[0]; }
function empStatus(id) { return EMP_STATUS.find(s => s.id === id) || EMP_STATUS[0]; }
function contractName(id) { return (CONTRACTS.find(c => c.id === id) || {}).name || id; }

/* A Seychelles National Identity Number is nine digits and the first
   six encode the date of birth. Generating it FROM the date of birth
   rather than at random means the two agree, which is the first thing
   anybody checking a record would notice. Invented, but consistent. */
function makeNin(dob, rng) {
  const d = new Date(dob);
  const p = n => String(n).padStart(2, '0');
  return p(d.getDate()) + p(d.getMonth() + 1) + p(d.getFullYear() % 100) +
         String(Math.floor(rng() * 900) + 100);
}

function buildHrSeed() {
  const rng = hrRng(20260903);
  const pick = a => a[Math.floor(rng() * a.length)];
  const now = Date.now();
  const employees = [];
  let seq = 0;

  const usedNames = {};
  function person() {
    /* names must not repeat: a register with two identical people in
       it is the first thing anybody spots, and it makes every later
       screen (reporting line, workload, leave) ambiguous */
    for (let attempt = 0; attempt < 200; attempt++) {
      const female = rng() < 0.44;
      const first = pick(female ? FEMALE_NAMES : MALE_NAMES);
      const sur = pick(SURNAMES);
      const key = first + ' ' + sur;
      if (!usedNames[key]) { usedNames[key] = 1; return { first, sur, female }; }
    }
    seq++;
    return { first: 'Name', sur: 'Number' + seq, female: false };
  }

  JOBS.forEach(job => {
    for (let i = 0; i < job.n; i++) {
      const p = person();
      const age = 22 + Math.floor(rng() * 38);
      const dob = now - (age * 365.25 + rng() * 300) * DAY;
      /* nobody can have joined before they were 18, and a head of
         section who joined last month is not credible either */
      const maxService = Math.min(age - 18, job.sg >= 'SG17' ? 30 : 25);
      const serviceY = Math.min(maxService, (job.head ? 6 : 0) + rng() * (maxService - (job.head ? 6 : 0)));
      const joined = now - serviceY * 365.25 * DAY;
      const g = grade(job.sg);
      const onProb = (now - joined) < 180 * DAY;
      const r = rng();

      seq++;
      const empNo = 'E' + String(1000 + seq);
      const initials = (p.first[0] + p.sur[0]).toUpperCase();

      /* Leave: 21 days a year in the Seychelles Employment Act, plus a
         day for every five years of service, capped. Computed rather
         than typed so the number always matches the service. */
      const entitlement = 21 + Math.min(5, Math.floor(serviceY / 5));

      employees.push({
        empNo,
        title: p.female ? (rng() < 0.5 ? 'Mrs' : 'Ms') : 'Mr',
        surname: p.sur,
        firstNames: p.first,
        knownAs: p.first,
        surnameAtBirth: (p.female && rng() < 0.4) ? pick(SURNAMES) : '',
        initials,
        gender: p.female ? 'Female' : 'Male',
        dob: Math.round(dob),
        nin: makeNin(dob, rng),
        nationality: rng() < 0.94 ? 'Seychellois' : pick(['Indian', 'Kenyan', 'Sri Lankan', 'Mauritian']),
        countryOfBirth: 'Seychelles',
        maritalStatus: age < 26 ? 'Single' : pick(MARITAL),
        address: (Math.floor(rng() * 90) + 5) + ' ' + pick(DISTRICTS) + ', Mahé',
        phone: '2 ' + (Math.floor(rng() * 9) + 5) + String(Math.floor(rng() * 90000) + 10000).slice(0, 2) +
               ' ' + String(Math.floor(rng() * 900) + 100),

        /* --- the employment side, none of which is on PM/05 --- */
        section: job.sec,
        position: job.title,
        isHead: !!job.head,
        sg: job.sg,
        salary: Math.round((g.min + rng() * (g.max - g.min)) / 100) * 100,
        joined: Math.round(joined),
        contract: onProb ? 'prob' : (r < 0.86 ? 'perm' : 'fixed'),
        status: onProb ? 'probation' : (r > 0.97 ? 'notice' : 'confirmed'),
        pensionNo: 'SPF' + String(Math.floor(rng() * 900000) + 100000),
        bank: pick(['Absa Seychelles', 'Seychelles Commercial Bank', 'Nouvobanq', 'MCB Seychelles']),
        bankAcc: '****' + String(Math.floor(rng() * 9000) + 1000),

        leaveEntitlement: entitlement,
        leaveTaken: Math.min(entitlement, Math.floor(rng() * (entitlement + 3))),

        licences: job.lic ? (rng() < 0.7 ? ['B', job.lic] : [job.lic]) : (rng() < 0.55 ? ['B'] : []),
        languages: FORM_LANGUAGES.map((l, li) => ({
          language: l,
          level: li === 0 ? 'Mother tongue' : (rng() < 0.72 ? 'Fluent' : 'Working knowledge')
        })),
        education: buildEducation(rng, job.sg),
        history: buildHistory(rng, joined, serviceY),
        nextOfKin: (function () {
          const k = person();
          const kdob = now - (25 + rng() * 40) * 365.25 * DAY;
          return {
            surname: rng() < 0.6 ? p.sur : k.sur,
            firstNames: k.first,
            nin: makeNin(kdob, rng),
            phone: '2 ' + (Math.floor(rng() * 9) + 5) + String(Math.floor(rng() * 90) + 10) +
                   ' ' + String(Math.floor(rng() * 900) + 100),
            address: (Math.floor(rng() * 90) + 5) + ' ' + pick(DISTRICTS) + ', Mahé',
            relationship: pick(['Spouse', 'Mother', 'Father', 'Sister', 'Brother', 'Son', 'Daughter'])
          };
        })()
      });
    }
  });

  /* Reporting line: everybody reports to the head of their section,
     heads report to the Director of Operations, and the Director
     reports to the Chief Executive. Worked out from the register so
     it cannot disagree with it. */
  const ceo = employees.find(e => e.position === 'Chief Executive Officer');
  const dir = employees.find(e => e.position === 'Director of Operations');
  const heads = {};
  employees.forEach(e => { if (e.isHead) heads[e.section] = e; });
  employees.forEach(e => {
    if (e === ceo) e.reportsTo = null;
    else if (e === dir) e.reportsTo = ceo ? ceo.empNo : null;
    else if (e.isHead) e.reportsTo = dir ? dir.empNo : (ceo ? ceo.empNo : null);
    else e.reportsTo = heads[e.section] ? heads[e.section].empNo : (dir ? dir.empNo : null);
  });

  return { employees, vacancies: buildVacancies(rng, now), applications: buildApplications(rng, now, employees) };
}

function buildEducation(rng, sg) {
  const pick = a => a[Math.floor(rng() * a.length)];
  /* how far somebody got broadly tracks the grade they hold */
  const ceiling = ['SG3', 'SG5'].indexOf(sg) !== -1 ? 3
                : ['SG7', 'SG9'].indexOf(sg) !== -1 ? 5
                : ['SG11', 'SG13'].indexOf(sg) !== -1 ? 7 : 9;
  const n = 1 + Math.floor(rng() * 2.4);
  const out = [];
  for (let i = 0; i < n; i++) {
    const inst = pick(INSTITUTES);
    const yEnd = 1988 + Math.floor(rng() * 34);
    const q = QUALS[Math.max(0, Math.min(ceiling, Math.floor(rng() * (ceiling + 1))))];
    out.push({
      course: q + ' course',
      qualification: q,
      subjects: pick([
        'English, Mathematics, Kreol', 'Mechanical engineering', 'Business studies',
        'Accounting, Economics', 'Transport and logistics', 'Information technology',
        'Human resource management', 'Health and safety'
      ]),
      instituteName: inst[0],
      instituteAddress: inst[1],
      entered: yEnd - 1 - Math.floor(rng() * 3),
      left: yEnd
    });
  }
  return out.sort((a, b) => a.left - b.left);
}

function buildHistory(rng, joined, serviceY) {
  const pick = a => a[Math.floor(rng() * a.length)];
  /* somebody with 20 years' service has less history before it than
     somebody who joined last year, which is the whole point */
  const n = serviceY > 15 ? Math.floor(rng() * 2) : Math.floor(rng() * 3.4);
  const out = [];
  let until = joined;
  for (let i = 0; i < n; i++) {
    const emp = pick(PAST_EMPLOYERS);
    const span = (1 + rng() * 6) * 365.25 * DAY;
    const to = until - rng() * 200 * DAY;
    const from = to - span;
    const g = GRADES[Math.floor(rng() * 6)];
    out.push({
      organisation: emp[0], address: emp[1],
      position: pick(['Clerk', 'Driver', 'Assistant', 'Technician', 'Supervisor',
                      'Officer', 'Storeman', 'Receptionist']),
      from: Math.round(from), to: Math.round(to),
      sg: g.sg,
      salary: Math.round((g.min + rng() * (g.max - g.min)) / 100) * 100,
      reason: pick(REASONS_LEAVING)
    });
    until = from;
  }
  return out;
}

function buildVacancies(rng, now) {
  const pick = a => a[Math.floor(rng() * a.length)];
  const posts = [
    { title: 'Bus Driver',             sec: 'ops',    sg: 'SG7',  code: 'OPS-DRV-07', n: 6 },
    { title: 'Conductor',              sec: 'ops',    sg: 'SG5',  code: 'OPS-CON-05', n: 3 },
    { title: 'Mechanic',               sec: 'fleet',  sg: 'SG9',  code: 'FLT-MEC-09', n: 2 },
    { title: 'Customer Care Agent',    sec: 'care',   sg: 'SG9',  code: 'CAR-AGT-09', n: 2 },
    { title: 'Safety Officer',         sec: 'safety', sg: 'SG13', code: 'SAF-OFF-13', n: 1 },
    { title: 'Payroll Officer',        sec: 'fin',    sg: 'SG13', code: 'FIN-PAY-13', n: 1 }
  ];
  return posts.map((p, i) => ({
    id: 'V' + (101 + i),
    title: p.title, section: p.sec, sg: p.sg, code: p.code, posts: p.n,
    employer: 'Seychelles Public Transport Corporation',
    opened: Math.round(now - (10 + rng() * 60) * DAY),
    closes: Math.round(now + (3 + rng() * 40) * DAY)
  }));
}

const APP_STATUS = [
  { id: 'received',    name: 'Received',    tone: 'new' },
  { id: 'shortlisted', name: 'Shortlisted', tone: 'warn' },
  { id: 'interviewed', name: 'Interviewed', tone: 'warn' },
  { id: 'offered',     name: 'Offered',     tone: 'ok' },
  { id: 'hired',       name: 'Hired',       tone: 'ok' },
  { id: 'rejected',    name: 'Not taken forward', tone: 'off' }
];
function appStatus(id) { return APP_STATUS.find(s => s.id === id) || APP_STATUS[0]; }

function buildApplications(rng, now, employees) {
  const pick = a => a[Math.floor(rng() * a.length)];
  const vacancies = buildVacancies(hrRng(20260903), now);
  const used = {};
  employees.forEach(e => { used[e.firstNames + ' ' + e.surname] = 1; });
  const out = [];
  const N = 14;

  /* Deal the stages rather than derive them from a random date. Drawing
     a date first and reading a stage off it left "Shortlisted" empty on
     some runs, and a filter that returns nothing looks like broken
     software rather than a quiet week. Every stage is guaranteed once,
     the rest are weighted, and the DATE is then chosen to suit the
     stage - nothing can be interviewed four days after it arrived. */
  const WINDOW = {
    received:    [0, 12],  shortlisted: [6, 25],  interviewed: [12, 40],
    offered:     [18, 48], hired:       [22, 52], rejected:    [10, 52]
  };
  const WEIGHT = { received: 4, shortlisted: 3, interviewed: 3, offered: 2, hired: 2, rejected: 4 };
  const deck = APP_STATUS.map(s => s.id);          /* one of each, first */
  const bag = [];
  Object.keys(WEIGHT).forEach(k => { for (let i = 0; i < WEIGHT[k]; i++) bag.push(k); });
  while (deck.length < N) deck.push(bag[Math.floor(rng() * bag.length)]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }

  for (let i = 0; i < N; i++) {
    const v = pick(vacancies);
    let first, sur, female;
    for (let a = 0; a < 200; a++) {
      female = rng() < 0.45;
      first = pick(female ? FEMALE_NAMES : MALE_NAMES);
      sur = pick(SURNAMES);
      if (!used[first + ' ' + sur]) { used[first + ' ' + sur] = 1; break; }
    }
    const age = 20 + Math.floor(rng() * 34);
    const dob = now - (age * 365.25 + rng() * 300) * DAY;
    const status = deck[i];
    const w = WINDOW[status];
    const received = now - Math.round(w[0] + rng() * (w[1] - w[0])) * DAY;

    out.push({
      id: 'APP-' + (2026000 + 100 + i),
      status,
      receivedAt: Math.round(received),
      /* 1 */
      positionTitle: v.title, positionCode: v.code, employer: v.employer,
      vacancyId: v.id, section: v.section, sg: v.sg,
      /* 2 */
      title: female ? (rng() < 0.5 ? 'Mrs' : 'Ms') : 'Mr',
      surname: sur, firstNames: first, knownAs: first,
      surnameAtBirth: (female && rng() < 0.35) ? pick(SURNAMES) : '',
      initials: (first[0] + sur[0]).toUpperCase(),
      nin: makeNin(dob, rng),
      dob: Math.round(dob),
      nationality: rng() < 0.93 ? 'Seychellois' : pick(['Indian', 'Kenyan', 'Mauritian']),
      countryOfBirth: 'Seychelles',
      gender: female ? 'Female' : 'Male',
      maritalStatus: age < 25 ? 'Single' : pick(MARITAL),
      address: (Math.floor(rng() * 90) + 5) + ' ' + pick(DISTRICTS) + ', Mahé',
      phone: '2 ' + (Math.floor(rng() * 9) + 5) + String(Math.floor(rng() * 90) + 10) +
             ' ' + String(Math.floor(rng() * 900) + 100),
      /* 3 */
      education: buildEducation(rng, v.sg),
      /* 4 */
      languages: FORM_LANGUAGES.map((l, li) => ({
        language: l, level: li === 0 ? 'Mother tongue' : (rng() < 0.7 ? 'Fluent' : 'Working knowledge')
      })),
      /* 5 */
      licences: v.title === 'Bus Driver' ? (rng() < 0.85 ? ['B', 'D'] : ['B'])
              : (rng() < 0.5 ? ['B'] : []),
      /* 6 */
      history: buildHistory(rng, now, 0),
      /* 7 */
      availableFrom: Math.round(now + (7 + rng() * 60) * DAY),
      /* 8 */
      career: pick([
        'I have driven passenger vehicles for six years and hold a class D licence. I know the Victoria to Beau Vallon corridor well and I am used to early starts.',
        'I have worked front of house in a hotel and I am used to dealing with people who are unhappy. I would like to move into a role with more responsibility.',
        'I completed an NVQ in mechanical engineering and have worked on light commercial vehicles. I would like to work on a larger fleet.',
        'I have been doing accounts work for four years and I am looking for a position where I can use the payroll side of my training.',
        'I am applying because I want steady work close to home and I am willing to be trained.'
      ]),
      /* 9 */
      references: [1, 2].map(() => {
        const rf = pick(female ? FEMALE_NAMES : MALE_NAMES);
        return {
          surname: pick(SURNAMES), firstNames: rf,
          contact: '2 ' + (Math.floor(rng() * 9) + 5) + String(Math.floor(rng() * 90) + 10) +
                   ' ' + String(Math.floor(rng() * 900) + 100),
          address: pick(DISTRICTS) + ', Mahé',
          occupation: pick(['Supervisor', 'Manager', 'Head Teacher', 'Officer', 'Foreman'])
        };
      }),
      contactPresent: rng() < 0.6 ? 'Yes' : 'No',
      contactPast: rng() < 0.85 ? 'Yes' : 'No',
      /* 10 */
      nextOfKin: {
        surname: pick(SURNAMES), firstNames: pick(rng() < 0.5 ? FEMALE_NAMES : MALE_NAMES),
        nin: makeNin(now - (30 + rng() * 30) * 365.25 * DAY, rng),
        phone: '2 ' + (Math.floor(rng() * 9) + 5) + String(Math.floor(rng() * 90) + 10) +
               ' ' + String(Math.floor(rng() * 900) + 100),
        address: pick(DISTRICTS) + ', Mahé',
        relationship: pick(['Spouse', 'Mother', 'Father', 'Sister', 'Brother'])
      },
      /* 11 */
      particulars: pick(['Football, coaching a junior side.', 'Church choir.', 'Fishing.',
                         'Volunteer with the Red Cross.', '', '']),
      /* 12 */
      privateBusiness: rng() < 0.16 ? pick([
        'Part share in a family takeaway at Anse aux Pins.',
        'I run a small taxi at weekends.',
        'Sole trader, minor building work.'
      ]) : '',
      /* 13 */
      declaredAt: Math.round(received),
      /* 14 */
      employerComment: rng() < 0.3 ? {
        name: pick(MALE_NAMES) + ' ' + pick(SURNAMES),
        designation: pick(['Manager', 'Supervisor', 'Head of Department']),
        at: Math.round(received - rng() * 5 * DAY)
      } : null
    });
  }
  return out.sort((a, b) => b.receivedAt - a.receivedAt);
}
