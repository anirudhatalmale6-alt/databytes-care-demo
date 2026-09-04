/* ------------------------------------------------------------------
   Payment runs

   The monthly Home Care payroll, from HC building it to Finance pushing
   it to the banks.

   Everything on these screens follows from what HC and Finance actually
   told us, and the awkward bits are awkward on purpose:

   - A line is a person, a number of DAYS and a daily rate. Not a lump
     sum. The correction HC make most often is "cut two days", and you
     cannot take two days off a figure that is not counted in days.
   - The daily rate is basic pay divided by the number of days in THAT
     month, so it is worked out, never stored. A day in February is
     worth more than a day in August.
   - ONE LINE PER PERSON, always. Finance pay once per NIN, so a second
     line for the same person is dropped without a word. An adjustment
     therefore changes the line it belongs to; it never adds another.
   - The CEO's approval is a request for a SUM. It is a ceiling. Going
     under it needs nobody. Going over it is a new request.
   - Amending is allowed for as long as the money has not gone. Not for
     a fixed number of hours - the state of the run says whether the
     banks have been paid, and a clock can only ever guess at that.
   ------------------------------------------------------------------ */

const PAY_SEED_VERSION = 1;
const PAY_SPF_RATE = 0.05;

/* The states a run moves through, in order. Amending is allowed while
   `open` is true - that is the whole permission rule, and it lives here
   rather than being re-decided at each button. */
const PAY_STATES = [
  { id: 'hc',        name: 'With HC',              open: true,
    hint: 'HC are still building the run. Nothing has been requested yet.' },
  { id: 'requested', name: 'Requested by the CEO', open: true,
    hint: 'The CEO has requested the funds. Finance have not picked it up yet.' },
  { id: 'ack',       name: 'Acknowledged',         open: true,
    hint: 'Finance have the run and have acknowledged it.' },
  { id: 'verified',  name: 'Verified',             open: true,
    hint: 'Finance have verified the run. The money has not gone yet.' },
  { id: 'bank',      name: 'Sent to the banks',    open: false,
    hint: 'Finance have pushed the payment. Nothing on this run can change now.' }
];

const PAY_REASONS = [
  'Absent without leave',
  'Absent - sick, uncertified',
  'Suspended',
  'Left employment',
  'Started part way through the month',
  'Paid in error last month'
];

function payState(id) { return PAY_STATES.find(s => s.id === id) || PAY_STATES[0]; }
function payStateAt(id) { return PAY_STATES.findIndex(s => s.id === id); }
function payIsOpen(run) { return payState(run.state).open; }

function payMoney(n) {
  return 'SR ' + Number(n).toLocaleString('en-GB',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function payDaysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

function payMonthName(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB',
    { month: 'long', year: 'numeric' });
}

/* ---------------- the sums ----------------

   Kept in one place so a figure on a screen and a figure in the export
   cannot drift apart. Every one of these is derived - none is stored -
   because a stored total is a total that can disagree with its own
   lines. */

function payLineRate(run, line) {
  return line.basic / payDaysInMonth(run.year, run.month);
}

function payLineDays(line) {
  const cut = (line.adjustments || []).reduce((n, a) => n + a.days, 0);
  return Math.max(0, line.days - cut);
}

function payLine(run, line) {
  const rate = payLineRate(run, line);
  const days = payLineDays(line);
  const earned = rate * days;
  const allowable = Math.round(earned + line.allowances);
  const spf = Math.round(allowable * PAY_SPF_RATE);
  const net = earned + line.allowances - spf - line.otherDed;
  return {
    rate, days, earned, allowable, spf,
    otherDed: line.otherDed,
    allowances: line.allowances,
    net,
    /* what this line would have paid before anybody touched it */
    fullNet: (() => {
      const e = rate * line.days;
      const a = Math.round(e + line.allowances);
      return e + line.allowances - Math.round(a * PAY_SPF_RATE) - line.otherDed;
    })()
  };
}

function payTotals(run) {
  return run.lines.reduce((t, l) => {
    const c = payLine(run, l);
    t.net += c.net; t.spf += c.spf; t.full += c.fullNet;
    t.days += c.days;
    return t;
  }, { net: 0, spf: 0, full: 0, days: 0 });
}

/* ---------------- what changed since last month ----------------

   The screen HC open on. Nearly every preventable mistake is a change
   from last month - somebody who should have come off and did not, an
   amount that moved. A figure that has been the same for eleven months
   is not where the trouble is.

   It cannot catch a day of absence that has not happened yet. Those are
   two different problems and only one of them lives before approval. */
function payDiff(run) {
  const prev = state.pay.runs.find(r => r.id === run.prevId);
  if (!prev) return null;
  const before = {};
  prev.lines.forEach(l => { before[l.nin] = l; });
  const seen = {};
  const added = [], moved = [];
  run.lines.forEach(l => {
    seen[l.nin] = 1;
    const was = before[l.nin];
    if (!was) { added.push(l); return; }
    if (was.basic !== l.basic || was.type !== l.type) {
      moved.push({ line: l, was: was.basic, now: l.basic });
    }
  });
  const gone = prev.lines.filter(l => !seen[l.nin]);
  return { added, gone, moved, prev };
}

/* ---------------- the checks ----------------

   The same checks as the script that reads the spreadsheet, run before
   HC can submit rather than after Finance have complained.

   Two of these exist because Finance keep no list of their own: they
   pay from whatever is in the file. So this is the only place a wrong
   identity number can be caught. */
function payChecks(run) {
  const out = [];
  const byNin = {};
  run.lines.forEach(l => (byNin[l.nin] = byNin[l.nin] || []).push(l));

  Object.keys(byNin).forEach(nin => {
    const g = byNin[nin];
    if (g.length < 2) return;
    const amounts = new Set(g.map(l => payLine(run, l).net.toFixed(2)));
    out.push(amounts.size > 1 ? {
      bad: true, t: 'Same identity number, different amounts',
      d: nin + ' appears ' + g.length + ' times with different net pay. Finance pay ' +
         'once per identity number, so one of these will be paid and the rest will be ' +
         'dropped without a word. Leave one line.'
    } : {
      bad: true, t: 'Same identity number twice',
      d: nin + ' appears ' + g.length + ' times. Nobody will be paid twice, but the ' +
         'repeats declare pension that this person did not earn.'
    });
  });

  const shape = s => String(s).replace(/\d/g, '9');
  const shapes = {};
  run.lines.forEach(l => { shapes[shape(l.nin)] = (shapes[shape(l.nin)] || 0) + 1; });
  const usual = Object.keys(shapes).sort((a, b) => shapes[b] - shapes[a])[0];
  run.lines.filter(l => shape(l.nin) !== usual).forEach(l => out.push({
    bad: true, t: 'Identity number written differently',
    d: esc(l.name) + ' has ' + esc(l.nin) + ', which is not the shape the other ' +
       shapes[usual] + ' use (' + usual + '). A wrong number does not fail - it pays ' +
       'the wrong person, or nobody.'
  }));

  const byName = {};
  run.lines.forEach(l => (byName[l.name.toUpperCase()] = byName[l.name.toUpperCase()] || new Set())
    .add(l.nin));
  Object.keys(byName).forEach(n => {
    if (byName[n].size > 1) out.push({
      bad: true, t: 'One name, two identity numbers',
      d: esc(n) + ' appears under ' + byName[n].size + ' different numbers. If that is one ' +
         'person they are on this run twice, and the check above cannot see it because the ' +
         'numbers genuinely differ.'
    });
  });

  const d = payDiff(run);
  if (d && d.added.length) out.push({
    bad: false, t: d.added.length + ' on a run for the first time',
    d: d.added.map(l => esc(l.name)).join(', ') + '. Finance keep no list of their own - ' +
       'they pay whoever is in the file - so nothing downstream will question these. ' +
       'HC are the only check there is.'
  });

  return out;
}

/* ---------------- seed ---------------- */

function payRng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function payMakeNin(rng) {
  const d = n => String(Math.floor(rng() * Math.pow(10, n))).padStart(n, '0');
  return d(3) + '-' + d(4) + '-' + String(Math.floor(rng() * 3)) + '-' +
         String(Math.floor(rng() * 2)) + '-' + d(2);
}

function payBuildSeed() {
  const rng = payRng(20260904);
  const now = new Date();
  /* One surname each, and enough of them for everybody. An earlier version
     took surnames modulo the list length, which quietly gave four pairs of
     people the same full name - and the "one name, two identity numbers"
     check dutifully flagged all four. They were sample-data accidents, not
     findings, and a demonstration that cries wolf teaches the wrong lesson
     about the check. */
  const surnames = ['ATTALA', 'SOLIN', 'SINON', 'BACCO', 'MONTHY', 'VICTOR', 'FELICIE',
    'ALVIS', 'DUVAL', 'ALBERT', 'BANANE', 'CADEAU', 'HOAREAU', 'PAYET', 'ROSE',
    'LOUISE', 'ESPARON', 'MELANIE', 'DINE', 'JEAN', 'MOUSTACHE', 'SAMSON',
    'CONFAIT', 'DUGASSE', 'LABROSSE', 'NOURRICE'];
  const firsts = ['Debby', 'Hyra', 'Sherika', 'Antoinette', 'Sheritina', 'Tyra', 'Nadra',
    'Dominic', 'Shamilla', 'Dino', 'Mario', 'Louise', 'Nella', 'Bernard', 'Jeanine',
    'Terence', 'Marie', 'Clive', 'Sabrina', 'Ronny', 'Kelly', 'Andre'];

  const FULL = 7633.47, HALF = 4971.13;

  const people = [];
  for (let i = 0; i < 26; i++) {
    const full = rng() < 0.82;
    people.push({
      nin: payMakeNin(rng),
      name: surnames[i] + '  ' + firsts[(i * 7) % firsts.length],
      type: full ? 'Full Day' : 'Half Day',
      basic: full ? FULL : HALF,
      allowances: rng() < 0.12 ? Math.round(rng() * 2000 * 100) / 100 : 0,
      otherDed: rng() < 0.1 ? Math.round(rng() * 900) : 0
    });
  }

  const mkLines = (list, year, month) => list.map(p => ({
    nin: p.nin, name: p.name, type: p.type, basic: p.basic,
    allowances: p.allowances, otherDed: p.otherDed,
    days: payDaysInMonth(year, month),
    adjustments: []
  }));

  /* Last month, finished and paid - so the run above it has something to
     be compared against. Without it the "what changed" screen would have
     nothing to say, which is exactly the state HC are in today. */
  const pm = now.getMonth() === 0 ? 12 : now.getMonth();
  const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prev = {
    id: 'R' + py + String(pm).padStart(2, '0'),
    year: py, month: pm, state: 'bank', prevId: null,
    lines: mkLines(people.slice(0, 24), py, pm),
    events: [{ at: Date.now() - 26 * 864e5, who: 'Finance', what: 'Sent to the banks' }],
    requested: 0
  };
  prev.requested = Math.ceil(payTotals(prev).net / 1000) * 1000;

  /* This month. One person has come on, one has come off, one has had a
     rate change, and there is a duplicate in it - because the real file
     had one and the checks should have something to find. */
  const cm = now.getMonth() + 1, cy = now.getFullYear();
  const list = people.slice(1, 25).concat([people[25]]);
  const cur = {
    id: 'R' + cy + String(cm).padStart(2, '0'),
    year: cy, month: cm, state: 'ack', prevId: prev.id,
    lines: mkLines(list, cy, cm),
    events: [
      { at: Date.now() - 3 * 864e5, who: 'HC', what: 'Run submitted' },
      { at: Date.now() - 3 * 864e5, who: 'CEO', what: 'Funds requested' },
      { at: Date.now() - 2 * 864e5, who: 'Finance', what: 'Acknowledged' }
    ],
    requested: 0
  };
  cur.lines.push(JSON.parse(JSON.stringify(cur.lines[4])));   /* the duplicate */
  cur.lines[6].basic = 7633.47;                                /* a rate that moved */
  cur.lines[6].type = 'Full Day';
  cur.requested = Math.ceil(payTotals(cur).net / 1000) * 1000;

  return { v: PAY_SEED_VERSION, runs: [cur, prev], as: 'hc' };
}

/* ---------------- who is looking ----------------

   Finance see the same run, read only, with two buttons. The demo lets
   you stand in either pair of shoes, because the argument for giving
   Finance a login is much easier to make when you can see what they
   would get. */
function payAs() { return state.pay.as === 'fin' ? 'fin' : 'hc'; }
function paySetAs(who) {
  state.pay.as = who === 'fin' ? 'fin' : 'hc';
  save();
  payRouteRefresh();
}

let payAtId = null;
function payRouteRefresh() { payRoute(payAtId ? ['r', payAtId] : []); }

/* ---------------- routing ---------------- */
function payRoute(parts) {
  const v = parts[0] || 'list';
  if (v === 'r') { payAtId = parts[1]; payRenderRun(parts[1]); }
  else { payAtId = null; payRenderList(); }
}

/* ---------------- the run list ---------------- */
function payRenderList() {
  setHead('Payment runs', 'The monthly Home Care payroll');
  const rows = state.pay.runs.map(r => {
    const t = payTotals(r), s = payState(r.state);
    return '<tr onclick="location.hash=\'#/pay/r/' + r.id + '\'">' +
      '<td data-label="Run"><b>' + esc(r.id) + '</b><div class="meta">' +
        esc(payMonthName(r.year, r.month)) + '</div></td>' +
      '<td data-label="People">' + r.lines.length + '</td>' +
      '<td data-label="Requested" class="mono">' + payMoney(r.requested) + '</td>' +
      '<td data-label="Current" class="mono">' + payMoney(t.net) + '</td>' +
      '<td data-label="State"><span class="paypill' + (s.open ? ' on' : '') + '">' +
        esc(s.name) + '</span></td></tr>';
  }).join('');

  $('#view').innerHTML = payBanner() +
    card('Runs', state.pay.runs.length + ' months',
      '<table class="tbl"><thead><tr><th>Run</th><th>People</th><th>Requested</th>' +
      '<th>Currently</th><th>State</th></tr></thead><tbody>' + rows + '</tbody></table>', true);
}

function payBanner() {
  return '<div class="banner"><b>DEMO</b><div>Sample carers and sample figures. The rules ' +
    'are the real ones - a day is basic pay divided by the days in that month, the pension ' +
    'is 5% each side, the requested sum is a ceiling, and Finance pay once per identity ' +
    'number.</div></div>';
}

/* ---------------- one run ---------------- */
function payRenderRun(id) {
  const run = state.pay.runs.find(r => r.id === id);
  if (!run) { location.hash = '#/pay'; return; }

  const t = payTotals(run), s = payState(run.state);
  const fin = payAs() === 'fin';
  const cut = run.requested - t.net;

  setHead(payMonthName(run.year, run.month), 'Payment run ' + run.id);

  const steps = PAY_STATES.map((st, i) => {
    const at = payStateAt(run.state);
    return '<div class="payst' + (i === at ? ' on' : (i < at ? ' done' : '')) + '">' +
      '<span class="paystdot">' + (i + 1) + '</span><span>' + esc(st.name) + '</span></div>';
  }).join('<span class="paystrule"></span>');

  const adjusted = run.lines.filter(l => (l.adjustments || []).length);

  $('#view').innerHTML =
    payWhoBar() +
    '<div class="paybar">' + steps + '</div>' +
    '<div class="hint" style="margin:-8px 0 16px">' + esc(s.hint) + '</div>' +
    payCeiling(run, t, cut) +
    (fin ? payFinanceBox(run) : payChecksBox(run) + payDiffBox(run)) +
    payAdjBox(run, adjusted) +
    payLinesBox(run, fin);

  payWire(run);
}

function payWhoBar() {
  const fin = payAs() === 'fin';
  return '<div class="modesw"><span>Looking as</span><div class="seg2">' +
    '<button data-w="hc"' + (fin ? '' : ' class="on"') + '>Home Care</button>' +
    '<button data-w="fin"' + (fin ? ' class="on"' : '') + '>Finance</button>' +
    '</div><span class="hint">Finance see the same run, read only, with two buttons.</span></div>';
}

/* The ceiling. The CEO requested a sum; this is how much of it is going
   to be used. Under is fine and needs nobody. Over is a new request,
   because the authority for the difference does not exist. */
function payCeiling(run, t, cut) {
  const over = t.net > run.requested + 0.005;
  return card('The request', 'approved by the CEO',
    '<div class="paygrid">' +
      '<div><div class="meta">Requested</div><div class="paybig mono">' +
        payMoney(run.requested) + '</div></div>' +
      '<div><div class="meta">Adjustments</div><div class="paybig mono' +
        (cut > 0.005 ? ' good' : '') + '">' + (cut > 0.005 ? '- ' : '') +
        payMoney(Math.abs(cut)) + '</div></div>' +
      '<div><div class="meta">Would be paid</div><div class="paybig mono">' +
        payMoney(t.net) + '</div></div>' +
    '</div>' +
    '<div class="hint" style="margin-top:12px">' +
      (over
        ? 'This run is <b>above</b> the sum the CEO requested. That is a new request, ' +
          'not an amendment - the authority for the difference does not exist yet.'
        : 'Under the requested sum, so nothing needs re-approving. HC are drawing less than ' +
          'they were authorised to draw, which is the ordinary direction.') +
    '</div>', false);
}

/* What HC would have had to assemble by hand, and now do not. */
function payChecksBox(run) {
  const c = payChecks(run);
  if (!c.length) {
    return card('Before this goes to Finance', 'nothing to flag',
      '<div class="hint">No repeated identity numbers, none written oddly, nobody new. ' +
      'This run can go.</div>');
  }
  return card('Before this goes to Finance', c.length + ' to look at',
    c.map(x => '<div class="payflag' + (x.bad ? ' bad' : '') + '">' +
      '<b>' + esc(x.t) + '</b><div>' + x.d + '</div></div>').join(''));
}

function payDiffBox(run) {
  const d = payDiff(run);
  if (!d) return '';
  const bit = (title, items) => items.length
    ? '<div class="paydiffrow"><b>' + title + '</b><div>' + items.join('<br>') + '</div></div>' : '';
  const body =
    bit('New this month', d.added.map(l => esc(l.name))) +
    bit('Gone since last month', d.gone.map(l => esc(l.name))) +
    bit('Amount moved', d.moved.map(m =>
      esc(m.line.name) + ' &mdash; ' + payMoney(m.was) + ' to ' + payMoney(m.now)));
  if (!body) return card('What changed since ' + payMonthName(d.prev.year, d.prev.month),
    'nothing', '<div class="hint">The same people at the same rates.</div>');
  return card('What changed since ' + payMonthName(d.prev.year, d.prev.month),
    'compared line by line', body +
    '<div class="hint" style="margin-top:10px">This catches what was already knowable when ' +
    'the run was built. It cannot catch a day of absence that has not happened yet - that is ' +
    'what the amendments below are for.</div>');
}

function payFinanceBox(run) {
  const at = payStateAt(run.state);
  const canAck = run.state === 'requested';
  const canVerify = run.state === 'ack';
  const canBank = run.state === 'verified';
  return card('Finance', 'read only, two buttons',
    '<div class="hint" style="margin-bottom:12px">Finance cannot change a figure on this run. ' +
    'That is not a courtesy - the screen does not offer it, so the rule that HC own their own ' +
    'document is kept by the system rather than by good manners.</div>' +
    '<div class="payact">' +
      '<button class="btn' + (canAck ? ' primary' : '') + '" id="payAck"' +
        (canAck ? '' : ' disabled') + '>Acknowledge</button>' +
      '<button class="btn' + (canVerify ? ' primary' : '') + '" id="payVer"' +
        (canVerify ? '' : ' disabled') + '>Verified</button>' +
      '<button class="btn' + (canBank ? ' primary' : '') + '" id="payBank"' +
        (canBank ? '' : ' disabled') + '>Sent to the banks</button>' +
    '</div>' +
    (at >= 4 ? '' : '<div class="hint" style="margin-top:12px">Pressing <b>Sent to the banks</b> ' +
      'locks the run. It is the only thing on this screen that cannot be undone, because after ' +
      'it the money has actually moved.</div>'));
}

function payAdjBox(run, adjusted) {
  if (!adjusted.length) return '';
  const rows = adjusted.map(l => (l.adjustments || []).map(a => {
    const rate = payLineRate(run, l);
    return '<tr><td data-label="Person">' + esc(l.name) + '</td>' +
      '<td data-label="Days">' + a.days + '</td>' +
      '<td data-label="Reason">' + esc(a.reason) + '</td>' +
      '<td data-label="Amount" class="mono">- ' + payMoney(a.days * rate) + '</td>' +
      '<td data-label="When">' + fmtDate(a.at) + '</td></tr>';
  }).join('')).join('');
  return card('Adjustments on this run', 'every one with its reason',
    '<table class="tbl"><thead><tr><th>Person</th><th>Days</th><th>Reason</th>' +
    '<th>Amount</th><th>When</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="hint" style="margin-top:10px">Because each of these carries a reason, the ' +
    'difference between what the CEO requested and what is actually paid explains itself. ' +
    'That is impossible today - the spreadsheet keeps one bundled deduction per person with ' +
    'no reason attached to it.</div>', true);
}

function payLinesBox(run, fin) {
  const open = payIsOpen(run) && !fin;
  const rows = run.lines.map((l, i) => {
    const c = payLine(run, l);
    const cutDays = l.days - c.days;
    return '<tr>' +
      '<td data-label="Person"><b>' + esc(l.name) + '</b><div class="meta mono">' +
        esc(l.nin) + '</div></td>' +
      '<td data-label="Type">' + esc(l.type) + '</td>' +
      '<td data-label="Days">' + c.days + ' of ' + l.days +
        (cutDays ? ' <span class="lbl">-' + cutDays + '</span>' : '') + '</td>' +
      '<td data-label="A day" class="mono">' + payMoney(c.rate) + '</td>' +
      '<td data-label="Pension" class="mono">' + payMoney(c.spf) + '</td>' +
      '<td data-label="Net" class="mono">' + payMoney(c.net) + '</td>' +
      '<td data-label="">' + (open
        ? '<button class="btn sm payamend" data-i="' + i + '">Cut days</button>'
        : '') + '</td></tr>';
  }).join('');

  return card('The run', run.lines.length + ' people',
    '<table class="tbl"><thead><tr><th>Person</th><th>Type</th><th>Days</th><th>A day</th>' +
    '<th>Pension</th><th>Net</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="hint" style="margin-top:10px">' + (open
      ? 'A day is basic pay divided by the ' + payDaysInMonth(run.year, run.month) +
        ' days in ' + payMonthName(run.year, run.month).split(' ')[0] + '. Cutting days lowers ' +
        'this run and never raises it, so it stays inside what the CEO already requested.'
      : (fin ? 'Finance see the run but cannot change it.'
             : 'The money has gone. Nothing on this run can change now.')) +
    '</div>', true);
}

/* ---------------- amending ----------------

   The adjustment changes the line it belongs to. It does not add a
   second line, and that is not a style preference: Finance pay once per
   identity number, so a correction row would be read as a duplicate and
   thrown away. The correction would vanish and the file would still
   look perfectly healthy. */
function payWire(run) {
  document.querySelectorAll('#view .modesw button').forEach(b => {
    b.onclick = () => paySetAs(b.getAttribute('data-w'));
  });

  const step = (to, who, what) => {
    run.state = to;
    run.events.push({ at: Date.now(), who, what });
    save();
    toast(what + '.');
    payRenderRun(run.id);
  };
  const ack = $('#payAck'), ver = $('#payVer'), bank = $('#payBank');
  if (ack && !ack.disabled) ack.onclick = () => step('ack', 'Finance', 'Acknowledged');
  if (ver && !ver.disabled) ver.onclick = () => step('verified', 'Finance', 'Verified');
  if (bank && !bank.disabled) bank.onclick = () => {
    if (!confirm('Once the run is sent to the banks nothing on it can be changed. ' +
                 'Has the payment actually been pushed?')) return;
    step('bank', 'Finance', 'Sent to the banks');
  };

  document.querySelectorAll('#view .payamend').forEach(b => {
    b.onclick = () => payAmendOpen(run, +b.getAttribute('data-i'));
  });
}

function payAmendOpen(run, i) {
  const l = run.lines[i];
  const c = payLine(run, l);
  const rate = c.rate;

  const wrap = document.createElement('div');
  wrap.className = 'paymodal';
  wrap.innerHTML = '<div class="paycardm">' +
    '<h3>' + esc(l.name) + '</h3>' +
    '<div class="hint">Currently paid ' + c.days + ' of ' + l.days + ' days at ' +
      payMoney(rate) + ' a day.</div>' +
    '<label>Days to cut<input id="payDays" type="number" min="1" max="' + c.days +
      '" value="1"></label>' +
    '<label>Reason<select id="payWhy">' +
      PAY_REASONS.map(r => '<option>' + esc(r) + '</option>').join('') +
    '</select></label>' +
    '<div class="paypre">This lowers the run by <b id="payPre">' + payMoney(rate) + '</b>.</div>' +
    '<div class="payact"><button class="btn" id="payNo">Cancel</button>' +
    '<button class="btn primary" id="payYes">Cut the days</button></div></div>';
  document.body.appendChild(wrap);

  const days = wrap.querySelector('#payDays');
  const pre = wrap.querySelector('#payPre');
  const redraw = () => {
    const n = Math.max(1, Math.min(c.days, +days.value || 1));
    pre.textContent = payMoney(n * rate);
  };
  days.oninput = redraw;
  days.focus();

  const shut = () => wrap.remove();
  wrap.querySelector('#payNo').onclick = shut;
  wrap.onclick = e => { if (e.target === wrap) shut(); };
  wrap.querySelector('#payYes').onclick = () => {
    const n = Math.max(1, Math.min(c.days, +days.value || 1));
    l.adjustments = l.adjustments || [];
    l.adjustments.push({
      days: n, reason: wrap.querySelector('#payWhy').value, at: Date.now(), who: 'HC'
    });
    run.events.push({
      at: Date.now(), who: 'HC',
      what: n + ' day' + (n === 1 ? '' : 's') + ' cut from ' + l.name
    });
    save();
    shut();
    toast(n + ' day' + (n === 1 ? '' : 's') + ' cut. The run total has gone down.');
    payRenderRun(run.id);
  };
}
