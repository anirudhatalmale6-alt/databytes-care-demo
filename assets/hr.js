/* ==================================================================
   Human Resources module

   Sits in the same shell as Passenger Care on purpose. "Centralised
   ERP" is a claim; one login, one look and a module switch is the
   demonstration of it.

   The spine is FORM PM/05: an application arrives on the government
   form, somebody works it through, and when the person is hired the
   record carries over into an employee file. Nothing is typed twice,
   which is the only honest reason to capture that much on intake.
   ================================================================== */

/* ---------------- helpers ---------------- */
const emp = no => state.hr.employees.find(e => e.empNo === no) || null;
const app = id => state.hr.applications.find(a => a.id === id) || null;
const vac = id => state.hr.vacancies.find(v => v.id === id) || null;
const fullName = e => e ? (e.firstNames + ' ' + e.surname) : '—';

function hrDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function hrYears(ms) {
  const y = (Date.now() - ms) / (365.25 * 24 * 3600 * 1000);
  if (y >= 1) return y.toFixed(1) + ' years';
  const m = Math.max(1, Math.round(y * 12));
  return m + (m === 1 ? ' month' : ' months');
}
function money(n) { return 'SR ' + Number(n).toLocaleString('en-GB'); }
function secPill(id) {
  const s = sec(id);
  return '<span class="secpill sc-' + id + '">' + esc(s.short) + '</span>';
}
function empAv(e, size) {
  const px = size || 26;
  return '<span class="av" style="width:' + px + 'px;height:' + px + 'px;font-size:' +
         (px * 0.36).toFixed(1) + 'px">' + esc(e.initials) + '</span>';
}
function empChip(e) {
  if (!e) return '<span class="lbl">nobody</span>';
  return '<a class="empchip" href="#/hr/p/' + e.empNo + '">' + empAv(e, 22) +
         '<span>' + esc(fullName(e)) + '</span></a>';
}
function empStatusPill(id) {
  const s = empStatus(id);
  return '<span class="pill st-' + s.tone + '"><i></i>' + esc(s.name) + '</span>';
}
function appPill(id) {
  const s = appStatus(id);
  return '<span class="pill st-' + s.tone + '"><i></i>' + esc(s.name) + '</span>';
}
function sgPill(sg) { return '<span class="route">' + esc(sg) + '</span>'; }
function kv(k, v) {
  return '<div><div class="k">' + esc(k) + '</div><div class="v">' + (v == null || v === '' ? '—' : v) + '</div></div>';
}
function appsFor(vid) { return state.hr.applications.filter(a => a.vacancyId === vid); }
function openApps() {
  return state.hr.applications.filter(a => ['received', 'shortlisted', 'interviewed', 'offered'].indexOf(a.status) !== -1);
}
function activeEmployees() { return state.hr.employees.filter(e => e.status !== 'left'); }

/* ---------------- router ---------------- */
function hrRoute(parts) {
  const v = parts[0] || 'dashboard';
  if (v === 'people')      renderPeople();
  else if (v === 'p')      renderEmployee(parts[1]);
  else if (v === 'jobs')   renderVacancies();
  else if (v === 'apps')   renderApplications();
  else if (v === 'a')      renderApplication(parts[1]);
  else if (v === 'apply')  renderApplyForm();
  else if (v === 'leave')  { parts[1] === 'new' ? renderLeaveForm(parts[2]) : renderLeave(); }
  else if (v === 'l')      renderLeaveRecord(parts[1]);
  else if (v === 'disc')   { parts[1] === 'new' ? renderDiscForm() : renderDiscipline(); }
  else if (v === 'd')      renderDiscRecord(parts[1]);
  else if (v === 'notices'){ parts[1] === 'new' ? renderAnnForm() : renderAnnouncements(); }
  else if (v === 'n')      renderAnnouncement(parts[1]);
  else if (v === 'tables') renderTables();
  else                     renderHrDashboard();
}

/* ---------------- dashboard ---------------- */
function renderHrDashboard() {
  setHead('People', 'Establishment, recruitment and employee records');
  const E = activeEmployees();
  const prob = E.filter(e => e.status === 'probation');
  const posts = state.hr.vacancies.reduce((n, v) => n + v.posts, 0);
  const toReview = state.hr.applications.filter(a => a.status === 'received');

  const bySec = secList().map(s => ({ name: s.name, n: E.filter(e => e.section === s.id).length }))
    .sort((a, b) => b.n - a.n);
  const byGrade = GRADES.map(g => ({ name: g.sg + ' — ' + g.note, n: E.filter(e => e.sg === g.sg).length }))
    .filter(r => r.n).sort((a, b) => b.n - a.n);

  const joiners = E.slice().sort((a, b) => b.joined - a.joined).slice(0, 6);

  /* Untaken leave is a liability the finance side has to carry, and it
     is the number an HR manager is asked for that nobody can ever
     produce quickly. It falls straight out of the register - and now
     out of the approved leave applications, rather than out of a field
     somebody typed. */
  const bals = E.map(e => leaveBalance(e));
  const owed = bals.reduce((n, b) => n + Math.max(0, b.remaining), 0);
  const pendingLeave = (state.hr.leave || []).filter(l => l.status === 'submitted');
  const outToday = (state.hr.leave || []).filter(l =>
    l.status === 'approved' && l.from <= Date.now() && l.to >= Date.now());
  const openDisc = (state.hr.discipline || []).filter(d => d.outcome === 'open');

  $('#view').innerHTML =
    hrBanner() +
    '<div class="grid k4" style="margin-bottom:14px">' +
      kpi('Headcount', E.length, 'people on the establishment', '--blue', null, 'people') +
      kpi('On probation', prob.length, 'inside their first six months', '--amber', null, 'clock') +
      kpi('Vacant posts', posts, state.hr.vacancies.length + ' positions advertised', '--violet', null, 'doc') +
      kpi('To review', toReview.length, 'applications nobody has opened', toReview.length ? '--coral' : '--teal', null, 'inbox') +
    '</div>' +

    '<div class="grid c23" style="margin-bottom:14px">' +
      card('Headcount by section', E.length + ' people', bars(bySec, 'name', 'n')) +
      card('Untaken leave', 'across the establishment',
        '<div class="gauge"><div><div class="big">' + owed + '</div>' +
        '<div class="sm">days owed and not taken</div>' +
        '<div class="sm" style="margin-top:9px">' +
        bals.filter(b => b.remaining > 15).length +
        ' people carrying more than 15 days</div>' +
        '<div class="sm" style="margin-top:9px">21 days by statute, plus one for every five years of ' +
        'service, pro-rated in the year somebody joins.</div>' +
        '<div class="sm" style="margin-top:9px">' + outToday.length + ' on approved leave today.</div>' +
        '</div></div>') +
    '</div>' +

    '<div class="grid k4" style="margin-bottom:14px">' +
      kpi('Leave to decide', pendingLeave.length, 'applications awaiting a supervisor',
          pendingLeave.length ? '--coral' : '--teal', null, 'clock') +
      kpi('Off today', outToday.length, 'approved leave running now', '--blue', null, 'people') +
      kpi('Discipline open', openDisc.length, 'no outcome recorded yet',
          openDisc.length ? '--amber' : '--teal', null, 'flag') +
      kpi('Announcements', (state.hr.announcements || []).length, 'notices on file', '--ocean', null, 'doc') +
    '</div>' +

    '<div class="grid k2" style="margin-bottom:14px">' +
      card('Headcount by grade', 'establishment', bars(byGrade, 'name', 'n')) +
      card('Recently joined', 'newest first',
        '<table class="tbl"><tbody>' + joiners.map(e =>
          '<tr onclick="location.hash=\'#/hr/p/' + e.empNo + '\'">' +
          '<td>' + empFace(e, 26) + '</td>' +
          '<td><div class="sum">' + esc(fullName(e)) + '</div>' +
          '<div class="meta">' + esc(e.position) + '</div></td>' +
          '<td style="text-align:right"><div>' + hrDate(e.joined) + '</div>' +
          '<div class="meta">' + hrYears(e.joined) + '</div></td></tr>').join('') +
        '</tbody></table>', true) +
    '</div>' +

    card('Recruitment in progress', openApps().length + ' live applications',
      appTable(openApps().slice(0, 8)), true);
}

function hrBanner() {
  return '<div class="banner"><b>DEMO</b><div>Sample records. The people, identity numbers, ' +
    'telephone numbers, bank details and salary figures are invented — none of them are SPTC ' +
    'employees. The salary grade bands are a plausible shape, <b>not</b> the published public ' +
    'service scale, and must be replaced before anybody quotes a figure from this screen.</div></div>';
}

/* ---------------- the register ---------------- */
let pf = { q: '', sec: '', st: '', sg: '' };
function renderPeople() {
  setHead('Employees', 'The establishment register');
  $('#view').innerHTML =
    '<div class="filters">' +
      '<input type="search" id="pq" placeholder="Name, employee number, position" value="' + esc(pf.q) + '">' +
      '<select id="psec"><option value="">Every section</option>' +
        secList().map(s => '<option value="' + s.id + '"' + (pf.sec === s.id ? ' selected' : '') + '>' +
          esc(s.name) + '</option>').join('') + '</select>' +
      '<select id="pst"><option value="">Any status</option>' +
        EMP_STATUS.map(s => '<option value="' + s.id + '"' + (pf.st === s.id ? ' selected' : '') + '>' +
          esc(s.name) + '</option>').join('') + '</select>' +
      '<select id="psg"><option value="">Any grade</option>' +
        GRADES.map(g => '<option value="' + g.sg + '"' + (pf.sg === g.sg ? ' selected' : '') + '>' +
          esc(g.sg + ' — ' + g.note) + '</option>').join('') + '</select>' +
      '<span class="spacer"></span>' +
      '<a class="btn primary" href="#/hr/apply">New PM/05 application</a>' +
    '</div>' +
    '<div class="card" id="pwrap"></div>';

  const paint = () => {
    const rows = state.hr.employees.filter(e => {
      if (pf.sec && e.section !== pf.sec) return false;
      if (pf.st && e.status !== pf.st) return false;
      if (pf.sg && e.sg !== pf.sg) return false;
      if (pf.q) {
        const hay = (e.empNo + ' ' + fullName(e) + ' ' + e.position + ' ' + e.nin).toLowerCase();
        if (hay.indexOf(pf.q.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort((a, b) => a.surname.localeCompare(b.surname));
    $('#pwrap').innerHTML =
      '<header><h3>' + rows.length + ' of ' + state.hr.employees.length + ' people</h3></header>' +
      (rows.length ? peopleTable(rows)
        : '<div class="empty">Nobody matches that. Clear a filter.</div>');
  };
  $('#pq').oninput = e => { pf.q = e.target.value; paint(); };
  $('#psec').onchange = e => { pf.sec = e.target.value; paint(); };
  $('#pst').onchange = e => { pf.st = e.target.value; paint(); };
  $('#psg').onchange = e => { pf.sg = e.target.value; paint(); };
  paint();
}

function peopleTable(rows) {
  return '<table class="tbl"><thead><tr>' +
    '<th style="width:92px">Number</th><th>Name</th><th>Position</th>' +
    '<th style="width:104px">Section</th><th style="width:72px">Grade</th>' +
    '<th style="width:112px">Joined</th><th style="width:126px">Status</th>' +
    '</tr></thead><tbody>' +
    rows.map(e =>
      '<tr onclick="location.hash=\'#/hr/p/' + e.empNo + '\'">' +
      '<td data-label="Number"><span class="ref">' + esc(e.empNo) + '</span></td>' +
      '<td data-label="Name"><div style="display:flex;align-items:center;gap:9px">' + empFace(e, 26) +
        '<div><div class="sum">' + esc(fullName(e)) + '</div>' +
        '<div class="meta">' + esc(e.title) + ' · ' + esc(e.gender) + '</div></div></div></td>' +
      '<td data-label="Position">' + esc(e.position) + '</td>' +
      '<td data-label="Section">' + secPill(e.section) + '</td>' +
      '<td data-label="Grade">' + sgPill(e.sg) + '</td>' +
      '<td data-label="Joined"><div>' + hrDate(e.joined) + '</div>' +
        '<div class="meta">' + hrYears(e.joined) + '</div></td>' +
      '<td data-label="Status">' + empStatusPill(e.status) + '</td></tr>').join('') +
    '</tbody></table>';
}

/* ---------------- one employee ---------------- */
function renderEmployee(no) {
  const e = emp(no);
  if (!e) { location.hash = '#/hr/people'; return; }
  setHead(fullName(e), e.position + ' · ' + sec(e.section).name);

  const boss = e.reportsTo ? emp(e.reportsTo) : null;
  const reports = state.hr.employees.filter(x => x.reportsTo === e.empNo);
  const g = grade(e.sg);

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/people\'">&larr; Back to the register</button>' +

    '<div class="tkhead">' +
      empFace(e, 46) +
      '<div style="flex:1;min-width:0">' +
        '<h2>' + esc(e.title + ' ' + fullName(e)) + '</h2>' +
        '<div class="meta" style="margin-top:3px">' + esc(e.position) + ' · ' + esc(e.empNo) + '</div>' +
      '</div>' +
      secPill(e.section) + sgPill(e.sg) + empStatusPill(e.status) +
    '</div>' +

    '<div class="grid c23" style="margin:16px 0 14px;align-items:start">' +
      card('Employment', 'not on the application form',
        '<div class="facts">' +
          kv('Employee number', esc(e.empNo)) +
          kv('Position', esc(e.position)) +
          kv('Position code', '<span class="mono">' + esc(e.positionCode || '—') + '</span>') +
          kv('Department', sec(e.section).name + (sec(e.section).active === false ? ' <span class="meta">(closed)</span>' : '')) +
          kv('Duty type', esc(e.dutyType || 'Full time')) +
          /* Two dates, deliberately both shown. They are different and
             the specification asks for both without saying which drives
             service - so the screen says which one does. */
          kv('Hired on', hrDate(e.hiredOn) + ' <span class="meta">offer accepted</span>') +
          kv('Date joined', hrDate(e.joined) + ' <span class="meta">first day · ' + hrYears(e.joined) + '</span>') +
          (e.retiredOn ? kv('Retired on', hrDate(e.retiredOn)) : '') +
          kv('Salary grade', esc(e.sg) + ' <span class="meta">' + esc(g.note) + '</span>') +
          kv('Contract', esc(contractName(e.contract))) +
          kv('Employee status', empStatusPill(e.status)) +
          kv('Reports to', boss ? empChip(boss) : '<span class="lbl">nobody — top of the tree</span>') +
          kv('Work permit', e.foreigner ? 'Yes — ' + esc(e.permitCountry) : 'Not required') +
          (e.foreigner ? kv('GOP number', '<span class="mono">' + esc(e.gopNo) + '</span>') : '') +
        '</div>' +
        '<div class="hint" style="margin-top:10px"><b>Service and leave are counted from the date ' +
        'joined</b>, not the hiring date. They are usually weeks apart and the difference is a day or ' +
        'two of entitlement — worth agreeing once rather than arguing about later.</div>') +
      card('Photograph and identity', e.empNo, photoPanel(e)) +
    '</div>' +

    '<div class="grid c23" style="margin-bottom:14px;align-items:start">' +
      card('Salary and bank', 'monthly', payPanel(e)) +
      card('Bank details', esc(e.bank),
        '<div class="facts">' +
          kv('Bank', esc(e.bank)) +
          kv('Branch', esc(e.bankBranch || '—')) +
          kv('Account number', '<span class="mono">' + esc(e.bankAcc) + '</span>') +
          kv('Pension Fund number', '<span class="mono">' + esc(e.pensionNo) + '</span>') +
          kv('Medical benefit', e.medicalBenefit ? 'Yes' : 'No') +
          (e.medicalBenefit ? kv('Scheme', esc(e.medicalScheme)) : '') +
        '</div>' +
        (reports.length ? '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line)">' +
          '<div class="lbl" style="margin-bottom:8px">Reports to this person</div>' +
          '<div class="chiprow">' + reports.map(r => empChip(r)).join('') + '</div></div>' : '')) +
    '</div>' +

    '<div class="grid c23" style="margin-bottom:14px;align-items:start">' +
      card('Annual leave', 'computed from service', leavePanelFor(e)) +
      card('Dependants', (e.dependants || []).length + ' recorded', dependantsPanel(e)) +
    '</div>' +

    '<div class="grid k2" style="margin-bottom:14px">' +
      card('Personal', 'PM/05 section 2',
        '<div class="facts">' +
          kv('Surname', esc(e.surname)) +
          kv('First names', esc(e.firstNames) + (e.knownAs ? ' <span class="meta">(known as ' + esc(e.knownAs) + ')</span>' : '')) +
          kv('Middle names', esc(e.middleNames)) +
          kv('Surname at birth', esc(e.surnameAtBirth)) +
          kv('Initials', esc(e.initials)) +
          kv('National Identity Number', '<span class="ref">' + esc(e.nin) + '</span>') +
          kv('Passport number', e.passportNo ? '<span class="mono">' + esc(e.passportNo) + '</span>' : '') +
          kv('Date of birth', hrDate(e.dob) + ' <span class="meta">(' + Math.floor((Date.now() - e.dob) / (365.25 * 864e5)) + ')</span>') +
          kv('Gender', esc(e.gender)) +
          kv('Nationality', esc(e.nationality)) +
          kv('Country of birth', esc(e.countryOfBirth)) +
          kv('Marital status', esc(e.maritalStatus)) +
          kv('District', esc(e.district)) +
          kv('Sub-district', esc(e.subDistrict)) +
          kv('Address', esc(e.address)) +
          kv('Contact number', esc(e.phone)) +
          kv('Personal email', esc(e.email)) +
          kv('Blood type', esc(e.bloodType)) +
          kv('Religion', esc(e.religion)) +
        '</div>' +
        '<div class="hint" style="margin-top:10px">Blood type and religion are <b>special category</b> ' +
        'personal data. Blood type earns its place — a driver in a road traffic accident is exactly ' +
        'why an operator holds it. Religion needs a stated reason before it is collected, and both ' +
        'should be visible to fewer people than the rest of this screen.</div>') +
      card('Next of kin', 'PM/05 section 10',
        '<div class="facts">' +
          kv('Surname', esc(e.nextOfKin.surname)) +
          kv('First names', esc(e.nextOfKin.firstNames)) +
          kv('National Identity Number', '<span class="ref">' + esc(e.nextOfKin.nin) + '</span>') +
          kv('Contact number', esc(e.nextOfKin.phone)) +
          kv('Relationship', esc(e.nextOfKin.relationship)) +
          kv('Address', esc(e.nextOfKin.address)) +
        '</div>' +
        '<div class="hint" style="margin-top:12px">This is the number somebody rings at two in the ' +
        'morning. It is worth a line on the annual check that it is still right.</div>') +
    '</div>' +

    '<div class="grid k2" style="margin-bottom:14px">' +
      card('Education and training', 'PM/05 section 3', eduList(e.education)) +
      card('Languages and licences', 'PM/05 sections 4 and 5',
        langTable(e.languages) +
        '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">' +
        '<div class="lbl" style="margin-bottom:8px">Driving licences held</div>' +
        (e.licences.length
          ? '<div class="chiprow">' + e.licences.map(l =>
              '<span class="who-chip" style="padding:3px 10px">' + esc(licName(l)) + '</span>').join('') + '</div>'
          : '<div class="meta">None recorded.</div>') +
        (e.licences.indexOf('D') !== -1
          ? '<div class="hint" style="margin-top:10px">Class D is the one that lets this person drive ' +
            'a bus in service. It is the field the fleet module will need.</div>' : '') +
        '</div>') +
    '</div>' +

    card('Employment before joining', 'PM/05 section 6', historyTable(e.history), true) +

    '<div class="grid k2" style="margin:14px 0">' +
      card('Disciplinary record', 'confidential', discPanelFor(e), true) +
      card('Documents', (e.documents || []).length + ' on file', documentsPanel(e)) +
    '</div>';

  /* The file inputs have to be wired after the markup is in the page.
     Doing it inside the string with an inline handler would work too,
     but the photograph needs a callback and a rollback if the save is
     refused, and that does not belong in an attribute. */
  bindPhoto(e.empNo);
  bindDoc(e.empNo);
}

function licName(id) { return (LICENCE_CLASSES.find(l => l.id === id) || { name: id }).name; }

function eduList(rows) {
  if (!rows || !rows.length) return '<div class="empty">Nothing recorded.</div>';
  return '<div class="edulist">' + rows.map(r =>
    '<div class="edu">' +
      '<div class="edu-h"><b>' + esc(r.qualification) + '</b>' +
        '<span class="meta">' + r.entered + ' – ' + r.left + '</span></div>' +
      '<div class="meta">' + esc(r.instituteName) + ', ' + esc(r.instituteAddress) + '</div>' +
      '<div class="meta">Subjects: ' + esc(r.subjects) + '</div>' +
    '</div>').join('') + '</div>';
}
function langTable(rows) {
  return '<table class="tbl mini"><tbody>' + rows.map(l =>
    '<tr><td style="width:110px">' + esc(l.language) + '</td>' +
    '<td class="meta">' + esc(l.level) + '</td></tr>').join('') + '</tbody></table>';
}
function historyTable(rows) {
  if (!rows || !rows.length)
    return '<div class="empty">No previous employment recorded. For somebody with long service ' +
           'that is normal — the form only asks for what came before.</div>';
  return '<table class="tbl"><thead><tr><th>Employer</th><th>Position</th>' +
    '<th style="width:168px">Period</th><th style="width:74px">Grade</th>' +
    '<th style="width:126px">Gross a year</th><th style="width:150px">Reason for leaving</th>' +
    '</tr></thead><tbody>' + rows.map(h =>
      '<tr style="cursor:default">' +
      '<td data-label="Employer"><div class="sum">' + esc(h.organisation) + '</div>' +
        '<div class="meta">' + esc(h.address) + '</div></td>' +
      '<td data-label="Position">' + esc(h.position) + '</td>' +
      '<td data-label="Period">' + hrDate(h.from) + ' – ' + hrDate(h.to) + '</td>' +
      '<td data-label="Grade">' + sgPill(h.sg) + '</td>' +
      '<td data-label="Gross a year">' + money(h.salary) + '</td>' +
      '<td data-label="Reason">' + esc(h.reason) + '</td></tr>').join('') +
    '</tbody></table>';
}

/* ---------------- vacancies ---------------- */
function renderVacancies() {
  setHead('Vacancies', 'Positions advertised, and what has come in');
  const rows = state.hr.vacancies.slice().sort((a, b) => a.closes - b.closes);
  $('#view').innerHTML =
    hrBanner() +
    card('Advertised positions', rows.reduce((n, v) => n + v.posts, 0) + ' posts',
      '<table class="tbl"><thead><tr><th style="width:130px">Code</th><th>Position</th>' +
      '<th style="width:104px">Section</th><th style="width:72px">Grade</th>' +
      '<th style="width:62px">Posts</th><th style="width:132px">Closes</th>' +
      '<th style="width:150px">Applications</th></tr></thead><tbody>' +
      rows.map(v => {
        const a = appsFor(v.id);
        const days = Math.ceil((v.closes - Date.now()) / 864e5);
        return '<tr onclick="location.hash=\'#/hr/apps\'">' +
          '<td data-label="Code"><span class="ref">' + esc(v.code) + '</span></td>' +
          '<td data-label="Position"><div class="sum">' + esc(v.title) + '</div>' +
            '<div class="meta">' + esc(v.employer) + '</div></td>' +
          '<td data-label="Section">' + secPill(v.section) + '</td>' +
          '<td data-label="Grade">' + sgPill(v.sg) + '</td>' +
          '<td data-label="Posts">' + v.posts + '</td>' +
          '<td data-label="Closes"><div>' + hrDate(v.closes) + '</div>' +
            '<div class="meta ' + (days < 0 ? 'lateish' : '') + '">' +
            (days < 0 ? 'closed' : 'in ' + days + ' days') + '</div></td>' +
          '<td data-label="Applications">' + a.length + ' received' +
            (a.filter(x => x.status === 'received').length
              ? '<div class="meta lateish">' + a.filter(x => x.status === 'received').length +
                ' not yet opened</div>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table>', true);
}

/* ---------------- applications ---------------- */
let appFilter = { st: '', q: '' };
function renderApplications() {
  setHead('Applications', 'Form PM/05, as received');
  $('#view').innerHTML =
    '<div class="filters">' +
      '<input type="search" id="aq" placeholder="Name, reference, position" value="' + esc(appFilter.q) + '">' +
      '<select id="ast"><option value="">Any stage</option>' +
        APP_STATUS.map(s => '<option value="' + s.id + '"' + (appFilter.st === s.id ? ' selected' : '') + '>' +
          esc(s.name) + '</option>').join('') + '</select>' +
      '<span class="spacer"></span>' +
      '<a class="btn primary" href="#/hr/apply">New PM/05 application</a>' +
    '</div>' +
    '<div class="card" id="awrap"></div>';
  const paint = () => {
    const rows = state.hr.applications.filter(a => {
      if (appFilter.st && a.status !== appFilter.st) return false;
      if (appFilter.q) {
        const hay = (a.id + ' ' + a.firstNames + ' ' + a.surname + ' ' + a.positionTitle).toLowerCase();
        if (hay.indexOf(appFilter.q.toLowerCase()) === -1) return false;
      }
      return true;
    });
    $('#awrap').innerHTML = '<header><h3>' + rows.length + ' of ' +
      state.hr.applications.length + ' applications</h3></header>' +
      (rows.length ? appTable(rows) : '<div class="empty">Nothing at that stage.</div>');
  };
  $('#aq').oninput = e => { appFilter.q = e.target.value; paint(); };
  $('#ast').onchange = e => { appFilter.st = e.target.value; paint(); };
  paint();
}

function appTable(rows) {
  if (!rows.length) return '<div class="empty">Nothing outstanding.</div>';
  return '<table class="tbl"><thead><tr><th style="width:132px">Reference</th><th>Applicant</th>' +
    '<th>Position applied for</th><th style="width:104px">Section</th>' +
    '<th style="width:120px">Received</th><th style="width:150px">Stage</th>' +
    '</tr></thead><tbody>' + rows.map(a =>
      '<tr onclick="location.hash=\'#/hr/a/' + a.id + '\'">' +
      '<td data-label="Reference"><span class="ref">' + esc(a.id) + '</span></td>' +
      '<td data-label="Applicant"><div class="sum">' + esc(a.firstNames + ' ' + a.surname) + '</div>' +
        '<div class="meta">' + esc(a.title) + ' · ' + esc(a.nin) + '</div></td>' +
      '<td data-label="Position"><div>' + esc(a.positionTitle) + '</div>' +
        '<div class="meta">' + esc(a.positionCode) + '</div></td>' +
      '<td data-label="Section">' + secPill(a.section) + '</td>' +
      '<td data-label="Received"><div>' + hrDate(a.receivedAt) + '</div>' +
        '<div class="meta">' + ago(a.receivedAt) + '</div></td>' +
      '<td data-label="Stage">' + appPill(a.status) + '</td></tr>').join('') +
    '</tbody></table>';
}

/* --- one application: the whole form, in the order it is printed --- */
function renderApplication(id) {
  const a = app(id);
  if (!a) { location.hash = '#/hr/apps'; return; }
  setHead(a.firstNames + ' ' + a.surname, 'Form PM/05 · ' + a.positionTitle);

  const hired = state.hr.employees.find(e => e.fromApplication === a.id);

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/apps\'">&larr; Back to applications</button>' +

    '<div class="tkhead">' +
      '<div style="flex:1;min-width:0">' +
        '<h2>' + esc(a.title + ' ' + a.firstNames + ' ' + a.surname) + '</h2>' +
        '<div class="meta" style="margin-top:3px">' + esc(a.id) + ' · received ' + hrDate(a.receivedAt) + '</div>' +
      '</div>' + appPill(a.status) + secPill(a.section) + sgPill(a.sg) +
    '</div>' +

    '<div class="formnote">Form PM/05, Annex 5 — Government of Seychelles Employment Application ' +
    'Form. Reproduced section by section, in the order the paper form prints them.</div>' +

    (hired ? '<div class="hiredbox">Hired on this application. Employee record ' +
      empChip(hired) + '</div>' : '') +

    '<div class="card" style="margin-bottom:14px"><header><h3>Move this application on</h3></header>' +
      '<div class="body"><div class="actions" id="appacts">' +
        (a.status === 'received' ? '<button class="btn" data-to="shortlisted">Shortlist</button>' : '') +
        (a.status === 'shortlisted' ? '<button class="btn" data-to="interviewed">Record interview</button>' : '') +
        (a.status === 'interviewed' ? '<button class="btn" data-to="offered">Make an offer</button>' : '') +
        (a.status === 'offered' && !hired ? '<button class="btn primary" data-to="hire">Hire — create the employee record</button>' : '') +
        (['hired', 'rejected'].indexOf(a.status) === -1 ? '<button class="btn" data-to="rejected">Not taken forward</button>' : '') +
        (['hired', 'rejected'].indexOf(a.status) !== -1 ? '<span class="meta">This application is closed.</span>' : '') +
      '</div>' +
      '<div class="hint" style="margin-top:11px">Hiring copies everything on this form into an ' +
      'employee record. It is the reason the form is worth capturing properly: nobody types it twice.</div>' +
      '</div></div>' +

    formSection(1, 'Position applied for',
      '<div class="facts">' + kv('Position title', esc(a.positionTitle)) +
      kv('Employer name', esc(a.employer)) + kv('Position code', '<span class="ref">' + esc(a.positionCode) + '</span>') +
      '</div>') +

    formSection(2, 'Personal information',
      '<div class="facts">' +
        kv('Surname', esc(a.surname)) + kv('Title', esc(a.title)) +
        kv('First names', esc(a.firstNames)) + kv('Name normally used', esc(a.knownAs)) +
        kv('Initials', esc(a.initials)) + kv('National Identity Number', '<span class="ref">' + esc(a.nin) + '</span>') +
        kv('Surname at birth', esc(a.surnameAtBirth)) + kv('Date of birth', hrDate(a.dob)) +
        kv('Nationality', esc(a.nationality)) + kv('Country of birth', esc(a.countryOfBirth)) +
        kv('Gender', esc(a.gender)) + kv('Marital status', esc(a.maritalStatus)) +
        kv('Residential / postal address', esc(a.address)) + kv('Contact numbers', esc(a.phone)) +
      '</div>') +

    formSection(3, 'Education and training record', eduList(a.education)) +
    formSection(4, 'Languages', langTable(a.languages)) +
    formSection(5, 'Driving licence(s)',
      a.licences.length
        ? '<div class="chiprow">' + a.licences.map(l =>
            '<span class="who-chip" style="padding:3px 10px">' + esc(licName(l)) + '</span>').join('') + '</div>'
        : '<div class="meta">None stated.</div>') +
    formSection(6, 'Employment history', historyTable(a.history)) +
    formSection(7, 'Availability',
      '<div class="facts">' + kv('Available to take up employment from', hrDate(a.availableFrom)) + '</div>') +
    formSection(8, 'Description of career', '<div class="quote">' + esc(a.career) + '</div>') +
    formSection(9, 'References',
      '<div class="grid k2" style="gap:14px">' + a.references.map(r =>
        '<div class="facts">' + kv('Surname', esc(r.surname)) + kv('First names', esc(r.firstNames)) +
        kv('Contact', esc(r.contact)) + kv('Occupation', esc(r.occupation)) +
        kv('Address', esc(r.address)) + '</div>').join('') + '</div>' +
      '<div class="facts" style="margin-top:12px">' +
        kv('May we contact your present employer?', esc(a.contactPresent)) +
        kv('May we contact your past employers?', esc(a.contactPast)) + '</div>') +
    formSection(10, 'Next of kin',
      '<div class="facts">' + kv('Surname', esc(a.nextOfKin.surname)) +
      kv('First names', esc(a.nextOfKin.firstNames)) +
      kv('National Identity Number', '<span class="ref">' + esc(a.nextOfKin.nin) + '</span>') +
      kv('Contact numbers', esc(a.nextOfKin.phone)) +
      kv('Relationship to applicant', esc(a.nextOfKin.relationship)) +
      kv('Address', esc(a.nextOfKin.address)) + '</div>') +
    formSection(11, 'Other relevant particulars',
      a.particulars ? '<div class="quote">' + esc(a.particulars) + '</div>' : '<div class="meta">Nothing stated.</div>') +
    formSection(12, 'Interests in private business',
      a.privateBusiness ? '<div class="quote">' + esc(a.privateBusiness) + '</div>'
        : '<div class="meta">None declared.</div>') +
    formSection(13, 'Declaration',
      '<div class="meta">"The facts set forth in this application for employment are true and ' +
      'complete." Signed ' + hrDate(a.declaredAt) + '.</div>') +
    formSection(14, 'Comments of present employer',
      a.employerComment
        ? '<div class="facts">' + kv('Name', esc(a.employerComment.name)) +
          kv('Designation', esc(a.employerComment.designation)) +
          kv('Signed', hrDate(a.employerComment.at)) + '</div>'
        : '<div class="meta">Not applicable — no present employer, or not completed.</div>') +

    '<div class="card dupnote"><div class="body">' +
      '<b>Section 15 on the paper form is section 14 again.</b> The whole block, ' +
      'including the declaration above it, is printed twice. It looks like a copy and paste when the ' +
      'form was made in 2017, and nobody has caught it since. It is shown once here on purpose. ' +
      'Worth raising with them — it is their form, not ours, and it is the kind of thing that makes ' +
      'a filing clerk collect two signatures for no reason.' +
    '</div></div>';

  document.querySelectorAll('#appacts button').forEach(b => b.onclick = () => {
    const to = b.dataset.to;
    if (to === 'hire') return hireApplicant(a);
    a.status = to;
    save(); renderApplication(a.id); paintChrome();
    toast('Application marked ' + appStatus(to).name.toLowerCase() + '.');
  });
}

function formSection(n, title, body) {
  return '<div class="card fsec"><header><span class="fnum">' + n + '</span>' +
    '<h3>' + esc(title) + '</h3></header><div class="body">' + body + '</div></div>';
}

/* --- hiring: the point of the whole thing --- */
function hireApplicant(a) {
  const v = vac(a.vacancyId);
  const g = grade(a.sg);
  const next = state.hr.employees.reduce((m, e) => Math.max(m, +e.empNo.slice(1) || 0), 1000) + 1;
  const now = Date.now();

  const e = {
    empNo: 'E' + next,
    fromApplication: a.id,
    title: a.title, surname: a.surname, firstNames: a.firstNames, knownAs: a.knownAs,
    surnameAtBirth: a.surnameAtBirth, initials: a.initials, gender: a.gender,
    dob: a.dob, nin: a.nin, nationality: a.nationality, countryOfBirth: a.countryOfBirth,
    maritalStatus: a.maritalStatus, address: a.address, phone: a.phone,

    /* fields the specification wants on an employee but PM/05 has no
       box for. They are left EMPTY on purpose rather than invented:
       a blank the HR officer has to fill is honest, a made-up bank
       account number is a payment to nowhere. */
    middleNames: '', email: '', passportNo: '', religion: '', bloodType: '',
    district: '', subDistrict: '', photo: null, documents: [], dependants: [],

    section: a.section, position: a.positionTitle, isHead: false, sg: a.sg,
    positionCode: (positionByTitle(a.positionTitle) || {}).code || null,
    dutyType: 'Full time',
    salary: g.min,
    hoursPerMonth: HOURS_PER_MONTH,
    allowances: [],
    medicalBenefit: false, medicalScheme: '',
    /* they cannot start before the date they told us they were free */
    hiredOn: now,
    joined: Math.max(now, a.availableFrom),
    retiredOn: null,
    contract: 'prob', status: 'probation',
    workPermit: a.nationality !== 'Seychellois',
    foreigner: a.nationality !== 'Seychellois',
    permitCountry: a.nationality !== 'Seychellois' ? a.countryOfBirth : '',
    gopNo: '',
    pensionNo: '', bank: '', bankBranch: '', bankAcc: '',
    leaveEntitlement: 21, leaveTaken: 0,

    licences: a.licences.slice(),
    languages: a.languages.map(l => ({ language: l.language, level: l.level })),
    education: a.education.slice(),
    history: a.history.slice(),
    nextOfKin: Object.assign({}, a.nextOfKin),
    reportsTo: (state.hr.employees.find(x => x.isHead && x.section === a.section) || {}).empNo || null
  };

  state.hr.employees.push(e);
  a.status = 'hired';
  if (v && v.posts > 0) v.posts--;
  save();
  toast(fullName(e) + ' hired as ' + e.empNo + '. Starts ' + hrDate(e.joined) + '.');
  location.hash = '#/hr/p/' + e.empNo;
}

/* ---------------- the form itself ---------------- */
function renderApplyForm() {
  setHead('New application', 'Form PM/05 — Government of Seychelles');
  const vs = state.hr.vacancies;

  const eduBlock = i =>
    '<div class="subblock"><div class="lbl">Record ' + (i + 1) + '</div>' +
    '<div class="frm">' +
      '<label><span>Level / course</span><input id="ed_c' + i + '"></label>' +
      '<label><span>Qualification obtained</span>' +
        '<select id="ed_q' + i + '"><option value="">—</option>' +
        QUALS.map(q => '<option>' + esc(q) + '</option>').join('') + '</select></label>' +
      '<label><span>Subjects</span><input id="ed_s' + i + '"></label>' +
      '<div class="two"><label><span>Institute name</span><input id="ed_n' + i + '"></label>' +
        '<label><span>Institute address</span><input id="ed_a' + i + '"></label></div>' +
      '<div class="two"><label><span>Date entered</span><input id="ed_f' + i + '" placeholder="YYYY"></label>' +
        '<label><span>Date left</span><input id="ed_t' + i + '" placeholder="YYYY"></label></div>' +
    '</div></div>';

  const jobBlock = i =>
    '<div class="subblock"><div class="lbl">Employer ' + (i + 1) + '</div>' +
    '<div class="frm">' +
      '<label><span>Employing organisation</span><input id="jb_o' + i + '"></label>' +
      '<label><span>Address</span><input id="jb_a' + i + '"></label>' +
      '<label><span>Position occupied</span><input id="jb_p' + i + '"></label>' +
      '<div class="two"><label><span>From</span><input type="date" id="jb_f' + i + '"></label>' +
        '<label><span>To</span><input type="date" id="jb_t' + i + '"></label></div>' +
      '<div class="two">' +
        '<label><span>Salary grade (SG)</span><select id="jb_g' + i + '"><option value="">—</option>' +
          GRADES.map(g => '<option value="' + g.sg + '">' + esc(g.sg) + '</option>').join('') + '</select></label>' +
        '<label><span>Gross salary a year (SR)</span><input id="jb_s' + i + '" inputmode="numeric"></label></div>' +
      '<label><span>Reason for leaving</span><input id="jb_r' + i + '"></label>' +
    '</div></div>';

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/apps\'">&larr; Back to applications</button>' +
    '<div class="formnote">This is Form PM/05, Annex 5 — the Government of Seychelles Employment ' +
    'Application Form — as a screen. The section numbers and titles are the ones printed on the ' +
    'paper, so somebody working from a completed form can go straight down it.</div>' +

    formSection(1, 'Position applied for',
      '<div class="frm"><label><span>Position applied for</span>' +
      '<select id="f_vac">' + vs.map(v => '<option value="' + v.id + '">' + esc(v.title) +
        ' — ' + esc(v.code) + '</option>').join('') + '</select></label>' +
      '<div class="two"><label><span>Employer name</span>' +
        '<input id="f_employer" value="Seychelles Public Transport Corporation"></label>' +
        '<label><span>Position code</span><input id="f_code" readonly></label></div></div>') +

    formSection(2, 'Personal information',
      '<div class="frm">' +
        '<div class="two"><label><span>Surname</span><input id="f_sur"></label>' +
          '<label><span>First names</span><input id="f_first"></label></div>' +
        '<div class="two"><label><span>Title</span><select id="f_title">' +
          TITLES.map(t => '<option>' + t + '</option>').join('') + '</select></label>' +
          '<label><span>Name normally used</span><input id="f_known"></label></div>' +
        '<div class="two"><label><span>National Identity Number</span>' +
          '<input id="f_nin" inputmode="numeric" placeholder="9 digits"></label>' +
          '<label><span>Surname at birth</span><input id="f_surbirth"></label></div>' +
        '<div class="two"><label><span>Date of birth</span><input type="date" id="f_dob"></label>' +
          '<label><span>Gender</span><select id="f_gender"><option>Female</option><option>Male</option></select></label></div>' +
        '<div class="two"><label><span>Nationality</span><input id="f_nat" value="Seychellois"></label>' +
          '<label><span>Country of birth</span><input id="f_cob" value="Seychelles"></label></div>' +
        '<div class="two"><label><span>Marital status</span><select id="f_marital">' +
          MARITAL.map(m => '<option>' + m + '</option>').join('') + '</select></label>' +
          '<label><span>Contact numbers</span><input id="f_phone" placeholder="2 xx xx xx"></label></div>' +
        '<label><span>Residential / postal address</span><input id="f_addr"></label>' +
      '</div>') +

    formSection(3, 'Education and training record',
      '<div class="hint" style="margin-bottom:12px">The paper form has room for three. ' +
      'The first block calls this "Qualification obtained" and the other two call it ' +
      '"Certificate obtained" — the same field under two names. One name here.</div>' +
      [0, 1, 2].map(eduBlock).join('')) +

    formSection(4, 'Languages',
      '<div class="frm">' + [0, 1, 2, 3, 4].map(i =>
        '<div class="two"><label><span>Language ' + (i + 1) + '</span>' +
        '<input id="lg_n' + i + '" value="' + (FORM_LANGUAGES[i] || '') + '"' +
        (i < 3 ? ' readonly' : '') + '></label>' +
        '<label><span>Level and qualifications</span><select id="lg_l' + i + '">' +
          '<option value="">—</option>' + LANG_LEVELS.map(l => '<option>' + l + '</option>').join('') +
        '</select></label></div>').join('') + '</div>') +

    formSection(5, 'Driving licence(s)',
      '<div class="lbl" style="margin-bottom:9px">State the types which you possess</div>' +
      '<div class="chiprow">' + LICENCE_CLASSES.map(l =>
        '<label class="chk"><input type="checkbox" class="lic" value="' + l.id + '"> ' +
        esc(l.name) + '</label>').join('') + '</div>') +

    formSection(6, 'Employment history', [0, 1, 2, 3].map(jobBlock).join('')) +

    formSection(7, 'Availability',
      '<div class="frm"><label><span>On what date would you be available to take up employment</span>' +
      '<input type="date" id="f_avail"></label></div>') +

    formSection(8, 'Description of career',
      '<div class="frm"><label><span>A concise account of relevant experience, and why you are ' +
      'applying for this post</span><textarea id="f_career" rows="5"></textarea></label></div>') +

    formSection(9, 'References',
      '<div class="hint" style="margin-bottom:12px">Two people in a supervisory position who have ' +
      'known you for two years.</div>' +
      [0, 1].map(i => '<div class="subblock"><div class="lbl">Referee ' + (i + 1) + '</div><div class="frm">' +
        '<div class="two"><label><span>Surname</span><input id="rf_s' + i + '"></label>' +
        '<label><span>First names</span><input id="rf_f' + i + '"></label></div>' +
        '<div class="two"><label><span>Contact</span><input id="rf_c' + i + '"></label>' +
        '<label><span>Occupation</span><input id="rf_o' + i + '"></label></div>' +
        '<label><span>Address</span><input id="rf_a' + i + '"></label></div></div>').join('') +
      '<div class="frm"><div class="two">' +
        '<label><span>May we contact your present employer?</span>' +
          '<select id="f_cpres"><option>Yes</option><option>No</option></select></label>' +
        '<label><span>May we contact your past employers?</span>' +
          '<select id="f_cpast"><option>Yes</option><option>No</option></select></label>' +
      '</div></div>') +

    formSection(10, 'Next of kin',
      '<div class="hint" style="margin-bottom:12px">Person to be contacted in case of emergency.</div>' +
      '<div class="frm">' +
        '<div class="two"><label><span>Surname</span><input id="nk_sur"></label>' +
          '<label><span>First names</span><input id="nk_first"></label></div>' +
        '<div class="two"><label><span>National Identity Number</span><input id="nk_nin"></label>' +
          '<label><span>Contact numbers</span><input id="nk_phone"></label></div>' +
        '<div class="two"><label><span>Relationship to applicant</span><input id="nk_rel"></label>' +
          '<label><span>Address</span><input id="nk_addr"></label></div>' +
      '</div>') +

    formSection(11, 'Other relevant particulars',
      '<div class="frm"><label><span>Any special interests</span>' +
      '<textarea id="f_particulars" rows="3"></textarea></label></div>') +

    formSection(12, 'Interests in private business',
      '<div class="frm"><label><span>Give details</span>' +
      '<textarea id="f_private" rows="3"></textarea></label></div>') +

    formSection(13, 'Declaration',
      '<label class="chk"><input type="checkbox" id="f_declare"> ' +
      'The facts set forth in this application for employment are true and complete.</label>' +
      '<div class="actions" style="margin-top:16px">' +
        '<button class="btn primary" id="f_save">Submit the application</button>' +
        '<button class="btn" id="f_fill">Fill it in for me</button>' +
      '</div>' +
      '<div class="hint" style="margin-top:10px">Nothing is sent anywhere. It is added to the ' +
      'applications list in this browser.</div>');

  const syncCode = () => {
    const v = vac($('#f_vac').value);
    if (v) { $('#f_code').value = v.code; $('#f_employer').value = v.employer; }
  };
  $('#f_vac').onchange = syncCode;
  syncCode();
  $('#f_fill').onclick = fillApplyForm;
  $('#f_save').onclick = submitApplication;
  applyStepper();   /* groups the sections above into steps, if that mode is on */
}

function fillApplyForm() {
  const set = (id, v) => { const el = $('#' + id); if (el) el.value = v; };
  const d = n => new Date(n).toISOString().slice(0, 10);
  set('f_sur', 'Melanie'); set('f_first', 'Dominic'); set('f_known', 'Dominic');
  set('f_title', 'Mr'); set('f_gender', 'Male');
  /* The identity number's first six digits ARE the date of birth, and the
     form checks that. A sample applicant whose own two fields disagree
     makes the demonstration argue with itself the moment anybody presses
     save, so the date is fixed and the number is built from it. */
  set('f_dob', '1994-07-14'); set('f_nin', '140794226');
  set('f_phone', '2 51 448');
  set('f_addr', '14 Anse aux Pins, Mahé'); set('f_marital', 'Married');
  set('f_avail', d(Date.now() + 21 * 864e5));
  set('ed_c0', 'NVQ Level 3 course'); set('ed_q0', 'NVQ Level 3');
  set('ed_s0', 'Mechanical engineering');
  set('ed_n0', 'Seychelles Institute of Technology'); set('ed_a0', 'Providence, Mahé');
  set('ed_f0', '2013'); set('ed_t0', '2015');
  set('lg_l0', 'Mother tongue'); set('lg_l1', 'Fluent'); set('lg_l2', 'Working knowledge');
  set('jb_o0', 'Public Utilities Corporation'); set('jb_a0', 'Roche Caiman, Mahé');
  set('jb_p0', 'Driver'); set('jb_f0', d(Date.now() - 6 * 365.25 * 864e5));
  set('jb_t0', d(Date.now() - 60 * 864e5)); set('jb_g0', 'SG7'); set('jb_s0', '124000');
  set('jb_r0', 'Better prospects');
  set('f_career', 'I have driven for six years, including heavy vehicles, and I hold a class D ' +
    'licence. I know the Victoria routes and I am used to early starts.');
  set('rf_s0', 'Hoareau'); set('rf_f0', 'Bertrand'); set('rf_c0', '2 72 119');
  set('rf_o0', 'Foreman'); set('rf_a0', 'Cascade, Mahé');
  set('rf_s1', 'Vidot'); set('rf_f1', 'Merna'); set('rf_c1', '2 63 507');
  set('rf_o1', 'Supervisor'); set('rf_a1', 'Bel Air, Mahé');
  set('nk_sur', 'Melanie'); set('nk_first', 'Jacqueline'); set('nk_nin', '030289417');
  set('nk_phone', '2 55 902'); set('nk_rel', 'Spouse'); set('nk_addr', '14 Anse aux Pins, Mahé');
  set('f_particulars', 'Football, coaching a junior side at Anse aux Pins.');
  document.querySelectorAll('.lic').forEach(c => { if (c.value === 'B' || c.value === 'D') c.checked = true; });
  $('#f_declare').checked = true;
  toast('Filled in with a sample applicant.');
}

function submitApplication() {
  const val = id => { const el = $('#' + id); return el ? el.value.trim() : ''; };
  const need = [['f_sur', 'a surname'], ['f_first', 'first names'],
                ['f_nin', 'a National Identity Number'], ['f_dob', 'a date of birth']];
  for (let i = 0; i < need.length; i++) {
    if (!val(need[i][0])) {
      toast('The form needs ' + need[i][1] + '.', true);
      const el = $('#' + need[i][0]);
      /* In stepped mode the empty field may be two steps back. Focusing an
         input inside a display:none block does nothing, so the complaint
         would name a field the user cannot see. Go to its step first. */
      stepShowFor(el);
      el.focus(); el.scrollIntoView({ block: 'center' });
      return;
    }
  }
  if (!$('#f_declare').checked) {
    toast('The declaration in section 13 has to be signed.', true);
    stepShowFor($('#f_declare'));
    $('#f_declare').scrollIntoView({ block: 'center' });
    return;
  }
  /* The identity number encodes the date of birth in its first six
     digits. Checking that here is the cheapest possible catch for a
     mistyped one, and it is a rule the registry already applies. */
  const nin = val('f_nin').replace(/\D/g, '');
  if (nin.length !== 9) {
    toast('A National Identity Number is nine digits.', true);
    stepShowFor($('#f_nin')); $('#f_nin').focus();
    return;
  }
  const dob = new Date(val('f_dob'));
  const p = n => String(n).padStart(2, '0');
  const expect = p(dob.getDate()) + p(dob.getMonth() + 1) + p(dob.getFullYear() % 100);
  if (nin.slice(0, 6) !== expect) {
    if (!confirm('The identity number starts ' + nin.slice(0, 6) + ', but the date of birth given ' +
        'would make it start ' + expect + '.\n\nSave it anyway?')) return;
  }

  const v = vac($('#f_vac').value) || state.hr.vacancies[0];
  const eduRows = [0, 1, 2].map(i => ({
    course: val('ed_c' + i), qualification: val('ed_q' + i), subjects: val('ed_s' + i),
    instituteName: val('ed_n' + i), instituteAddress: val('ed_a' + i),
    entered: val('ed_f' + i), left: val('ed_t' + i)
  })).filter(r => r.qualification || r.instituteName);
  const jobRows = [0, 1, 2, 3].map(i => ({
    organisation: val('jb_o' + i), address: val('jb_a' + i), position: val('jb_p' + i),
    from: val('jb_f' + i) ? +new Date(val('jb_f' + i)) : null,
    to: val('jb_t' + i) ? +new Date(val('jb_t' + i)) : null,
    sg: val('jb_g' + i), salary: +val('jb_s' + i) || 0, reason: val('jb_r' + i)
  })).filter(r => r.organisation);

  const now = Date.now();
  const a = {
    id: 'APP-' + (2026000 + 900 + state.hr.applications.length),
    status: 'received', receivedAt: now,
    positionTitle: v.title, positionCode: v.code, employer: val('f_employer'),
    vacancyId: v.id, section: v.section, sg: v.sg,
    title: val('f_title'), surname: val('f_sur'), firstNames: val('f_first'),
    knownAs: val('f_known') || val('f_first'), surnameAtBirth: val('f_surbirth'),
    initials: (val('f_first')[0] + val('f_sur')[0]).toUpperCase(),
    nin: nin, dob: +dob, nationality: val('f_nat'), countryOfBirth: val('f_cob'),
    gender: val('f_gender'), maritalStatus: val('f_marital'),
    address: val('f_addr'), phone: val('f_phone'),
    education: eduRows,
    languages: [0, 1, 2, 3, 4].map(i => ({ language: val('lg_n' + i), level: val('lg_l' + i) }))
                              .filter(l => l.language && l.level),
    licences: Array.prototype.slice.call(document.querySelectorAll('.lic:checked')).map(c => c.value),
    history: jobRows,
    availableFrom: val('f_avail') ? +new Date(val('f_avail')) : now,
    career: val('f_career'),
    references: [0, 1].map(i => ({
      surname: val('rf_s' + i), firstNames: val('rf_f' + i), contact: val('rf_c' + i),
      address: val('rf_a' + i), occupation: val('rf_o' + i)
    })).filter(r => r.surname),
    contactPresent: val('f_cpres'), contactPast: val('f_cpast'),
    nextOfKin: {
      surname: val('nk_sur'), firstNames: val('nk_first'), nin: val('nk_nin'),
      phone: val('nk_phone'), address: val('nk_addr'), relationship: val('nk_rel')
    },
    particulars: val('f_particulars'), privateBusiness: val('f_private'),
    declaredAt: now, employerComment: null
  };
  state.hr.applications.unshift(a);
  save(); paintChrome();
  toast('Application ' + a.id + ' received.');
  location.hash = '#/hr/a/' + a.id;
}
