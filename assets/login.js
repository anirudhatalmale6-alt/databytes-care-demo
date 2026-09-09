/* ------------------------------------------------------------------
   The way in.

   Built to the shape of the HCIS sign-in page, because these two are
   sold as one platform and the first screen is where that either reads
   true or does not: photograph and dark wash down the left, the crest,
   the name of the organisation, and a plain white card on the right.

   WHAT THIS IS, said plainly, because a login screen is the one control
   people assume is real:

     This demonstration checks the password against a list written into
     this file, in the browser, with nothing behind it. It shows what
     signing in LOOKS like and it carries the demonstration accounts so
     anybody can get in without being handed a password in advance. It
     is not authentication and it protects nothing. A real deployment
     authenticates on the server - which is exactly what the HCIS build
     does, and the reason it can be pointed at here rather than
     described.

   Anybody reading this before a meeting: say that sentence out loud
   rather than letting the screen imply otherwise.

   The background photograph is `assets/login-bg.jpg`. If that file is
   absent - and today it is, the client is sending one - the panel falls
   back to a wash in SPTC's own blue and nothing looks broken. Dropping
   the file in is the whole change; no code moves.
   ------------------------------------------------------------------ */

const LOGIN_KEY = 'sptc_demo_session';

/* The demonstration accounts.

   Invented people, like everybody else in this demonstration. The
   spread is chosen to show the one thing worth showing - that the same
   system looks different depending on whose job you are doing - so
   there is an agent who sees their own work, a supervisor who sees the
   section's, an HR officer and the chief executive.

   `to` is where each lands, so signing in as HR does not open the
   passenger care desk and leave somebody hunting for the module
   switch. */
const LOGIN_PASSWORD = 'sptc2026';

const LOGIN_ACCOUNTS = [
  { user: 'a.servina',  staff: 'u1',  to: '#/dashboard', note: 'sees the cases assigned to them' },
  { user: 't.bristol',  staff: 'u6',  to: '#/dashboard', note: 'sees the whole section, and the workload' },
  { user: 's.dugasse',  staff: 'u12', to: '#/hr',        note: 'the establishment, leave and discipline' },
  { user: 'f.larue',    staff: 'u13', to: '#/hr',        note: 'day to day HR, same screens, fewer powers' },
  { user: 'm.payet',    staff: 'u11', to: '#/dashboard', note: 'the view from the top of the corporation' },
];

function loginStaff(id) {
  return (typeof STAFF !== 'undefined' && STAFF.find(s => s.id === id)) || null;
}

function loginSession() {
  try {
    const raw = sessionStorage.getItem(LOGIN_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.staff && loginStaff(s.staff) ? s : null;
  } catch (e) { return null; }
}

function loginSignOut() {
  try { sessionStorage.removeItem(LOGIN_KEY); } catch (e) {}
  location.hash = '#/dashboard';
  location.reload();
}

/* Held for the length of the browser session and no longer. That is the
   right lifetime for a demonstration: the sign-in screen is part of what
   is being shown, so it must appear again on a fresh visit rather than
   being skipped for the one person who logged in last week. There is a
   Sign out in the rail for showing it on demand. */
function loginRemember(acct) {
  try {
    sessionStorage.setItem(LOGIN_KEY, JSON.stringify({ staff: acct.staff, at: Date.now() }));
  } catch (e) {}
}

function loginEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Every class in here is prefixed si-. The application already owns .who,
   .av, .tt and .nm for the person in the top bar, and .who is display:flex
   there - reusing the names laid every account row out sideways. The
   sign-in screen shares a stylesheet with the application, so it does not
   get to have short names. */
function loginRender(onDone) {
  const wrap = document.createElement('div');
  wrap.className = 'signin';
  wrap.id = 'signin';

  const rows = LOGIN_ACCOUNTS.map(a => {
    const s = loginStaff(a.staff);
    if (!s) return '';
    return '<button type="button" class="acct" data-user="' + loginEsc(a.user) + '">' +
      '<span class="si-av">' + loginEsc(s.initials) + '</span>' +
      '<span class="si-who">' +
        '<b>' + loginEsc(s.name) + '</b>' +
        '<span class="si-tt">' + loginEsc(s.title) + '</span>' +
        '<span class="si-nt">' + loginEsc(a.note) + '</span>' +
      '</span>' +
      '<span class="si-un mono">' + loginEsc(a.user) + '</span>' +
    '</button>';
  }).join('');

  wrap.innerHTML =
    '<div class="si-art">' +
      '<img id="si_bg" src="assets/login-bg.jpg?v=16" alt="">' +
      '<div class="si-wash"></div>' +
      '<div class="si-art-in">' +
        '<span class="si-crest"><img src="assets/sptc-logo.png?v=16" alt="SPTC" width="150" height="150"></span>' +
        '<h1>Seychelles Public Transport Corporation</h1>' +
        '<span class="si-rule"></span>' +
        '<p class="si-sub">Passenger Care and Human Resources</p>' +
        '<p class="si-gov">One system, one sign in, one look</p>' +
        '<div class="si-tiles">' +
          '<div><b>Passenger Care</b><span>Cases from the public, routed and answered</span></div>' +
          '<div><b>Human Resources</b><span>The establishment, leave, discipline</span></div>' +
          '<div><b>One establishment</b><span>The same people, whichever module you open</span></div>' +
        '</div>' +
        '<p class="si-foot">Prepared by DataBytes Consulting &middot; working demonstration</p>' +
      '</div>' +
    '</div>' +

    '<div class="si-form">' +
      '<div class="si-card">' +
        '<div class="si-mob">' +
          '<span class="si-crest sm"><img src="assets/sptc-logo.png?v=16" alt="SPTC" width="150" height="150"></span>' +
          '<b>SPTC</b><span>Public Transport</span>' +
        '</div>' +

        '<h2>Sign in</h2>' +
        '<p class="si-lead">Enter your credentials to open the system.</p>' +

        '<div class="si-err" id="si_err" hidden></div>' +

        '<form id="si_form" autocomplete="off">' +
          '<label><span>Username</span>' +
            '<input id="si_user" type="text" placeholder="a.servina" autocomplete="username" autocapitalize="none" spellcheck="false"></label>' +
          '<label><span>Password</span>' +
            '<span class="si-pw">' +
              '<input id="si_pass" type="password" placeholder="Enter your password" autocomplete="current-password">' +
              '<button type="button" id="si_eye" title="Show the password">show</button>' +
            '</span></label>' +
          '<button type="submit" class="si-go" id="si_go">Sign in</button>' +
        '</form>' +

        '<div class="si-demo">' +
          '<button type="button" class="si-toggle" id="si_toggle" aria-expanded="true">' +
            '<b>Demonstration accounts</b>' +
            '<span id="si_chev">hide</span>' +
          '</button>' +
          '<div id="si_list">' +
            '<p class="si-hint">Pick anybody to sign straight in. The password for every ' +
              'one of them is <span class="mono">' + loginEsc(LOGIN_PASSWORD) + '</span>.</p>' +
            rows +
            '<p class="si-warn">These people are invented, and so is the password. This ' +
              'screen checks it in the browser and nothing stands behind it &mdash; it shows ' +
              'what signing in looks like, it does not protect anything.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(wrap);

  /* No photograph yet: drop the element rather than leave a broken image,
     and the wash underneath carries the panel on its own. */
  const bg = wrap.querySelector('#si_bg');
  bg.onerror = () => { bg.remove(); wrap.classList.add('nobg'); };

  const err = wrap.querySelector('#si_err');
  const fail = msg => {
    err.textContent = msg;
    err.hidden = false;
    wrap.querySelector('.si-card').classList.remove('shake');
    void wrap.querySelector('.si-card').offsetWidth;
    wrap.querySelector('.si-card').classList.add('shake');
  };

  const enter = acct => {
    loginRemember(acct);
    if (acct.to) location.hash = acct.to;
    wrap.classList.add('gone');
    setTimeout(() => { wrap.remove(); onDone(); }, 220);
  };

  wrap.querySelector('#si_form').onsubmit = e => {
    e.preventDefault();
    const u = wrap.querySelector('#si_user').value.trim().toLowerCase();
    const p = wrap.querySelector('#si_pass').value;
    if (!u || !p) { fail('Enter a username and a password.'); return; }
    const acct = LOGIN_ACCOUNTS.find(a => a.user === u);
    /* One message for both halves being wrong. Telling somebody the
       username was right and only the password was not is a favour to
       whoever is guessing, and this screen is a demonstration of the
       real thing, so it should not teach the wrong habit. */
    if (!acct || p !== LOGIN_PASSWORD) {
      fail('That username and password do not match. The demonstration accounts are listed below.');
      return;
    }
    enter(acct);
  };

  wrap.querySelectorAll('.acct').forEach(b => {
    b.onclick = () => {
      const acct = LOGIN_ACCOUNTS.find(a => a.user === b.dataset.user);
      if (!acct) return;
      wrap.querySelector('#si_user').value = acct.user;
      wrap.querySelector('#si_pass').value = LOGIN_PASSWORD;
      enter(acct);
    };
  });

  const eye = wrap.querySelector('#si_eye');
  eye.onclick = () => {
    const f = wrap.querySelector('#si_pass');
    const shown = f.type === 'text';
    f.type = shown ? 'password' : 'text';
    eye.textContent = shown ? 'show' : 'hide';
    f.focus();
  };

  const list = wrap.querySelector('#si_list');
  const chev = wrap.querySelector('#si_chev');
  wrap.querySelector('#si_toggle').onclick = () => {
    const open = list.hasAttribute('hidden');
    if (open) { list.removeAttribute('hidden'); chev.textContent = 'hide'; }
    else { list.setAttribute('hidden', ''); chev.textContent = 'show'; }
    wrap.querySelector('#si_toggle').setAttribute('aria-expanded', String(open));
  };

  wrap.querySelector('#si_user').focus();
}

/* Called instead of boot(). Either there is a session, in which case the
   application starts exactly as it always did, or the sign-in screen is
   put up and boot() waits until somebody is through it. */
function loginGate(boot) {
  const s = loginSession();
  if (s) { boot(); return; }
  loginRender(boot);
}
