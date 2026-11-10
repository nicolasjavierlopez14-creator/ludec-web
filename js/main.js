/* LUDEC — Interacciones mínimas (JavaScript nativo, sin dependencias) */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu-principal');
  var navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
  var mobileQuery = window.matchMedia('(max-width: 980px)');

  /* ---------- Menú mobile ---------- */
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    var onBreakpointChange = function (e) { if (!e.matches) setMenu(false); };
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', onBreakpointChange);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(onBreakpointChange);
    }
  }

  /* ---------- Sombra del header al hacer scroll ---------- */
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Enlace activo según la sección visible ---------- */
  if (hasIO) {
    var linkById = {};
    document.querySelectorAll('.nav-link').forEach(function (link) {
      linkById[link.getAttribute('href').slice(1)] = link;
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = linkById[entry.target.id];
        if (!link) return;
        Object.keys(linkById).forEach(function (id) {
          linkById[id].classList.remove('is-active');
          linkById[id].removeAttribute('aria-current');
        });
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(linkById).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Formulario de contacto (envío vía Web3Forms) ---------- */
  var form = document.getElementById('contact-form');
  if (form && window.fetch && window.FormData) {
    var statusEl = form.querySelector('.form-status');
    var submitBtn = form.querySelector('.form-submit');
    var submitLabel = submitBtn.textContent;

    var setStatus = function (msg, type) {
      statusEl.textContent = msg;
      statusEl.className = 'form-status' + (type ? ' is-' + type : '');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      form.querySelectorAll('[required]').forEach(function (field) {
        var ok = field.checkValidity() && field.value.trim() !== '';
        field.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        setStatus('Por favor, complete nombre, un email válido y el mensaje.', 'error');
        firstInvalid.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';
      setStatus('', '');

      // FormData = petición "simple" (sin preflight CORS)
      var data = new FormData(form);
      data.append('replyto', data.get('email'));

      fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json && json.success) {
            form.reset();
            form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
            setStatus('Gracias. Recibimos su consulta y le responderemos a la brevedad.', 'success');
          } else {
            throw new Error('envio');
          }
        })
        .catch(function () {
          setStatus('No pudimos enviar la consulta. Intente nuevamente o escríbanos por WhatsApp.', 'error');
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        });
    });
  }

  /* ---------- Aparición sutil de contenidos ---------- */
  var revealItems = document.querySelectorAll('.reveal');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!hasIO || reduceMotion) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }
})();
