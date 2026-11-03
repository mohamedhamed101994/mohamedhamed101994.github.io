(function () {
  var root = document.documentElement;

  // Theme toggle (remembers the visitor's choice when storage is available)
  var themeBtn = document.querySelector('.theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      themeBtn.setAttribute('aria-label', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
  }

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var links = document.querySelector('.links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Project filter
  var filters = document.querySelectorAll('.filters button');
  var cards = document.querySelectorAll('.pc[data-tags]');
  filters.forEach(function (btn) {
    var f = btn.getAttribute('data-filter');
    var count = f === 'all' ? cards.length : Array.prototype.filter.call(cards, function (c) {
      return c.getAttribute('data-tags').split(' ').indexOf(f) > -1;
    }).length;
    var n = btn.querySelector('.n');
    if (n) n.textContent = count;
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var show = f === 'all' || c.getAttribute('data-tags').split(' ').indexOf(f) > -1;
        c.classList.toggle('hide', !show);
      });
    });
  });

  // Highlight the current section in the nav
  var navLinks = document.querySelectorAll('.links a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Visit notifications -> Mohamed's phone via ntfy (no cookies, no personal data: page, source, device type, time zone).
// The owner's own browser is excluded by opening the site once with ?me=1 (?me=0 undoes it).
(function () {
  var TOPIC = 'mh-portfolio-9emyr81vsz7m';
  var qs = new URLSearchParams(location.search);
  try {
    if (qs.get('me') === '1') localStorage.setItem('mh-owner', '1');
    if (qs.get('me') === '0') localStorage.removeItem('mh-owner');
    if (localStorage.getItem('mh-owner') === '1') return;
  } catch (e) {}
  if (/bot|crawl|spider|preview|headless|lighthouse/i.test(navigator.userAgent)) return;

  function send(title, message, tags, priority) {
    var body = JSON.stringify({ topic: TOPIC, title: title, message: message, tags: tags, priority: priority || 3 });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('https://ntfy.sh/', body)) return;
    } catch (e) {}
    try { fetch('https://ntfy.sh/', { method: 'POST', body: body, keepalive: true, mode: 'no-cors' }); } catch (e) {}
  }

  function source() {
    var src = qs.get('src');
    if (src) return src.toUpperCase() === 'QR' ? 'QR code' : src;
    if (!document.referrer) return 'Direct / unknown';
    try {
      var h = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (h === location.hostname) return null;
      if (/linkedin\.com|lnkd\.in/.test(h)) return 'LinkedIn';
      if (/naukrigulf/.test(h)) return 'NaukriGulf';
      if (/google\./.test(h)) return 'Google';
      if (/github\.com/.test(h)) return 'GitHub';
      return h;
    } catch (e) { return 'Unknown'; }
  }

  var device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var page = /\/projects\//.test(location.pathname) ? document.title.split(' — ')[0] : 'Home';

  // One notification per visit (browser session), not per page.
  var first = false;
  try { first = !sessionStorage.getItem('mh-visit'); sessionStorage.setItem('mh-visit', '1'); } catch (e) { first = true; }
  var src = source();
  if (first) {
    send('New portfolio visit', 'Page: ' + page + '\nFrom: ' + (src || 'Direct / unknown') + '\nDevice: ' + device + (tz ? '\nTime zone: ' + tz : ''), ['eyes']);
  }

  // High-intent clicks: CV download, WhatsApp, email, opening a dashboard / repo from a case study.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('download') || /\.pdf$/i.test(href) && /cv/i.test(href)) send('CV downloaded', 'From page: ' + page + '\nDevice: ' + device, ['page_facing_up'], 4);
    else if (a.classList.contains('wa')) send('WhatsApp button clicked', 'From page: ' + page + '\nDevice: ' + device, ['speech_balloon'], 5);
    else if (href.indexOf('mailto:') === 0) send('Email button clicked', 'From page: ' + page, ['email'], 4);
    else if (/app\.powerbi\.com/.test(href)) send('Dashboard opened', page, ['bar_chart']);
  });
})();
