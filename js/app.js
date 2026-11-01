/* three-tier-visual: builds the SVG diagram, step data and caption text. No dependencies. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var PERIOD = 8; // seconds per animation loop (the journey packet uses 12)

  /* ---------- Text content: edit freely ---------- */
  var STEPS = [
    { t: 'The big picture', sub: 'Three layers, one order',
      plain: "Ravi runs a busy restaurant. A guest never walks into the pantry. They sit in the dining hall, the order goes to the kitchen, and the kitchen fetches things from the pantry. Software is built the same way: three layers, each with one job.",
      tech: 'Three-tier architecture: presentation tier, application tier and data tier.',
      watch: 'Three coloured columns appear, with the guests (Users) on the far left.' },
    { t: 'The fenced plot', sub: 'VPC',
      plain: "Before opening the restaurant, Ravi buys a plot and builds a fence around it. Nobody outside the fence can walk in unless Ravi allows it.",
      tech: 'VPC (Virtual Private Cloud): your own private network inside AWS, with an address range such as 10.0.0.0/16.',
      watch: 'A dashed blue fence appears around all three tiers.' },
    { t: 'The main gate', sub: 'Internet Gateway',
      plain: "The fence needs one main gate. Guests from the street enter and leave through it. It is the only door between the plot and the outside world.",
      tech: 'Internet Gateway (IGW): connects the VPC to the internet. A route table sends outside-bound traffic (0.0.0.0/0) to it.',
      watch: 'The gate (IGW) appears on the fence, with The Internet outside it.' },
    { t: 'Open and private areas', sub: 'Public and private subnets',
      plain: "Ravi marks the dining hall as open to guests. The kitchen and the pantry are staff-only areas that guests cannot walk into.",
      tech: 'Public subnet: has a route to the Internet Gateway. Private subnet: no direct route from the internet.',
      watch: 'Tier 1 is tagged Public. Tier 2 and Tier 3 are tagged Private.' },
    { t: 'Tier 1: Dining hall', sub: 'Web servers = waiters',
      plain: "Waiters greet the guest, show the menu and take the order. They do not cook. They only deal with the guest.",
      tech: 'Presentation tier: web servers that show pages and the user interface in the browser.',
      watch: 'An envelope (the guest\'s request) travels through the gate to a web server.' },
    { t: 'The receptionist', sub: 'Load balancer',
      plain: "The receptionist seats each new guest at the least busy table, so no single waiter is overwhelmed.",
      tech: 'Load balancer: spreads incoming requests across several web servers.',
      watch: 'Envelopes take turns: one to Web server 1, the next to Web server 2.' },
    { t: 'Tier 2: Kitchen', sub: 'App servers = chefs',
      plain: "The waiter writes an order slip and hands it to a chef. The chefs follow the recipes (the business rules) to prepare the answer.",
      tech: 'Application tier: app servers run the business logic. Web servers call them with an API call.',
      watch: 'A memo (the order slip) crosses from each waiter to a chef.' },
    { t: 'Tier 3: Pantry', sub: 'Database = ledger',
      plain: "When a chef needs ingredients or past records, a runner goes to the pantry and the ledger book, then comes back with the answer.",
      tech: 'Data tier: the database stores and returns data that must be kept safely.',
      watch: 'A floppy disk (data request) goes to the database and a tick (the answer) comes back.' },
    { t: 'The quick shelf', sub: 'Cache',
      plain: "Chefs keep popular items on a shelf next to the stove. No trip to the pantry needed, so it is much faster.",
      tech: 'Cache: fast memory for frequently used data. Found = cache hit. Not found = cache miss, so ask the database.',
      watch: 'Lightning shows the fast hit. The other order takes the slower route to the database.' },
    { t: 'Staying open', sub: 'Replica + auto scaling',
      plain: "Ravi keeps a photocopy of the ledger in another building in case of fire. In rush hour he calls in extra waiters.",
      tech: 'Database replica in a second zone, and Auto Scaling that adds web servers when traffic grows.',
      watch: 'Repeat arrows copy data to the replica, and a third web server fades in.' },
    { t: 'Door guards', sub: 'Security',
      plain: "A guard at the main door checks who enters. Each room has its own guard: only waiters may enter the kitchen, only chefs may enter the pantry. A stranger cannot reach the ledger directly.",
      tech: 'Firewall plus security groups. The database accepts traffic only from the app tier, never from the internet.',
      watch: 'Allowed routes turn green. The devil tries to jump straight to the database and is blocked.' },
    { t: "One order's journey", sub: 'Start to finish',
      plain: "Follow one order: the guest asks, the receptionist seats them, the waiter takes the order, the chef checks the shelf, and the answer walks back to the guest.",
      tech: 'End-to-end request and response through load balancer, web tier, app tier and cache or database.',
      watch: 'One glowing envelope makes the full round trip. Numbers show the order.' }
  ];

  var LEGEND = [
    ['\u2709\uFE0F', 'Visitor request'], ['\uD83D\uDCDD', 'Order slip (API call)'],
    ['\uD83D\uDCBE', 'Data'], ['\u26A1', 'Cache hit (fast)'],
    ['\uD83D\uDD01', 'Database replication'], ['\u2705', 'Response going back'],
    ['\uD83D\uDE08', 'Intruder']
  ];

  /* ---------- Wires (path ids used by the packets) ---------- */
  var W = {
    dU: 'M95 310 C 150 310, 215 205, 270 205',
    ul: 'M95 310 L160 310',
    l1: 'M215 205 L270 205',
    l2: 'M215 340 L270 340',
    l3: 'M215 475 L270 475',
    a1: 'M440 205 L530 205',
    a2: 'M440 340 L530 340',
    w3: 'M440 475 C 485 475, 485 360, 530 360',
    hit: 'M700 195 L780 195',
    miss: 'M700 235 C 820 240, 860 330, 940 330',
    d2: 'M700 340 L940 350',
    rep: 'M1000 380 L1000 440',
    intr: 'M52 255 L52 10 L1000 10 L1000 242'
  };

  /* ---------- Small helpers ---------- */
  var svg = document.getElementById('diagram');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) { n.setAttribute(k, attrs[k]); }
    if (parent) { parent.appendChild(n); }
    return n;
  }
  function text(parent, x, y, str, cls, anchor) {
    var t = el('text', { x: x, y: y, 'class': cls, 'text-anchor': anchor || 'middle' }, parent);
    t.textContent = str;
    return t;
  }

  var defs = el('defs', {}, svg);
  var gWires = el('g', {}, svg);   // layer 1: wires
  var gBoxes = el('g', {}, svg);   // layer 2: boxes and labels
  var gPkts = el('g', {}, svg);    // layer 3: moving packets
  var pieces = [];

  Object.keys(W).forEach(function (id) { el('path', { id: 'w-' + id, d: W[id] }, defs); });

  var shift = 0; // original steps (2 and up) move later by this many steps
  function piece(layer, from, until, cls) {
    var g = el('g', { 'class': 'piece ' + (cls || '') }, layer);
    pieces.push({ g: g, from: from >= 2 ? from + shift : from, until: until ? until + shift : 99 });
    return g;
  }
  function wire(id, from, until, cls) {
    el('path', { d: W[id], 'class': 'wire ' + (cls || '') }, piece(gWires, from, until));
  }
  function band(from, cls, x, w, title, sub) {
    var g = piece(gBoxes, from, 0, cls);
    el('rect', { x: x, y: 40, width: w, height: 540, rx: 16, 'class': 'band' }, g);
    text(g, x + 16, 68, title, 'bandT', 'start');
    text(g, x + 16, 86, sub, 'bandS', 'start');
  }
  function box(from, cls, x, y, w, h, title, sub) {
    var g = piece(gBoxes, from, 0, cls);
    el('rect', { x: x, y: y, width: w, height: h, rx: 10, 'class': 'box' }, g);
    text(g, x + w / 2, y + h / 2 - 2, title, 'bt');
    text(g, x + w / 2, y + h / 2 + 16, sub, 'bs');
  }
  function label(from, until, x, y, str, cls, anchor) {
    text(piece(gBoxes, from, until, cls), x, y, str, 'lbl', anchor);
  }
  function tag(from, cx, y, str) {
    var g = piece(gBoxes, from);
    el('rect', { x: cx - 31, y: y, width: 62, height: 16, rx: 8, 'class': 'tagbox' }, g);
    text(g, cx, y + 12, str, 'tagtxt');
  }
  function badge(from, x, y, n) {
    var g = piece(gBoxes, from);
    el('circle', { cx: x, cy: y, r: 10, 'class': 'badge' }, g);
    text(g, x, y + 4, String(n), 'badgeT');
  }
  // A moving emoji that follows a wire. rev = travel backwards along the wire.
  function pkt(from, emoji, wid, start, dur, o) {
    o = o || {};
    var period = o.period || PERIOD, f = dur / period;
    var g = piece(gPkts, from, o.until);
    var p = el('g', { 'class': 'pkt', opacity: 0 }, g);
    if (o.halo) { el('circle', { r: 15, 'class': 'halo' }, p); }
    text(p, 0, 6, emoji, '');
    var m = el('animateMotion', {
      dur: period + 's', begin: start + 's', repeatCount: 'indefinite', calcMode: 'linear',
      keyPoints: o.rev ? '1;0;0' : '0;1;1', keyTimes: '0;' + f + ';1'
    }, p);
    el('mpath', { href: '#w-' + wid }, m);
    el('animate', {
      attributeName: 'opacity', dur: period + 's', begin: start + 's', repeatCount: 'indefinite',
      values: '1;1;0;0', keyTimes: '0;' + f + ';' + (f + 0.001) + ';1'
    }, p);
  }

  /* ---------- Build the diagram ---------- */
  // New steps 2-4: VPC, Internet Gateway, subnets (built first so the fence sits behind everything)
  var vpc = piece(gBoxes, 2, 0, 'blue');
  el('rect', { x: 124, y: 22, width: 966, height: 576, rx: 18, 'class': 'vpcbox' }, vpc);
  text(vpc, 136, 52, 'VPC', 'bandT', 'start');
  text(vpc, 136, 68, '10.0.0.0/16', 'bandS', 'start');
  text(vpc, 136, 84, "Ravi's fenced plot", 'bandS', 'start');

  var igw = piece(gBoxes, 3, 0, 'blue');
  el('rect', { x: 100, y: 250, width: 48, height: 120, rx: 8, 'class': 'box' }, igw);
  text(igw, 124, 276, 'IGW', 'bt');
  text(igw, 124, 292, 'gate', 'bs');
  label(3, 0, 124, 389, 'Internet', 'blue');
  label(3, 0, 124, 402, 'Gateway', 'blue');
  label(3, 0, 52, 385, 'The Internet', 'blue');

  function pill(from, x, y, str, cls) {
    var g = piece(gBoxes, from, 0, cls);
    el('rect', { x: x, y: y, width: 102, height: 18, rx: 9, 'class': 'pillbox' }, g);
    text(g, x + 51, y + 13, str, 'pilltxt');
  }
  pill(4, 256, 98, 'Public subnet', 'gold');
  pill(4, 516, 98, 'Private subnet', 'purple');
  pill(4, 776, 98, 'Private subnet', 'purple');

  shift = 3; // everything below was the original step N, now step N + 3

  // Step 1: the stage
  band(1, 'gold', 240, 230, 'Tier 1: Presentation', 'the dining hall');
  band(1, 'teal', 500, 230, 'Tier 2: Application', 'the kitchen');
  band(1, 'purple', 760, 320, 'Tier 3: Data', 'the pantry');
  box(1, 'blue', 10, 255, 85, 110, 'Users', 'browser');
  var chev = piece(gBoxes, 1);
  el('polygon', { points: '478,262 492,270 478,278', 'class': 'chev' }, chev);
  el('polygon', { points: '738,262 752,270 738,278', 'class': 'chev' }, chev);
  text(piece(gBoxes, 1, 8), 550, 606, 'Every request passes Tier 1, then Tier 2, then Tier 3, in order.', 'note');

  // Step 2: web server 1 and a first request
  box(2, 'gold', 270, 170, 170, 70, 'Web server 1', 'waiter');
  wire('dU', 2, 2); pkt(2, '\u2709\uFE0F', 'dU', 0, 2, { until: 2 });
  // (web server 2 appears together with the balancer)

  // Step 3: load balancer, web server 2, shared requests
  box(3, 'gold', 270, 305, 170, 70, 'Web server 2', 'waiter');
  var lb = piece(gBoxes, 3, 0, 'blue');
  el('rect', { x: 160, y: 110, width: 55, height: 430, rx: 10, 'class': 'box' }, lb);
  var t1 = text(lb, 0, 0, 'Load Balancer', 'bt'); t1.setAttribute('transform', 'translate(183,325) rotate(-90)');
  var t2 = text(lb, 0, 0, 'receptionist', 'bs'); t2.setAttribute('transform', 'translate(203,325) rotate(-90)');
  wire('ul', 3); wire('l1', 3); wire('l2', 3);
  pkt(3, '\u2709\uFE0F', 'ul', 0, 1); pkt(3, '\u2709\uFE0F', 'l1', 1, 1);
  pkt(3, '\u2709\uFE0F', 'ul', 4, 1); pkt(3, '\u2709\uFE0F', 'l2', 5, 1);

  // Step 4: app servers and API calls
  box(4, 'teal', 530, 170, 170, 70, 'App server 1', 'chef');
  box(4, 'teal', 530, 305, 170, 70, 'App server 2', 'chef');
  wire('a1', 4); wire('a2', 4);
  label(4, 0, 485, 191, 'API call', 'teal');
  pkt(4, '\uD83D\uDCDD', 'a1', 2, 1.2); pkt(4, '\uD83D\uDCDD', 'a2', 6, 1.2);

  // Step 5: database (data out, answer back)
  box(5, 'purple', 940, 300, 120, 80, 'Primary DB', 'ledger, zone A');
  wire('miss', 5); wire('d2', 5);
  pkt(5, '\uD83D\uDCBE', 'miss', 3.2, 1.6, { until: 5 }); pkt(5, '\u2705', 'miss', 5, 1.6, { rev: true, until: 5 });
  pkt(5, '\uD83D\uDCBE', 'd2', 7.2, 1.4); pkt(5, '\u2705', 'd2', 8.6, 1.4, { rev: true });

  // Step 6: cache (hit = fast, miss = slow). Chain 1 now hits the cache.
  box(6, 'gold', 780, 150, 100, 70, 'Cache', 'quick shelf');
  wire('hit', 6);
  label(6, 0, 780, 138, 'hit = fast, skips DB', 'gold', 'start');
  label(6, 0, 800, 372, 'miss = slow trip to DB', 'red', 'start');
  pkt(6, '\u26A1', 'hit', 3.2, 0.8); pkt(6, '\u26A1', 'hit', 4.2, 0.8, { rev: true });

  // Step 7: replica + auto scaling
  box(7, 'purple', 940, 440, 120, 80, 'Replica DB', 'photocopy, zone B');
  wire('rep', 7);
  pkt(7, '\uD83D\uDD01', 'rep', 0, 2); pkt(7, '\uD83D\uDD01', 'rep', 4, 2);
  label(7, 0, 1014, 415, 'live copy', 'purple', 'start');
  box(7, 'gold', 270, 440, 170, 70, 'Web server 3', 'extra waiter');
  label(7, 0, 355, 433, 'Auto Scaling: rush hour', 'gold');
  wire('l3', 7); wire('w3', 7);
  pkt(7, '\u2709\uFE0F', 'l3', 6, 1); pkt(7, '\uD83D\uDCDD', 'w3', 7, 1.2);

  // Step 8: security
  [[355, 244], [615, 244], [355, 379], [615, 379], [355, 514], [830, 224], [1000, 281], [1000, 534]]
    .forEach(function (p) { tag(8, p[0], p[1], 'SG guard'); });
  var fw = piece(gBoxes, 8, 0, 'red');
  el('line', { x1: 127, y1: 213, x2: 127, y2: 250, 'class': 'fw' }, fw);
  el('rect', { x: 99, y: 195, width: 56, height: 18, rx: 9, 'class': 'tagbox' }, fw);
  text(fw, 127, 208, 'Firewall', 'tagtxt');
  wire('intr', 8, 0, 'deny');
  pkt(8, '\uD83D\uDE08', 'intr', 0, 5);
  var xm = piece(gBoxes, 8, 0, 'red');
  var xg = el('g', { opacity: 0 }, xm);
  el('line', { x1: 991, y1: 250, x2: 1009, y2: 268, 'class': 'xline' }, xg);
  el('line', { x1: 1009, y1: 250, x2: 991, y2: 268, 'class': 'xline' }, xg);
  text(xg, 1018, 264, 'Blocked!', 'xtxt', 'start');
  if (reduced) { xg.setAttribute('opacity', 1); } else {
    el('animate', { attributeName: 'opacity', dur: PERIOD + 's', repeatCount: 'indefinite',
      values: '0;0;1;1;0', keyTimes: '0;0.62;0.66;0.95;1' }, xg);
  }

  // Step 9: one order's journey (12 s loop, 8 legs of 1.2 s)
  pkt(9, '\u2709\uFE0F', 'ul', 0, 1.2, { period: 12, halo: 1 });
  pkt(9, '\u2709\uFE0F', 'l1', 1.2, 1.2, { period: 12, halo: 1 });
  pkt(9, '\uD83D\uDCDD', 'a1', 2.4, 1.2, { period: 12, halo: 1 });
  pkt(9, '\u26A1', 'hit', 3.6, 1.2, { period: 12, halo: 1 });
  pkt(9, '\u26A1', 'hit', 4.8, 1.2, { period: 12, halo: 1, rev: true });
  pkt(9, '\u2705', 'a1', 6, 1.2, { period: 12, halo: 1, rev: true });
  pkt(9, '\u2705', 'l1', 7.2, 1.2, { period: 12, halo: 1, rev: true });
  pkt(9, '\u2705', 'ul', 8.4, 1.2, { period: 12, halo: 1, rev: true });
  [[86, 247, 1], [187, 100, 2], [440, 170, 3], [700, 170, 4], [880, 150, 5], [86, 373, 6]]
    .forEach(function (b) { badge(9, b[0], b[1], b[2]); });
  text(piece(gBoxes, 9), 550, 606,
    '1 Request  >  2 Gate + balancer  >  3 Web  >  4 App  >  5 Cache or DB  >  6 Response back', 'note');

  /* ---------- UI ---------- */
  var stepsNav = document.getElementById('steps');
  var playBtn = document.getElementById('play');
  var current = 0, timer = null, buttons = [];

  STEPS.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'step';
    b.innerHTML = '<span class="num">' + (i + 1) + '</span><span><b></b><small></small></span>';
    b.querySelector('b').textContent = s.t;
    b.querySelector('small').textContent = s.sub;
    b.addEventListener('click', function () { stopPlay(); show(i + 1); });
    stepsNav.appendChild(b); buttons.push(b);
  });
  LEGEND.forEach(function (l) {
    var li = document.createElement('li');
    li.innerHTML = '<span></span>';
    li.firstChild.textContent = l[0];
    li.appendChild(document.createTextNode(l[1]));
    document.getElementById('legend').appendChild(li);
  });

  function show(n) {
    var forward = n > current;
    current = n;
    pieces.forEach(function (p) {
      var on = p.from <= n && n <= p.until;
      p.g.classList.toggle('hid', !on);
      p.g.classList.remove('new');
      if (on && p.from === n && forward || (on && p.from === n && n === 1)) {
        void p.g.getBoundingClientRect();
        p.g.classList.add('new');
      }
    });
    svg.classList.toggle('sec', n >= 11);
    buttons.forEach(function (b, i) {
      if (i + 1 === n) { b.setAttribute('aria-current', 'step'); } else { b.removeAttribute('aria-current'); }
      b.classList.toggle('done', i + 1 < n);
    });
    var s = STEPS[n - 1];
    document.getElementById('cap-title').textContent = 'Step ' + n + ': ' + s.t;
    document.getElementById('cap-plain').textContent = s.plain;
    document.getElementById('cap-tech').textContent = s.tech;
    document.getElementById('cap-watch').textContent = s.watch;
  }
  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Auto-play';
  }
  function startPlay() {
    if (current >= STEPS.length) { show(1); }
    playBtn.setAttribute('aria-pressed', 'true'); playBtn.textContent = 'Pause';
    timer = setInterval(function () {
      if (current >= STEPS.length) { stopPlay(); } else { show(current + 1); }
    }, 5000);
  }
  playBtn.addEventListener('click', function () { if (timer) { stopPlay(); } else { startPlay(); } });
  document.getElementById('reset').addEventListener('click', function () { stopPlay(); show(1); });

  if (reduced && svg.pauseAnimations) { svg.pauseAnimations(); }
  show(1);
})();
