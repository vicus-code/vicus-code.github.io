// Lejátszók betöltése kattintásra (adatvédelem + gyorsabb oldal)
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.embed button');
  if (!btn) return;
  var box = btn.closest('.embed');
  var f = document.createElement('iframe');
  f.src = box.dataset.src;
  f.title = box.dataset.title || 'Lejátszó';
  f.loading = 'lazy';
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  f.setAttribute('allowfullscreen', '');
  if (box.dataset.height) f.style.height = box.dataset.height + 'px';
  box.innerHTML = '';
  box.appendChild(f);
  box.classList.add('is-loaded');
});

// Lapozható zine: széles képernyőn kinyitható könyv 3D-ben forduló lapokkal (kattintás a jobb/bal lapra, nyilak, húzás);
// telefonon és JS nélkül oldalra húzható sor, az oldalpárok egyben, a gombok egy oldalpárt léptetnek.
(function () {
  var gyok = document.querySelectorAll('[data-lapozo]');
  if (!gyok.length) return;
  var szeles = matchMedia('(min-width: 48rem)');
  var vezerlok = [];
  gyok.forEach(function (root) {
    var szalag = root.querySelector('.lapozo-szalag');
    var elemek = [].slice.call(szalag.querySelectorAll('.lap'));
    // a könyv lapjai: az oldalpár (par) két lap, bal és jobb fele ugyanabból a képből
    var lapok = [];
    elemek.forEach(function (f) { var i = f.querySelector('img');
      if (f.getAttribute('data-fel') === 'par') { lapok.push({ img: i, fel: 'bal' }); lapok.push({ img: i, fel: 'jobb' }); }
      else lapok.push({ img: i, fel: 'egesz' }); });
    var elozo = root.querySelector('.lapozo-elozo'), kov = root.querySelector('.lapozo-kovetkezo'), szam = root.querySelector('.lapozo-szam');
    var N = lapok.length, L = Math.ceil(N / 2), nezet = 0;
    // a könyv: L levél, a j. levél eleje a 2j., hátulja a 2j+1. lap
    var konyv = document.createElement('div'); konyv.className = 'konyv';
    var levelek = [];
    function oldal(lap, hol) {
      var d = document.createElement('div'); d.className = 'oldal ' + hol + ' ' + (lap ? lap.fel : 'ures');
      if (lap) { var k = document.createElement('img'); k.alt = lap.fel === 'jobb' ? '' : lap.img.alt; k.setAttribute('data-src', lap.img.getAttribute('src')); k.decoding = 'async'; d.appendChild(k); }
      return d;
    }
    for (var j = 0; j < L; j++) {
      var lv = document.createElement('div'); lv.className = 'level';
      lv.appendChild(oldal(lapok[2 * j], 'elo')); lv.appendChild(oldal(lapok[2 * j + 1], 'hat'));
      konyv.appendChild(lv); levelek.push(lv);
    }
    root.insertBefore(konyv, szalag.nextSibling);
    function tolt() { for (var j = Math.max(0, nezet - 2); j < Math.min(L, nezet + 3); j++) levelek[j].querySelectorAll('img[data-src]').forEach(function (k) { k.src = k.getAttribute('data-src'); k.removeAttribute('data-src'); }); }
    function rajzol() {
      levelek.forEach(function (lv, j) { lv.classList.toggle('forditva', j < nezet); lv.style.zIndex = j < nezet ? j + 1 : 1000 - j; });
      konyv.classList.toggle('csak-elol', nezet === 0); konyv.classList.toggle('csak-hatul', nezet === L);
      szam.textContent = felirat(nezet);
      elozo.disabled = nezet === 0; kov.disabled = nezet === L; tolt();
    }
    function lapoz(d) {
      var uj = Math.max(0, Math.min(L, nezet + d)); if (uj === nezet) return;
      var lv = levelek[d > 0 ? nezet : uj]; lv.classList.add('forog');
      setTimeout(function () { lv.classList.remove('forog'); rajzol(); }, 950);
      nezet = uj; rajzol(); lv.style.zIndex = '';
    }
    // lapsor (telefon): melyik lap van középen, gombokkal egy lapot léptet
    // lapsor: az i. elem az i. nézet (0 = borító, utolsó = hátlap), így a könyvvel oda-vissza ugyanott áll
    function lapIndex() { var x = szalag.scrollLeft + szalag.clientWidth / 2, best = 0, bd = 1e9;
      elemek.forEach(function (f, i) { var c = f.offsetLeft - szalag.offsetLeft + f.offsetWidth / 2, d = Math.abs(c - x); if (d < bd) { bd = d; best = i; } });
      return best; }
    function felirat(v) { return v === 0 ? '1 / ' + N : v >= L ? N + ' / ' + N : (2 * v) + '–' + (2 * v + 1) + ' / ' + N; }
    function sorSzam() { var i = lapIndex(); szam.textContent = felirat(i); elozo.disabled = i === 0; kov.disabled = i >= elemek.length - 1; }
    function sorUgrik(i, sima) { var f = elemek[Math.max(0, Math.min(elemek.length - 1, i))]; szalag.scrollTo({ left: f.offsetLeft - szalag.offsetLeft - (szalag.clientWidth - f.offsetWidth) / 2, behavior: sima && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' }); }
    function sorLep(d) { sorUgrik(lapIndex() + d, true); }
    szalag.addEventListener('scroll', function () { if (!szeles.matches) sorSzam(); }, { passive: true });
    elozo.addEventListener('click', function () { szeles.matches ? lapoz(-1) : sorLep(-1); });
    kov.addEventListener('click', function () { szeles.matches ? lapoz(1) : sorLep(1); });
    // könyv: kattintás a jobb/bal felére, húzás, nyilak
    var x0 = null, huzott = false;
    konyv.addEventListener('pointerdown', function (e) { x0 = e.clientX; huzott = false; });
    konyv.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { huzott = true; lapoz(dx < 0 ? 1 : -1); } });
    konyv.addEventListener('click', function (e) { if (huzott) return; var r = konyv.getBoundingClientRect(); lapoz(e.clientX > r.left + r.width / 2 ? 1 : -1); });
    vezerlok.push({ root: root, lep: function (d) { szeles.matches ? lapoz(d) : sorLep(d); } });
    function mod() {
      root.classList.toggle('konyv-mod', szeles.matches);
      if (szeles.matches) { nezet = Math.min(L, lapIndex()); rajzol(); }
      else { sorUgrik(nezet, false); sorSzam(); }
    }
    (szeles.addEventListener ? szeles.addEventListener('change', mod) : szeles.addListener(mod));
    mod();
  });
  // nyilak: csak egy zine lapoz, a képernyő közepéhez legközelebbi (a Zine oldalon kettő is látszhat egyszerre)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    var best = null, bd = Infinity;
    vezerlok.forEach(function (v) {
      var r = v.root.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var d = Math.abs((r.top + r.bottom) / 2 - innerHeight / 2); if (d < bd) { bd = d; best = v; }
    });
    if (!best) return;
    best.lep(e.key === 'ArrowRight' ? 1 : -1); e.preventDefault();
  });
})();

/* Sorokba rendezett galéria (gallery.html, „sorok”): a sormagasságot az alapérték körül (−20% … +15%) úgy választja,
   hogy az utolsó sor a lehető legjobban kitöltődjön. Ha legalább 80%-ig kitöltődik, az utolsó sor is a teljes szélességre nyúlik
   („kitolt”). Szkript nélkül a CSS-elrendezés marad, csak az utolsó sor lehet rövidebb. */
(function () {
  var galeriak = document.querySelectorAll('.gallery.sorok');
  if (!galeriak.length) return;
  function utolsoSor(g) {
    var f = g.querySelectorAll(':scope > figure');
    if (!f.length) return 1;
    var top = f[f.length - 1].offsetTop, w = 0, n = 0;
    for (var i = f.length - 1; i >= 0 && f[i].offsetTop === top; i--) { w += f[i].offsetWidth; n++; }
    return (w + (n - 1) * parseFloat(getComputedStyle(g).columnGap || 0)) / g.clientWidth;
  }
  function igazit(g) {
    g.classList.remove('kitolt');
    g.classList.add('meres');
    g.style.removeProperty('--sor-mag');
    var alap = parseFloat(getComputedStyle(g).getPropertyValue('--sor-mag')) || 0;
    if (!alap) {
      var p = document.createElement('div');
      p.style.cssText = 'position:absolute;visibility:hidden;height:var(--sor-mag)';
      g.appendChild(p); alap = p.offsetHeight; g.removeChild(p);
    }
    if (!alap) { g.classList.remove('meres'); return; }
    var legjobb = alap, legjobbArany = -1;
    for (var k = 0; k <= 35; k++) {
      var m = alap * (0.8 + k * 0.01);
      g.style.setProperty('--sor-mag', m + 'px');
      var a = utolsoSor(g) - Math.abs(m - alap) / alap * 0.2;
      if (a > legjobbArany) { legjobbArany = a; legjobb = m; }
    }
    g.style.setProperty('--sor-mag', legjobb + 'px');
    if (utolsoSor(g) >= 0.8) g.classList.add('kitolt');
    g.classList.remove('meres');
  }
  function mind() { [].forEach.call(galeriak, igazit); }
  mind();
  var idozito, szel = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === szel) return;
    szel = window.innerWidth;
    clearTimeout(idozito); idozito = setTimeout(mind, 150);
  });
})();

/* Képek nagyban (figure.html, „nagyit” link): kattintásra a kép az egész képernyőn, fehéren, alatta a felirata.
   Nyilakkal (vagy a kép bal/jobb felére kattintva, telefonon húzással) az ugyanabban a galériában lévő előző/következő kép;
   Esc, a ×, vagy a képen kívül kattintva bezárul. */
(function () {
  var linkek = document.querySelectorAll('a.nagyit');
  if (!linkek.length || typeof HTMLDialogElement !== 'function') return;
  var en = document.documentElement.lang === 'en';
  var d = document.createElement('dialog');
  d.className = 'nagykep';
  d.setAttribute('aria-label', en ? 'Image' : 'Kép');
  d.innerHTML = '<button type="button" class="nagykep-zar" aria-label="' + (en ? 'Close' : 'Bezár') + '">×</button>' +
    '<figure><img alt=""><figcaption class="meta"></figcaption></figure>';
  document.body.appendChild(d);
  var kep = d.querySelector('img'), felirat = d.querySelector('figcaption'), sor = [], i = 0;
  function mutat(n) {
    i = (n + sor.length) % sor.length;
    var a = sor[i], k = a.querySelector('img'), fc = a.closest('figure').querySelector('figcaption');
    kep.src = a.href; kep.alt = k ? k.alt : '';
    felirat.innerHTML = fc ? fc.innerHTML : '';
    felirat.hidden = !fc;
  }
  [].forEach.call(linkek, function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      var g = a.closest('.gallery') || document;
      sor = [].slice.call(g.querySelectorAll('a.nagyit'));
      mutat(sor.indexOf(a));
      d.showModal();
    });
  });
  d.addEventListener('close', function () { kep.removeAttribute('src'); });
  d.querySelector('.nagykep-zar').addEventListener('click', function () { d.close(); });
  d.addEventListener('click', function (e) {
    if (e.target === kep) {
      if (sor.length < 2) return;
      var r = kep.getBoundingClientRect();
      mutat(i + (e.clientX < r.left + r.width / 2 ? -1 : 1));
    } else if (!e.target.closest('figcaption')) d.close();
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { mutat(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { mutat(i - 1); e.preventDefault(); }
  });
  var x0 = null;
  d.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  d.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50 && sor.length > 1) mutat(i + (dx < 0 ? 1 : -1));
  });
})();
