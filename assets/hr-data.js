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

const HR_SEED_VERSION = 4;

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

/* ==================================================================
   REFERENCE TABLES

   Everything the specification marks (SELECT) has to come from a list
   somebody can maintain, otherwise the first time SPTC opens a depot
   or adds an allowance the answer is "that needs a developer". These
   are the lists. The two the specification asks for by name -
   Department and Position - are editable on screen, because they are
   the two that change.
   ================================================================== */

const DUTY_TYPES = ['Full time', 'Part time', 'Consultant', 'Casual', 'Attachment'];

const DEPENDANT_TYPES = ['Spouse', 'Child', 'Mother', 'Father', 'Brother', 'Sister', 'Other'];

const RELATIONSHIPS = ['Spouse', 'Mother', 'Father', 'Sister', 'Brother',
                       'Son', 'Daughter', 'Aunt', 'Uncle', 'Friend'];

const BLOOD_TYPES = ['O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−'];

const RELIGIONS = ['Roman Catholic', 'Anglican', 'Other Christian', 'Hindu',
                   'Muslim', 'Bahá’í', 'None', 'Prefer not to say'];

const COUNTRIES = ['Seychelles', 'India', 'Sri Lanka', 'Kenya', 'Mauritius',
                   'Madagascar', 'Philippines', 'Bangladesh', 'United Kingdom',
                   'France', 'South Africa', 'Other'];

const BANKS = [
  { name: 'Absa Bank Seychelles',        branches: ['Victoria House, Victoria', 'Providence', 'Beau Vallon', 'Praslin'] },
  { name: 'Seychelles Commercial Bank',  branches: ['Kingsgate House, Victoria', 'Anse Royale', 'Praslin'] },
  { name: 'Nouvobanq',                   branches: ['Victoria House, Victoria', 'Providence', 'Praslin'] },
  { name: 'MCB Seychelles',              branches: ['Caravelle House, Victoria', 'Providence', 'Beau Vallon'] },
  { name: 'Bank of Ceylon',              branches: ['Victoria'] }
];

/* Allowances are added to basic pay to make gross. Each one is either
   a flat monthly amount or a percentage of basic - the specification
   says "SELECT", but a list of names with no amounts cannot produce a
   gross figure, so the amount lives on the table entry. */
const ALLOWANCES = [
  { id: 'house',   name: 'Housing',              kind: 'flat', amount: 2500 },
  { id: 'trans',   name: 'Transport',            kind: 'flat', amount: 1200 },
  { id: 'skill',   name: 'Scarce skills',        kind: 'pct',  amount: 10 },
  { id: 'shift',   name: 'Shift and night duty', kind: 'flat', amount: 1800 },
  { id: 'resp',    name: 'Responsibility',       kind: 'pct',  amount: 7.5 },
  { id: 'meal',    name: 'Meal',                 kind: 'flat', amount: 700 },
  { id: 'uniform', name: 'Uniform upkeep',       kind: 'flat', amount: 400 },
  { id: 'acting',  name: 'Acting appointment',   kind: 'pct',  amount: 12 }
];

/* Deductions. The specification asks for "Gross net" as though it were
   one field. It is two: gross is basic plus allowances, net is gross
   less deductions, and nothing can work out net without knowing which
   deductions apply. These are a placeholder - the income tax bands and
   the Pension Fund rate must be confirmed before any figure is used. */
const DEDUCTIONS = [
  { id: 'spf',  name: 'Seychelles Pension Fund (employee share)', kind: 'pct', amount: 3,  statutory: true },
  { id: 'tax',  name: 'Income tax (illustrative flat rate)',      kind: 'pct', amount: 15, statutory: true },
  { id: 'loan', name: 'Salary advance recovery',                  kind: 'flat', amount: 0 },
  { id: 'union', name: 'Union subscription',                      kind: 'flat', amount: 100 }
];

const MEDICAL_SCHEMES = [
  'Government scheme — Seychelles Hospital',
  'Company scheme — in-patient and out-patient',
  'Company scheme — in-patient only',
  'Private insurance, employee contributes'
];

const HOSPITALS = [
  'Seychelles Hospital, Mont Fleuri',
  'Anse Royale Hospital',
  'Baie Sainte Anne Hospital, Praslin',
  'La Digue Hospital',
  'Logan Hospital, Praslin',
  'English River Health Centre',
  'Beau Vallon Health Centre',
  'Private clinic'
];

const SICKNESS = ['Fever', 'Influenza', 'COVID-19', 'Hypertension', 'Diabetes',
                  'Back injury', 'Gastroenteritis', 'Dengue', 'Migraine',
                  'Post-operative recovery', 'Maternity related', 'Other'];

const HEALTH_STATUS = ['Fit to work', 'Unfit to work', 'Fit for light duties'];

/* --- leave ------------------------------------------------------- */
const LEAVE_TYPES = [
  { id: 'annual',  name: 'Annual leave',       deducts: true,  cert: false,
    note: 'Comes off the annual entitlement.' },
  { id: 'sick',    name: 'Sick leave',         deducts: false, cert: true,
    note: 'Does not touch annual leave. A medical certificate is required.' },
  { id: 'mat',     name: 'Maternity leave',    deducts: false, cert: true,
    note: 'Statutory. Does not touch annual leave.' },
  { id: 'pat',     name: 'Paternity leave',    deducts: false, cert: false,
    note: 'Statutory. Does not touch annual leave.' },
  { id: 'compass', name: 'Compassionate leave', deducts: false, cert: false,
    note: 'Bereavement. Does not touch annual leave.' },
  { id: 'sabbat',  name: 'Sabbatical',         deducts: false, cert: false,
    note: 'Unpaid unless agreed otherwise. Does not touch annual leave.' },
  { id: 'unpaid',  name: 'Unpaid leave',       deducts: false, cert: false,
    note: 'Recorded so the payroll can stop pay for the period.' }
];
function leaveType(id) { return LEAVE_TYPES.find(t => t.id === id) || LEAVE_TYPES[0]; }

const LEAVE_STATUS = [
  { id: 'draft',     name: 'Draft',              tone: 'off'  },
  { id: 'submitted', name: 'Awaiting decision',  tone: 'warn' },
  { id: 'approved',  name: 'Approved',           tone: 'ok'   },
  { id: 'declined',  name: 'Declined',           tone: 'bad'  },
  { id: 'cancelled', name: 'Cancelled',          tone: 'off'  }
];
function leaveStatus(id) { return LEAVE_STATUS.find(s => s.id === id) || LEAVE_STATUS[0]; }

/* --- public holidays ---------------------------------------------
   A leave application that runs over Independence Day must not charge
   the employee for it, so the holidays have to be known. The movable
   feasts are COMPUTED from Easter rather than typed, so the table is
   right for any year without somebody remembering to extend it.

   THE FIXED DATES BELOW ARE MY LIST, NOT A GAZETTE. They are editable
   on screen for exactly that reason - confirm them against the
   published notice before a leave balance is relied on. */
const FIXED_HOLIDAYS = [
  { md: '01-01', name: 'New Year’s Day' },
  { md: '01-02', name: 'New Year Holiday' },
  { md: '05-01', name: 'Labour Day' },
  { md: '06-18', name: 'Constitution Day' },
  { md: '06-29', name: 'Independence (National) Day' },
  { md: '08-15', name: 'Assumption — La Digue Festival' },
  { md: '11-01', name: 'All Saints’ Day' },
  { md: '12-08', name: 'Feast of the Immaculate Conception' },
  { md: '12-25', name: 'Christmas Day' }
];

/* Anonymous Gregorian computus. Easter drives Good Friday, Holy
   Saturday and Corpus Christi, which is why it is worth computing. */
function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31);
  const da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
}
function dayKey(d) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') +
         '-' + String(x.getDate()).padStart(2, '0');
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

/* Every holiday in one year, fixed and movable together. */
function holidaysIn(year) {
  const easter = easterSunday(year);
  const out = FIXED_HOLIDAYS.map(h => ({ key: year + '-' + h.md, name: h.name, moves: false }));
  out.push({ key: dayKey(addDays(easter, -2)), name: 'Good Friday', moves: true });
  out.push({ key: dayKey(addDays(easter, -1)), name: 'Holy Saturday', moves: true });
  out.push({ key: dayKey(easter),              name: 'Easter Sunday', moves: true });
  out.push({ key: dayKey(addDays(easter, 60)), name: 'Corpus Christi', moves: true });
  return out.sort((a, b) => a.key < b.key ? -1 : 1);
}
/* Cached because the leave screens ask this per day of every request. */
const _holCache = {};
function holidayMap(year) {
  if (!_holCache[year]) {
    const m = {};
    holidaysIn(year).forEach(h => { m[h.key] = h.name; });
    _holCache[year] = m;
  }
  return _holCache[year];
}
function holidayName(d) { return holidayMap(new Date(d).getFullYear())[dayKey(d)] || null; }

/* Working days between two dates inclusive, skipping weekends and
   public holidays.

   The specification says the employee enters "Number of Days
   requesting". Left as a typed number it disagrees with the dates
   sooner or later, and the disagreement is invisible. Counting it from
   the dates is the only version that cannot drift - and it is the only
   version that gets Friday-to-Monday right, which is two days, not
   four. */
function workingDays(fromMs, toMs) {
  if (!fromMs || !toMs || toMs < fromMs) return { days: 0, weekend: 0, holidays: [] };
  let days = 0, weekend = 0;
  const holidays = [];
  let d = new Date(fromMs); d.setHours(12, 0, 0, 0);
  const end = new Date(toMs); end.setHours(12, 0, 0, 0);
  let guard = 0;
  while (d <= end && guard++ < 1000) {
    const dow = d.getDay();
    const hol = holidayName(d);
    if (dow === 0 || dow === 6) weekend++;
    else if (hol) holidays.push({ key: dayKey(d), name: hol });
    else days++;
    d = addDays(d, 1);
  }
  return { days, weekend, holidays };
}

/* --- entitlement -------------------------------------------------
   "Auto calculate from the date joined" - two different things hide in
   that sentence and both matter:

     1. how much service somebody has, which raises the entitlement
     2. WHEN in the year they joined, which lowers it for that year

   Somebody who started in October has not earned twenty-one days by
   December. Pro-rating the joining year is the part that is normally
   missed, and it is the part that causes an argument in January. */
function leaveEntitlement(employee, year) {
  const y = year || new Date().getFullYear();
  const joined = new Date(employee.joined);
  const serviceY = (new Date(y, 11, 31) - joined) / (365.25 * DAY);
  const base = 21 + Math.min(5, Math.floor(Math.max(0, serviceY) / 5));
  if (joined.getFullYear() < y) {
    return { days: base, base, prorated: false, months: 12,
             why: '21 days by statute, plus ' + (base - 21) + ' for ' +
                  Math.floor(serviceY) + ' years of service.' };
  }
  if (joined.getFullYear() > y) {
    return { days: 0, base, prorated: true, months: 0, why: 'Joined after this leave year.' };
  }
  /* joined during the year: count the whole month they started in */
  const months = 12 - joined.getMonth();
  const days = Math.round(base * months / 12);
  return { days, base, prorated: true, months,
           why: base + ' days for a full year, pro-rated to ' + months +
                ' of 12 months because they joined in ' +
                joined.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '.' };
}

/* The balance. Days come off when a request is APPROVED, never when it
   is submitted - a declined or cancelled request that had already
   eaten somebody's entitlement is a bug nobody finds until they are
   refused leave they are owed. Pending days are shown separately so
   the supervisor can see what the balance WOULD be. */
function leaveBalance(employee, year) {
  const y = year || new Date().getFullYear();
  const ent = leaveEntitlement(employee, y);
  const mine = (state.hr.leave || []).filter(l =>
    l.empNo === employee.empNo && l.year === y && leaveType(l.type).deducts);
  const taken = mine.filter(l => l.status === 'approved')
                    .reduce((n, l) => n + l.days, 0);
  const pending = mine.filter(l => l.status === 'submitted')
                      .reduce((n, l) => n + l.days, 0);
  return { year: y, entitlement: ent.days, why: ent.why, prorated: ent.prorated,
           taken, pending, remaining: ent.days - taken,
           ifAllApproved: ent.days - taken - pending };
}

/* --- discipline --------------------------------------------------- */
const DISC_ACTIONS = [
  { id: 'verbal',  name: 'Verbal warning',  tone: 'warn' },
  { id: 'written', name: 'Written warning', tone: 'warn' },
  { id: 'final',   name: 'Final warning',   tone: 'bad'  },
  { id: 'suspend', name: 'Suspension pending investigation', tone: 'bad' }
];
const DISC_BY = ['Line manager', 'Head of section', 'HR Officer',
                 'HR Committee', 'Chief Executive Officer'];
const DISC_OUTCOMES = [
  { id: 'open',      name: 'Open — no decision yet', tone: 'new' },
  { id: 'reinstate', name: 'Re-instated',            tone: 'ok'  },
  { id: 'warned',    name: 'Warning stands',         tone: 'warn' },
  { id: 'demoted',   name: 'Demoted',                tone: 'bad' },
  { id: 'dismissed', name: 'Dismissed',              tone: 'bad' },
  { id: 'withdrawn', name: 'Withdrawn',              tone: 'off' }
];
function discAction(id) { return DISC_ACTIONS.find(a => a.id === id) || DISC_ACTIONS[0]; }
function discOutcome(id) { return DISC_OUTCOMES.find(a => a.id === id) || DISC_OUTCOMES[0]; }

/* --- announcements ------------------------------------------------ */
const ANN_TYPES = ['General notice', 'Policy', 'Roster change', 'Safety notice',
                   'Training', 'Vacancy', 'Social', 'Urgent'];

/* --- helpers ------------------------------------------------------ */
function hrRng(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const DAY = 24 * 3600 * 1000;

/* ------------------------------------------------------------------
   Department and Position tables

   The specification asks for both as maintainable lists. They are also
   the join between the two modules: Passenger Care routes a complaint
   to a DEPARTMENT, and HR employs people into the same department. One
   list, two modules - which is what "centralised" has to mean if it
   means anything.

   secList() returns the ACTIVE departments, for pickers. sec() must
   still find a retired one, because a case or an employee record from
   two years ago can point at a department that no longer exists, and
   showing "undefined" on an old record is worse than showing a
   department marked closed.
   ------------------------------------------------------------------ */
function buildDepartments() {
  return SECTIONS.map((s, i) => ({
    id: s.id, name: s.name, short: s.short, head: s.head, what: s.what,
    code: 'D' + String(10 + i), active: true, fromSeed: true
  }));
}
function secList() {
  const d = (typeof state !== 'undefined' && state && state.hr && state.hr.departments);
  return d ? d.filter(x => x.active) : SECTIONS;
}
function allDepartments() {
  const d = (typeof state !== 'undefined' && state && state.hr && state.hr.departments);
  return d || SECTIONS;
}

/* Position codes are generated from the department and the title so
   they are readable, then made unique - two positions sharing a code
   is the defect that makes a payroll export land in the wrong cost
   centre, and it is invisible until it happens. */
function buildPositions() {
  const used = {};
  return JOBS.map(j => {
    const stem = j.sec.slice(0, 3).toUpperCase() + '-' +
      j.title.replace(/[^A-Za-z ]/g, '').split(/\s+/)
        .map(w => w[0]).join('').slice(0, 3).toUpperCase();
    let code = stem + '-' + j.sg.replace('SG', '');
    let n = 1;
    while (used[code]) code = stem + (++n) + '-' + j.sg.replace('SG', '');
    used[code] = 1;
    return { code, title: j.title, dept: j.sec, sg: j.sg, active: true,
             head: !!j.head, licence: j.lic || null };
  });
}
function positionByTitle(t) {
  return (state.hr.positions || []).find(p => p.title === t) || null;
}

/* --- pay ----------------------------------------------------------
   Three of the numbers in the specification can contradict each other:
   basic salary, monthly work hours, and rate per hour. Only two of
   them can be independent. Basic and hours are the inputs here and the
   rate is DERIVED, so it cannot drift. If SPTC pays the hourly rate
   and derives the salary instead, this is the one function to invert. */
const HOURS_PER_MONTH = 173.33;   /* 40 hours a week averaged over a year */

function payBreakdown(e) {
  const basic = Math.round(e.salary / 12);
  const lines = (e.allowances || []).map(a => {
    const def = ALLOWANCES.find(x => x.id === (a.id || a)) || { name: a.id || a, kind: 'flat', amount: 0 };
    const amount = def.kind === 'pct' ? Math.round(basic * def.amount / 100) : def.amount;
    return { name: def.name, kind: def.kind, rate: def.amount, amount };
  });
  const allowances = lines.reduce((n, l) => n + l.amount, 0);
  const gross = basic + allowances;
  const deductions = DEDUCTIONS.filter(d => d.amount > 0).map(d => ({
    name: d.name, statutory: d.statutory,
    amount: d.kind === 'pct' ? Math.round(gross * d.amount / 100) : d.amount
  }));
  const totalDed = deductions.reduce((n, d) => n + d.amount, 0);
  const hours = e.hoursPerMonth || HOURS_PER_MONTH;
  return {
    basic, lines, allowances, gross, deductions, totalDed,
    net: gross - totalDed,
    hours, rate: Math.round(basic / hours * 100) / 100
  };
}

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

      const foreigner = !(rng() < 0.94);
      const district = pick(DISTRICTS);
      const bank = pick(BANKS);
      /* allowances follow the job, not a coin toss: a driver gets shift
         and uniform, a manager gets responsibility */
      const allow = [];
      if (['SG3', 'SG5', 'SG7', 'SG9'].indexOf(job.sg) !== -1) {
        allow.push({ id: 'uniform' });
        if (rng() < 0.75) allow.push({ id: 'shift' });
        if (rng() < 0.5) allow.push({ id: 'meal' });
      } else {
        if (rng() < 0.8) allow.push({ id: 'resp' });
        if (rng() < 0.5) allow.push({ id: 'trans' });
      }
      if (job.head || job.sg === 'SG21' || job.sg === 'SG23') allow.push({ id: 'house' });
      if (foreigner) allow.push({ id: 'skill' });

      const marital = age < 26 ? 'Single' : pick(MARITAL);
      /* Dependants have to agree with the rest of the record: no spouse
         for somebody recorded as single, and no child older than the
         parent. A register that contradicts itself is the first thing
         anybody notices in a demonstration. */
      const dependants = [];
      if (marital === 'Married') {
        dependants.push({ type: 'Spouse', name: (p.female ? pick(MALE_NAMES) : pick(FEMALE_NAMES)) + ' ' + p.sur,
                          dob: Math.round(now - (age - 4 + rng() * 8) * 365.25 * DAY) });
      }
      const kids = age < 24 ? 0 : Math.floor(rng() * (marital === 'Single' ? 1.6 : 3.4));
      for (let c = 0; c < kids; c++) {
        const kAge = Math.min(age - 18, 1 + Math.floor(rng() * 22));
        dependants.push({ type: 'Child', name: pick(rng() < 0.5 ? FEMALE_NAMES : MALE_NAMES) + ' ' + p.sur,
                          dob: Math.round(now - kAge * 365.25 * DAY) });
      }

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
        nationality: foreigner ? pick(['Indian', 'Kenyan', 'Sri Lankan', 'Mauritian']) : 'Seychellois',
        countryOfBirth: foreigner ? pick(['India', 'Kenya', 'Sri Lanka', 'Mauritius']) : 'Seychelles',
        maritalStatus: marital,
        address: (Math.floor(rng() * 90) + 5) + ' ' + district + ', Mahé',
        district,
        subDistrict: pick(['Upper', 'Lower', 'Central', 'Coastal', 'Hill']) + ' ' + district,
        phone: '2 ' + (Math.floor(rng() * 9) + 5) + String(Math.floor(rng() * 90000) + 10000).slice(0, 2) +
               ' ' + String(Math.floor(rng() * 900) + 100),

        /* --- asked for by the specification, not on PM/05 --- */
        middleNames: rng() < 0.45 ? pick(p.female ? FEMALE_NAMES : MALE_NAMES) : '',
        email: (p.first.replace(/[^A-Za-z]/g, '') + '.' + p.sur.replace(/[^A-Za-z]/g, '')).toLowerCase() + '@sptc.sc',
        passportNo: (foreigner || rng() < 0.35)
          ? String.fromCharCode(65 + Math.floor(rng() * 26)) + String(Math.floor(rng() * 900000) + 100000) : '',
        religion: pick(RELIGIONS),
        bloodType: pick(BLOOD_TYPES),
        photo: null,                       /* uploaded on the record */
        documents: [],
        dependants,

        /* --- the employment side, none of which is on PM/05 --- */
        section: job.sec,
        position: job.title,
        positionCode: null,                /* filled from the position table below */
        dutyType: rng() < 0.9 ? 'Full time' : pick(['Part time', 'Consultant', 'Casual']),
        isHead: !!job.head,
        sg: job.sg,
        salary: Math.round((g.min + rng() * (g.max - g.min)) / 100) * 100,
        hoursPerMonth: HOURS_PER_MONTH,
        allowances: allow,
        medicalBenefit: rng() < 0.72,
        medicalScheme: pick(MEDICAL_SCHEMES),
        /* Two dates the specification asks for separately, and they are
           genuinely different: hired is when the offer was accepted,
           joined is the first day at work. Service and leave are
           counted from JOINED. */
        hiredOn: Math.round(joined - (7 + rng() * 45) * DAY),
        joined: Math.round(joined),
        retiredOn: null,
        contract: onProb ? 'prob' : (r < 0.86 ? 'perm' : 'fixed'),
        status: onProb ? 'probation' : (r > 0.97 ? 'notice' : 'confirmed'),
        workPermit: foreigner,
        foreigner,
        permitCountry: foreigner ? pick(['India', 'Kenya', 'Sri Lanka', 'Mauritius']) : '',
        gopNo: foreigner ? 'GOP' + String(Math.floor(rng() * 90000) + 10000) : '',
        pensionNo: 'SPF' + String(Math.floor(rng() * 900000) + 100000),
        bank: bank.name,
        bankBranch: pick(bank.branches),
        bankAcc: String(Math.floor(rng() * 9000) + 1000) + ' ' +
                 String(Math.floor(rng() * 9000) + 1000) + ' ' +
                 String(Math.floor(rng() * 9000) + 1000),

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

  const positions = buildPositions();
  employees.forEach(e => {
    const p = positions.find(x => x.title === e.position);
    e.positionCode = p ? p.code : null;
  });

  const leave = buildLeave(rng, now, employees);
  return {
    employees,
    departments: buildDepartments(),
    positions,
    vacancies: buildVacancies(rng, now),
    applications: buildApplications(rng, now, employees),
    leave,
    discipline: buildDiscipline(rng, now, employees),
    announcements: buildAnnouncements(rng, now, employees),
    leaveSeq: leave.length,
    discSeq: 0,
    annSeq: 0
  };
}

/* ------------------------------------------------------------------
   Leave applications

   Dates are drawn first and the day count is COUNTED from them, never
   invented, so every row in the sample agrees with its own dates -
   including the ones that straddle a weekend or Independence Day.
   ------------------------------------------------------------------ */
function buildLeave(rng, now, employees) {
  const pick = a => a[Math.floor(rng() * a.length)];
  const out = [];
  const year = new Date(now).getFullYear();
  const N = 34;

  /* Guarantee one of each status and one of each leave type, then
     weight the rest. A filter that comes back empty in a meeting looks
     like broken software rather than a quiet month. */
  const deck = LEAVE_STATUS.filter(s => s.id !== 'draft').map(s => s.id);
  const bag = ['approved', 'approved', 'approved', 'approved', 'submitted',
               'submitted', 'submitted', 'declined', 'cancelled'];
  while (deck.length < N) deck.push(bag[Math.floor(rng() * bag.length)]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }
  const typeDeck = LEAVE_TYPES.map(t => t.id);
  const typeBag = ['annual', 'annual', 'annual', 'annual', 'annual',
                   'sick', 'sick', 'sick', 'compass', 'unpaid'];
  while (typeDeck.length < N) typeDeck.push(typeBag[Math.floor(rng() * typeBag.length)]);
  for (let i = typeDeck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = typeDeck[i]; typeDeck[i] = typeDeck[j]; typeDeck[j] = t;
  }

  const heads = {};
  employees.forEach(e => { if (e.isHead) heads[e.section] = e; });

  for (let i = 0; i < N; i++) {
    const e = employees[Math.floor(rng() * employees.length)];
    const status = deck[i];
    const type = typeDeck[i];
    const t = leaveType(type);

    /* an approved past leave, a pending future one - a request awaiting
       a decision that started last month is a different (bad) story */
    const future = status === 'submitted' || (status === 'approved' && rng() < 0.35);
    const startOffset = future ? (3 + Math.floor(rng() * 70)) : -(5 + Math.floor(rng() * 200));
    const length = type === 'mat' ? 60 : type === 'sabbat' ? 30
                 : type === 'sick' ? 1 + Math.floor(rng() * 4)
                 : 2 + Math.floor(rng() * 12);
    let from = new Date(now + startOffset * DAY); from.setHours(12, 0, 0, 0);
    const to = addDays(from, length - 1);
    /* keep the sample inside the current leave year so the balances on
       screen add up to what the year screen shows */
    if (from.getFullYear() !== year || to.getFullYear() !== year) {
      from = new Date(year, 5, 1 + Math.floor(rng() * 20));
    }
    /* A one-day sick leave that lands on a Saturday contains no working
       days at all. Skipping the row - which is what this used to do -
       quietly threw away the guarantee that every status appears, and
       on a date three months out the sample had no declined application
       in it and the filter came back empty. Move the start forward to
       the next working day instead of dropping the record. */
    let end = addDays(from, length - 1);
    let wd = workingDays(from.getTime(), end.getTime());
    let nudge = 0;
    while (wd.days < 1 && nudge++ < 10) {
      from = addDays(from, 1);
      end = addDays(from, length - 1);
      wd = workingDays(from.getTime(), end.getTime());
    }
    if (wd.days < 1) continue;   /* unreachable in practice; not a silent hole */

    const applied = from.getTime() - (3 + Math.floor(rng() * 20)) * DAY;
    const decidedBy = heads[e.section] || employees.find(x => x.position === 'HR Director');
    out.push({
      id: 'LV-' + (year * 1000 + 100 + i),
      empNo: e.empNo,
      year,
      type,
      status,
      appliedAt: Math.round(applied),
      from: from.getTime(),
      to: end.getTime(),
      days: wd.days,
      weekendDays: wd.weekend,
      holidays: wd.holidays,
      overseas: type === 'annual' && rng() < 0.3,
      overseasAddress: '',
      reason: pick(t.id === 'sick' ? ['Unwell, certificate attached.', 'Admitted overnight.',
                                      'Seen at the health centre.']
                 : t.id === 'compass' ? ['Bereavement in the family.', 'Funeral of a parent.']
                 : ['Family time.', 'Travelling to see family.', 'Rest.',
                    'Personal matters.', 'Wedding.', 'Building work at home.']),
      medical: t.cert ? {
        sickness: pick(SICKNESS), hospital: pick(HOSPITALS),
        visitedAt: Math.round(applied),
        health: length > 3 ? 'Unfit to work' : pick(HEALTH_STATUS),
        certificate: { name: 'medical-certificate.pdf', kind: 'application/pdf', size: 84000 }
      } : null,
      hardCopy: rng() < 0.55 ? { name: 'leave-form-signed.pdf', kind: 'application/pdf', size: 120000 } : null,
      decidedBy: (status === 'approved' || status === 'declined') && decidedBy ? decidedBy.empNo : null,
      decidedAt: (status === 'approved' || status === 'declined')
        ? Math.round(applied + (1 + rng() * 4) * DAY) : null,
      decisionNote: status === 'declined'
        ? pick(['Two drivers already off that week.', 'Falls in the school holiday peak.',
                'Insufficient notice.']) : ''
    });
  }
  /* ---- leave people have already taken this year ----
     Without this the register held about thirty applications and the
     dashboard reported eleven hundred days owed across fifty-one
     people - which is every single person's full entitlement still
     outstanding in September. It adds up, it is internally consistent,
     and it is obviously wrong to anybody who runs a depot: the whole
     point of the untaken-leave figure is that it should be alarming
     when it is high, and it cannot be if it is always the maximum.

     So give most of the establishment some approved leave earlier in
     the year, capped at their own entitlement so no balance can go
     negative. */
  const yStart = new Date(year, 0, 1).getTime();
  employees.forEach((e, ei) => {
    if (rng() < 0.10) return;                    /* some people genuinely have taken none */
    const ent = leaveEntitlement(e, year).days;
    if (ent < 4) return;                         /* joined too recently to have taken any */
    /* By September somebody has usually taken between a quarter and
       four-fifths of the year's leave. Anything much outside that and
       the untaken-leave figure stops telling anybody anything. */
    let budget = Math.min(ent - 1, Math.round(ent * (0.30 + rng() * 0.50)));
    let guard = 0;
    while (budget >= 2 && guard++ < 4) {
      /* clamp the block to what is left rather than abandoning the
         budget when a long block does not fit */
      const length = Math.max(2, Math.min(budget, 2 + Math.floor(rng() * 8)));
      /* Somewhere between the start of the year and a few days ahead.
         Stopping a month short of today made every one of these leaves
         finished, so the "off today" tile read zero across fifty-one
         people in September - true of the data and false of any bus
         company. A handful have to be running right now. */
      const span = Math.max(1, Math.floor((now + 4 * DAY - yStart) / DAY));
      let from = new Date(yStart + Math.floor(rng() * span) * DAY);
      from.setHours(12, 0, 0, 0);
      let end = addDays(from, length - 1);
      let w = workingDays(from.getTime(), end.getTime());
      let nudge = 0;
      while (w.days < 1 && nudge++ < 10) {
        from = addDays(from, 1); end = addDays(from, length - 1);
        w = workingDays(from.getTime(), end.getTime());
      }
      if (w.days < 1 || w.days > budget) break;
      const applied = from.getTime() - (5 + Math.floor(rng() * 25)) * DAY;
      const head = heads[e.section] || employees.find(x => x.position === 'HR Director');
      out.push({
        id: 'LV-' + (year * 1000 + 200 + out.length + ei),
        empNo: e.empNo, year, type: 'annual', status: 'approved',
        appliedAt: Math.round(Math.max(yStart - 20 * DAY, applied)),
        from: from.getTime(), to: end.getTime(),
        days: w.days, weekendDays: w.weekend, holidays: w.holidays,
        overseas: false, overseasAddress: '',
        reason: pick(['Family time.', 'Rest.', 'Travelling to see family.',
                      'Personal matters.', 'Building work at home.']),
        medical: null, hardCopy: null,
        decidedBy: head ? head.empNo : null,
        decidedAt: Math.round(applied + (1 + rng() * 3) * DAY),
        decisionNote: ''
      });
      budget -= w.days;
    }
  });

  /* ---- reconcile the two generators ----
     Two passes write approved annual leave for the same people: the
     weighted deck above, and the "already taken this year" pass below
     it. Neither knew what the other had given, so somebody could end up
     with thirteen approved days against an entitlement of seven - which
     the calendar simulation found on a date ten weeks out, not today.

     Rather than delete a row (which would break the guarantee that
     every status and every type appears), walk each person's approved
     annual leave oldest first and re-label the overflow as UNPAID.
     That is what actually happens when somebody has used up their
     entitlement and still needs the time, it deducts nothing, and the
     row stays exactly where it was. */
  const byEmp = {};
  out.forEach(l => {
    if (l.status !== 'approved' || !leaveType(l.type).deducts) return;
    (byEmp[l.empNo] = byEmp[l.empNo] || []).push(l);
  });
  Object.keys(byEmp).forEach(empNo => {
    const e = employees.find(x => x.empNo === empNo);
    if (!e) return;
    const ent = leaveEntitlement(e, year).days;
    let used = 0;
    byEmp[empNo].sort((a, b) => a.from - b.from).forEach(l => {
      if (used + l.days <= ent) { used += l.days; return; }
      l.type = 'unpaid';
      l.reason = 'Annual entitlement already used for the year. Taken unpaid.';
    });
  });

  /* overseas address only where it is actually overseas */
  out.forEach(l => {
    if (l.overseas) l.overseasAddress = pick([
      'c/o Patel, 14 Rue de la Paix, Mauritius', '22 Gordon Road, Nairobi, Kenya',
      'Flat 3, Beau Sejour, Réunion', '8 Rosewood Avenue, London, United Kingdom'
    ]);
  });
  return out.sort((a, b) => b.appliedAt - a.appliedAt);
}

/* ------------------------------------------------------------------
   Disciplinary records. Deliberately few - a register in which a
   quarter of the staff are on a final warning is not a bus company,
   it is a caricature, and it would be the wrong thing to project in
   front of a customer.
   ------------------------------------------------------------------ */
function buildDiscipline(rng, now, employees) {
  const pick = a => a[Math.floor(rng() * a.length)];
  const heads = {};
  employees.forEach(e => { if (e.isHead) heads[e.section] = e; });
  const cases = [
    { action: 'verbal',  outcome: 'warned',
      what: 'Left the depot four minutes ahead of the board on the 07:15 working.' },
    { action: 'verbal',  outcome: 'reinstate',
      what: 'Reported for duty out of uniform. Explained; uniform was at the laundry.' },
    { action: 'written', outcome: 'warned',
      what: 'Third late report for duty inside one month.' },
    { action: 'written', outcome: 'open',
      what: 'Passenger complaint upheld: refused to lower the ramp at Anse Royale.' },
    { action: 'final',   outcome: 'open',
      what: 'Fare takings short on two consecutive shifts. Under investigation.' },
    { action: 'suspend', outcome: 'open',
      what: 'Reported for a road traffic incident at Bel Ombre. Suspended on full pay pending the report.' },
    { action: 'verbal',  outcome: 'withdrawn',
      what: 'Alleged absence without leave. Leave form was later found, unprocessed.' }
  ];
  const eligible = employees.filter(e => !e.isHead && e.position !== 'Chief Executive Officer');
  const used = {};
  return cases.map((c, i) => {
    let e;
    for (let a = 0; a < 100; a++) {
      e = eligible[Math.floor(rng() * eligible.length)];
      if (!used[e.empNo]) { used[e.empNo] = 1; break; }
    }
    const at = now - (10 + rng() * 300) * DAY;
    return {
      id: 'DC-' + (2026100 + i),
      empNo: e.empNo,
      action: c.action,
      comments: c.what,
      byRole: pick(DISC_BY),
      byEmpNo: (heads[e.section] || {}).empNo || null,
      at: Math.round(at),
      outcome: c.outcome,
      outcomeAt: c.outcome === 'open' ? null : Math.round(at + (3 + rng() * 30) * DAY),
      validated: c.outcome !== 'open',
      document: rng() < 0.6 ? { name: 'disciplinary-letter.pdf', kind: 'application/pdf', size: 96000 } : null
    };
  }).sort((a, b) => b.at - a.at);
}

/* ------------------------------------------------------------------
   Announcements. Audience is stored as a rule (all / departments /
   individuals), not as a frozen list of names, so a notice addressed
   to "Operations" reaches whoever is in Operations on the day it goes
   out rather than whoever was in it when it was written.
   ------------------------------------------------------------------ */
function buildAnnouncements(rng, now, employees) {
  const items = [
    { subject: 'Revised Sunday timetable, route 22',
      type: 'Roster change', audience: { mode: 'dept', depts: ['ops', 'crew'] },
      body: 'From Sunday the 14th the 22 will run hourly from 06:00 with the last departure ' +
            'from Victoria at 19:00. Duty boards have been reissued. Depot supervisors to confirm ' +
            'receipt with the scheduling officer.', days: 2 },
    { subject: 'Annual leave: apply before the end of the month',
      type: 'General notice', audience: { mode: 'all' },
      body: 'Leave for the December period must be applied for before the end of this month so the ' +
            'boards can be built. Applications after that date will only be approved where cover exists.',
      days: 6 },
    { subject: 'Ramp checks before first departure',
      type: 'Safety notice', audience: { mode: 'dept', depts: ['ops', 'fleet', 'safety'] },
      body: 'Following a complaint upheld last week, the wheelchair ramp is to be deployed and ' +
            'retracted once as part of the pre-departure check. Report any fault to the workshop ' +
            'immediately and do not take the vehicle out.', days: 11 },
    { subject: 'Defensive driving refresher — two places left',
      type: 'Training', audience: { mode: 'dept', depts: ['ops'] },
      body: 'Two places remain on the refresher at the Guy Morel Institute. Speak to your supervisor.',
      days: 19 },
    { subject: 'Payroll cut-off moved forward by two days',
      type: 'Policy', audience: { mode: 'all' },
      body: 'Because of the public holiday, the payroll cut-off moves forward by two days this month. ' +
            'Overtime claims must be with the payroll officer by the 18th.', days: 26 }
  ];
  return items.map((it, i) => ({
    id: 'AN-' + (2026200 + i),
    subject: it.subject,
    type: it.type,
    body: it.body,
    audience: it.audience,
    createdAt: Math.round(now - it.days * DAY),
    sendAt: Math.round(now - it.days * DAY),
    sent: true,
    attachment: null,
    byEmpNo: (employees.find(e => e.position === 'HR Officer') || {}).empNo || null
  })).sort((a, b) => b.sendAt - a.sendAt);
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
      /* 5 - the licence has to agree with how far the application has
         got. Somebody without a class D cannot lawfully drive a bus in
         service, so they do not reach a shortlist. Drawing the licence
         independently of the stage produced exactly that: a shortlisted
         driver with no licence, which anybody from an operator would
         spot in the first minute of a demonstration. */
      licences: v.title === 'Bus Driver'
        ? (['shortlisted', 'interviewed', 'offered', 'hired'].indexOf(status) !== -1 || rng() < 0.6
            ? ['B', 'D'] : ['B'])
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
