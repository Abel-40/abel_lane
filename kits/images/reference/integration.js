/* Excerpts from reference/index.html (vanilla JS + GSAP). Port the behaviour and values into the app's components;
   do not paste verbatim if the app uses React/Vue. Helpers used: $, $$, esc, ico, pad2, projById, caseById, G (gsap), motion (false when reduced motion). */

/* 1. Image helpers, stacked pair, gallery */
  var SHOT_DIR = 'shots/';
  function shotSrc(f, big) { return SHOT_DIR + f + (big ? '.webp' : '-sm.webp'); }
  function shotSet(f) { return SHOT_DIR + f + '-sm.webp 960w, ' + SHOT_DIR + f + '.webp 1800w'; }
  function shotImg(p, k, cls, sizes, eager) {
    var sh = p.shots[k];
    return '<img class="' + cls + '" src="' + shotSrc(sh[0]) + '" srcset="' + shotSet(sh[0]) + '" sizes="' + sizes + '" width="960" height="600" alt="' + esc(p.name + ': ' + sh[1]) + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">';
  }
  function shotsHTML(p, sizes, eager) {
    return '<span class="shots" style="--h1:' + p.hue[0] + ';--h2:' + p.hue[1] + '">' +
      shotImg(p, p.cover[1], 'sh sh-b', sizes, eager) + shotImg(p, p.cover[0], 'sh sh-f', sizes, eager) + '</span>';
  }
  function galleryHTML(p) {
    var first = p.shots[0];
    return '<div class="gal" data-gal="' + p.id + '">' +
      '<div class="gal-view">' + p.shots.map(function (sh, k) {
        return '<img class="gal-img' + (k === 0 ? ' on' : '') + '" src="' + shotSrc(sh[0], true) + '" srcset="' + shotSet(sh[0]) + '" sizes="(max-width: 860px) 94vw, 980px" width="1800" height="1125" alt="' + esc(p.name + ': ' + sh[1]) + '"' + (k === 0 ? '' : ' loading="lazy"') + ' decoding="async">';
      }).join('') +
      '<button type="button" class="gal-arw prev" data-gal-step="-1" aria-label="Previous screen">' + ico('back') + '</button>' +
      '<button type="button" class="gal-arw next" data-gal-step="1" aria-label="Next screen">' + ico('arrow') + '</button></div>' +
      '<div class="gal-bar"><div class="gal-cap" aria-live="polite"><span class="gal-n">01 / ' + pad2(p.shots.length) + '</span><b class="gal-t">' + esc(first[1]) + '</b><p class="gal-d">' + esc(first[3]) + '</p></div>' +
      '<a class="gal-full" href="' + shotSrc(first[0], true) + '" target="_blank" rel="noopener">' + ico('expand') + 'Full size</a></div>' +
      '<div class="gal-thumbs">' + p.shots.map(function (sh, k) {
        return '<button type="button" class="gal-th' + (k === 0 ? ' on' : '') + '" data-gal-i="' + k + '" aria-pressed="' + (k === 0) + '"><img src="' + shotSrc(sh[0]) + '" width="960" height="600" alt="" loading="lazy" decoding="async"><span>' + esc(sh[1]) + '<small>' + (sh[2] === 'd' ? 'Dark' : 'Light') + '</small></span></button>';
      }).join('') + '</div>' +
      '<p class="gal-note">' + ico('info') + 'Redesigned interface screens, shown with sample data.</p></div>';
  }
  function galleryGo(gal, k) {
    var p = projById(gal.getAttribute('data-gal')); if (!p) return;
    var n = p.shots.length; k = (k + n) % n;
    var imgs = $$('.gal-img', gal), cur = $('.gal-img.on', gal), nx = imgs[k];
    if (!nx || nx === cur) return;
    $$('.gal-th', gal).forEach(function (b, i) { b.classList.toggle('on', i === k); b.setAttribute('aria-pressed', String(i === k)); });
    var sh = p.shots[k];
    $('.gal-n', gal).textContent = pad2(k + 1) + ' / ' + pad2(n);
    $('.gal-t', gal).textContent = sh[1];
    $('.gal-d', gal).textContent = sh[3];
    $('.gal-full', gal).setAttribute('href', shotSrc(sh[0], true));
    nx.removeAttribute('loading');
    if (motion) {
      G.killTweensOf(imgs);
      imgs.forEach(function (im) { if (im !== cur && im !== nx) { im.classList.remove('on'); G.set(im, { clearProps: 'all' }); } });
      nx.classList.add('on');
      G.set(nx, { zIndex: 1 }); if (cur) G.set(cur, { zIndex: 0 });
      G.fromTo(nx, { autoAlpha: 0, scale: 1.03 }, { autoAlpha: 1, scale: 1, duration: .7, ease: 'power3.out', onComplete: function () { if (cur) { cur.classList.remove('on'); G.set(cur, { clearProps: 'all' }); } G.set(nx, { clearProps: 'zIndex,transform' }); } });
      G.fromTo([$('.gal-t', gal), $('.gal-d', gal)], { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: 'power2.out', stagger: .05 });
    } else {
      if (cur) cur.classList.remove('on');
      nx.classList.add('on');
    }
  }


/* 2. Where the stacked pair is used */
        '<div class="wc-art">' + shotsHTML(p, '(max-width: 860px) 70vw, 460px') + '</div>' +
        '<span class="pc-art">' + shotsHTML(p, '(max-width: 760px) 70vw, 300px') + '</span>' +
      '<div class="po-art po-in">' + shotsHTML(p, '(max-width: 860px) 70vw, 460px', true) + '</div></header>' +
      '<section class="po-sec po-in"><h3 class="po-k">Inside the product</h3>' + galleryHTML(p) + '</section>' +

/* 3. Case-study figure (inside readerHTML, after the system-flow card) */
      (c.fig ? '<figure class="rd-fig rd-in"><a class="rd-fig-img" href="cases/' + c.fig + '.webp" target="_blank" rel="noopener" aria-label="Open the figure full size"><img src="cases/' + c.fig + '-sm.webp" srcset="cases/' + c.fig + '-sm.webp 960w, cases/' + c.fig + '.webp 1800w" sizes="(max-width: 1280px) 94vw, 1180px" width="1800" height="1125" alt="' + esc(c.figAlt || c.figCap) + '" decoding="async"><span class="rd-fig-zoom" aria-hidden="true">' + ico('expand') + '</span></a><figcaption><span class="mono">Figure ' + c.num + '</span>' + esc(c.figCap) + '</figcaption></figure>' : '') + '</div>' +

/* 4. Gallery clicks and keyboard */
    var gb = e.target.closest('[data-gal-i],[data-gal-step]');
    if (gb) {
      var gal = gb.closest('.gal'), cur = $$('.gal-th', gal).indexOf($('.gal-th.on', gal));
      galleryGo(gal, gb.hasAttribute('data-gal-i') ? +gb.getAttribute('data-gal-i') : cur + (+gb.getAttribute('data-gal-step')));
      return;
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && poOpen && document.activeElement && document.activeElement.closest) {
      var gl = document.activeElement.closest('.gal');
      if (gl) { e.preventDefault(); galleryGo(gl, $$('.gal-th', gl).indexOf($('.gal-th.on', gl)) + (e.key === 'ArrowRight' ? 1 : -1)); }
    }


/* 5. Case list hover preview (follows the cursor) */
    var prev = $('#csPreview'), pImg = $('img', prev), pCur = '', pPre = false;
    var px = G.quickTo(prev, 'x', { duration: .55, ease: 'power3' }), py = G.quickTo(prev, 'y', { duration: .55, ease: 'power3' });
    var rows = $('#csRows');
    rows.addEventListener('pointermove', function (e) { px(e.clientX + 28); py(e.clientY - 90); });
    rows.addEventListener('pointerover', function (e) {
      var b = e.target.closest('.cs-row-btn'); if (!b) return;
      var a = b.getAttribute('data-preview');
      if (!pPre) { pPre = true; D.cases.forEach(function (c) { if (c.fig) { var im = new Image(); im.src = 'cases/' + c.fig + '-sm.webp'; } }); }
      if (pCur !== a) { var cc = caseById(a); if (cc) { pCur = a; pImg.src = cc.fig ? 'cases/' + cc.fig + '-sm.webp' : shotSrc(projById(cc.projectId).shots[0][0]); } }
      G.to(prev, { autoAlpha: 1, scale: 1, rotation: -3, duration: .45, ease: 'power3.out', overwrite: 'auto' });
    });
    rows.addEventListener('pointerleave', function () { G.to(prev, { autoAlpha: 0, scale: .8, rotation: 0, duration: .35, overwrite: 'auto' }); });
    G.set(prev, { scale: .8 });

/* 6. Home rail parallax for the two screens (inside the horizontal pinned rail) */
          var shB = $('.wc-art .sh-b', cd), shF = $('.wc-art .sh-f', cd);
          if (shB) G.fromTo(shB, { xPercent: -6 }, { xPercent: 4, ease: 'none', scrollTrigger: { trigger: cd, containerAnimation: railTw, start: 'left right', end: 'right left', scrub: true } });
          if (shF) G.fromTo(shF, { xPercent: 7, yPercent: 4 }, { xPercent: -5, yPercent: -2, ease: 'none', scrollTrigger: { trigger: cd, containerAnimation: railTw, start: 'left right', end: 'right left', scrub: true } });
