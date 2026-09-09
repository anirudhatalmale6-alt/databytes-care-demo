/* ------------------------------------------------------------------
   New Employee

   Built to the client's own HR SYSTEM document - the "Add New Employee
   (Basic Info)" list and the four blocks under it - rather than to
   Form PM/05.

   WHY IT IS A SEPARATE FORM. PM/05 is the Government of Seychelles
   EMPLOYMENT APPLICATION form. It is filled in by somebody who does not
   work here yet, so it has no box for an employee number, a joining
   date, a bank account, a pension number or a leave entitlement - all
   of which this screen has to collect, because it is creating a member
   of staff. Making PM/05 do both jobs would have meant adding boxes to
   a government form that does not have them, which is exactly the sort
   of thing that has to be explained afterwards.

   PM/05 has not been deleted. It is what an applicant fills in, and
   Applications still opens it. It is simply no longer the thing on the
   menu called "new".

   STEP BY STEP, and only that. The client asked for the stepped format
   here, so there is no one-page switch on this form - a control with
   one sensible setting is a control that should not exist.

   FIVE STEPS, in the document's own order and with its own headings, so
   that somebody holding the document can follow it down the screen.
   ------------------------------------------------------------------ */

const NEW_EMP_STEPS = [
  { name: 'Basic information', secs: [1] },
  { name: 'Dependants',        secs: [2] },
  { name: 'Salary and bank',   secs: [3] },
  { name: 'Employment',        secs: [4] },
  { name: 'Next of kin',       secs: [5] },
];

let newEmpStepAt = 0;

/* Three dependants and three documents. The document does not say how
   many, and an unbounded "add another" is a lot of machinery for a
   demonstration; three is enough to show the shape and to hold a spouse
   and two children, which is what the sample data mostly has. */
const NEW_EMP_DEPENDANTS = 3;

function neSel(id, list, opts) {
  const o = opts || {};
  return '<select id="' + id + '">' +
    (o.blank ? '<option value="">' + (o.blank === true ? '—' : o.blank) + '</option>' : '') +
    list.map(v => {
      const val = (typeof v === 'string') ? v : v.value;
      const lab = (typeof v === 'string') ? v : v.label;
      return '<option value="' + esc(val) + '"' +
             (o.selected === val ? ' selected' : '') + '>' + esc(lab) + '</option>';
    }).join('') + '</select>';
}

function neField(label, inner) {
  return '<label><span>' + esc(label) + '</span>' + inner + '</label>';
}

function neTwo(a, b) { return '<div class="two">' + a + b + '</div>'; }

/* Nothing here is sent anywhere - there is no server behind this
   demonstration - but the two kinds of attachment are not treated the
   same, and the difference is worth being straight about.

   The PHOTOGRAPH is genuinely kept: read in the browser, cropped square
   and shrunk to 160px by readPhoto(), the same path the employee record
   already uses, and stored with the record so it shows on the register.

   Everything else keeps the file's NAME and SIZE only. A scanned licence
   is a multi-megabyte thing and a handful of them would exhaust the
   browser's storage and take the whole demonstration down with it. So
   the record shows that a document was attached and what it was called,
   and the screen says that is all it is. */
function neUpload(id, label, note) {
  return '<label><span>' + esc(label) + '</span>' +
    '<input type="file" id="' + id + '" class="fileinp"' +
      (id === 'ne_photo' ? ' accept="image/*"' : '') + '>' +
    (note ? '<span class="hint">' + esc(note) + '</span>' : '') +
    '</label>';
}

function renderNewEmployee() {
  setHead('New employee', 'Add somebody to the establishment');

  const positions = (state.hr.positions || []).filter(p => p.active !== false);
  const depts = secList();

  const dependantBlock = i =>
    '<div class="subblock"><div class="lbl">Dependant ' + (i + 1) + '</div>' +
    '<div class="frm">' +
      neTwo(
        neField('Type', neSel('ne_dt' + i, DEPENDANT_TYPES, { blank: '— none —' })),
        neField('Full name', '<input id="ne_dn' + i + '">')) +
      neField('Date of birth', '<input type="date" id="ne_dd' + i + '">') +
    '</div></div>';

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/people\'">&larr; Back to employees</button>' +

    '<div class="formnote">The fields, their order and their headings come from the ' +
    'HR SYSTEM document. Anything the system can work out for itself &mdash; the position ' +
    'code, the gross, the hourly rate, the leave entitlement &mdash; is filled in as you ' +
    'type rather than asked for.</div>' +

    formSection(1, 'Basic information',
      '<div class="frm">' +
        neTwo(neUpload('ne_photo', 'Photo ID', 'Shrunk to 160\u00d7160 here and kept with the record.'),
              neUpload('ne_lic', 'Driving licence (scan)', 'The file name is kept, not the file.')) +
        neTwo(neField('First name', '<input id="ne_first">'),
              neField('Middle name', '<input id="ne_middle">')) +
        neTwo(neField('Last name', '<input id="ne_sur">'),
              neField('Title', neSel('ne_title', TITLES))) +
        neTwo(neField('Phone contact', '<input id="ne_phone" placeholder="2 512 345">'),
              neField('Personal email address', '<input id="ne_email" type="email" placeholder="name@example.com">')) +
        neTwo(neField('Country of birth', neSel('ne_cob', COUNTRIES, { selected: 'Seychelles' })),
              neField('Date of birth', '<input type="date" id="ne_dob">')) +
        neTwo(neField('National Identity Number',
                '<input id="ne_nin" inputmode="numeric" maxlength="15" placeholder="999-9999-9-9-99">'),
              neField('Passport number', '<input id="ne_passport">')) +
        '<div id="ne_ninhint" class="calcbox">The first three digits are the year of birth. ' +
          'Fill both in and they are checked against each other.</div>' +
        neTwo(neField('Physical address (district)', neSel('ne_district', DISTRICTS)),
              neField('Sub-district address', '<input id="ne_subdistrict">')) +
        neTwo(neField('Gender', neSel('ne_gender', ['Female', 'Male', 'Other'])),
              neField('Marital status', neSel('ne_marital', MARITAL))) +
        neTwo(neField('Religion', neSel('ne_religion', RELIGIONS, { blank: true })),
              neField('Blood type', neSel('ne_blood', BLOOD_TYPES, { blank: true }))) +
      '</div>') +

    formSection(2, 'Dependants',
      '<div class="hint">Leave the type blank on any row that is not needed.</div>' +
      Array.from({ length: NEW_EMP_DEPENDANTS }, (_, i) => dependantBlock(i)).join('')) +

    formSection(3, 'Salary and bank information',
      '<div class="frm">' +
        neTwo(neField('Bank name', neSel('ne_bank', BANKS.map(b => b.name), { blank: true })),
              neField('Branch address', neSel('ne_branch', [], { blank: '— choose a bank first —' }))) +
        neField('Account number', '<input id="ne_acc" placeholder="1234 5678 9012">') +
        neTwo(neField('Basic salary a year (SR)',
                '<input id="ne_basic" inputmode="numeric" placeholder="124000">' +
                '<span class="hint">A year, not a month &mdash; the SG grade bands are annual, ' +
                'and the record shows the monthly figure worked out from it.</span>'),
              neField('Monthly work hours', '<input id="ne_hours" inputmode="decimal" value="' + HOURS_PER_MONTH + '">')) +
        '<label><span>Allowances</span><div class="checks" id="ne_allow">' +
          /* Three of these are a PERCENTAGE of basic pay, not a number of
             rupees. Printing "Scarce skills 10" next to "Housing 2,500"
             invites somebody to read 10 rupees, so the unit is on every
             one of them. */
          ALLOWANCES.map((a, i) =>
            '<label class="chk"><input type="checkbox" id="ne_al' + i + '" data-id="' + esc(a.id) + '">' +
            '<span>' + esc(a.name) + ' <b class="mono">' +
            (a.kind === 'pct' ? a.amount + '% of basic' : 'SR ' + a.amount.toLocaleString() + ' a month') +
            '</b></span></label>').join('') +
        '</div></label>' +
        '<div id="ne_pay" class="calcbox">Enter a basic salary and the gross and the hourly ' +
          'rate are worked out here.</div>' +
        neTwo(neField('Medical benefit', neSel('ne_med', ['No', 'Yes'])),
              neField('Medical scheme', neSel('ne_medscheme', MEDICAL_SCHEMES.map(m => m.name || m), { blank: true }))) +
      '</div>') +

    formSection(4, 'Employment information',
      '<div class="frm">' +
        neTwo(neField('Department', neSel('ne_dept', depts.map(d => ({ value: d.id, label: d.name })), { blank: true })),
              neField('Position', neSel('ne_pos', [], { blank: '— choose a department first —' }))) +
        neTwo(neField('Position code', '<input id="ne_poscode" readonly placeholder="from the position table">'),
              neField('Duty type', neSel('ne_duty', DUTY_TYPES))) +
        neTwo(neField('Hiring date (offer accepted)', '<input type="date" id="ne_hired">'),
              neField('Joining date (first day)', '<input type="date" id="ne_joined">')) +
        neTwo(neField('Retirement date', '<input type="date" id="ne_retired">'),
              neField('Employee status', neSel('ne_status', EMP_STATUS.map(s => ({ value: s.id, label: s.name }))))) +
        '<div id="ne_leave" class="calcbox">The leave entitlement follows from the joining date.</div>' +
        neTwo(neField('Work permit', neSel('ne_permit', ['No', 'Yes'])),
              neField('Foreigner', neSel('ne_foreign', ['No', 'Yes']))) +
        neTwo(neField('If foreign, country', neSel('ne_fcountry', COUNTRIES, { blank: true })),
              neField('If foreign, GOP number', '<input id="ne_gop">')) +
        '<label><span>Languages</span><div class="frm">' +
          FORM_LANGUAGES.map((l, i) =>
            neTwo(neField(l, neSel('ne_lang' + i, LANG_LEVELS, { selected: 'Fluent' })), '')).join('') +
        '</div></label>' +
        neUpload('ne_doc', 'Any other document', 'The file name is kept, not the file.') +
      '</div>') +

    formSection(5, 'Next of kin',
      '<div class="frm">' +
        neTwo(neField('Contact name', '<input id="ne_kfirst">'),
              neField('Contact surname', '<input id="ne_ksur">')) +
        neTwo(neField('Contact identity number',
                '<input id="ne_knin" inputmode="numeric" maxlength="15" placeholder="999-9999-9-9-99">'),
              neField('Relationship', neSel('ne_krel', RELATIONSHIPS))) +
        neTwo(neField('Contact phone number', '<input id="ne_kphone">'),
              neField('Contact physical address', neSel('ne_kdistrict', DISTRICTS))) +
      '</div>') +

    '<div class="formactions">' +
      '<button class="btn primary" id="ne_save">Add the employee</button>' +
      '<button class="btn" id="ne_fill">Fill it in for me</button>' +
    '</div>';

  newEmpStepper();
  wireNewEmployee();
}

/* ---- the things that fill themselves in ---- */

function neVal(id) { const e = $('#' + id); return e ? String(e.value || '').trim() : ''; }

/* Stored the way the register stores them - an id, and nothing else.
   payBreakdown() resolves the id against ALLOWANCES and works out what a
   percentage one is worth. Storing {name, amount} instead, which is what
   this did first, left payBreakdown unable to find the definition: the
   payslip showed the allowance as worth nothing at all. */
function neAllowances() {
  return ALLOWANCES.map((a, i) => ({ el: $('#ne_al' + i), a }))
    .filter(x => x.el && x.el.checked)
    .map(x => ({ id: x.a.id }));
}

/* The provisional employee, good enough for payBreakdown() and nothing
   else. The point is that the figures on this form come out of the SAME
   function the record and the payslip use - three implementations of one
   sum is how a form and a record come to disagree. */
function neProvisional() {
  return {
    salary: +neVal('ne_basic').replace(/[^\d.]/g, '') || 0,
    hoursPerMonth: +neVal('ne_hours').replace(/[^\d.]/g, '') || HOURS_PER_MONTH,
    allowances: neAllowances()
  };
}

function nePaint() {
  const annual = +neVal('ne_basic').replace(/[^\d.]/g, '') || 0;
  const box = $('#ne_pay');
  if (box) {
    if (!annual) {
      box.className = 'calcbox';
      box.textContent = 'Enter a basic salary and the gross and the hourly rate are worked out here.';
    } else {
      const p = payBreakdown(neProvisional());
      const lines = p.lines.map(l => esc(l.name) +
        (l.kind === 'pct' ? ' (' + l.rate + '% of basic)' : '') +
        ' <b class="mono">' + l.amount.toLocaleString() + '</b>').join(' &middot; ');
      /* out-of-band is a question, not an error - acting up and red-circled
         salaries are both real, and the person typing knows which it is */
      const pos = (state.hr.positions || []).find(x => x.code === neVal('ne_pos'));
      const g = pos ? grade(pos.sg) : null;
      const out = g && (annual < g.min || annual > g.max);
      box.className = 'calcbox' + (out ? ' bad' : '');
      box.innerHTML =
        'Basic <b class="mono">' + p.basic.toLocaleString() + '</b> a month' +
        ' (<b class="mono">' + annual.toLocaleString() + '</b> a year)' +
        ' + allowances <b class="mono">' + p.allowances.toLocaleString() + '</b>' +
        ' = gross <b class="mono">' + p.gross.toLocaleString() + '</b> a month.' +
        '<br>Hourly rate <b class="mono">' + p.rate.toFixed(2) + '</b>' +
        ' — monthly basic divided by ' + p.hours + ' hours.' +
        (lines ? '<br><span class="hint">' + lines + '</span>' : '') +
        (out ? '<br><b>Outside the ' + esc(g.sg) + ' band</b> (' + g.min.toLocaleString() +
               ' to ' + g.max.toLocaleString() + ' a year). That may be deliberate.' : '');
    }
  }

  /* leave: the same rule the register already uses — 21 days, plus one
     for every five years of service, counted from the JOINING date */
  const lb = $('#ne_leave');
  const j = neVal('ne_joined');
  if (lb) {
    if (j) {
      const years = Math.max(0, (Date.now() - new Date(j).getTime()) / (365.25 * 864e5));
      const ent = 21 + Math.min(5, Math.floor(years / 5));
      lb.innerHTML = 'Leave entitlement <b class="mono">' + ent + ' days</b> — 21 by statute, ' +
        'plus one for every five years of service. ' +
        (years < 1 ? 'Less than a year of service so far.'
                   : years.toFixed(1) + ' years of service.');
    } else {
      lb.textContent = 'The leave entitlement follows from the joining date.';
    }
  }

  /* the identity number against the date of birth */
  const hb = $('#ne_ninhint');
  const nin = neVal('ne_nin').replace(/\D/g, '');
  const dob = neVal('ne_dob');
  if (hb) {
    if (!nin && !dob) {
      hb.className = 'calcbox';
      hb.textContent = 'The first three digits are the year of birth. Fill both in and they are checked against each other.';
    } else if (nin.length !== NIN_DIGITS) {
      hb.className = 'calcbox';
      hb.textContent = nin.length + ' of ' + NIN_DIGITS + ' digits.';
    } else if (!dob) {
      hb.className = 'calcbox';
      hb.innerHTML = '<b class="mono">' + esc(ninPretty(nin)) + '</b> — add the date of birth and the year is checked.';
    } else {
      const want = String(new Date(dob).getFullYear() % 1000).padStart(3, '0');
      const ok = nin.slice(0, 3) === want;
      hb.className = 'calcbox' + (ok ? '' : ' bad');
      hb.innerHTML = ok
        ? '<b class="mono">' + esc(ninPretty(nin)) + '</b> agrees with the date of birth.'
        : 'The number starts <b class="mono">' + esc(nin.slice(0, 3)) + '</b> but the date of birth ' +
          'would make it start <b class="mono">' + esc(want) + '</b>. One of the two is wrong.';
    }
  }
}

function neFillBranches() {
  const bank = BANKS.find(b => b.name === neVal('ne_bank'));
  const sel = $('#ne_branch');
  if (!sel) return;
  sel.innerHTML = bank
    ? bank.branches.map(br => '<option>' + esc(br) + '</option>').join('')
    : '<option value="">— choose a bank first —</option>';
}

function neFillPositions() {
  const dept = neVal('ne_dept');
  const sel = $('#ne_pos');
  if (!sel) return;
  const list = (state.hr.positions || []).filter(p => p.active !== false && (!dept || p.dept === dept));
  sel.innerHTML = dept
    ? '<option value="">—</option>' + list.map(p => '<option value="' + esc(p.code) + '">' + esc(p.title) + '</option>').join('')
    : '<option value="">— choose a department first —</option>';
  neFillPosCode();
}

function neFillPosCode() {
  const code = neVal('ne_pos');
  const box = $('#ne_poscode');
  if (box) box.value = code || '';
  nePaint();   /* the grade band depends on the position */
}

/* Held between choosing the file and pressing save. */
let newEmpPhoto = null;

function wireNewEmployee() {
  const ph = $('#ne_photo');
  if (ph) ph.onchange = () => {
    const f = ph.files && ph.files[0];
    if (!f) { newEmpPhoto = null; return; }
    readPhoto(f, (dataUrl, err) => {
      newEmpPhoto = dataUrl;
      if (err) toast(err, true);
      else toast('Photograph ready — it is kept when the employee is added.');
    });
  };

  ['ne_basic', 'ne_hours', 'ne_joined', 'ne_nin', 'ne_dob'].forEach(id => {
    const e = $('#' + id); if (e) e.oninput = nePaint;
  });
  ['ne_joined', 'ne_dob'].forEach(id => { const e = $('#' + id); if (e) e.onchange = nePaint; });
  ALLOWANCES.forEach((_, i) => { const e = $('#ne_al' + i); if (e) e.onchange = nePaint; });

  const bank = $('#ne_bank'); if (bank) bank.onchange = neFillBranches;
  const dept = $('#ne_dept'); if (dept) dept.onchange = neFillPositions;
  const pos = $('#ne_pos');   if (pos) pos.onchange = neFillPosCode;

  const save = $('#ne_save'); if (save) save.onclick = submitNewEmployee;
  const fill = $('#ne_fill'); if (fill) fill.onclick = fillNewEmployee;

  neFillBranches(); neFillPositions(); nePaint();
}

/* ---- the stepper. Stepped only: the client asked for this format, so
   there is no one-page switch to get out of step with it. ---- */

function goNewEmpStep(at, quiet) {
  const secs = Array.prototype.slice.call(document.querySelectorAll('#view .card.fsec'));
  if (!secs.length) return;
  const last = NEW_EMP_STEPS.length - 1;
  newEmpStepAt = Math.max(0, Math.min(last, at));

  secs.forEach(s => {
    s.style.display = (+s.getAttribute('data-step') === newEmpStepAt) ? '' : 'none';
  });
  document.querySelectorAll('#view .stepitem').forEach((b, i) => {
    b.classList.toggle('on', i === newEmpStepAt);
    b.classList.toggle('done', i < newEmpStepAt);
  });

  const back = $('#neBack'), next = $('#neNext'), of = $('#neOf');
  if (back) back.disabled = newEmpStepAt === 0;
  if (next) next.style.display = newEmpStepAt === last ? 'none' : '';
  if (of) of.textContent = 'Step ' + (newEmpStepAt + 1) + ' of ' + (last + 1) +
    ' — ' + NEW_EMP_STEPS[newEmpStepAt].name;

  if (!quiet) {
    const bar = document.querySelector('#view .stepbar');
    if (bar) bar.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}

/* A complaint about a field on a step nobody can see is no complaint at
   all - focusing a hidden input does nothing. Open its step first. */
function neShowFor(el) {
  if (!el) return;
  let n = el;
  while (n && !(n.classList && n.classList.contains('fsec'))) n = n.parentNode;
  if (!n) return;
  const at = +n.getAttribute('data-step');
  if (!isNaN(at)) goNewEmpStep(at, true);
  if (el.focus) el.focus();
}

function newEmpStepper() {
  const view = $('#view');
  const secs = Array.prototype.slice.call(view.querySelectorAll('.card.fsec'));
  if (!secs.length) return;

  secs.forEach(s => {
    const num = +(s.querySelector('.fnum') || {}).textContent;
    let at = NEW_EMP_STEPS.length - 1;
    for (let i = 0; i < NEW_EMP_STEPS.length; i++) {
      if (NEW_EMP_STEPS[i].secs.indexOf(num) >= 0) { at = i; break; }
    }
    s.setAttribute('data-step', at);
  });

  const bar = document.createElement('div');
  bar.className = 'stepbar';
  bar.innerHTML = NEW_EMP_STEPS.map((s, i) =>
    '<button class="stepitem" type="button">' +
    '<span class="stepdot">' + (i + 1) + '</span>' +
    '<span class="steptxt"><b>Step ' + (i + 1) + '</b><span>' + esc(s.name) + '</span></span>' +
    '</button>').join('<span class="steprule"></span>');
  view.insertBefore(bar, secs[0]);
  bar.querySelectorAll('.stepitem').forEach((b, i) => { b.onclick = () => goNewEmpStep(i); });

  const nav = document.createElement('div');
  nav.className = 'stepnav';
  nav.innerHTML = '<button class="btn" id="neBack">&larr; Back</button>' +
    '<span class="mono" id="neOf"></span>' +
    '<button class="btn primary" id="neNext">Next &rarr;</button>';
  const lastSec = secs[secs.length - 1];
  if (lastSec.nextSibling) view.insertBefore(nav, lastSec.nextSibling);
  else view.appendChild(nav);
  $('#neBack').onclick = () => goNewEmpStep(newEmpStepAt - 1);
  $('#neNext').onclick = () => goNewEmpStep(newEmpStepAt + 1);

  goNewEmpStep(0, true);
}

/* ---- saving ---- */

function submitNewEmployee() {
  const need = (id, what) => {
    const v = neVal(id);
    if (!v) { toast(what, true); neShowFor($('#' + id)); return false; }
    return true;
  };
  if (!need('ne_first', 'A first name is needed.')) return;
  if (!need('ne_sur', 'A last name is needed.')) return;
  if (!need('ne_dob', 'A date of birth is needed.')) return;

  const nin = neVal('ne_nin').replace(/\D/g, '');
  if (nin.length !== NIN_DIGITS) {
    toast('A National Identity Number is ' + NIN_DIGITS + ' digits — ' + nin.length + ' entered.', true);
    neShowFor($('#ne_nin')); return;
  }
  /* the register is keyed on it, and two people under one number is the
     one mistake nothing downstream can see */
  if (state.hr.employees.some(e => e.nin === nin)) {
    const who = state.hr.employees.find(e => e.nin === nin);
    toast(ninPretty(nin) + ' already belongs to ' + fullName(who) + ' (' + who.empNo + ').', true);
    neShowFor($('#ne_nin')); return;
  }
  const wantYear = String(new Date(neVal('ne_dob')).getFullYear() % 1000).padStart(3, '0');
  if (nin.slice(0, 3) !== wantYear &&
      !confirm('The identity number starts ' + nin.slice(0, 3) + ', but the date of birth given ' +
               'would make it start ' + wantYear + '.\n\nSave it anyway?')) return;

  if (!need('ne_pos', 'A position is needed — choose a department first.')) return;
  if (!need('ne_joined', 'A joining date is needed. Service and leave are counted from it.')) return;

  const pos = (state.hr.positions || []).find(p => p.code === neVal('ne_pos'));
  /* annual, like every other salary in the register - payBreakdown()
     divides it by twelve */
  const annual = +neVal('ne_basic').replace(/[^\d.]/g, '') || 0;
  const hours = +neVal('ne_hours').replace(/[^\d.]/g, '') || HOURS_PER_MONTH;
  const joined = new Date(neVal('ne_joined')).getTime();
  const years = Math.max(0, (Date.now() - joined) / (365.25 * 864e5));
  const first = neVal('ne_first'), sur = neVal('ne_sur');
  const next = state.hr.employees.reduce((m, e) => Math.max(m, +e.empNo.slice(1) || 0), 1000) + 1;

  const fileName = id => {
    const el = $('#' + id);
    return el && el.files && el.files[0] ? el.files[0].name : null;
  };
  const docs = [];
  [['ne_lic', 'Driving licence'], ['ne_doc', 'Supporting document']].forEach(([id, kind]) => {
    const n = fileName(id);
    if (n) docs.push({ kind, name: n, at: Date.now() });
  });

  const emp = {
    empNo: 'E' + next,
    title: neVal('ne_title'),
    surname: sur,
    firstNames: first,
    middleNames: neVal('ne_middle'),
    knownAs: first,
    surnameAtBirth: '',
    initials: (first[0] || '') + (sur[0] || ''),
    gender: neVal('ne_gender'),
    dob: new Date(neVal('ne_dob')).getTime(),
    nin,
    nationality: neVal('ne_foreign') === 'Yes' ? (neVal('ne_fcountry') || '—') : 'Seychellois',
    countryOfBirth: neVal('ne_cob'),
    maritalStatus: neVal('ne_marital'),
    address: neVal('ne_subdistrict') ? neVal('ne_subdistrict') + ', ' + neVal('ne_district')
                                     : neVal('ne_district'),
    district: neVal('ne_district'),
    subDistrict: neVal('ne_subdistrict'),
    phone: neVal('ne_phone'),
    email: neVal('ne_email'),
    passportNo: neVal('ne_passport'),
    religion: neVal('ne_religion'),
    bloodType: neVal('ne_blood'),
    /* The photograph is NOT kept. The file was never read and never sent
       anywhere; only that one was chosen. Saying so here so nobody later
       wonders where the images went. */
    photo: newEmpPhoto,                 /* the shrunk one, or null */
    photoName: fileName('ne_photo'),
    documents: docs,
    dependants: Array.from({ length: NEW_EMP_DEPENDANTS }, (_, i) => ({
      type: neVal('ne_dt' + i), name: neVal('ne_dn' + i),
      dob: neVal('ne_dd' + i) ? new Date(neVal('ne_dd' + i)).getTime() : null
    })).filter(d => d.type && d.name),

    section: pos ? pos.dept : neVal('ne_dept'),
    position: pos ? pos.title : '',
    positionCode: pos ? pos.code : null,
    dutyType: neVal('ne_duty'),
    isHead: pos ? !!pos.head : false,
    sg: pos ? pos.sg : 'SG7',
    salary: annual,
    hoursPerMonth: hours,
    allowances: neAllowances(),
    medicalBenefit: neVal('ne_med') === 'Yes',
    medicalScheme: neVal('ne_medscheme'),
    hiredOn: neVal('ne_hired') ? new Date(neVal('ne_hired')).getTime() : joined,
    joined,
    retiredOn: neVal('ne_retired') ? new Date(neVal('ne_retired')).getTime() : null,
    contract: neVal('ne_status') === 'probation' ? 'prob' : 'perm',
    status: neVal('ne_status') || 'probation',
    workPermit: neVal('ne_permit') === 'Yes',
    foreigner: neVal('ne_foreign') === 'Yes',
    permitCountry: neVal('ne_foreign') === 'Yes' ? neVal('ne_fcountry') : '',
    gopNo: neVal('ne_gop'),
    pensionNo: '',
    bank: neVal('ne_bank'),
    bankBranch: neVal('ne_branch'),
    bankAcc: neVal('ne_acc'),
    leaveEntitlement: 21 + Math.min(5, Math.floor(years / 5)),
    leaveTaken: 0,
    licences: fileName('ne_lic') ? ['B'] : [],
    languages: FORM_LANGUAGES.map((l, i) => ({ language: l, level: neVal('ne_lang' + i) })),
    education: [],
    history: [],
    /* Everybody reports to the head of their section, which is the rule
       the seeded register already follows. Without this the record shows
       a blank where every other employee shows a name. */
    reportsTo: (function () {
      const secId = pos ? pos.dept : neVal('ne_dept');
      const head = state.hr.employees.find(x => x.section === secId && x.isHead);
      return head ? head.empNo : null;
    })(),
    nextOfKin: {
      surname: neVal('ne_ksur'),
      firstNames: neVal('ne_kfirst'),
      nin: neVal('ne_knin').replace(/\D/g, ''),
      phone: neVal('ne_kphone'),
      address: neVal('ne_kdistrict'),
      relationship: neVal('ne_krel')
    }
  };

  state.hr.employees.push(emp);
  newEmpPhoto = null;    /* or the next person added inherits this face */
  save();
  toast(fullName(emp) + ' added as ' + emp.empNo + '.');
  location.hash = '#/hr/p/' + emp.empNo;
}

/* The sample somebody presses when they want to see the end of the form
   rather than type forty boxes. Every value here obeys the rules the
   form itself enforces - the identity number starts with the year of
   birth, the position belongs to the department - because a sample that
   fails its own validation is worse than no sample. */
function fillNewEmployee() {
  const set = (id, v) => { const e = $('#' + id); if (e) e.value = v; };
  const d = t => new Date(t).toISOString().slice(0, 10);

  set('ne_first', 'Danielle'); set('ne_middle', 'Marie'); set('ne_sur', 'Rachel');
  set('ne_title', 'Ms');
  set('ne_phone', '2 517 402'); set('ne_email', 'danielle.rachel@example.com');
  set('ne_cob', 'Seychelles');
  set('ne_dob', '1996-03-22');
  set('ne_nin', '996-4821-7-3-05');          /* 1996 -> 996 */
  set('ne_passport', 'S412887');
  set('ne_district', DISTRICTS[0]); set('ne_subdistrict', 'Upper ' + DISTRICTS[0]);
  set('ne_gender', 'Female'); set('ne_marital', 'Married');
  set('ne_religion', RELIGIONS[0]); set('ne_blood', 'O+');

  set('ne_dt0', 'Spouse'); set('ne_dn0', 'Terry Rachel'); set('ne_dd0', '1993-11-02');
  set('ne_dt1', 'Child');  set('ne_dn1', 'Ella Rachel');  set('ne_dd1', '2019-06-14');

  set('ne_bank', BANKS[0].name); neFillBranches();
  set('ne_acc', '4021 7788 1140');
  set('ne_basic', '124000');   /* a year, inside the SG7 band */
  set('ne_hours', String(HOURS_PER_MONTH));
  const al = $('#ne_al0'); if (al) al.checked = true;
  set('ne_med', 'Yes'); set('ne_medscheme', (MEDICAL_SCHEMES[0].name || MEDICAL_SCHEMES[0]));

  const firstPos = (state.hr.positions || []).find(p => p.active !== false);
  if (firstPos) { set('ne_dept', firstPos.dept); neFillPositions(); set('ne_pos', firstPos.code); neFillPosCode(); }
  set('ne_duty', 'Full time');
  set('ne_hired', d(Date.now() - 40 * 864e5));
  set('ne_joined', d(Date.now() - 21 * 864e5));
  set('ne_status', 'probation');
  set('ne_permit', 'No'); set('ne_foreign', 'No');

  set('ne_kfirst', 'Terry'); set('ne_ksur', 'Rachel');
  set('ne_knin', '993-1180-4-2-61');
  set('ne_krel', 'Spouse'); set('ne_kphone', '2 664 913'); set('ne_kdistrict', DISTRICTS[0]);

  nePaint();
  toast('Filled in with a sample employee.');
}
