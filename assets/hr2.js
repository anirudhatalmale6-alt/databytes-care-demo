/* ==================================================================
   Human Resources — the rest of the specification

   Leave, medical, discipline, announcements, and the two reference
   tables. Split from hr.js only because one file of two thousand lines
   is nobody's friend; everything here shares the same globals.

   NOTHING in this file may declare a top-level name that already
   exists in data.js, hr-data.js, app.js or hr.js. Four classic scripts
   share ONE global lexical environment, so a repeated top-level const
   or function is a SyntaxError that silently kills the whole file -
   and the symptom is an empty screen, not an error anybody sees.
   check-hr.js proves it on every run.
   ================================================================== */

/* ---------------- small shared helpers ---------------- */
const fv = id => { const el = $('#' + id); return el ? String(el.value).trim() : ''; };
const fchecked = id => { const el = $('#' + id); return !!(el && el.checked); };
const lv = id => (state.hr.leave || []).find(l => l.id === id) || null;
const dc = id => (state.hr.discipline || []).find(d => d.id === id) || null;
const ann = id => (state.hr.announcements || []).find(a => a.id === id) || null;

function dateInput(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
         '-' + String(d.getDate()).padStart(2, '0');
}
/* A date typed into <input type=date> is parsed as UTC midnight by the
   Date constructor, which lands on the PREVIOUS day for anyone west of
   Greenwich and, more quietly, makes a leave request one day short at
   certain hours. Parse the parts and build a local noon instead. */
function parseDateInput(s) {
  if (!s) return 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return 0;
  return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0, 0).getTime();
}
function selOpts(list, selected, vk, lk) {
  return list.map(o => {
    const v = vk ? o[vk] : o, l = lk ? o[lk] : o;
    return '<option value="' + esc(v) + '"' + (String(v) === String(selected) ? ' selected' : '') +
           '>' + esc(l) + '</option>';
  }).join('');
}
function tonePill(name, tone) {
  return '<span class="pill st-' + tone + '"><i></i>' + esc(name) + '</span>';
}
function lvPill(id) { const s = leaveStatus(id); return tonePill(s.name, s.tone); }

/* The photograph, or the initials if there is not one. Everywhere a
   person appears they should look the same, so this is the only place
   that decides. */
function empFace(e, px) {
  const size = px || 40;
  if (e && e.photo) {
    return '<img class="face" src="' + e.photo + '" alt="" width="' + size + '" height="' + size +
           '" style="width:' + size + 'px;height:' + size + 'px">';
  }
  return empAv(e || { initials: '??' }, size);
}

/* Is the person looking at the screen allowed to decide leave and
   discipline? The specification is explicit: the employee sees the
   status, only a supervisor or manager can change it. The Agent /
   Supervisor switch in the top bar already models exactly that. */
function isSupervisor() {
  const u = me();
  return u && (u.role === 'supervisor' || u.role === 'head' || u.role === 'exec');
}
function supervisorNote() {
  return '<div class="hint">Switch to <b>Supervisor</b> in the top bar to decide this. ' +
    'An employee can see the status of their own application but cannot change it.</div>';
}

/* ---------------- uploads ----------------------------------------
   There is no server here, so a file has nowhere to go. Two different
   honest answers, and it matters which is which:

     - a photograph is shrunk in the browser to a small square and kept
       with the record, so it is really there on the next screen
     - anything else is recorded by name, type, size and date, and the
       bytes are NOT kept

   Storing a scanned PDF for fifty employees would fill the browser's
   few megabytes of local storage and lose the whole session, which is
   a far worse outcome than a document register that is honest about
   where the file lives.
   ------------------------------------------------------------------ */
const PHOTO_PX = 160;
function readPhoto(file, cb) {
  if (!file) return cb(null, 'No file chosen.');
  if (!/^image\//.test(file.type)) return cb(null, 'That is not an image file.');
  const fr = new FileReader();
  fr.onerror = () => cb(null, 'The file could not be read.');
  fr.onload = () => {
    const img = new Image();
    img.onerror = () => cb(null, 'That image could not be decoded.');
    img.onload = () => {
      /* square crop from the middle, then down to PHOTO_PX. A full
         camera photograph is several megabytes as a data URL and would
         exhaust local storage after a handful of records. */
      const side = Math.min(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = c.height = PHOTO_PX;
      const g = c.getContext('2d');
      g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side,
                  0, 0, PHOTO_PX, PHOTO_PX);
      cb(c.toDataURL('image/jpeg', 0.78), null);
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}
function fileNote(f) {
  return { name: f.name, kind: f.type || 'unknown', size: f.size, at: Date.now(), stored: false };
}
function kb(n) { return n > 1024 * 1024 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'; }

/* ================================================================
   LEAVE
   ================================================================ */
let lvFilter = { st: '', type: '', q: '' };

function renderLeave() {
  setHead('Leave', 'Applications, entitlement and balances');
  const rows = (state.hr.leave || []).filter(l => {
    if (lvFilter.st && l.status !== lvFilter.st) return false;
    if (lvFilter.type && l.type !== lvFilter.type) return false;
    if (lvFilter.q) {
      const e = emp(l.empNo);
      const hay = (l.id + ' ' + (e ? fullName(e) + ' ' + e.empNo : '')).toLowerCase();
      if (hay.indexOf(lvFilter.q.toLowerCase()) === -1) return false;
    }
    return true;
  });

  const pend = (state.hr.leave || []).filter(l => l.status === 'submitted');
  const E = activeEmployees();
  const owed = E.reduce((n, e) => n + Math.max(0, leaveBalance(e).remaining), 0);
  const outNow = (state.hr.leave || []).filter(l =>
    l.status === 'approved' && l.from <= Date.now() && l.to >= Date.now());

  $('#view').innerHTML =
    '<div class="grid k4" style="margin-bottom:14px">' +
      kpi('Awaiting decision', pend.length, 'applications a supervisor has not answered',
          pend.length ? '--coral' : '--teal', null, 'inbox') +
      kpi('Off today', outNow.length, 'approved leave running right now', '--blue', null, 'people') +
      kpi('Days owed', owed, 'entitlement earned and not yet taken', '--amber', null, 'clock') +
      kpi('Applications', (state.hr.leave || []).length, 'this leave year', '--violet', null, 'doc') +
    '</div>' +

    '<div class="filters">' +
      '<input id="lq" placeholder="Search by name, number or reference" value="' + esc(lvFilter.q) + '">' +
      '<select id="lst"><option value="">Any status</option>' +
        selOpts(LEAVE_STATUS, lvFilter.st, 'id', 'name') + '</select>' +
      '<select id="ltp"><option value="">Any type</option>' +
        selOpts(LEAVE_TYPES, lvFilter.type, 'id', 'name') + '</select>' +
      '<span class="spacer"></span>' +
      '<button class="primary" onclick="location.hash=\'#/hr/leave/new\'">Apply for leave</button>' +
    '</div>' +

    card(rows.length + ' of ' + (state.hr.leave || []).length + ' applications',
      pend.length ? pend.length + ' awaiting a decision' : 'nothing waiting',
      leaveTable(rows), true) +

    '<div class="formnote" style="margin-top:14px">Days are <b>counted from the dates</b>, not typed. ' +
    'Weekends and Seychelles public holidays are skipped, so a Friday-to-Monday request is two days ' +
    'and not four. Annual leave comes off the balance when it is <b>approved</b> — never when it is ' +
    'submitted, so a declined or cancelled application cannot quietly eat somebody’s entitlement.</div>';

  $('#lq').oninput = e => { lvFilter.q = e.target.value; renderLeave(); $('#lq').focus(); };
  $('#lst').onchange = e => { lvFilter.st = e.target.value; renderLeave(); };
  $('#ltp').onchange = e => { lvFilter.type = e.target.value; renderLeave(); };
}

function leaveTable(rows) {
  if (!rows.length) return '<div class="empty">Nothing matches.</div>';
  return '<table class="tbl"><thead><tr><th>Reference</th><th>Employee</th><th>Type</th>' +
    '<th>From</th><th>To</th><th style="text-align:right">Days</th><th>Status</th></tr></thead><tbody>' +
    rows.map(l => {
      const e = emp(l.empNo);
      return '<tr onclick="location.hash=\'#/hr/l/' + l.id + '\'">' +
        '<td class="mono">' + esc(l.id) + '</td>' +
        '<td>' + (e ? '<div class="sum">' + esc(fullName(e)) + '</div><div class="meta">' +
                  esc(e.position) + '</div>' : '—') + '</td>' +
        '<td>' + esc(leaveType(l.type).name) + '</td>' +
        '<td>' + hrDate(l.from) + '</td>' +
        '<td>' + hrDate(l.to) + '</td>' +
        '<td style="text-align:right"><b>' + l.days + '</b></td>' +
        '<td>' + lvPill(l.status) + '</td></tr>';
    }).join('') + '</tbody></table>';
}

function renderLeaveRecord(id) {
  const l = lv(id);
  if (!l) { $('#view').innerHTML = '<div class="empty">No such leave application.</div>'; return; }
  const e = emp(l.empNo);
  setHead(l.id, (e ? fullName(e) : '') + ' — ' + leaveType(l.type).name);
  const bal = e ? leaveBalance(e, l.year) : null;
  const t = leaveType(l.type);
  const decider = l.decidedBy ? emp(l.decidedBy) : null;

  const holNote = l.holidays && l.holidays.length
    ? '<div class="hint">Not charged: ' + l.holidays.map(h => esc(h.name) + ' (' + esc(h.key) + ')').join(', ') + '</div>'
    : '';

  let decide = '';
  if (l.status === 'submitted') {
    decide = isSupervisor()
      ? '<div class="frm"><label><span>Note (required to decline)</span>' +
        '<input id="lv_note" placeholder="Reason, or a condition on the approval"></label>' +
        '<div class="btnrow">' +
        '<button class="primary" onclick="decideLeave(\'' + l.id + '\',true)">Approve</button>' +
        '<button class="danger" onclick="decideLeave(\'' + l.id + '\',false)">Decline</button>' +
        '<button onclick="cancelLeave(\'' + l.id + '\')">Cancel the application</button></div></div>'
      : supervisorNote();
  }

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/leave\'">&larr; Back to leave</button>' +
    '<div class="grid c23">' +
      '<div>' +
        card('The application', leaveStatus(l.status).name,
          '<div style="margin-bottom:10px">' + lvPill(l.status) + '</div>' +
          '<div class="kvs">' +
            kv('Employee', e ? empChip(e) : '—') +
            kv('Employee number', e ? '<span class="mono">' + esc(e.empNo) + '</span>' : '—') +
            kv('Department', e ? secPill(e.section) + ' ' + esc(sec(e.section).name) : '—') +
            kv('Type of leave', esc(t.name)) +
            kv('Applied on', hrDate(l.appliedAt)) +
            kv('First day', hrDate(l.from)) +
            kv('Last day', hrDate(l.to)) +
            kv('Working days', '<b>' + l.days + '</b>' +
               (l.weekendDays ? ' <span class="meta">(' + l.weekendDays + ' weekend days not charged)</span>' : '')) +
            kv('Where', l.overseas ? 'Overseas' : 'In Seychelles') +
            (l.overseas ? kv('Address while away', esc(l.overseasAddress)) : '') +
            kv('Reason', esc(l.reason)) +
          '</div>' + holNote +
          '<div class="hint" style="margin-top:8px">' + esc(t.note) + '</div>' +
          decide) +

        (l.medical ? card('Medical information', 'sick leave',
          '<div class="kvs">' +
            kv('Type of sickness', esc(l.medical.sickness)) +
            kv('Hospital or clinic', esc(l.medical.hospital)) +
            kv('Seen on', hrDate(l.medical.visitedAt)) +
            kv('Health status', tonePill(l.medical.health,
                 l.medical.health === 'Fit to work' ? 'ok' : l.medical.health === 'Unfit to work' ? 'bad' : 'warn')) +
          '</div>' +
          (l.medical.certificate ? docLine(l.medical.certificate, 'Medical certificate') : '')) : '') +

        (l.hardCopy ? card('Signed paper form', 'attached', docLine(l.hardCopy, 'Application, signed')) : '') +
      '</div>' +

      '<div>' +
        (bal ? card('Leave balance ' + l.year, e.empNo, balancePanel(bal)) : '') +
        card('Decision', l.decidedAt ? hrDate(l.decidedAt) : 'not yet',
          l.decidedAt
            ? '<div class="kvs">' + kv('Status', lvPill(l.status)) +
              kv('Decided by', decider ? empChip(decider) : '—') +
              kv('When', hrDate(l.decidedAt)) +
              (l.decisionNote ? kv('Note', esc(l.decisionNote)) : '') + '</div>'
            : '<div class="empty">Waiting for a supervisor.</div>') +
      '</div>' +
    '</div>';
}

function balancePanel(b) {
  const bar = (label, n, colour) =>
    '<div class="kvline"><span class="meta">' + esc(label) + '</span>' +
    '<b style="color:' + colour + '">' + n + '</b></div>';
  return '<div>' +
    '<div class="gauge" style="margin-bottom:6px"><div>' +
      '<div class="big">' + b.remaining + '</div>' +
      '<div class="sm">days of annual leave left</div></div></div>' +
    bar('Entitlement this year', b.entitlement, 'var(--txt)') +
    bar('Approved and taken', '−' + b.taken, 'var(--txt)') +
    bar('Remaining', b.remaining, 'var(--teal)') +
    (b.pending ? bar('Awaiting a decision', b.pending, 'var(--amber)') +
      '<div class="hint">If everything pending is approved this becomes <b>' + b.ifAllApproved + '</b>. ' +
      'Pending days are shown, not deducted.</div>' : '') +
    '<div class="hint" style="margin-top:8px">' + esc(b.why) + '</div>' +
    (b.prorated ? '<div class="hint"><b>Pro-rated.</b> A person who started part way through the year ' +
      'has not earned the full entitlement for it.</div>' : '') +
  '</div>';
}

function docLine(d, label) {
  return '<div class="docline"><span class="dicon">' +
    '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>' +
    '<path d="M14 3v4h4"/></svg></span>' +
    '<div><div class="sum">' + esc(d.name) + '</div>' +
    '<div class="meta">' + esc(label || d.kind) + ' · ' + kb(d.size || 0) +
    (d.stored ? '' : ' · <b>file not stored</b> — this demonstration has no server') +
    '</div></div></div>';
}

function decideLeave(id, ok) {
  const l = lv(id);
  if (!l) return;
  if (!isSupervisor()) { toast('Only a supervisor or manager can decide leave.', true); return; }
  const note = fv('lv_note');
  if (!ok && !note) { toast('A declined application needs a reason.', true); return; }

  /* Approving is the moment the days actually come off, so it is the
     moment to check there are days to come off. Refusing here rather
     than letting the balance go negative is the whole point of holding
     the deduction until approval. */
  const e = emp(l.empNo);
  if (ok && e && leaveType(l.type).deducts) {
    const b = leaveBalance(e, l.year);
    if (l.days > b.remaining) {
      if (!confirm('This is ' + l.days + ' days but ' + fullName(e) + ' has only ' +
          b.remaining + ' left for ' + l.year + '.\n\nApproving takes the balance to ' +
          (b.remaining - l.days) + '.\n\nApprove anyway?')) return;
    }
  }
  l.status = ok ? 'approved' : 'declined';
  l.decidedAt = Date.now();
  l.decidedBy = hrSelfEmpNo();
  l.decisionNote = note;
  save();
  toast(ok ? 'Approved. ' + l.days + ' days.' : 'Declined.');
  renderLeaveRecord(id);
  paintChrome();
}
function cancelLeave(id) {
  const l = lv(id);
  if (!l) return;
  if (!confirm('Cancel ' + l.id + '?\n\nIt stays on the record marked cancelled — leave applications are not deleted.')) return;
  l.status = 'cancelled';
  l.decidedAt = Date.now();
  l.decidedBy = hrSelfEmpNo();
  save(); toast('Cancelled.'); renderLeaveRecord(id); paintChrome();
}

/* Who is signed in, expressed as an employee number. The top bar is
   modelled on the Passenger Care directory, so map by name onto the
   establishment rather than inventing a second identity. */
function hrSelfEmpNo() {
  const u = me();
  if (!u) return null;
  const hit = state.hr.employees.find(e => fullName(e) === u.name);
  return hit ? hit.empNo : null;
}

/* ---------------- the leave application form ---------------- */
function renderLeaveForm(preEmp) {
  setHead('Apply for leave', 'The days are counted from the dates you give');
  const E = activeEmployees().slice().sort((a, b) => fullName(a) < fullName(b) ? -1 : 1);
  const self = hrSelfEmpNo();
  const chosen = preEmp || self || (E[0] || {}).empNo;

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/leave\'">&larr; Back to leave</button>' +
    '<div class="grid c23"><div>' +
    card('Leave application', 'form',
      '<div class="frm">' +
        '<label><span>Employee</span><select id="lf_emp">' +
          E.map(e => '<option value="' + e.empNo + '"' + (e.empNo === chosen ? ' selected' : '') + '>' +
            esc(fullName(e)) + ' — ' + esc(e.empNo) + ', ' + esc(e.position) + '</option>').join('') +
        '</select></label>' +
        '<label><span>Type of leave</span><select id="lf_type">' +
          selOpts(LEAVE_TYPES, 'annual', 'id', 'name') + '</select></label>' +
        '<div class="two">' +
          '<label><span>First day</span><input type="date" id="lf_from"></label>' +
          '<label><span>Last day</span><input type="date" id="lf_to"></label>' +
        '</div>' +
        '<div id="lf_count" class="calcbox">Choose the dates and the working days are counted here.</div>' +
        '<label><span>Reason</span><textarea id="lf_reason" rows="2" ' +
          'placeholder="Why the leave is needed"></textarea></label>' +
        '<label><span>Where</span><select id="lf_where">' +
          '<option value="local">In Seychelles</option><option value="overseas">Overseas</option>' +
        '</select></label>' +
        '<label id="lf_addrwrap" style="display:none"><span>Address while away</span>' +
          '<textarea id="lf_addr" rows="2" placeholder="Where you can be reached"></textarea></label>' +

        '<div id="lf_med" style="display:none">' +
          '<div class="lbl" style="margin-top:6px">Medical information</div>' +
          '<div class="two">' +
            '<label><span>Type of sickness</span><select id="lf_sick">' + selOpts(SICKNESS) + '</select></label>' +
            '<label><span>Health status</span><select id="lf_health">' + selOpts(HEALTH_STATUS) + '</select></label>' +
          '</div>' +
          '<div class="two">' +
            '<label><span>Hospital or clinic</span><select id="lf_hosp">' + selOpts(HOSPITALS) + '</select></label>' +
            '<label><span>Date seen</span><input type="date" id="lf_seen"></label>' +
          '</div>' +
          '<label><span>Medical certificate</span><input type="file" id="lf_cert"></label>' +
        '</div>' +

        '<label><span>Signed paper form, if there is one</span><input type="file" id="lf_hard"></label>' +

        '<div class="btnrow">' +
          '<button class="primary" onclick="submitLeave()">Submit the application</button>' +
          '<button onclick="fillLeaveForm()">Fill it in for me</button>' +
        '</div>' +
        '<div class="hint">It is submitted for a decision. Nothing comes off the balance until a ' +
        'supervisor approves it.</div>' +
      '</div>') +
    '</div><div id="lf_side"></div></div>';

  const recount = () => {
    const t = leaveType($('#lf_type').value);
    $('#lf_med').style.display = t.cert ? '' : 'none';
    $('#lf_addrwrap').style.display = $('#lf_where').value === 'overseas' ? '' : 'none';
    const from = parseDateInput(fv('lf_from')), to = parseDateInput(fv('lf_to'));
    const box = $('#lf_count');
    if (!from || !to) { box.className = 'calcbox'; box.innerHTML = 'Choose the dates and the working days are counted here.'; }
    else if (to < from) { box.className = 'calcbox bad'; box.innerHTML = 'The last day is before the first day.'; }
    else {
      const w = workingDays(from, to);
      box.className = 'calcbox ok';
      box.innerHTML = '<b>' + w.days + ' working day' + (w.days === 1 ? '' : 's') + '</b>' +
        ' over ' + (Math.round((to - from) / DAY) + 1) + ' calendar days.' +
        (w.weekend ? '<div class="meta">' + w.weekend + ' weekend day' + (w.weekend === 1 ? '' : 's') + ' not charged.</div>' : '') +
        (w.holidays.length ? '<div class="meta">Public holidays not charged: ' +
          w.holidays.map(h => esc(h.name)).join(', ') + '.</div>' : '');
    }
    paintLeaveSide(recount);
  };
  ['lf_emp', 'lf_type', 'lf_from', 'lf_to', 'lf_where'].forEach(id => {
    const el = $('#' + id);
    el.onchange = recount; el.oninput = recount;
  });
  recount();
}

function paintLeaveSide() {
  const e = emp($('#lf_emp') ? $('#lf_emp').value : null);
  const side = $('#lf_side');
  if (!side) return;
  if (!e) { side.innerHTML = ''; return; }
  const b = leaveBalance(e);
  const t = leaveType($('#lf_type') ? $('#lf_type').value : 'annual');
  side.innerHTML =
    card('Balance ' + b.year, esc(e.empNo),
      t.deducts ? balancePanel(b)
        : '<div class="hint">' + esc(t.name) + ' does not come off the annual entitlement, so this ' +
          'application will not change the balance below.</div>' + balancePanel(b)) +
    card('Who decides', 'reporting line',
      '<div class="kvs">' +
        kv('Employee', empChip(e)) +
        kv('Reports to', e.reportsTo ? empChip(emp(e.reportsTo)) : '—') +
        kv('Department', secPill(e.section) + ' ' + esc(sec(e.section).name)) +
      '</div>');
}

function fillLeaveForm() {
  const from = new Date(); from.setDate(from.getDate() + 14);
  const to = new Date(from); to.setDate(to.getDate() + 6);
  $('#lf_from').value = dateInput(from.getTime());
  $('#lf_to').value = dateInput(to.getTime());
  $('#lf_reason').value = 'Family visit to Praslin.';
  $('#lf_type').value = 'annual';
  $('#lf_where').value = 'local';
  $('#lf_from').dispatchEvent(new Event('change'));
  toast('Filled in. Check it, then submit.');
}

function submitLeave() {
  const e = emp(fv('lf_emp'));
  if (!e) { toast('Choose an employee.', true); return; }
  const type = fv('lf_type');
  const t = leaveType(type);
  const from = parseDateInput(fv('lf_from')), to = parseDateInput(fv('lf_to'));
  if (!from || !to) { toast('Both dates are needed.', true); return; }
  if (to < from) { toast('The last day cannot be before the first day.', true); return; }
  const reason = fv('lf_reason');
  if (!reason) { toast('A reason is needed.', true); return; }

  const w = workingDays(from, to);
  if (!w.days) {
    toast('Those dates are all weekend or public holiday — there is nothing to charge.', true);
    return;
  }

  /* Two people from the same department off at once is the thing a
     depot manager actually needs to know, and it is invisible on paper.
     A warning, not a block: sometimes it is fine. */
  const clash = (state.hr.leave || []).filter(l =>
    l.status === 'approved' && l.empNo !== e.empNo &&
    (emp(l.empNo) || {}).section === e.section &&
    l.from <= to && l.to >= from);
  if (clash.length) {
    const names = clash.slice(0, 4).map(l => fullName(emp(l.empNo))).join(', ');
    if (!confirm(clash.length + ' other person' + (clash.length === 1 ? '' : 's') + ' in ' +
        sec(e.section).name + ' already has approved leave over those dates:\n\n' + names +
        '\n\nSubmit anyway?')) return;
  }

  const year = new Date(from).getFullYear();
  const b = leaveBalance(e, year);
  if (t.deducts && w.days > b.remaining) {
    if (!confirm(fullName(e) + ' has ' + b.remaining + ' days left for ' + year +
        ' and this asks for ' + w.days + '.\n\nSubmit it anyway for a supervisor to decide?')) return;
  }

  const overseas = fv('lf_where') === 'overseas';
  const certEl = $('#lf_cert'), hardEl = $('#lf_hard');
  const cert = certEl && certEl.files && certEl.files[0] ? fileNote(certEl.files[0]) : null;
  if (t.cert && !cert) {
    if (!confirm(t.name + ' normally needs a medical certificate and none is attached.\n\nSubmit anyway?')) return;
  }

  state.hr.leaveSeq = (state.hr.leaveSeq || 0) + 1;
  const rec = {
    id: 'LV-' + (year * 1000 + 500 + state.hr.leaveSeq),
    empNo: e.empNo, year, type, status: 'submitted',
    appliedAt: Date.now(), from, to,
    days: w.days, weekendDays: w.weekend, holidays: w.holidays,
    overseas, overseasAddress: overseas ? fv('lf_addr') : '',
    reason,
    medical: t.cert ? {
      sickness: fv('lf_sick'), hospital: fv('lf_hosp'),
      visitedAt: parseDateInput(fv('lf_seen')) || Date.now(),
      health: fv('lf_health'), certificate: cert
    } : null,
    hardCopy: hardEl && hardEl.files && hardEl.files[0] ? fileNote(hardEl.files[0]) : null,
    decidedBy: null, decidedAt: null, decisionNote: ''
  };
  state.hr.leave.unshift(rec);
  if (!save()) return;
  toast(rec.id + ' submitted — ' + w.days + ' working days.');
  location.hash = '#/hr/l/' + rec.id;
}

/* ================================================================
   DISCIPLINE
   ================================================================ */
function renderDiscipline() {
  setHead('Discipline', 'Warnings, investigations and outcomes');
  const rows = state.hr.discipline || [];
  const open = rows.filter(d => d.outcome === 'open');
  $('#view').innerHTML =
    '<div class="banner"><b>CONFIDENTIAL</b><div>Disciplinary records are the most sensitive thing ' +
    'in an HR system. In a real deployment this screen is restricted to HR and the employee’s own ' +
    'line of management, and every time it is opened should be logged. Nothing here is a real case.</div></div>' +
    '<div class="grid k4" style="margin-bottom:14px">' +
      kpi('Open', open.length, 'no decision recorded yet', open.length ? '--amber' : '--teal', null, 'clock') +
      kpi('Records', rows.length, 'all time', '--blue', null, 'doc') +
      kpi('Final warnings', rows.filter(d => d.action === 'final').length, 'currently on record', '--coral', null, 'flag') +
      kpi('People', new Set(rows.map(d => d.empNo)).size, 'with a record of any kind', '--violet', null, 'people') +
    '</div>' +
    '<div class="filters"><span class="spacer"></span>' +
      '<button class="primary" onclick="location.hash=\'#/hr/disc/new\'">Record an action</button></div>' +
    card(rows.length + ' records', 'newest first', discTable(rows), true);
}

function discTable(rows) {
  if (!rows.length) return '<div class="empty">Nothing recorded.</div>';
  return '<table class="tbl"><thead><tr><th>Reference</th><th>Employee</th><th>Department</th>' +
    '<th>Action</th><th>Date</th><th>Outcome</th></tr></thead><tbody>' +
    rows.map(d => {
      const e = emp(d.empNo);
      const a = discAction(d.action), o = discOutcome(d.outcome);
      return '<tr onclick="location.hash=\'#/hr/d/' + d.id + '\'">' +
        '<td class="mono">' + esc(d.id) + '</td>' +
        '<td>' + (e ? '<div class="sum">' + esc(fullName(e)) + '</div><div class="meta">' +
          esc(e.position) + '</div>' : '—') + '</td>' +
        '<td>' + (e ? secPill(e.section) : '—') + '</td>' +
        '<td>' + tonePill(a.name, a.tone) + '</td>' +
        '<td>' + hrDate(d.at) + '</td>' +
        '<td>' + tonePill(o.name, o.tone) + '</td></tr>';
    }).join('') + '</tbody></table>';
}

function renderDiscRecord(id) {
  const d = dc(id);
  if (!d) { $('#view').innerHTML = '<div class="empty">No such record.</div>'; return; }
  const e = emp(d.empNo);
  setHead(d.id, (e ? fullName(e) : '') + ' — ' + discAction(d.action).name);
  const by = d.byEmpNo ? emp(d.byEmpNo) : null;
  const prior = (state.hr.discipline || []).filter(x => x.empNo === d.empNo && x.id !== d.id);

  let decide = '';
  if (d.outcome === 'open') {
    decide = isSupervisor()
      ? '<div class="frm" style="margin-top:8px">' +
        '<label><span>Outcome</span><select id="dc_out">' +
          selOpts(DISC_OUTCOMES.filter(o => o.id !== 'open'), 'warned', 'id', 'name') + '</select></label>' +
        '<label><span>Note</span><input id="dc_note" placeholder="What was decided and why"></label>' +
        '<button class="primary" style="margin-top:8px" onclick="closeDisc(\'' + d.id + '\')">Record the outcome</button>' +
        '</div>'
      : supervisorNote();
  }

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/disc\'">&larr; Back to discipline</button>' +
    '<div class="grid c23"><div>' +
      card('The record', discAction(d.action).name,
        '<div style="margin-bottom:10px">' +
          tonePill(discAction(d.action).name, discAction(d.action).tone) + '</div>' +
        '<div class="kvs">' +
          kv('Employee', e ? empChip(e) : '—') +
          kv('Identity number', e ? '<span class="mono">' + esc(e.nin) + '</span>' : '—') +
          kv('Department', e ? esc(sec(e.section).name) : '—') +
          kv('Position', e ? esc(e.position) : '—') +
          kv('Action', tonePill(discAction(d.action).name, discAction(d.action).tone)) +
          kv('Taken by', esc(d.byRole) + (by ? ' — ' + fullName(by) : '')) +
          kv('Date and time', new Date(d.at).toLocaleString('en-GB')) +
          kv('Outcome', tonePill(discOutcome(d.outcome).name, discOutcome(d.outcome).tone)) +
          (d.outcomeAt ? kv('Outcome recorded', hrDate(d.outcomeAt)) : '') +
          kv('Validated', d.validated ? 'Yes' : 'Not yet') +
        '</div>' +
        '<div class="lbl" style="margin-top:10px">Comments</div>' +
        '<div style="font-size:13px;line-height:1.55">' + esc(d.comments) + '</div>' +
        (d.document ? docLine(d.document, 'Scanned letter') : '') +
        decide) +
    '</div><div>' +
      card('Photograph and identity', e ? e.empNo : '',
        e ? '<div class="idcard">' + empFace(e, 88) +
          '<div><div class="sum">' + esc(fullName(e)) + '</div>' +
          '<div class="meta">' + esc(e.position) + '</div>' +
          '<div class="meta mono">' + esc(e.nin) + '</div></div></div>' +
          '<div class="hint">Everything on this panel came from the identity number. Nothing about ' +
          'the person is retyped onto a disciplinary record.</div>'
        : '<div class="empty">Employee not found.</div>') +
      card('Earlier records', prior.length + ' on file',
        prior.length ? discTable(prior)
          : '<div class="empty">Nothing else on file for this person.</div>', prior.length > 0) +
    '</div></div>';
}

function closeDisc(id) {
  const d = dc(id);
  if (!d) return;
  if (!isSupervisor()) { toast('Only a supervisor or manager can record an outcome.', true); return; }
  const note = fv('dc_note');
  if (!note) { toast('An outcome needs a note saying what was decided.', true); return; }
  d.outcome = fv('dc_out');
  d.outcomeAt = Date.now();
  d.validated = true;
  d.comments = d.comments + '\n\nOutcome: ' + note;
  save(); toast('Outcome recorded.'); renderDiscRecord(id);
}

/* The specification's own idea, and a good one: type the identity
   number and the rest of the person appears. It is also the cheapest
   guard against a disciplinary letter being filed against the wrong
   member of staff. */
function renderDiscForm() {
  setHead('Record a disciplinary action', 'Enter the identity number and the person is looked up');
  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/disc\'">&larr; Back to discipline</button>' +
    '<div class="grid c23"><div>' +
    card('New record', 'form',
      '<div class="frm">' +
        '<label><span>National Identity Number</span>' +
          '<input id="dn_nin" inputmode="numeric" maxlength="9" placeholder="nine digits" autocomplete="off"></label>' +
        '<div id="dn_found" class="calcbox">Type an identity number to find the employee.</div>' +
        '<label><span>Action</span><select id="dn_act">' +
          selOpts(DISC_ACTIONS, 'verbal', 'id', 'name') + '</select></label>' +
        '<label><span>What happened</span><textarea id="dn_what" rows="4" ' +
          'placeholder="The facts, in the words that would appear in the letter"></textarea></label>' +
        '<div class="two">' +
          '<label><span>Action taken by</span><select id="dn_by">' + selOpts(DISC_BY) + '</select></label>' +
          '<label><span>Date and time</span><input type="datetime-local" id="dn_at"></label>' +
        '</div>' +
        '<label><span>Scanned letter, if there is one</span><input type="file" id="dn_doc"></label>' +
        '<button class="primary" style="margin-top:10px" onclick="submitDisc()">Record it</button>' +
        '<div class="hint">The outcome is recorded separately, by a supervisor, once there is one. ' +
        'A record is never deleted — a withdrawn allegation is marked withdrawn.</div>' +
      '</div>') +
    '</div><div id="dn_side"></div></div>';

  const now = new Date();
  $('#dn_at').value = dateInput(now.getTime()) + 'T' +
    String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  $('#dn_nin').oninput = discLookup;
  discLookup();
}

function discLookup() {
  const nin = fv('dn_nin').replace(/\D/g, '');
  const box = $('#dn_found'), side = $('#dn_side');
  const hit = nin.length === 9 ? state.hr.employees.find(e => e.nin === nin) : null;
  if (hit) {
    box.className = 'calcbox ok';
    box.innerHTML = '<b>' + esc(fullName(hit)) + '</b> — ' + esc(hit.empNo) + ', ' +
      esc(hit.position) + ', ' + esc(sec(hit.section).name);
    side.innerHTML = card('Employee', hit.empNo,
      '<div class="idcard">' + empFace(hit, 88) +
      '<div><div class="sum">' + esc(fullName(hit)) + '</div>' +
      '<div class="meta">' + esc(hit.position) + '</div>' +
      '<div class="meta">' + esc(sec(hit.section).name) + '</div></div></div>' +
      '<div class="kvs" style="margin-top:8px">' +
        kv('Employee number', '<span class="mono">' + esc(hit.empNo) + '</span>') +
        kv('Department', secPill(hit.section) + ' ' + esc(sec(hit.section).name)) +
        kv('Position', esc(hit.position)) +
        kv('Status', empStatusPill(hit.status)) +
        kv('Reports to', hit.reportsTo ? empChip(emp(hit.reportsTo)) : '—') +
      '</div>');
  } else {
    box.className = 'calcbox' + (nin.length === 9 ? ' bad' : '');
    box.innerHTML = nin.length === 9
      ? 'No employee has the identity number ' + esc(nin) + '. A disciplinary record cannot be filed ' +
        'against somebody who is not on the establishment.'
      : 'Type an identity number to find the employee. ' + nin.length + ' of 9 digits.';
    side.innerHTML = '';
  }
}

function submitDisc() {
  const nin = fv('dn_nin').replace(/\D/g, '');
  const e = state.hr.employees.find(x => x.nin === nin);
  if (!e) { toast('Find the employee by identity number first.', true); return; }
  const what = fv('dn_what');
  if (!what) { toast('A record needs the facts written down.', true); return; }
  const at = fv('dn_at') ? new Date(fv('dn_at')).getTime() : Date.now();
  if (at > Date.now() + 60000) { toast('The date is in the future.', true); return; }

  const docEl = $('#dn_doc');
  state.hr.discSeq = (state.hr.discSeq || 0) + 1;
  const heads = {};
  state.hr.employees.forEach(x => { if (x.isHead) heads[x.section] = x; });
  const rec = {
    id: 'DC-' + (2026500 + state.hr.discSeq),
    empNo: e.empNo,
    action: fv('dn_act'),
    comments: what,
    byRole: fv('dn_by'),
    byEmpNo: hrSelfEmpNo() || (heads[e.section] || {}).empNo || null,
    at,
    outcome: 'open',
    outcomeAt: null,
    validated: false,
    document: docEl && docEl.files && docEl.files[0] ? fileNote(docEl.files[0]) : null
  };
  state.hr.discipline.unshift(rec);
  if (!save()) return;
  toast(rec.id + ' recorded against ' + fullName(e) + '.');
  location.hash = '#/hr/d/' + rec.id;
}

/* ================================================================
   ANNOUNCEMENTS
   ================================================================ */
function audienceCount(a) {
  const E = activeEmployees();
  if (!a) return 0;
  if (a.mode === 'all') return E.length;
  if (a.mode === 'dept') return E.filter(e => (a.depts || []).indexOf(e.section) !== -1).length;
  if (a.mode === 'people') return (a.people || []).length;
  return 0;
}
function audienceText(a) {
  if (!a) return '—';
  if (a.mode === 'all') return 'All staff';
  if (a.mode === 'dept') return (a.depts || []).map(d => sec(d).name).join(', ') || 'no department chosen';
  if (a.mode === 'people') return (a.people || []).map(p => { const e = emp(p); return e ? fullName(e) : p; }).join(', ');
  return '—';
}

function renderAnnouncements() {
  setHead('Announcements', 'Notices to staff');
  const rows = state.hr.announcements || [];
  const scheduled = rows.filter(a => !a.sent);
  $('#view').innerHTML =
    '<div class="filters"><span class="spacer"></span>' +
      '<button class="primary" onclick="location.hash=\'#/hr/notices/new\'">Write an announcement</button></div>' +
    (scheduled.length ? card('Scheduled', scheduled.length + ' not sent yet', annList(scheduled), true) +
      '<div style="height:14px"></div>' : '') +
    card('Sent', rows.filter(a => a.sent).length + ' notices', annList(rows.filter(a => a.sent)), true) +
    '<div class="formnote" style="margin-top:14px">The audience is stored as a <b>rule</b> — all staff, ' +
    'or named departments, or named people — and not as a frozen list of names. A notice addressed to ' +
    'Operations therefore reaches whoever is in Operations on the day it goes out, which is the only ' +
    'version that still works six months later. <b>Nothing is actually sent</b> from a demonstration ' +
    'with no server; the audience is worked out and recorded exactly as it would be.</div>';
}

function annList(rows) {
  if (!rows.length) return '<div class="empty">Nothing here.</div>';
  return '<table class="tbl"><thead><tr><th>Subject</th><th>Type</th><th>Audience</th>' +
    '<th style="text-align:right">People</th><th>When</th></tr></thead><tbody>' +
    rows.map(a =>
      '<tr onclick="location.hash=\'#/hr/n/' + a.id + '\'">' +
      '<td><div class="sum">' + esc(a.subject) + '</div>' +
      '<div class="meta">' + esc(String(a.body).slice(0, 80)) + '…</div></td>' +
      '<td>' + esc(a.type) + '</td>' +
      '<td>' + esc(audienceText(a.audience)) + '</td>' +
      '<td style="text-align:right"><b>' + audienceCount(a.audience) + '</b></td>' +
      '<td>' + hrDate(a.sendAt) + (a.sent ? '' : ' <span class="meta">scheduled</span>') + '</td></tr>'
    ).join('') + '</tbody></table>';
}

function renderAnnouncement(id) {
  const a = ann(id);
  if (!a) { $('#view').innerHTML = '<div class="empty">No such announcement.</div>'; return; }
  setHead(a.subject, a.type);
  const by = a.byEmpNo ? emp(a.byEmpNo) : null;
  const who = activeEmployees().filter(e =>
    a.audience.mode === 'all' ||
    (a.audience.mode === 'dept' && (a.audience.depts || []).indexOf(e.section) !== -1) ||
    (a.audience.mode === 'people' && (a.audience.people || []).indexOf(e.empNo) !== -1));

  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/notices\'">&larr; Back to announcements</button>' +
    '<div class="grid c23"><div>' +
      card(a.subject, a.sent ? 'sent ' + hrDate(a.sendAt) : 'scheduled for ' + hrDate(a.sendAt),
        '<div class="kvs">' +
          kv('Type', esc(a.type)) +
          kv('Audience', esc(audienceText(a.audience))) +
          kv('Written by', by ? empChip(by) : '—') +
          kv('Created', hrDate(a.createdAt)) +
        '</div>' +
        '<div class="lbl" style="margin-top:10px">Message</div>' +
        '<div style="font-size:13.5px;line-height:1.6;white-space:pre-wrap">' + esc(a.body) + '</div>' +
        (a.attachment ? docLine(a.attachment, 'Attached') : '')) +
    '</div><div>' +
      card('Who it reaches', who.length + ' people',
        '<table class="tbl"><tbody>' + who.slice(0, 40).map(e =>
          '<tr onclick="location.hash=\'#/hr/p/' + e.empNo + '\'"><td>' + empFace(e, 26) + '</td>' +
          '<td><div class="sum">' + esc(fullName(e)) + '</div>' +
          '<div class="meta">' + esc(e.position) + '</div></td></tr>').join('') +
        '</tbody></table>' +
        (who.length > 40 ? '<div class="hint">and ' + (who.length - 40) + ' more</div>' : ''), true) +
    '</div></div>';
}

function renderAnnForm() {
  setHead('Write an announcement', 'Choose who it goes to');
  $('#view').innerHTML =
    '<button class="back" onclick="location.hash=\'#/hr/notices\'">&larr; Back to announcements</button>' +
    '<div class="grid c23"><div>' +
    card('New announcement', 'form',
      '<div class="frm">' +
        '<label><span>Send to</span><select id="an_mode">' +
          '<option value="all">All staff</option>' +
          '<option value="dept">Chosen departments</option>' +
          '<option value="people">Named individuals</option></select></label>' +
        '<div id="an_deptwrap" style="display:none"><span class="lbl">Departments</span>' +
          '<div class="checks">' + secList().map(s =>
            '<label class="chk"><input type="checkbox" class="an_d" value="' + s.id + '"> ' +
            esc(s.name) + '</label>').join('') + '</div></div>' +
        '<label id="an_peoplewrap" style="display:none"><span>People</span>' +
          '<select id="an_people" multiple size="8">' +
          activeEmployees().slice().sort((a, b) => fullName(a) < fullName(b) ? -1 : 1)
            .map(e => '<option value="' + e.empNo + '">' + esc(fullName(e)) + ' — ' +
              esc(e.position) + '</option>').join('') + '</select></label>' +
        '<div id="an_count" class="calcbox"></div>' +
        '<div class="two">' +
          '<label><span>Type</span><select id="an_type">' + selOpts(ANN_TYPES) + '</select></label>' +
          '<label><span>Send on</span><input type="date" id="an_when"></label>' +
        '</div>' +
        '<label><span>Subject</span><input id="an_subject" placeholder="One line"></label>' +
        '<label><span>Message</span><textarea id="an_body" rows="6"></textarea></label>' +
        '<label><span>Attachment</span><input type="file" id="an_file"></label>' +
        '<div class="btnrow">' +
          '<button class="primary" onclick="submitAnn()">Save the announcement</button>' +
          '<button onclick="fillAnnForm()">Fill it in for me</button></div>' +
      '</div>') +
    '</div><div id="an_side"></div></div>';

  $('#an_when').value = dateInput(Date.now());
  const recount = () => {
    const mode = $('#an_mode').value;
    $('#an_deptwrap').style.display = mode === 'dept' ? '' : 'none';
    $('#an_peoplewrap').style.display = mode === 'people' ? '' : 'none';
    const a = readAudience();
    const n = audienceCount(a);
    const box = $('#an_count');
    box.className = 'calcbox ' + (n ? 'ok' : 'bad');
    box.innerHTML = n
      ? 'This reaches <b>' + n + ' ' + (n === 1 ? 'person' : 'people') + '</b> — ' + esc(audienceText(a))
      : 'Nobody is selected, so this would reach no one.';
    const side = $('#an_side');
    const who = activeEmployees().filter(e =>
      a.mode === 'all' || (a.mode === 'dept' && (a.depts || []).indexOf(e.section) !== -1) ||
      (a.mode === 'people' && (a.people || []).indexOf(e.empNo) !== -1));
    side.innerHTML = card('Recipients', who.length + ' people',
      who.length ? '<table class="tbl"><tbody>' + who.slice(0, 30).map(e =>
        '<tr><td>' + empFace(e, 26) + '</td><td><div class="sum">' + esc(fullName(e)) + '</div>' +
        '<div class="meta">' + esc(e.position) + '</div></td></tr>').join('') + '</tbody></table>' +
        (who.length > 30 ? '<div class="hint">and ' + (who.length - 30) + ' more</div>' : '')
        : '<div class="empty">Nobody yet.</div>', who.length > 0);
  };
  $('#an_mode').onchange = recount;
  $('#an_people').onchange = recount;
  document.querySelectorAll('.an_d').forEach(c => c.onchange = recount);
  recount();
}

function readAudience() {
  const mode = $('#an_mode') ? $('#an_mode').value : 'all';
  if (mode === 'dept') {
    return { mode: 'dept', depts: Array.prototype.slice.call(document.querySelectorAll('.an_d:checked')).map(c => c.value) };
  }
  if (mode === 'people') {
    const sel = $('#an_people');
    return { mode: 'people', people: sel ? Array.prototype.slice.call(sel.selectedOptions).map(o => o.value) : [] };
  }
  return { mode: 'all' };
}

function fillAnnForm() {
  $('#an_mode').value = 'dept';
  $('#an_mode').dispatchEvent(new Event('change'));
  const first = document.querySelector('.an_d[value=ops]') || document.querySelector('.an_d');
  if (first) { first.checked = true; first.dispatchEvent(new Event('change')); }
  $('#an_type').value = 'Safety notice';
  $('#an_subject').value = 'Pre-departure ramp check';
  $('#an_body').value = 'From Monday the wheelchair ramp is to be deployed and retracted once as ' +
    'part of the pre-departure check. Report any fault to the workshop immediately and do not take ' +
    'the vehicle out of the depot.';
  toast('Filled in. Check it, then save.');
}

function submitAnn() {
  const a = readAudience();
  const n = audienceCount(a);
  if (!n) { toast('Choose who this goes to.', true); return; }
  const subject = fv('an_subject');
  const body = fv('an_body');
  if (!subject) { toast('A subject is needed.', true); return; }
  if (!body) { toast('There is no message to send.', true); return; }
  const when = parseDateInput(fv('an_when')) || Date.now();
  const fileEl = $('#an_file');

  state.hr.annSeq = (state.hr.annSeq || 0) + 1;
  const rec = {
    id: 'AN-' + (2026500 + state.hr.annSeq),
    subject, type: fv('an_type'), body, audience: a,
    createdAt: Date.now(), sendAt: when,
    /* An announcement dated today is sent; one dated ahead is
       scheduled. Nothing leaves the browser either way, and the screen
       says so rather than implying an email went out. */
    sent: when <= Date.now() + 60000,
    attachment: fileEl && fileEl.files && fileEl.files[0] ? fileNote(fileEl.files[0]) : null,
    byEmpNo: hrSelfEmpNo()
  };
  state.hr.announcements.unshift(rec);
  if (!save()) return;
  toast(rec.sent ? 'Recorded as sent to ' + n + ' people.' : 'Scheduled for ' + hrDate(when) + '.');
  location.hash = '#/hr/n/' + rec.id;
}

/* ================================================================
   REFERENCE TABLES — departments, positions, public holidays
   ================================================================ */
function renderTables() {
  setHead('Tables', 'The lists the rest of the system chooses from');
  const D = allDepartments(), P = state.hr.positions || [];
  const year = new Date().getFullYear();

  $('#view').innerHTML =
    '<div class="formnote">These are the two tables the specification asks for, and they are the ' +
    'join between the modules: <b>Passenger Care routes a complaint to a department, and HR employs ' +
    'people into the same department</b>. One list, maintained in one place. Close a department here ' +
    'and it stops being offered when a case is routed — without breaking the cases already in it.</div>' +

    card('Departments', D.filter(d => d.active).length + ' open of ' + D.length,
      '<table class="tbl"><thead><tr><th>Code</th><th>Department</th><th>Head</th>' +
      '<th style="text-align:right">People</th><th style="text-align:right">Open cases</th>' +
      '<th>Status</th><th></th></tr></thead><tbody>' +
      D.map(d => {
        const people = activeEmployees().filter(e => e.section === d.id).length;
        const cases = state.tickets.filter(t => t.section === d.id && isOpen(t)).length;
        return '<tr>' +
          '<td class="mono">' + esc(d.code) + '</td>' +
          '<td>' + secPill(d.id) + ' ' + esc(d.name) + '</td>' +
          '<td class="meta">' + esc((staff(d.head) || {}).name || '—') + '</td>' +
          '<td style="text-align:right">' + people + '</td>' +
          '<td style="text-align:right">' + cases + '</td>' +
          '<td>' + (d.active ? tonePill('Open', 'ok') : tonePill('Closed', 'off')) + '</td>' +
          '<td style="text-align:right"><button onclick="toggleDept(\'' + d.id + '\')">' +
            (d.active ? 'Close' : 'Re-open') + '</button></td></tr>';
      }).join('') + '</tbody></table>', true) +

    '<div style="height:14px"></div>' +

    card('Positions', P.filter(p => p.active).length + ' active of ' + P.length,
      '<div class="frm" style="padding:12px 14px 0">' +
        '<div class="three">' +
          '<label><span>New position title</span><input id="pt_title" placeholder="e.g. Depot Cleaner"></label>' +
          '<label><span>Department</span><select id="pt_dept">' +
            selOpts(secList(), '', 'id', 'name') + '</select></label>' +
          '<label><span>Grade</span><select id="pt_sg">' + selOpts(GRADES, 'SG7', 'sg', 'sg') + '</select></label>' +
        '</div>' +
        '<div class="btnrow" style="margin:0 0 12px">' +
          '<button class="primary" onclick="addPosition()">Add the position</button></div>' +
      '</div>' +
      '<table class="tbl nowrap2"><thead><tr><th>Code</th><th>Position</th><th>Department</th>' +
      '<th>Grade</th><th style="text-align:right">Held by</th><th>Status</th><th></th></tr></thead><tbody>' +
      P.map(p => {
        const held = activeEmployees().filter(e => e.position === p.title).length;
        return '<tr>' +
          '<td class="mono">' + esc(p.code) + '</td>' +
          '<td>' + esc(p.title) + '</td>' +
          '<td>' + secPill(p.dept) + '</td>' +
          '<td>' + sgPill(p.sg) + '</td>' +
          '<td style="text-align:right">' + held + '</td>' +
          '<td>' + (p.active ? tonePill('Active', 'ok') : tonePill('Not active', 'off')) + '</td>' +
          '<td style="text-align:right"><button onclick="togglePosition(\'' + esc(p.code) + '\')">' +
            (p.active ? 'Deactivate' : 'Activate') + '</button></td></tr>';
      }).join('') + '</tbody></table>', true) +

    '<div style="height:14px"></div>' +

    card('Public holidays ' + year, holidaysIn(year).length + ' days',
      '<table class="tbl"><thead><tr><th>Date</th><th>Holiday</th><th>How it is known</th></tr></thead><tbody>' +
      holidaysIn(year).map(h =>
        '<tr><td class="mono">' + esc(h.key) + '</td><td>' + esc(h.name) + '</td>' +
        '<td class="meta">' + (h.moves ? 'computed from Easter' : 'fixed date') + '</td></tr>').join('') +
      '</tbody></table>' +
      '<div class="hint" style="padding:10px 14px">Leave is counted in working days, so these dates ' +
      'decide what an employee is charged for. The movable feasts are <b>computed</b> from Easter, so ' +
      'the table is right for any year without anybody remembering to extend it. <b>The fixed dates ' +
      'are my list, not a gazette</b> — confirm them against the published notice before a balance is ' +
      'relied on.</div>', true);
}

function toggleDept(id) {
  const d = allDepartments().find(x => x.id === id);
  if (!d) return;
  if (d.active) {
    /* Closing a department that still has people or open cases in it is
       how a case ends up routed to nobody. Say what is in the way and
       refuse, rather than allowing it and dealing with the wreckage. */
    const people = activeEmployees().filter(e => e.section === id).length;
    const cases = state.tickets.filter(t => t.section === id && isOpen(t)).length;
    if (people || cases) {
      alert('Cannot close ' + d.name + ' yet.\n\n' +
        (people ? people + ' employee' + (people === 1 ? '' : 's') + ' still posted there.\n' : '') +
        (cases ? cases + ' open case' + (cases === 1 ? '' : 's') + ' still routed there.\n' : '') +
        '\nMove them first. Closing it now would leave them pointing at a department that no ' +
        'longer accepts work.');
      return;
    }
    d.active = false;
  } else {
    d.active = true;
  }
  save();
  toast(d.name + (d.active ? ' re-opened.' : ' closed.'));
  renderTables();
}

function togglePosition(code) {
  const p = (state.hr.positions || []).find(x => x.code === code);
  if (!p) return;
  if (p.active) {
    const held = activeEmployees().filter(e => e.position === p.title).length;
    if (held) {
      alert('Cannot deactivate ' + p.title + '.\n\n' + held + ' ' +
        (held === 1 ? 'person holds' : 'people hold') + ' that position. A position nobody can be ' +
        'appointed to is fine; a position somebody already holds is not.');
      return;
    }
    p.active = false;
  } else p.active = true;
  save(); toast(p.title + (p.active ? ' activated.' : ' deactivated.')); renderTables();
}

function addPosition() {
  const title = fv('pt_title');
  if (!title) { toast('A position needs a title.', true); return; }
  const P = state.hr.positions || [];
  if (P.some(p => p.title.toLowerCase() === title.toLowerCase())) {
    toast('There is already a position called that.', true); return;
  }
  const dept = fv('pt_dept'), sg = fv('pt_sg');
  const stem = dept.slice(0, 3).toUpperCase() + '-' +
    title.replace(/[^A-Za-z ]/g, '').split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  /* A duplicate position code is the defect that sends a payroll line
     to the wrong cost centre, and nothing on screen would show it. */
  let code = stem + '-' + sg.replace('SG', ''), n = 1;
  while (P.some(p => p.code === code)) code = stem + (++n) + '-' + sg.replace('SG', '');
  P.push({ code, title, dept, sg, active: true, head: false, licence: null });
  save(); toast(title + ' added as ' + code + '.'); renderTables();
}

/* ================================================================
   PANELS ADDED TO THE EMPLOYEE RECORD
   ================================================================ */
function payPanel(e) {
  const p = payBreakdown(e);
  const row = (k, v, strong) =>
    '<div class="kvline' + (strong ? ' total' : '') + '">' +
    '<span class="' + (strong ? 'sum' : 'meta') + '">' + esc(k) + '</span>' +
    '<span class="' + (strong ? 'sum' : '') + ' mono">' + esc(v) + '</span></div>';
  return '<div>' +
    row('Basic salary a month', money(p.basic)) +
    p.lines.map(l => row(l.name + (l.kind === 'pct' ? ' (' + l.rate + '% of basic)' : ''), money(l.amount))).join('') +
    row('Gross a month', money(p.gross), true) +
    p.deductions.map(d => row(d.name, '− ' + money(d.amount))).join('') +
    row('Net a month', money(p.net), true) +
    '<div class="hint" style="margin-top:9px">Gross and net are two different numbers, so they are ' +
    'two lines. <b>The deduction rates are placeholders</b> — the income tax bands and the Pension ' +
    'Fund rate must be confirmed before any figure here is quoted.</div>' +
    '<div class="kvs" style="margin-top:9px">' +
      kv('Annual gross (basic)', money(e.salary)) +
      kv('Monthly work hours', p.hours) +
      kv('Rate an hour', money(p.rate)) +
    '</div>' +
    '<div class="hint">The hourly rate is <b>derived</b> from basic pay and monthly hours, not typed. ' +
    'Three numbers that can disagree are three numbers that eventually will. If SPTC sets the hourly ' +
    'rate and works the salary out from it, this is the one calculation to turn around.</div>' +
  '</div>';
}

function photoPanel(e) {
  const st = storageUsed();
  return '<div class="idcard">' + empFace(e, 96) +
    '<div><div class="sum">' + esc(fullName(e)) + '</div>' +
    '<div class="meta">' + esc(e.empNo) + ' · ' + esc(e.position) + '</div>' +
    '<div class="meta mono">' + esc(e.nin) + '</div>' +
    '<div style="margin-top:8px"><label class="filebtn">Upload photograph' +
    '<input type="file" accept="image/*" id="ph_file" style="display:none"></label>' +
    (e.photo ? ' <button onclick="removePhoto(\'' + e.empNo + '\')">Remove</button>' : '') +
    '</div></div></div>' +
    '<div class="hint">The photograph is shrunk to ' + PHOTO_PX + '×' + PHOTO_PX +
    ' in the browser before it is kept, because a full camera image would fill the few megabytes of ' +
    'storage a demonstration has and lose the session. Browser storage in use: ' + st.kb + ' KB.</div>';
}

function bindPhoto(empNo) {
  const el = $('#ph_file');
  if (!el) return;
  el.onchange = () => {
    const f = el.files && el.files[0];
    readPhoto(f, (dataUrl, err) => {
      if (err) { toast(err, true); return; }
      const e = emp(empNo);
      if (!e) return;
      const before = e.photo;
      e.photo = dataUrl;
      if (!save()) { e.photo = before; return; }   /* do not keep what would not store */
      toast('Photograph saved.');
      renderEmployee(empNo);
    });
  };
}
function removePhoto(empNo) {
  const e = emp(empNo);
  if (!e) return;
  e.photo = null; save(); toast('Photograph removed.'); renderEmployee(empNo);
}

function dependantsPanel(e) {
  if (!e.dependants || !e.dependants.length) return '<div class="empty">None recorded.</div>';
  return '<table class="tbl"><thead><tr><th>Relationship</th><th>Name</th><th>Date of birth</th>' +
    '<th style="text-align:right">Age</th></tr></thead><tbody>' +
    e.dependants.map(d => {
      const age = Math.floor((Date.now() - d.dob) / (365.25 * DAY));
      return '<tr><td>' + esc(d.type) + '</td><td>' + esc(d.name) + '</td>' +
        '<td>' + hrDate(d.dob) + '</td>' +
        '<td style="text-align:right">' + age + '</td></tr>';
    }).join('') + '</tbody></table>';
}

function leavePanelFor(e) {
  const b = leaveBalance(e);
  const mine = (state.hr.leave || []).filter(l => l.empNo === e.empNo)
    .sort((a, c) => c.from - a.from);
  return balancePanel(b) +
    '<div class="lbl" style="margin-top:12px">Applications</div>' +
    (mine.length ? leaveTable(mine.slice(0, 8)) : '<div class="empty">None on file.</div>') +
    '<div style="margin-top:10px"><button onclick="location.hash=\'#/hr/leave/new/' + e.empNo +
    '\'">Apply for leave</button></div>';
}

function discPanelFor(e) {
  const mine = (state.hr.discipline || []).filter(d => d.empNo === e.empNo);
  if (!mine.length) return '<div class="empty">Nothing on file.</div>';
  return discTable(mine);
}

function documentsPanel(e) {
  const docs = e.documents || [];
  return (docs.length ? docs.map(d => docLine(d)).join('') : '<div class="empty">No documents recorded.</div>') +
    '<div style="margin-top:10px"><label class="filebtn">Add a document' +
    '<input type="file" id="doc_file" style="display:none"></label></div>' +
    '<div class="hint">Documents are recorded by name, type and size. <b>The file itself is not ' +
    'stored</b> — there is no server behind this demonstration to store it in, and pretending ' +
    'otherwise would be the sort of thing that is only discovered when somebody needs the file.</div>';
}
function bindDoc(empNo) {
  const el = $('#doc_file');
  if (!el) return;
  el.onchange = () => {
    const f = el.files && el.files[0];
    if (!f) return;
    const e = emp(empNo);
    if (!e) return;
    if (!Array.isArray(e.documents)) e.documents = [];
    e.documents.push(fileNote(f));
    if (!save()) { e.documents.pop(); return; }
    toast(f.name + ' recorded.');
    renderEmployee(empNo);
  };
}

/* ================= FORM PM/05: one page, or step by step =================
   Evans sent Doc1.docx: two screenshots, no text. One is the HCIS intake
   wizard (Personal Info / Household / Socio-Economic / Documents), the other
   is this module's employee list with the "New PM/05 application" button in
   the corner. The obvious reading is "put PM/05 on steps like that one".

   Obvious is not the same as confirmed, and he has already approved the
   one-page form, so I have not replaced it. Both live at the same address
   and a switch at the top of the form chooses between them.

   The important part: this does NOT build a second form. renderApplyForm()
   builds every field exactly as before; the code below only groups the
   sections it already produced and hides all but one group. There is one
   set of inputs, one fill routine and one submit routine, so the two views
   cannot drift apart — a stepped form with its own copy of the fields is
   how you end up fixing every bug twice. */

const APPLY_STEPS = [
  { name: 'Post and personal',    secs: [1, 2] },
  { name: 'Education and skills', secs: [3, 4, 5] },
  { name: 'Experience',           secs: [6, 7, 8] },
  { name: 'References and kin',   secs: [9, 10] },
  { name: 'Declaration',          secs: [11, 12, 13] }
];

let applyStepAt = 0;

/* Evans compared the two on 4 Sep and chose step by step, so that is the
   default now. One catch: he had already clicked the switch while looking,
   so his browser holds a stored choice — and a stored choice would mask
   the new default and leave him on whichever he happened to press last.
   APPLY_MODE_V retires stored choices made before the default changed, so
   it takes effect once, and anything he clicks after this still sticks.

   Stored on state, not state.hr: bumping HR_SEED_VERSION rebuilds
   state.hr from the seed and would throw the choice away. */
const APPLY_MODE_V = 2;

function applyMode() {
  if (state.applyModeV !== APPLY_MODE_V) return 'steps';
  return state.applyMode === 'page' ? 'page' : 'steps';
}

function setApplyMode(m) {
  m = (m === 'page') ? 'page' : 'steps';
  const changed = applyMode() !== m;
  state.applyMode = m;
  state.applyModeV = APPLY_MODE_V;   /* set even when unchanged, or his */
  save();                            /* choice never becomes his own    */
  if (!changed) return;
  applyStepAt = 0;
  renderApplyForm();
}

function stepOfSection(n) {
  for (let i = 0; i < APPLY_STEPS.length; i++) {
    if (APPLY_STEPS[i].secs.indexOf(n) >= 0) return i;
  }
  return APPLY_STEPS.length - 1;   /* a new section belongs somewhere, not nowhere */
}

/* Called by submitApplication when a required field is empty. In one-page
   mode scrollIntoView is enough; in stepped mode the field may be on a step
   that is not on screen, and focusing a hidden input does nothing at all —
   the user would get a complaint about a field they cannot see. */
function stepShowFor(el) {
  if (applyMode() !== 'steps' || !el) return;
  let n = el;
  while (n && !(n.classList && n.classList.contains('fsec'))) n = n.parentNode;
  if (!n) return;
  const at = +n.getAttribute('data-step');
  if (!isNaN(at)) goApplyStep(at, true);
}

function goApplyStep(at, quiet) {
  const secs = Array.prototype.slice.call(document.querySelectorAll('#view .card.fsec'));
  if (!secs.length) return;
  const last = APPLY_STEPS.length - 1;
  applyStepAt = Math.max(0, Math.min(last, at));

  secs.forEach(s => {
    s.style.display = (+s.getAttribute('data-step') === applyStepAt) ? '' : 'none';
  });

  document.querySelectorAll('#view .stepitem').forEach((b, i) => {
    b.classList.toggle('on', i === applyStepAt);
    b.classList.toggle('done', i < applyStepAt);
  });

  const back = $('#stepBack'), next = $('#stepNext'), of = $('#stepOf');
  if (back) back.disabled = applyStepAt === 0;
  if (next) next.style.display = applyStepAt === last ? 'none' : '';
  if (of) of.textContent = 'Step ' + (applyStepAt + 1) + ' of ' + (last + 1) +
    ' — ' + APPLY_STEPS[applyStepAt].name;

  if (!quiet) {
    const bar = document.querySelector('#view .stepbar');
    if (bar) bar.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}

/* Runs at the end of renderApplyForm, after the sections exist. */
function applyStepper() {
  const view = $('#view');
  const secs = Array.prototype.slice.call(view.querySelectorAll('.card.fsec'));
  if (!secs.length) return;
  const stepped = applyMode() === 'steps';

  const sw = document.createElement('div');
  sw.className = 'modesw';
  sw.innerHTML = '<span>Fill it in</span><div class="seg2">' +
    '<button data-m="page"' + (stepped ? '' : ' class="on"') + '>On one page</button>' +
    '<button data-m="steps"' + (stepped ? ' class="on"' : '') + '>Step by step</button>' +
    '</div><span class="hint">The same form and the same fields either way.</span>';
  const note = view.querySelector('.formnote');
  if (note && note.nextSibling) view.insertBefore(sw, note.nextSibling);
  else view.insertBefore(sw, secs[0]);
  sw.querySelectorAll('button').forEach(b => {
    b.onclick = () => setApplyMode(b.getAttribute('data-m'));
  });

  if (!stepped) return;

  secs.forEach(s => {
    const num = +(s.querySelector('.fnum') || {}).textContent;
    s.setAttribute('data-step', stepOfSection(num));
  });

  const bar = document.createElement('div');
  bar.className = 'stepbar';
  bar.innerHTML = APPLY_STEPS.map((s, i) =>
    '<button class="stepitem" type="button">' +
    '<span class="stepdot">' + (i + 1) + '</span>' +
    '<span class="steptxt"><b>Step ' + (i + 1) + '</b><span>' + esc(s.name) + '</span></span>' +
    '</button>').join('<span class="steprule"></span>');
  view.insertBefore(bar, secs[0]);
  bar.querySelectorAll('.stepitem').forEach((b, i) => { b.onclick = () => goApplyStep(i); });

  const nav = document.createElement('div');
  nav.className = 'stepnav';
  nav.innerHTML = '<button class="btn" id="stepBack">&larr; Back</button>' +
    '<span class="mono" id="stepOf"></span>' +
    '<button class="btn primary" id="stepNext">Next &rarr;</button>';
  const lastSec = secs[secs.length - 1];
  if (lastSec.nextSibling) view.insertBefore(nav, lastSec.nextSibling);
  else view.appendChild(nav);
  $('#stepBack').onclick = () => goApplyStep(applyStepAt - 1);
  $('#stepNext').onclick = () => goApplyStep(applyStepAt + 1);

  goApplyStep(applyStepAt, true);
}
