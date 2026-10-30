(function () {
  'use strict';

  // Planilha de origem (aba AGENDA: A=DATA, B=DIA, C=SVÇ, D=RETÉM).
  // Precisa estar compartilhada como "Qualquer pessoa com o link: leitor".
  var SHEET_ID = '1iUXf6HYi_tIuOflN1kuCsLddUbpwIwu7S6KGYZrJSws';
  var SYNC_MS = 5 * 60 * 1000;
  var SHOW_RETEM = true;
  var HIGHLIGHT_HOLIDAYS = true;

  var MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var MES_ABR = ['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.'];
  var MES_PDF = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  var WEEKDAYS = ['dom.','seg.','ter.','qua.','qui.','sex.','sáb.'];

  var pad = function (n) { return String(n).padStart(2, '0'); };
  var key = function (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); };
  var keyOf = function (d) { return key(d.getFullYear(), d.getMonth(), d.getDate()); };
  var $ = function (id) { return document.getElementById(id); };

  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  }
  function offset(base, days) { var d = new Date(base); d.setDate(base.getDate() + days); return d; }

  function holidays(y) {
    var h = {};
    [[0,1,'Confraternização'],[2,6,'Data Magna PE'],[3,21,'Tiradentes'],[4,1,'Dia do Trabalho'],[5,24,'São João'],[6,16,'N. Sra. do Carmo'],
     [8,7,'Independência'],[9,12,'N. Sra. Aparecida'],[10,2,'Finados'],[10,15,'Proclamação'],[10,20,'Consciência Negra'],[11,8,'N. Sra. Conceição'],[11,25,'Natal']]
      .forEach(function (x) { h[key(y, x[0], x[1])] = x[2]; });
    var e = easter(y);
    [[-48,'Carnaval'],[-47,'Carnaval'],[-2,'Paixão de Cristo'],[60,'Corpus Christi']]
      .forEach(function (x) { h[keyOf(offset(e, x[0]))] = x[1]; });
    return h;
  }
  // Dias de festas maiores (Natal/Réveillon, Carnaval, Semana Santa) em lilás.
  function purpleDays(y) {
    var s = new Set([key(y,11,24), key(y,11,25), key(y,11,31), key(y,0,1)]);
    var e = easter(y);
    [-50,-49,-48,-47,-46,-2,-1,0].forEach(function (o) { s.add(keyOf(offset(e, o))); });
    return s;
  }

  function parseCsv(t) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(f); f = ''; }
      else if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
      else if (ch !== '\r') f += ch;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }

  // ---- Estado ----
  var snap = window.ESCALA_SNAPSHOT || { date: '', data: {} };
  var now = new Date();
  var state = { y: now.getFullYear(), m: now.getMonth(), data: snap.data, live: null, busy: false };
  try {
    var saved = JSON.parse(localStorage.getItem('escala-spa-mes') || 'null');
    if (saved && typeof saved.y === 'number' && typeof saved.m === 'number') { state.y = saved.y; state.m = saved.m; }
  } catch (e) {}

  function setMonth(y, m) {
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    try { localStorage.setItem('escala-spa-mes', JSON.stringify({ y: y, m: m })); } catch (e) {}
    state.y = y; state.m = m; render();
  }

  function sync() {
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=AGENDA&range=A:D&t=' + Date.now();
    fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (t) {
        if (/^\s*</.test(t)) throw new Error('planilha sem acesso público');
        var map = {}, n = 0;
        parseCsv(t).forEach(function (r) {
          var mt = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec((r[0] || '').trim()); if (!mt) return;
          var svc = (r[2] || '').trim(), ret = (r[3] || '').trim(); if (!svc && !ret) return;
          map[key(+mt[3], +mt[2] - 1, +mt[1])] = [svc, ret]; n++;
        });
        if (n) { state.data = map; state.live = new Date(); render(); }
      })
      .catch(function (err) { console.warn('Sincronização com a planilha falhou; usando cópia local.', err); });
  }

  // ---- Renderização ----
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderSelects() {
    var selM = $('selMonth'), selY = $('selYear');
    if (!selM.options.length) MESES.forEach(function (l, i) { selM.appendChild(new Option(l, String(i))); });
    var yrs = new Set([state.y - 1, state.y, state.y + 1]);
    Object.keys(state.data).forEach(function (k) { yrs.add(+k.slice(0, 4)); });
    selY.textContent = '';
    Array.from(yrs).sort().forEach(function (y) { selY.appendChild(new Option(String(y), String(y))); });
    selM.value = String(state.m); selY.value = String(state.y);
  }

  function render() {
    var y = state.y, m = state.m, data = state.data;
    var hol = HIGHLIGHT_HOLIDAYS ? holidays(y) : {};
    var purp = purpleDays(y);
    var startOff = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
    var total = Math.ceil((startOff + dim) / 7) * 7;
    var tk = keyOf(new Date());
    var grid = $('grid'), frag = document.createDocumentFragment(), filled = 0;

    for (var i = 0; i < total; i++) {
      var d = i - startOff + 1;
      if (d < 1 || d > dim) { frag.appendChild(el('div')); continue; }
      var k = key(y, m, d), dow = (startOff + d - 1) % 7, e = data[k], holiday = hol[k] || '';
      if (e) filled++;
      var cell = el('div', 'cell'); cell.dataset.p = 'cell';
      if (purp.has(k)) cell.classList.add('purple');
      else if (dow === 0 || dow === 6 || holiday) cell.classList.add('special');
      if (k === tk) cell.classList.add('today');

      var dt = el('div', 'dt'); dt.dataset.p = 'dt';
      var lab = el('span', null, pad(d) + '/' + MES_ABR[m]);
      if (holiday) lab.title = 'Feriado: ' + holiday;
      dt.appendChild(lab); cell.appendChild(dt);

      var sw = el('div'); sw.style.minWidth = '0';
      var svc = el('span', 'svc', e && e[0] ? e[0] : '—'); svc.dataset.p = 'svc';
      sw.appendChild(svc); cell.appendChild(sw);

      if (SHOW_RETEM) {
        var ret = el('div', 'ret'); ret.dataset.p = 'ret';
        ret.appendChild(el('span', null, 'Retém: '));
        ret.appendChild(el('b', null, e && e[1] ? e[1] : '—'));
        cell.appendChild(ret);
      }
      frag.appendChild(cell);
    }
    grid.textContent = ''; grid.appendChild(frag);
    renderSelects();

    var live = state.live;
    $('source').textContent = live
      ? 'Fonte: AGENDA · sincronizado com a planilha às ' + pad(live.getHours()) + ':' + pad(live.getMinutes())
      : 'Fonte: AGENDA · cópia local de ' + snap.date;
    $('stats').textContent = state.busy ? 'Gerando PDF…' : filled + ' de ' + dim + ' dias lançados';
    document.title = 'Escala Supervisão SPA · ' + MESES[m] + ' ' + y;
  }

  // ---- PDF (clique no brasão) ----
  var fontCss = null;
  function warmFonts() {
    if (!fontCss && window.htmlToImage) fontCss = window.htmlToImage.getFontEmbedCSS($('card')).catch(function () { return ''; });
  }
  function savePdf() {
    var card = $('card');
    if (!window.htmlToImage || !window.jspdf || state.busy) return;
    var w = card.offsetWidth, h = card.offsetHeight, y = state.y, m = state.m;
    state.busy = true; render(); document.body.style.cursor = 'wait';
    var done = function () { state.busy = false; render(); document.body.style.cursor = ''; };
    warmFonts();
    fontCss
      .then(function (css) {
        return window.htmlToImage.toJpeg(card, {
          quality: 1, pixelRatio: 4, backgroundColor: '#ffffff', fontEmbedCSS: css,
          filter: function (n) { return !(n.dataset && n.dataset.noprint); }
        });
      })
      .then(function (url) {
        var pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        var pw = 297, ph = 210, mg = 7, aw = pw - 2 * mg, ah = ph - 2 * mg;
        var s = Math.min(aw / w, ah / h), iw = w * s, ih = h * s;
        pdf.addImage(url, 'JPEG', (pw - iw) / 2, (ph - ih) / 2, iw, ih, undefined, 'NONE');
        pdf.save('Escala_Supervisao_SPA_' + MES_PDF[m] + y + '.pdf');
        done();
      })
      .catch(function (err) { console.error('Falha ao gerar PDF', err); done(); });
  }

  // ---- Inicialização ----
  var wk = $('weekdays');
  WEEKDAYS.forEach(function (w) { wk.appendChild(el('div', null, w)); });
  $('prev').addEventListener('click', function () { setMonth(state.y, state.m - 1); });
  $('next').addEventListener('click', function () { setMonth(state.y, state.m + 1); });
  $('selMonth').addEventListener('change', function (e) { setMonth(state.y, +e.target.value); });
  $('selYear').addEventListener('change', function (e) { setMonth(+e.target.value, state.m); });
  $('brasao').addEventListener('click', savePdf);

  render();
  sync();
  setInterval(sync, SYNC_MS);
  window.addEventListener('focus', sync);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(); });
  setTimeout(warmFonts, 1500);
})();
