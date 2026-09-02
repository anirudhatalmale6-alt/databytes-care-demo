/* ==================================================================
   SPTC Passenger Care - demo application
   No frameworks, no build step, no external requests. It runs from a
   folder on a laptop with no internet just as well as it runs from a
   web address, which matters when a demonstration is being given in
   somebody else's meeting room.
   ================================================================== */

const KEY = 'sptc-care-v1';
const H = 3600 * 1000;
let state = null;

/* ---------------- store ---------------- */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.tickets && p.tickets.length && p.v === SEED_VERSION) return p;
    }
  } catch (e) { /* fall through to a fresh seed */ }
  const tickets = buildSeed();
  return { v: SEED_VERSION, tickets, alerts: buildAlerts(tickets), me: 'u6', theme: 'dark', seq: 0 };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
function reset() {
  if (!confirm('Reset the demonstration back to its starting data?\n\nAnything logged or changed during this session will be discarded.')) return;
  localStorage.removeItem(KEY);
  location.hash = '#/dashboard';
  location.reload();
}

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cat = id => CATEGORIES.find(c => c.id === id) || { name: id, pri: 'P3' };
const chan = id => (CHANNELS.find(c => c.id === id) || { name: id }).name;
const staff = id => STAFF.find(s => s.id === id) || null;
const route = no => ROUTES.find(r => r.no === no) || { no, name: '' };
const me = () => staff(state.me);
const isOpen = t => OPEN_STATUSES.includes(t.status);
const sec = id => SECTIONS.find(s => s.id === id) || { id: id, name: id, short: id, head: null, what: '' };
const secOf = t => sec(t.section || cat(t.category).section);
const rule = id => NOTIFY_RULES.find(r => r.id === id) || { id: id, label: id, who: [], how: '', what: '' };

/* ---------------- who gets told ----------------
   The rules name jobs, not people, so that a rule survives somebody
   leaving. This is where a job becomes a person.
   ------------------------------------------------------------------ */
const WHO_TOKENS = {
  'section-head':          c => sec(c.section).head,
  'previous-section-head': c => (c.from ? sec(c.from).head : null),
  'care-head':             () => 'u6',
  'complaints-supervisor': () => 'u5',
  'safety-head':           () => sec('safety').head,
  'ops-director':          () => 'u9',
  'ceo':                   () => 'u11',
  'owner':                 c => c.assignee || null
};
const WHO_LABEL = {
  'section-head': 'Head of the receiving section',
  'previous-section-head': 'Head of the section it came from',
  'care-head': 'Head of Customer Care',
  'complaints-supervisor': 'Complaints Desk Supervisor',
  'safety-head': 'Safety and Compliance',
  'ops-director': 'Director of Operations',
  'ceo': 'Chief Executive',
  'owner': 'Whoever holds the case'
};

/* resolve a rule's recipients against one case; drops anybody the
   rule asks for who does not exist on this case (an unassigned case
   has no owner to tell) and never tells the same person twice */
function recipients(r, ctx) {
  const out = [];
  (r.who || []).forEach(tok => {
    const fn = WHO_TOKENS[tok];
    const id = fn ? fn(ctx) : null;
    if (id && out.indexOf(id) === -1) out.push(id);
  });
  return out;
}

/* Raise a notification for something that just happened on screen.
   Same shape as the seeded ones, so the log does not have two kinds
   of row in it. */
function notify(ruleId, t, extra) {
  const r = NOTIFY_RULES.find(x => x.id === ruleId);
  if (!r) return null;
  if (r.only && t.priority !== r.only) return null;
  state.alerts.unshift({
    id: 'A' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    at: Date.now(), rule: ruleId, ticketId: t.id, ref: t.ref,
    section: t.section, priority: t.priority, extra: extra || null, read: false
  });
  return r;
}
function alertsFor(id) { return state.alerts.filter(a => a.ticketId === id).sort((a, b) => b.at - a.at); }
function unreadAlerts() { return state.alerts.filter(a => !a.read).length; }

function fmtDate(ms) {
  const d = new Date(ms);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtDur(ms) {
  const m = Math.floor(Math.abs(ms) / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + String(mm).padStart(2, '0') + 'm';
  return mm + 'm';
}
function ago(ms) { return fmtDur(Date.now() - ms) + ' ago'; }

/* ---------------- service levels ----------------
   The clock a passenger actually feels is "when did somebody get back
   to me", so that is the one shown while a case is unanswered. Once
   answered, the clock that matters becomes "when will it be settled".
   ------------------------------------------------------------------ */
function sla(t) {
  const p = PRIORITIES[t.priority];
  if (!p || p.respondH == null) return { kind: 'none' };

  const respondDue = t.createdAt + p.respondH * H;
  const resolveDue = t.createdAt + p.resolveH * H;

  if (t.status === 'Resolved' || t.status === 'Closed') {
    const met = t.resolvedAt != null && t.resolvedAt <= resolveDue;
    return {
      kind: 'done', met, label: met ? 'Within target' : 'Over target',
      state: 'done', pct: 100,
      took: t.resolvedAt ? t.resolvedAt - t.createdAt : null
    };
  }

  const awaitingReply = !t.firstResponseAt;
  const due = awaitingReply ? respondDue : resolveDue;
  const started = t.createdAt;
  const now = Date.now();
  const pct = Math.max(0, Math.min(100, ((now - started) / (due - started)) * 100));
  const left = due - now;
  const st = left < 0 ? 'bad' : (pct > 75 ? 'warn' : 'ok');
  return {
    kind: awaitingReply ? 'respond' : 'resolve',
    label: (awaitingReply ? 'Reply' : 'Resolve') + ' ' + (left < 0 ? fmtDur(left) + ' over' : fmtDur(left) + ' left'),
    state: st, pct, left, breached: left < 0
  };
}
function slaCell(t) {
  const s = sla(t);
  if (s.kind === 'none') return '<span class="lbl">no target</span>';
  if (s.kind === 'done')
    return '<div class="sla done"><span class="t">' + esc(s.label) + '</span>' +
           '<span class="lbl">' + (s.took ? fmtDur(s.took) : '') + '</span></div>';
  return '<div class="sla ' + s.state + '"><span class="t">' + esc(s.label) + '</span>' +
         '<span class="bar"><i style="width:' + s.pct.toFixed(1) + '%"></i></span></div>';
}

/* ---------------- small components ---------------- */
const statusPill = s => '<span class="pill s-' + s.replace(/\s/g, '') + '"><i></i>' + esc(s) + '</span>';
const priPill = p => '<span class="pri p-' + p + '">' + (p === 'NA' ? '—' : p) + '</span>';
function avatar(id) {
  const u = staff(id);
  if (!u) return '<span class="lbl">unassigned</span>';
  return '<span style="display:inline-flex;align-items:center;gap:7px">' +
         '<span class="av" style="width:22px;height:22px;font-size:9px">' + u.initials + '</span>' +
         '<span style="font-size:12.5px">' + esc(u.name) + '</span></span>';
}

/* ---------------- routing ---------------- */
function router() {
  const h = location.hash || '#/dashboard';
  const parts = h.replace('#/', '').split('/');
  const view = parts[0] || 'dashboard';
  document.querySelectorAll('.nav a').forEach(a =>
    a.classList.toggle('on', a.getAttribute('href') === '#/' + view));
  if (view === 'queue')          renderQueue();
  else if (view === 't')         renderTicket(parts[1]);
  else if (view === 'new')       renderNew();
  else if (view === 'routes')    renderRoutes();
  else if (view === 'sections')  renderSections();
  else if (view === 'alerts')    renderAlerts();
  else if (view === 'rules')     renderRules();
  else                           renderDashboard();
  window.scrollTo(0, 0);
}

/* ---------------- dashboard ---------------- */
function renderDashboard() {
  const T = state.tickets;
  const now = Date.now();
  const open = T.filter(isOpen);
  const overdue = open.filter(t => { const s = sla(t); return s.kind !== 'none' && s.kind !== 'done' && s.breached; });

  const last7 = T.filter(t => t.createdAt > now - 7 * 24 * H);
  const prev7 = T.filter(t => t.createdAt <= now - 7 * 24 * H && t.createdAt > now - 14 * 24 * H);
  const resolved7 = T.filter(t => t.resolvedAt && t.resolvedAt > now - 7 * 24 * H);

  /* first-response performance, over everything that has been answered */
  const answered = T.filter(t => t.firstResponseAt && PRIORITIES[t.priority].respondH != null);
  const onTime = answered.filter(t => t.firstResponseAt <= t.createdAt + PRIORITIES[t.priority].respondH * H);
  const respPct = answered.length ? Math.round(onTime.length / answered.length * 100) : 100;

  const doneAll = T.filter(t => t.resolvedAt);
  const medResolve = median(doneAll.map(t => t.resolvedAt - t.createdAt));

  const delta = (a, b) => {
    if (!b) return { c: 'flat', s: '—' };
    const d = Math.round((a - b) / b * 100);
    return { c: d > 0 ? 'up' : d < 0 ? 'down' : 'flat', s: (d > 0 ? '+' : '') + d + '%' };
  };
  const dv = delta(last7.length, prev7.length);

  setHead('Control desk', 'Passenger contact across the network, live');

  const sup = me().role !== 'agent';

  $('#view').innerHTML =
    banner() +
    '<div class="grid k4" style="margin-bottom:14px">' +
      kpi('Open cases', open.length, 'currently being handled', '--amber', null) +
      kpi('Past target', overdue.length, 'need attention now', '--coral', null) +
      kpi('Replied on time', respPct + '%', 'first response, all cases', respPct >= 85 ? '--teal' : '--amber', null) +
      kpi('New this week', last7.length, 'vs ' + prev7.length + ' the week before', '--blue', dv) +
    '</div>' +

    '<div class="grid c23" style="margin-bottom:14px">' +
      card('Contact received', '21 days', '<div id="trend"></div>') +
      card('Resolution performance', 'all cases',
        '<div class="gauge">' + gauge(respPct) +
        '<div><div class="big">' + fmtDur(medResolve) + '</div>' +
        '<div class="sm">typical time to settle a case</div>' +
        '<div class="sm" style="margin-top:9px">' + resolved7.length + ' settled in the last 7 days</div>' +
        '</div></div>') +
    '</div>' +

    '<div class="grid ' + (sup ? 'c23' : 'k2') + '" style="margin-bottom:14px">' +
      card('What people are contacting us about', 'by volume', bars(byCategory(T), 'name', 'n')) +
      (sup ? card('Agent workload', 'open cases', workload(open)) : card('Busiest routes', 'by volume', bars(byRoute(T).slice(0, 8), 'name', 'n'))) +
    '</div>' +

    (sup ? '<div class="grid k2" style="margin-bottom:14px">' +
      card('Busiest routes', 'by volume', bars(byRoute(T).slice(0, 8), 'name', 'n')) +
      card('Safety reports', 'last 21 days', safetyPanel(T)) +
      '</div>' +
      '<div class="grid k2" style="margin-bottom:14px">' +
      card('Where the work has been sent', 'open cases by section', sectionBars(open)) +
      card('Recent notifications', unreadAlerts() + ' unread', recentAlerts()) +
      '</div>' : '') +

    card('Needs attention first', overdue.length + ' past target',
         overdue.length ? table(sortByUrgency(overdue).slice(0, 8)) :
         '<div class="empty">Nothing is past its target time. Unusual, and worth saying out loud.</div>', true);

  drawTrend(T);
}

function banner() {
  return '<div class="banner"><b>DEMO</b><div>Sample data only. Staff, passengers, route numbers and fleet ' +
         'numbers are invented and would be replaced with SPTC\'s own. Everything on screen is live and clickable — ' +
         'log a case, assign it, work it through and watch the clocks move.</div></div>';
}
function setHead(h, s) { $('#ph').textContent = h; $('#ps').textContent = s; }
function kpi(label, n, d, colorVar, dl) {
  return '<div class="card kpi" style="--k:var(' + colorVar + ')">' +
    '<div class="lbl">' + esc(label) + '</div>' +
    (dl ? '<div class="trend ' + dl.c + '">' + dl.s + '</div>' : '') +
    '<div class="n">' + esc(n) + '</div><div class="d">' + esc(d) + '</div></div>';
}
function card(title, right, body, flush) {
  return '<div class="card"><header><h3>' + esc(title) + '</h3>' +
    (right ? '<span class="lbl">' + esc(right) + '</span>' : '') + '</header>' +
    (flush ? body : '<div class="body">' + body + '</div>') + '</div>';
}
function median(a) {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function byCategory(T) {
  const m = {};
  T.forEach(t => { m[t.category] = (m[t.category] || 0) + 1; });
  return Object.keys(m).map(k => ({ name: cat(k).name, n: m[k] })).sort((a, b) => b.n - a.n);
}
function byRoute(T) {
  const m = {};
  T.forEach(t => { m[t.routeNo] = (m[t.routeNo] || 0) + 1; });
  return Object.keys(m).map(k => ({ name: 'Route ' + k, n: m[k] })).sort((a, b) => b.n - a.n);
}
function bars(rows, nk, vk) {
  const max = Math.max.apply(null, rows.map(r => r[vk]).concat([1]));
  return '<div class="bars">' + rows.map((r, i) =>
    '<div class="row"><span class="nm" title="' + esc(r[nk]) + '">' + esc(r[nk]) + '</span>' +
    '<span class="tr"><i style="width:' + (r[vk] / max * 100) + '%;animation-delay:' + (i * 45) + 'ms"></i></span>' +
    '<span class="vv">' + r[vk] + '</span></div>').join('') + '</div>';
}
function workload(open) {
  const m = {};
  AGENTS.forEach(a => m[a.id] = { u: a, n: 0, bad: 0 });
  open.forEach(t => {
    if (t.assignee && m[t.assignee]) {
      m[t.assignee].n++;
      const s = sla(t); if (s.breached) m[t.assignee].bad++;
    }
  });
  const rows = Object.values(m).sort((a, b) => b.n - a.n);
  const max = Math.max.apply(null, rows.map(r => r.n).concat([1]));
  const un = open.filter(t => !t.assignee).length;
  return '<div class="wl">' + rows.map((r, i) =>
    '<div class="r"><span class="av" style="width:26px;height:26px">' + r.u.initials + '</span>' +
    '<div><div class="nn">' + esc(r.u.name) +
      (r.bad ? ' <span class="pri p-P1" style="margin-left:5px">' + r.bad + ' late</span>' : '') +
      (r.u.available ? '' : ' <span class="pill s-Closed" style="margin-left:5px">' + esc(r.u.why) + '</span>') + '</div>' +
    '<div class="tr" style="margin-top:5px"><i style="width:' + (r.n / max * 100) + '%;animation-delay:' + (i * 55) + 'ms"></i></div></div>' +
    '<span class="vv mono" style="text-align:right">' + r.n + '</span></div>').join('') +
    '</div>' + (un ? '<div class="hint" style="margin-top:12px">' + un + ' unassigned, sitting in the New queue</div>' : '');
}
/* open cases per section, with the late ones called out - the number a
   section head is judged on, not the total */
function sectionBars(open) {
  const rows = SECTIONS.map(s => {
    const mine = open.filter(t => secOf(t).id === s.id);
    return { s, n: mine.length, bad: mine.filter(t => sla(t).breached).length };
  }).sort((a, b) => b.n - a.n);
  const max = Math.max.apply(null, rows.map(r => r.n).concat([1]));
  return '<div class="bars">' + rows.map((r, i) =>
    '<div class="row" style="cursor:pointer" onclick="qf.section=\'' + r.s.id +
      '\';qf.status=\'open\';qf.touched=1;location.hash=\'#/queue\'">' +
    '<span class="nm" title="' + esc(r.s.name) + '">' + esc(r.s.name) + '</span>' +
    '<span class="tr"><i style="width:' + (r.n / max * 100) + '%;animation-delay:' + (i * 45) + 'ms;' +
      'background:var(--sc-' + r.s.id + ')"></i></span>' +
    '<span class="vv">' + r.n + (r.bad ? ' <span style="color:var(--coral)">·' + r.bad + '</span>' : '') +
    '</span></div>').join('') + '</div>' +
    '<div class="hint" style="margin-top:11px">Open cases. A red figure is how many of them are past their ' +
    'target. <a href="#/sections">Section board</a></div>';
}

/* the last few things the rules sent, so a supervisor sees the traffic
   without leaving the control desk */
function recentAlerts() {
  const list = state.alerts.slice(0, 6);
  if (!list.length) return '<div class="hint">Nothing sent yet.</div>';
  return '<div class="tal">' + list.map(a => {
    const r = rule(a.rule), s = sec(a.section);
    return '<div class="tal-r" style="cursor:pointer" onclick="location.hash=\'#/t/' + a.ticketId + '\'">' +
      '<div><span class="rulechip">' + esc(r.id) + '</span> ' +
      '<span style="font-size:12.5px">' + esc(r.label) + '</span> ' +
      '<span class="secpill sc-' + esc(s.id) + '">' + esc(s.short) + '</span>' +
      '<div class="hint" style="margin-top:3px">' + esc(a.ref) + ' · ' + esc(r.how) + '</div></div>' +
      '<span class="lbl mono" style="white-space:nowrap">' + esc(ago(a.at)) + '</span></div>';
  }).join('') + '</div>' +
  '<div class="hint" style="margin-top:11px"><a href="#/alerts">The full log</a>, and the ' +
  '<a href="#/rules">rules that produce it</a>.</div>';
}

function safetyPanel(T) {
  const s = T.filter(t => t.priority === 'P1');
  const openS = s.filter(isOpen);
  const late = openS.filter(t => sla(t).breached);
  return '<div class="grid k2" style="gap:12px">' +
    '<div><div class="lbl">Reported</div><div class="n mono" style="font-size:26px;font-weight:700">' + s.length + '</div>' +
    '<div class="hint">dangerous driving and accessibility, 21 days</div></div>' +
    '<div><div class="lbl">Still open</div><div class="n mono" style="font-size:26px;font-weight:700;color:' +
      (late.length ? 'var(--coral)' : 'var(--teal)') + '">' + openS.length + '</div>' +
    '<div class="hint">' + (late.length ? late.length + ' past their 2 hour reply target' : 'all inside target') + '</div></div>' +
    '</div><div class="hint" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">' +
    'Safety reports carry a 2 hour reply and 24 hour resolution target, and are the only category that pages a supervisor automatically.</div>';
}
function gauge(pct) {
  const r = 42, c = 2 * Math.PI * r, on = c * pct / 100;
  const col = pct >= 85 ? 'var(--teal)' : pct >= 70 ? 'var(--amber)' : 'var(--coral)';
  return '<svg width="104" height="104" viewBox="0 0 104 104">' +
    '<circle cx="52" cy="52" r="' + r + '" fill="none" stroke="var(--panel-3)" stroke-width="9"/>' +
    '<circle cx="52" cy="52" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="9" stroke-linecap="round" ' +
    'stroke-dasharray="' + on + ' ' + c + '" transform="rotate(-90 52 52)">' +
    '<animate attributeName="stroke-dasharray" from="0 ' + c + '" to="' + on + ' ' + c + '" dur=".9s" fill="freeze"/></circle>' +
    '<text x="52" y="50" text-anchor="middle" font-family="Plex Mono,monospace" font-size="21" font-weight="600" fill="var(--txt)">' + pct + '%</text>' +
    '<text x="52" y="66" text-anchor="middle" font-size="9" letter-spacing="1.2" fill="var(--faint)">ON TARGET</text></svg>';
}
function drawTrend(T) {
  const el = $('#trend'); if (!el) return;
  const now = Date.now(), days = 21, w = 640, h = 88, gap = 3;
  const bw = (w - gap * (days - 1)) / days;
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(now - i * 24 * H); start.setHours(0, 0, 0, 0);
    const end = start.getTime() + 24 * H;
    const inDay = T.filter(t => t.createdAt >= start.getTime() && t.createdAt < end);
    buckets.push({ d: start, n: inDay.length, p1: inDay.filter(t => t.priority === 'P1').length });
  }
  const max = Math.max.apply(null, buckets.map(b => b.n).concat([1]));
  let svg = '<svg class="spark" viewBox="0 0 ' + w + ' ' + (h + 16) + '" preserveAspectRatio="none">';
  buckets.forEach((b, i) => {
    const bh = Math.max(2, b.n / max * h), x = i * (bw + gap), y = h - bh;
    const p1h = b.p1 ? Math.max(2, b.p1 / max * h) : 0;
    svg += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="1.5" fill="var(--ocean)" opacity=".78">' +
           '<title>' + b.d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
           ' — ' + b.n + ' received' + (b.p1 ? ', ' + b.p1 + ' safety' : '') + '</title></rect>';
    if (p1h) svg += '<rect x="' + x + '" y="' + (h - p1h) + '" width="' + bw + '" height="' + p1h + '" rx="1.5" fill="var(--coral)"/>';
    if (i % 5 === 0) svg += '<text x="' + (x + bw / 2) + '" y="' + (h + 12) + '" text-anchor="middle" font-size="9" fill="var(--faint)">' +
      b.d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</text>';
  });
  svg += '</svg><div class="legend"><span><i style="background:var(--ocean)"></i>All contact</span>' +
         '<span><i style="background:var(--coral)"></i>Safety reports</span></div>';
  el.innerHTML = svg;
}

/* ---------------- queue ---------------- */
let qf = { status: 'open', cat: '', route: '', section: '', assignee: '', q: '', mine: false };

function sortByUrgency(list) {
  return list.slice().sort((a, b) => {
    const sa = sla(a), sb = sla(b);
    const ba = sa.breached ? 1 : 0, bb = sb.breached ? 1 : 0;
    if (ba !== bb) return bb - ba;
    const pa = { P1: 0, P2: 1, P3: 2, NA: 3 }[a.priority], pb = { P1: 0, P2: 1, P3: 2, NA: 3 }[b.priority];
    if (pa !== pb) return pa - pb;
    return (sa.left == null ? 9e15 : sa.left) - (sb.left == null ? 9e15 : sb.left);
  });
}

function renderQueue() {
  if (me().role === 'agent' && qf.assignee === '' && !qf.touched) { qf.mine = true; }
  setHead('Case queue', 'Everything logged, sorted by what will run out of time first');

  const opts = (arr, sel, valk, labk) => arr.map(o =>
    '<option value="' + esc(o[valk]) + '"' + (String(sel) === String(o[valk]) ? ' selected' : '') + '>' + esc(o[labk]) + '</option>').join('');

  $('#view').innerHTML =
    '<div class="filters">' +
      '<input type="search" id="fq" placeholder="Search reference, passenger, words in the case…" value="' + esc(qf.q) + '">' +
      '<select id="fs"><option value="open"' + (qf.status === 'open' ? ' selected' : '') + '>Open cases</option>' +
        '<option value="">Every status</option>' + opts(STATUSES.map(s => ({ v: s, l: s })), qf.status, 'v', 'l') + '</select>' +
      '<select id="fc"><option value="">Every subject</option>' + opts(CATEGORIES.map(c => ({ v: c.id, l: c.name })), qf.cat, 'v', 'l') + '</select>' +
      '<select id="fr"><option value="">Every route</option>' + opts(ROUTES.map(r => ({ v: r.no, l: 'Route ' + r.no })), qf.route, 'v', 'l') + '</select>' +
      '<select id="fsec"><option value="">Every section</option>' + opts(SECTIONS.map(s => ({ v: s.id, l: s.name })), qf.section, 'v', 'l') + '</select>' +
      '<button class="chipbtn' + (qf.mine ? ' on' : '') + '" id="fmine">Assigned to me</button>' +
      '<button class="chipbtn" id="fclear">Clear</button>' +
      '<span class="spacer"></span>' +
      '<a class="btn primary" href="#/new" style="text-decoration:none">Log a new case</a>' +
    '</div>' +
    '<div class="card" id="qwrap"></div>';

  $('#fq').oninput = e => { qf.q = e.target.value; qf.touched = 1; paintQueue(); };
  $('#fs').onchange = e => { qf.status = e.target.value; qf.touched = 1; paintQueue(); };
  $('#fc').onchange = e => { qf.cat = e.target.value; qf.touched = 1; paintQueue(); };
  $('#fr').onchange = e => { qf.route = e.target.value; qf.touched = 1; paintQueue(); };
  $('#fsec').onchange = e => { qf.section = e.target.value; qf.touched = 1; paintQueue(); };
  $('#fmine').onclick = () => { qf.mine = !qf.mine; qf.touched = 1; renderQueue(); };
  $('#fclear').onclick = () => { qf = { status: 'open', cat: '', route: '', section: '', assignee: '', q: '', mine: false, touched: 1 }; renderQueue(); };
  paintQueue();
}

function filtered() {
  const q = qf.q.trim().toLowerCase();
  return state.tickets.filter(t => {
    if (qf.status === 'open') { if (!isOpen(t)) return false; }
    else if (qf.status && t.status !== qf.status) return false;
    if (qf.cat && t.category !== qf.cat) return false;
    if (qf.route && t.routeNo !== qf.route) return false;
    if (qf.section && secOf(t).id !== qf.section) return false;
    if (qf.mine && t.assignee !== state.me) return false;
    if (q) {
      const hay = (t.ref + ' ' + t.passenger + ' ' + t.summary + ' ' + t.detail + ' ' + cat(t.category).name).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}
function paintQueue() {
  const rows = sortByUrgency(filtered());
  $('#qwrap').innerHTML = rows.length ? table(rows) :
    '<div class="empty">Nothing matches those filters.</div>';
}
function table(rows) {
  return '<table class="tbl"><thead><tr>' +
    '<th style="width:112px">Reference</th><th>Case</th><th style="width:112px">Route</th>' +
    '<th style="width:44px">Pri</th><th style="width:132px">Status</th>' +
    '<th style="width:158px">Assigned</th><th style="width:150px">Time target</th></tr></thead><tbody>' +
    rows.map((t, i) =>
      '<tr class="rowin" style="animation-delay:' + Math.min(i * 18, 320) + 'ms" onclick="location.hash=\'#/t/' + t.id + '\'">' +
      '<td data-label="Reference"><span class="ref">' + esc(t.ref) + '</span><div class="meta">' + esc(ago(t.createdAt)) + '</div></td>' +
      '<td data-label="Case"><div class="sum">' + esc(cat(t.category).name) +
        ' <span class="secpill sc-' + esc(secOf(t).id) + '">' + esc(secOf(t).short) + '</span>' +
        (t.routedBy === 'hand' ? '<span class="lbl" title="moved by hand, reason on the case"> moved</span>' : '') + '</div>' +
        '<div class="meta">' + esc(t.passenger) + ' · ' + esc(chan(t.channel)) + '</div></td>' +
      '<td data-label="Route"><span class="route">' + esc(t.routeNo) + '</span><div class="meta">' + esc(t.fleetNo) + '</div></td>' +
      '<td data-label="Priority">' + priPill(t.priority) + '</td>' +
      '<td data-label="Status">' + statusPill(t.status) + '</td>' +
      '<td data-label="Assigned">' + avatar(t.assignee) + '</td>' +
      '<td data-label="Time target">' + slaCell(t) + '</td></tr>').join('') +
    '</tbody></table>';
}

/* ---------------- ticket ---------------- */
function renderTicket(id) {
  const t = state.tickets.find(x => x.id === id);
  if (!t) { $('#view').innerHTML = '<div class="empty">That case no longer exists.</div>'; return; }
  const c = cat(t.category), r = route(t.routeNo), p = PRIORITIES[t.priority];
  setHead(t.ref, c.name + ' · route ' + t.routeNo);

  $('#view').innerHTML =
    '<button class="back" onclick="history.back()">&larr; Back to the queue</button>' +
    '<div class="grid c23">' +
      '<div style="display:grid;gap:14px;align-content:start">' +
        card('The case', esc(chan(t.channel)),
          '<div class="tkhead"><h2>' + esc(c.name) + '</h2>' + priPill(t.priority) + statusPill(t.status) + '</div>' +
          '<div class="hint" style="margin-bottom:14px">Route ' + esc(t.routeNo) + ' · ' + esc(r.name) +
            ' · vehicle ' + esc(t.fleetNo) + ' · incident ' + esc(fmtDate(t.incidentAt)) + '</div>' +
          '<div class="quote">' + esc(t.detail) + '</div>') +
        card('What has happened', t.notes.length + ' entries', timeline(t)) +
        (isOpen(t) ? card('Add to this case', '', workForm(t)) : '') +
      '</div>' +
      '<div style="display:grid;gap:14px;align-content:start">' +
        card('Handled by', secOf(t).short, sectionPanel(t)) +
        card('Time target', p.respondH ? p.label : 'none', slaPanel(t)) +
        card('Details', '', facts(t)) +
        card('Actions', '', actions(t)) +
        card('Who has been told', alertsFor(t.id).length + '', ticketAlerts(t)) +
      '</div>' +
    '</div>';
  wireTicket(t);
}
/* Where the case went, why, and the one control that moves it. The
   reason is required - a case that changes hands without one is how
   things get lost between two departments who each think the other
   has it. */
function sectionPanel(t) {
  const s = secOf(t), h = staff(s.head), c = cat(t.category);
  const byRule = t.routedBy !== 'hand';
  let html =
    '<div class="secbox"><span class="secpill sc-' + esc(s.id) + '">' + esc(s.short) + '</span>' +
    '<div><div style="font-size:13px;font-weight:600">' + esc(s.name) + '</div>' +
    '<div class="hint">' + (byRule
      ? 'Sent here automatically because the subject is &ldquo;' + esc(c.name) + '&rdquo;.'
      : 'Moved here by hand.') + '</div></div></div>';

  if (h) html += '<div class="sec-head" style="margin-top:12px">' +
    '<span class="av" style="width:24px;height:24px;font-size:9.5px">' + h.initials + '</span>' +
    '<div><div style="font-size:12.5px">' + esc(h.name) + '</div>' +
    '<div class="hint">' + esc(h.title) + '</div></div></div>';

  if (t.redirected) html +=
    '<div class="movebox"><div class="lbl">Moved ' + esc(fmtDate(t.redirected.at)) + '</div>' +
    '<div style="font-size:12.5px;margin:5px 0 6px">' + esc(sec(t.redirected.from).name) + ' &rarr; ' +
      esc(sec(t.redirected.to).name) + '</div>' +
    '<div class="hint">' + esc(t.redirected.why) + '</div>' +
    '<div class="hint" style="margin-top:6px">by ' + esc((staff(t.redirected.by) || {}).name || '') + '</div></div>';

  if (isOpen(t)) {
    html += '<div class="frm" style="margin-top:12px">' +
      '<label><span class="lbl">Send it somewhere else</span><select id="secsel">' +
      SECTIONS.map(x => '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') +
      '</select></label>' +
      (t.priority === 'P1' ? '<div class="hint">This is a safety report. Moving it out of Safety and Compliance is possible but is recorded and notified upwards.</div>'
                           : '<div class="hint">A reason is required, and both section heads are told.</div>') +
      '</div>';
  }
  return html;
}

function ticketAlerts(t) {
  const list = alertsFor(t.id);
  if (!list.length) return '<div class="hint">Nothing has been sent about this case yet.</div>';
  return '<div class="tal">' + list.slice(0, 8).map(a => {
    const r = rule(a.rule);
    const to = recipients(r, { section: a.section, from: a.extra ? a.extra.from : null, assignee: t.assignee })
      .map(id => staff(id)).filter(Boolean);
    return '<div class="tal-r"><div><span class="rulechip">' + esc(r.id) + '</span> ' +
      '<span style="font-size:12.5px">' + esc(r.label) + '</span>' +
      '<div class="hint" style="margin-top:3px">' + to.map(u => esc(u.name)).join(', ') +
      (to.length ? ' · ' + esc(r.how) : 'no recipient') + '</div></div>' +
      '<span class="lbl mono" style="white-space:nowrap">' + esc(ago(a.at)) + '</span></div>';
  }).join('') + '</div>' +
  (list.length > 8 ? '<div class="hint" style="margin-top:10px">' + (list.length - 8) + ' older. ' +
    '<a href="#/alerts">Full log</a></div>' : '');
}

function slaPanel(t) {
  const s = sla(t), p = PRIORITIES[t.priority];
  if (s.kind === 'none')
    return '<div class="hint">Compliments are not worked to a clock. They are passed to the depot manager and recorded on the crew member\'s file.</div>';
  const line = (k, v, cls) => '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)">' +
    '<span class="lbl">' + k + '</span><span class="mono" style="font-size:12px' + (cls ? ';color:' + cls : '') + '">' + v + '</span></div>';
  return '<div style="margin-bottom:12px">' + slaCell(t) + '</div>' +
    line('Priority', p.code + ' · ' + p.label) +
    line('Reply within', p.respondH + ' hours') +
    line('Settle within', p.resolveH + ' hours') +
    line('Logged', fmtDate(t.createdAt)) +
    line('First reply', t.firstResponseAt ? fmtDate(t.firstResponseAt) : 'not yet',
         t.firstResponseAt ? '' : 'var(--amber)') +
    (t.resolvedAt ? line('Settled', fmtDate(t.resolvedAt)) : '');
}
function facts(t) {
  const r = route(t.routeNo);
  const f = (k, v) => '<div><div class="k">' + k + '</div><div class="v">' + esc(v) + '</div></div>';
  return '<div class="facts">' +
    f('Passenger', t.passenger) + f('Telephone', t.phone) +
    f('Received by', chan(t.channel)) + f('Reference', t.ref) +
    f('Route', t.routeNo + ' — ' + r.name) + f('Vehicle', t.fleetNo) +
    f('Owner', t.assignee ? staff(t.assignee).name : 'nobody yet') +
    f('Open for', fmtDur(Date.now() - t.createdAt)) + '</div>';
}
function timeline(t) {
  /* not .toLowerCase() - it turned "WhatsApp" into "whatsapp" on screen */
  const evs = [{ at: t.createdAt, kind: 'open', by: null, text: 'Case logged. Received by ' + chan(t.channel) + '.' }]
    .concat(t.notes);
  return '<div class="tl">' + evs.map(e =>
    '<div class="ev ' + esc(e.kind) + '"><div class="when">' + esc(fmtDate(e.at)) + '</div>' +
    (e.by ? '<div class="who2">' + esc(staff(e.by) ? staff(e.by).name : '') + ' · ' +
      (e.kind === 'internal' ? 'internal note' :
       e.kind === 'resolution' ? 'resolution' :
       e.kind === 'routing' ? 'moved to another section' : 'reply to passenger') + '</div>' : '') +
    '<div class="txt">' + esc(e.text) + '</div></div>').join('') + '</div>';
}
function workForm(t) {
  return '<div class="frm">' +
    '<label><span class="lbl">Note or reply</span>' +
    '<textarea id="nt" rows="3" placeholder="What did you do, or what are you telling the passenger?"></textarea></label>' +
    '<div class="actions">' +
      '<button class="btn" id="addInternal">Add internal note</button>' +
      '<button class="btn primary" id="addReply">Record a reply to the passenger</button>' +
    '</div></div>';
}
function actions(t) {
  const opts = AGENTS.map(a => '<option value="' + a.id + '"' +
      (t.assignee === a.id ? ' selected' : '') +
      (a.available ? '' : ' disabled') + '>' + esc(a.name) +
      (a.available ? '' : ' — ' + a.why) + '</option>').join('');
  let h = '<div class="frm">';
  if (isOpen(t)) {
    h += '<label><span class="lbl">Owner</span><select id="asg"><option value="">— nobody —</option>' + opts + '</select></label>' +
         '<label><span class="lbl">Status</span><select id="stt">' +
         OPEN_STATUSES.map(s => '<option' + (t.status === s ? ' selected' : '') + '>' + s + '</option>').join('') +
         '</select></label>' +
         '<button class="btn good" id="resolve">Settle this case</button>';
    if (!t.assignee) h += '<button class="btn" id="takeit">Take it myself</button>';
  } else {
    h += '<div class="hint">Settled ' + esc(fmtDate(t.resolvedAt || t.createdAt)) + '.</div>' +
         '<button class="btn" id="reopen">Reopen</button>';
  }
  return h + '</div>';
}
function wireTicket(t) {
  const add = kind => {
    const el = $('#nt'); const v = el.value.trim();
    if (!v) { el.focus(); return; }
    t.notes.push({ at: Date.now(), by: state.me, kind, text: v });
    if (kind === 'reply' && !t.firstResponseAt) t.firstResponseAt = Date.now();
    if (t.status === 'New') { t.status = 'Assigned'; if (!t.assignee) t.assignee = state.me; }
    save(); toast(kind === 'reply' ? 'Reply recorded. The reply clock has stopped.' : 'Internal note added.');
    renderTicket(t.id);
  };
  if ($('#addInternal')) $('#addInternal').onclick = () => add('internal');
  if ($('#addReply'))    $('#addReply').onclick    = () => add('reply');
  if ($('#asg')) $('#asg').onchange = e => {
    t.assignee = e.target.value || null;
    if (t.assignee && t.status === 'New') t.status = 'Assigned';
    save(); toast('Owner changed.'); renderTicket(t.id);
  };
  if ($('#stt')) $('#stt').onchange = e => { t.status = e.target.value; save(); renderTicket(t.id); };
  if ($('#secsel')) $('#secsel').onchange = e => {
    const to = e.target.value, from = secOf(t).id;
    if (to === from) return;
    const why = prompt('Why is this case being moved from ' + sec(from).name + ' to ' + sec(to).name + '?\n\n' +
      'This is kept on the case and both section heads are told.');
    if (why == null || !why.trim()) { renderTicket(t.id); return; }   /* cancelled: put the dropdown back */
    const at = Date.now();
    t.redirected = { at, from, to, by: state.me, why: why.trim() };
    t.section = to;
    t.routedBy = 'hand';
    t.notes.push({ at, by: state.me, kind: 'routing', text: why.trim() });
    t.notes.sort((a, b) => a.at - b.at);
    const r = notify('R7', t, { from, to });
    save();
    const told = recipients(r, { section: to, from, assignee: t.assignee }).map(id => (staff(id) || {}).name).filter(Boolean);
    toast('Moved to ' + sec(to).name + '. ' + (told.length ? told.join(' and ') + ' told.' : ''));
    renderTicket(t.id);
  };
  if ($('#takeit')) $('#takeit').onclick = () => {
    t.assignee = state.me; t.status = 'Assigned'; save(); toast('You own this case now.'); renderTicket(t.id);
  };
  if ($('#resolve')) $('#resolve').onclick = () => {
    const txt = prompt('How was this settled?\n\nThis is what the passenger will be told.', RESOLUTIONS[t.category] || '');
    if (txt == null) return;
    t.status = 'Resolved'; t.resolvedAt = Date.now(); t.resolution = txt;
    if (!t.firstResponseAt) t.firstResponseAt = Date.now();
    if (!t.assignee) t.assignee = state.me;
    t.notes.push({ at: Date.now(), by: state.me, kind: 'resolution', text: txt });
    notify('R8', t);
    save(); toast('Case settled. Customer Care and ' + sec(secOf(t).id).name + ' copied in.'); renderTicket(t.id);
  };
  if ($('#reopen')) $('#reopen').onclick = () => {
    t.status = 'In progress'; t.resolvedAt = null; save(); renderTicket(t.id);
  };
}

/* ---------------- new case ---------------- */
function renderNew() {
  setHead('Log a case', 'What the agent fills in while the passenger is still on the telephone');
  $('#view').innerHTML =
    '<div class="grid c23"><div class="card"><div class="body"><div class="frm">' +
      '<div class="two">' +
        '<label><span class="lbl">Passenger name</span><input id="n_name" placeholder="As given"></label>' +
        '<label><span class="lbl">Telephone</span><input id="n_phone" placeholder="2 xx xx xx"></label>' +
      '</div>' +
      '<div class="two">' +
        '<label><span class="lbl">How did it reach us</span><select id="n_chan">' +
          CHANNELS.map(c => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('') + '</select></label>' +
        '<label><span class="lbl">Subject</span><select id="n_cat">' +
          CATEGORIES.map(c => '<option value="' + c.id + '">' + esc(c.name) + ' (' + (c.pri === 'NA' ? 'no target' : c.pri) + ')</option>').join('') +
        '</select></label>' +
      '</div>' +
      /* the thing SPTC asked for: choosing the subject sends the case
         somewhere, and the agent can see where before saving          */
      '<div class="routebox" id="n_routebox"></div>' +
      '<div class="two">' +
        '<label><span class="lbl">Route</span><select id="n_route">' +
          ROUTES.map(r => '<option value="' + r.no + '">' + r.no + ' — ' + esc(r.name) + '</option>').join('') + '</select></label>' +
        '<label><span class="lbl">Vehicle, if known</span><input id="n_fleet" placeholder="BUS-000"></label>' +
      '</div>' +
      '<label><span class="lbl">What happened, in the passenger\'s words</span>' +
        '<textarea id="n_detail" rows="6" placeholder="Write it as they say it. Do not summarise away the detail — it is what identifies the crew and the working."></textarea></label>' +
      '<div class="actions"><button class="btn primary" id="n_save">Log the case</button>' +
      '<button class="btn" id="n_demo">Fill it in for me</button></div>' +
      '<div class="hint">The reply and resolution clocks start the moment this is saved, and are set by the subject chosen above.</div>' +
    '</div></div></div>' +
    card('How the clock is set', 'service targets',
      CATEGORIES.filter(c => c.pri !== 'NA').reduce((acc, c) => {
        const p = PRIORITIES[c.pri];
        return acc + '<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)">' +
          '<span style="font-size:12.5px">' + esc(c.name) + '</span>' +
          '<span class="mono" style="font-size:11.5px;color:var(--dim);white-space:nowrap">' +
          p.respondH + 'h / ' + p.resolveH + 'h</span></div>';
      }, '') + '<div class="hint" style="margin-top:12px">Reply target / resolution target. Safety subjects also alert a supervisor immediately.</div>') +
    '</div>';

  /* nRoute holds what the intake screen has decided so far. It starts
     as whatever the subject implies and only becomes 'hand' if the
     agent overrides it, because that distinction is worth keeping. */
  let nRoute = { section: cat($('#n_cat').value).section, by: 'rule' };

  function paintRouteBox() {
    const c = cat($('#n_cat').value);
    const s = sec(nRoute.section), h = staff(s.head);
    const fired = NOTIFY_RULES.filter(r => r.on === 'logged' && (!r.only || r.only === c.pri));
    const told = [];
    fired.forEach(r => recipients(r, { section: s.id, assignee: null }).forEach(id => {
      if (told.indexOf(id) === -1) told.push(id);
    }));

    $('#n_routebox').innerHTML =
      '<div class="rb-top"><span class="lbl">This will go to</span>' +
        (nRoute.by === 'rule'
          ? '<span class="lbl auto">chosen by the subject</span>'
          : '<span class="lbl auto hand">overridden by hand</span>') + '</div>' +
      '<div class="rb-mid">' +
        '<span class="secpill sc-' + esc(s.id) + '">' + esc(s.short) + '</span>' +
        '<select id="n_sec">' + SECTIONS.map(x => '<option value="' + x.id + '"' +
            (x.id === s.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>' +
      '</div>' +
      (h ? '<div class="hint">Lands with ' + esc(h.name) + ', ' + esc(h.title) + '.</div>' : '') +
      '<div class="rb-told"><span class="lbl">Told straight away</span>' +
        told.map(id => {
          const u = staff(id);
          return u ? '<span class="who-chip"><span class="av" style="width:18px;height:18px;font-size:8px">' +
            u.initials + '</span>' + esc(u.name) + '</span>' : '';
        }).join('') +
      '</div>' +
      (c.pri === 'P1' ? '<div class="hint p1note">A safety report. The Safety Officer and the Director of ' +
        'Operations are sent an SMS as well, whatever the hour.</div>' : '');

    $('#n_sec').onchange = e => {
      nRoute.section = e.target.value;
      nRoute.by = (e.target.value === cat($('#n_cat').value).section) ? 'rule' : 'hand';
      paintRouteBox();
    };
  }

  /* changing the subject re-routes, and silently drops a manual
     override - a fresh subject means a fresh decision */
  $('#n_cat').onchange = () => {
    nRoute = { section: cat($('#n_cat').value).section, by: 'rule' };
    paintRouteBox();
  };
  paintRouteBox();

  $('#n_demo').onclick = () => {
    const p = PASSENGERS[Math.floor(Math.random() * PASSENGERS.length)];
    $('#n_name').value = p[0]; $('#n_phone').value = p[1];
    $('#n_cat').value = 'nostop'; $('#n_route').value = '26';
    $('#n_fleet').value = 'BUS-' + (100 + Math.floor(Math.random() * 78));
    $('#n_detail').value = NARRATIVES.nostop[0];
    nRoute = { section: cat('nostop').section, by: 'rule' };
    paintRouteBox();
  };
  $('#n_save').onclick = () => {
    const name = $('#n_name').value.trim(), detail = $('#n_detail').value.trim();
    if (!name || !detail) { toast('A name and a description are needed.', true); return; }
    const cid = $('#n_cat').value, c = cat(cid);
    state.seq = (state.seq || 0) + 1;
    const t = {
      id: 'N' + state.seq + '-' + Date.now(),
      ref: 'SPTC-' + new Date().getFullYear() + '-' + String(900 + state.seq).slice(-3),
      createdAt: Date.now(), channel: $('#n_chan').value, category: cid, priority: c.pri,
      routeNo: $('#n_route').value, fleetNo: $('#n_fleet').value.trim() || '—',
      incidentAt: Date.now(), passenger: name, phone: $('#n_phone').value.trim(),
      summary: c.name + ' - route ' + $('#n_route').value, detail,
      section: nRoute.section, routedBy: nRoute.by,
      status: 'New', assignee: null, firstResponseAt: null, resolvedAt: null, resolution: null, notes: []
    };
    if (nRoute.by === 'hand') {
      t.notes.push({ at: Date.now(), by: state.me, kind: 'routing',
        text: 'Sent to ' + sec(nRoute.section).name + ' at intake rather than ' +
              sec(c.section).name + ', which is where the subject would normally send it.' });
    }
    state.tickets.push(t);

    /* fire the rules that apply to a case being logged, and tell the
       agent what actually went out - a notification nobody can see is
       indistinguishable from one that never happened */
    const told = [];
    NOTIFY_RULES.filter(r => r.on === 'logged').forEach(r => {
      const fired = notify(r.id, t);
      if (fired) recipients(fired, { section: t.section, assignee: null })
        .forEach(id => { if (told.indexOf(id) === -1) told.push(id); });
    });
    save();

    toast('Logged as ' + t.ref + ', sent to ' + sec(t.section).name + '. ' +
          told.length + ' ' + (told.length === 1 ? 'person' : 'people') + ' told. The clock is running.');
    location.hash = '#/t/' + t.id;
  };
}

/* ---------------- routes view ---------------- */
function renderRoutes() {
  setHead('By route', 'Where the pressure is on the network');
  const T = state.tickets;
  const rows = ROUTES.map(r => {
    const all = T.filter(t => t.routeNo === r.no);
    const open = all.filter(isOpen);
    const late = open.filter(t => sla(t).breached);
    const safety = all.filter(t => t.priority === 'P1');
    return { r, all: all.length, open: open.length, late: late.length, safety: safety.length };
  }).sort((a, b) => b.all - a.all);
  const max = Math.max.apply(null, rows.map(x => x.all).concat([1]));

  $('#view').innerHTML = '<div class="card"><table class="tbl"><thead><tr>' +
    '<th style="width:74px">Route</th><th>Corridor</th><th style="width:190px">21 day volume</th>' +
    '<th style="width:70px">Open</th><th style="width:76px">Late</th><th style="width:82px">Safety</th></tr></thead><tbody>' +
    rows.map((x, i) => '<tr class="rowin" style="animation-delay:' + (i * 22) + 'ms" onclick="qf.route=\'' + x.r.no +
      '\';qf.status=\'\';qf.touched=1;location.hash=\'#/queue\'">' +
      '<td data-label="Route"><span class="route">' + esc(x.r.no) + '</span></td>' +
      '<td data-label="Corridor" style="font-size:12.5px">' + esc(x.r.name) + '</td>' +
      '<td data-label="21 day volume"><span class="tr" style="display:block;height:14px;background:var(--panel-3);border-radius:2px;overflow:hidden">' +
        '<i style="display:block;height:100%;width:' + (x.all / max * 100) + '%;background:linear-gradient(90deg,var(--ocean),var(--amber))"></i></span>' +
        '<div class="meta">' + x.all + ' cases</div></td>' +
      '<td data-label="Open" class="mono">' + x.open + '</td>' +
      '<td data-label="Late" class="mono" style="color:' + (x.late ? 'var(--coral)' : 'var(--faint)') + '">' + x.late + '</td>' +
      '<td data-label="Safety" class="mono" style="color:' + (x.safety ? 'var(--amber)' : 'var(--faint)') + '">' + x.safety + '</td></tr>').join('') +
    '</tbody></table></div>';
}

/* ---------------- sections ----------------
   The board a duty manager stands in front of: who is holding what,
   and which section is quietly running late.
   ------------------------------------------------------------------ */
function renderSections() {
  setHead('By section', 'Where the work has been sent, and whether it is moving');
  const T = state.tickets;
  const rows = SECTIONS.map(s => {
    const all = T.filter(t => secOf(t).id === s.id);
    const open = all.filter(isOpen);
    const late = open.filter(t => sla(t).breached);
    const unanswered = open.filter(t => !t.firstResponseAt);
    return { s, all: all.length, open: open.length, late: late.length, un: unanswered.length };
  }).sort((a, b) => b.open - a.open || b.all - a.all);
  const max = Math.max.apply(null, rows.map(x => x.all).concat([1]));

  $('#view').innerHTML =
    '<div class="hint" style="margin-bottom:14px">Choosing the subject of a complaint is what sends it to a section. ' +
    'Nobody has to know who deals with what — and the rules that decide it are on the ' +
    '<a href="#/rules">routing and notification</a> screen, in plain words, to be argued with.</div>' +
    '<div class="grid k2 secgrid">' + rows.map((x, i) => {
      const h = staff(x.s.head);
      return '<div class="card sec-card rowin" style="animation-delay:' + (i * 40) + 'ms" ' +
        'onclick="qf.section=\'' + x.s.id + '\';qf.status=\'open\';qf.touched=1;location.hash=\'#/queue\'">' +
        '<div class="body">' +
          '<div class="sec-top"><div><h3 style="margin:0;font-size:14.5px">' + esc(x.s.name) + '</h3>' +
            '<div class="hint" style="margin-top:4px">' + esc(x.s.what) + '</div></div>' +
            '<span class="secpill sc-' + x.s.id + '">' + esc(x.s.short) + '</span></div>' +
          '<div class="sec-nums">' +
            '<div><div class="lbl">Open</div><div class="mono big2">' + x.open + '</div></div>' +
            '<div><div class="lbl">Unanswered</div><div class="mono big2" style="color:' + (x.un ? 'var(--amber)' : 'var(--faint)') + '">' + x.un + '</div></div>' +
            '<div><div class="lbl">Past target</div><div class="mono big2" style="color:' + (x.late ? 'var(--coral)' : 'var(--faint)') + '">' + x.late + '</div></div>' +
            '<div><div class="lbl">21 days</div><div class="mono big2" style="color:var(--dim)">' + x.all + '</div></div>' +
          '</div>' +
          '<div class="tr" style="margin:10px 0 12px"><i style="width:' + (x.all / max * 100) + '%"></i></div>' +
          '<div class="sec-head">' + (h ? '<span class="av" style="width:24px;height:24px;font-size:9.5px">' + h.initials + '</span>' +
            '<div><div style="font-size:12.5px">' + esc(h.name) + '</div><div class="hint">' + esc(h.title) + ' · told when a case arrives</div></div>' : '') +
          '</div>' +
        '</div></div>';
    }).join('') + '</div>';
}

/* ---------------- notification log ----------------
   "Notification is sent to a few other managers, to keep track" was
   the request. This is that, made auditable: every line says which
   rule fired, on which case, and who it reached.
   ------------------------------------------------------------------ */
let af = { rule: '', section: '', unread: false };

function renderAlerts() {
  setHead('Notifications', 'Everything the routing rules have told somebody about');
  const opts = (arr, selv, vk, lk) => arr.map(o =>
    '<option value="' + esc(o[vk]) + '"' + (String(selv) === String(o[vk]) ? ' selected' : '') + '>' + esc(o[lk]) + '</option>').join('');

  $('#view').innerHTML =
    '<div class="filters">' +
      '<select id="ar"><option value="">Every rule</option>' +
        opts(NOTIFY_RULES.map(r => ({ v: r.id, l: r.id + ' — ' + r.label })), af.rule, 'v', 'l') + '</select>' +
      '<select id="as"><option value="">Every section</option>' +
        opts(SECTIONS.map(s => ({ v: s.id, l: s.name })), af.section, 'v', 'l') + '</select>' +
      '<button class="chipbtn' + (af.unread ? ' on' : '') + '" id="aunread">Unread only</button>' +
      '<button class="chipbtn" id="aread">Mark all as read</button>' +
      '<span class="spacer"></span>' +
      '<a class="btn" href="#/rules" style="text-decoration:none">See the rules</a>' +
    '</div>' +
    '<div class="card" id="awrap"></div>';

  $('#ar').onchange = e => { af.rule = e.target.value; paintAlerts(); };
  $('#as').onchange = e => { af.section = e.target.value; paintAlerts(); };
  $('#aunread').onclick = () => { af.unread = !af.unread; renderAlerts(); };
  $('#aread').onclick = () => {
    state.alerts.forEach(a => a.read = true); save(); paintChrome(); renderAlerts();
    toast('All notifications marked as read.');
  };
  paintAlerts();
}
function paintAlerts() {
  const list = state.alerts.filter(a =>
    (!af.rule || a.rule === af.rule) &&
    (!af.section || a.section === af.section) &&
    (!af.unread || !a.read)
  );
  const shown = list.slice(0, 60);
  if (!shown.length) { $('#awrap').innerHTML = '<div class="empty">Nothing matches those filters.</div>'; return; }

  $('#awrap').innerHTML = '<div class="alist">' + shown.map((a, i) => {
    const r = rule(a.rule);
    const t = state.tickets.find(x => x.id === a.ticketId);
    const ctx = { section: a.section, from: a.extra ? a.extra.from : null, assignee: t ? t.assignee : null };
    const to = recipients(r, ctx).map(id => staff(id)).filter(Boolean);
    const s = sec(a.section);
    return '<div class="al' + (a.read ? '' : ' unread') + ' rowin" style="animation-delay:' + Math.min(i * 14, 260) + 'ms"' +
      (t ? ' onclick="location.hash=\'#/t/' + t.id + '\'"' : '') + '>' +
      '<div class="al-l"><span class="rulechip">' + esc(r.id) + '</span></div>' +
      '<div class="al-m">' +
        '<div class="al-t">' + esc(r.label) +
          (a.priority === 'P1' ? ' ' + priPill('P1') : '') +
          ' <span class="secpill sc-' + esc(s.id) + '">' + esc(s.short) + '</span></div>' +
        '<div class="meta">' + esc(a.ref) + (t ? ' · ' + esc(cat(t.category).name) + ' · route ' + esc(t.routeNo) : '') +
          (a.extra && a.extra.from ? ' · moved from ' + esc(sec(a.extra.from).name) : '') + '</div>' +
        '<div class="al-to">' + (to.length
            ? to.map(u => '<span class="who-chip"><span class="av" style="width:18px;height:18px;font-size:8px">' + u.initials + '</span>' + esc(u.name) + '</span>').join('')
            : '<span class="lbl">nobody — no recipient exists on this case</span>') +
          '<span class="lbl" style="margin-left:4px">· ' + esc(r.how) + '</span></div>' +
      '</div>' +
      '<div class="al-r mono">' + esc(ago(a.at)) + '</div></div>';
  }).join('') + '</div>' +
  (list.length > shown.length ? '<div class="hint" style="padding:12px 16px;border-top:1px solid var(--line)">Showing the most recent ' +
    shown.length + ' of ' + list.length + '.</div>' : '');
}

/* ---------------- the rules themselves ----------------
   The screen to put on the wall in the next meeting. Everything the
   system decides on its own is written here as a sentence, so it can
   be corrected by somebody who has never seen a database.
   ------------------------------------------------------------------ */
function renderRules() {
  setHead('Routing and notification rules', 'What the system decides on its own, in plain words');

  const routeRows = CATEGORIES.map(c => {
    const s = sec(c.section), p = PRIORITIES[c.pri], h = staff(s.head);
    const n = state.tickets.filter(t => t.category === c.id).length;
    return '<tr>' +
      '<td data-label="Subject chosen"><div class="sum">' + esc(c.name) + '</div>' +
        '<div class="meta">' + n + ' in the last 21 days</div></td>' +
      '<td data-label="Goes to"><span class="secpill sc-' + esc(s.id) + '">' + esc(s.short) + '</span> ' +
        '<span style="font-size:12.5px">' + esc(s.name) + '</span></td>' +
      '<td data-label="Landing with">' + (h ? avatar(h.id) : '<span class="lbl">—</span>') + '</td>' +
      '<td data-label="Priority">' + priPill(c.pri) + '</td>' +
      '<td data-label="Reply / settle" class="mono" style="font-size:11.5px;white-space:nowrap">' +
        (p.respondH == null ? 'no clock' : p.respondH + 'h / ' + p.resolveH + 'h') + '</td></tr>';
  }).join('');

  $('#view').innerHTML =
    '<div class="banner"><b>FOR MARKING UP</b><div>These two tables are the workflow. Nothing here is fixed — ' +
      'they are a first proposal written from the way most operators work, and the point of putting them on a ' +
      'screen is so SPTC can cross bits out. Every line lives in one file and takes minutes to change.</div></div>' +

    card('Where a complaint goes', 'the subject decides',
      /* the section names run long - "Operations and Scheduling" wrapped
         under its own pill at 230px and made every Ops row two lines */
      '<table class="tbl"><thead><tr><th>Subject chosen at intake</th><th style="width:272px">Goes straight to</th>' +
      '<th style="width:186px">Landing with</th><th style="width:52px">Pri</th><th style="width:114px">Reply / settle</th>' +
      '</tr></thead><tbody>' + routeRows + '</tbody></table>', true) +

    '<div style="height:14px"></div>' +

    card('Who is told, and when', NOTIFY_RULES.length + ' rules',
      '<div class="rules">' + NOTIFY_RULES.map(r => {
        const fired = state.alerts.filter(a => a.rule === r.id).length;
        return '<div class="rule">' +
          '<div class="rule-h"><span class="rulechip">' + esc(r.id) + '</span>' +
            '<b>' + esc(r.label) + '</b>' +
            '<span class="lbl">' + esc(ON_LABEL[r.on] || r.on) + (r.only ? ', ' + r.only + ' only' : '') + '</span>' +
            '<span class="spacer"></span>' +
            '<span class="lbl mono">' + fired + ' sent</span></div>' +
          '<div class="rule-b">' + esc(r.what) + '</div>' +
          '<div class="rule-w">' + (r.who || []).map(w =>
            '<span class="who-chip">' + esc(WHO_LABEL[w] || w) + '</span>').join('') +
            '<span class="lbl" style="margin-left:2px">· ' + esc(r.how) + '</span></div>' +
        '</div>';
      }).join('') + '</div>' +
      '<div class="hint" style="margin-top:14px">Recipients are written as jobs rather than names, so a rule keeps ' +
      'working when somebody leaves or is promoted. The person it resolves to today is shown against each ' +
      'notification in the <a href="#/alerts">log</a>.</div>') +

    '<div style="height:14px"></div>' +

    card('What is not decided automatically', 'deliberately',
      '<div class="notrules">' +
      ['A case is never closed by the system. Somebody has to write what was done and put their name to it.',
       'A case can always be moved by hand to another section, and the reason is required, kept and shown on the case.',
       'A safety report is never routed anywhere but Safety, and never quietly downgraded.',
       'Nobody on leave is given new work, however the rules would otherwise fall.',
       'Customer Care keeps the passenger throughout. A section doing the work does not take the passenger with it.'
      ].map(x => '<div class="nr">' + esc(x) + '</div>').join('') + '</div>');
}
const ON_LABEL = {
  'logged': 'when a case is logged',
  'due-soon': 'when the reply time is three quarters gone',
  'breached': 'when a target is missed',
  'redirected': 'when a case is moved between sections',
  'resolved': 'when a case is settled'
};

/* ---------------- chrome ---------------- */
function toast(msg, bad) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  if (bad) el.style.borderLeftColor = 'var(--coral)';
  document.body.appendChild(el);
  setTimeout(() => { el.style.transition = '.3s'; el.style.opacity = 0; setTimeout(() => el.remove(), 320); }, 2600);
}
function paintChrome() {
  const u = me();
  $('#whoName').textContent = u.name;
  $('#whoTitle').textContent = u.title;
  $('#whoAv').textContent = u.initials;
  document.querySelectorAll('#roleSeg button').forEach(b =>
    b.classList.toggle('on', b.dataset.role === (u.role === 'agent' ? 'agent' : 'sup')));
  const open = state.tickets.filter(isOpen);
  $('#ctQueue').textContent = open.length;
  $('#ctNew').textContent = state.tickets.filter(t => t.status === 'New').length;
  const un = unreadAlerts();
  const badge = $('#ctAlerts');
  if (badge) { badge.textContent = un; badge.classList.toggle('hot', un > 0); }
}
function tick() {
  $('#clock').textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function boot() {
  state = load();
  /* A stored session from a build that had no notifications would
     leave every rule with nowhere to write. Rebuild rather than
     throw away the tickets somebody may have logged. */
  if (!Array.isArray(state.alerts)) state.alerts = buildAlerts(state.tickets);
  document.documentElement.setAttribute('data-theme', state.theme || 'dark');

  document.querySelectorAll('#roleSeg button').forEach(b => b.onclick = () => {
    state.me = b.dataset.role === 'agent' ? 'u1' : 'u6';
    qf.mine = false; qf.touched = 0;
    save(); paintChrome(); router();
  });
  $('#themeBtn').onclick = () => {
    state.theme = (state.theme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    save(); router();
  };
  $('#resetBtn').onclick = reset;

  window.addEventListener('hashchange', () => { paintChrome(); router(); });
  paintChrome(); router();
  tick(); setInterval(tick, 1000);

  /* keep the clocks honest without redrawing while somebody is typing */
  setInterval(() => {
    const v = (location.hash || '').split('/')[1];
    if (v === 'queue' && !document.activeElement.matches('input,select,textarea')) { paintQueue(); paintChrome(); }
    else if (!v || v === 'dashboard') { renderDashboard(); paintChrome(); }
  }, 30000);
}
document.addEventListener('DOMContentLoaded', boot);
