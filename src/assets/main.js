// Sylvie · Château de Voltaire — small progressive enhancements.
// Everything works without JavaScript; this adds the mobile menu,
// remembers the chosen language and makes the booking form friendlier.
(function () {
  "use strict";

  // Header: translucent gold once the page is scrolled
  var siteHeader = document.querySelector("[data-header]");
  if (siteHeader) {
    var onScroll = function () { siteHeader.classList.toggle("is-scrolled", window.scrollY > 12); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile navigation
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      toggle.querySelector(".sr-only").textContent = toggle.getAttribute(open ? "data-label-close" : "data-label-open");
    };
    toggle.addEventListener("click", function () {
      document.documentElement.classList.add("nav-anim");
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
  }

  // Collapse the header menu into the menu button when the labels do not
  // fit on one line (German, Dutch or Spanish need far more room than
  // Chinese). Remembers the needed width for the next page load.
  var root = document.documentElement, headerInner = document.querySelector(".header-inner");
  if (headerInner) {
    var key = "navw-" + root.lang;
    var fit = function () {
      if (nav && nav.classList.contains("is-open")) return;
      root.classList.remove("nav-compact");
      var over = headerInner.scrollWidth - headerInner.clientWidth;
      try {
        if (over > 0) localStorage.setItem(key, String(window.innerWidth + over + 8));
        else if (+localStorage.getItem(key) > window.innerWidth) localStorage.setItem(key, String(window.innerWidth));
      } catch (e) {}
      if (over > 0) root.classList.add("nav-compact");
    };
    fit();
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  // Remember the language choice so "/" sends returning visitors home.
  // Links in the switcher keep the current anchor and query (e.g. a
  // pre-selected tour) when changing language.
  try { localStorage.setItem("lang", document.documentElement.lang); } catch (e) {}
  document.querySelectorAll("a[data-lang]").forEach(function (a) {
    a.addEventListener("click", function () {
      try { localStorage.setItem("lang", a.getAttribute("data-lang")); } catch (e) {}
      if (location.search || location.hash) a.href = a.pathname + location.search + location.hash;
    });
  });

  // Videos: silent loops that play only while on screen, never for visitors
  // who prefer reduced motion. Pausing with the button sticks.
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-video]").forEach(function (box) {
    var video = box.querySelector("video");
    var btn = box.querySelector("[data-video-toggle]");
    var userPaused = still;
    var sync = function () {
      var playing = !video.paused;
      box.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-label", btn.getAttribute(playing ? "data-label-pause" : "data-label-play"));
    };
    var play = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    btn.hidden = false;
    btn.addEventListener("click", function () {
      if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); }
    });
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !userPaused) play();
          else if (!e.isIntersecting && !video.paused) video.pause();
        });
      }, { threshold: 0.35 }).observe(video);
    } else if (!userPaused) {
      play();
    }
    sync();
  });

  // Home page filmstrip: arrows scroll by about one screen of photos and hide
  // at either end; swipe, trackpad and keyboard scrolling work natively.
  document.querySelectorAll("[data-strip]").forEach(function (strip) {
    var track = strip.querySelector("[data-strip-track]");
    var prev = strip.querySelector("[data-strip-prev]");
    var next = strip.querySelector("[data-strip-next]");
    var update = function () {
      prev.hidden = track.scrollLeft < 8;
      next.hidden = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    };
    var step = function (dir) {
      track.scrollBy({ left: dir * Math.max(track.clientWidth * 0.8, 280), behavior: "smooth" });
    };
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    update();
  });

  // Gallery lightbox (plain links to the full image without JavaScript)
  var dialog = document.querySelector("[data-lightbox-dialog]");
  var shots = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  if (dialog && shots.length && dialog.showModal) {
    var img = dialog.querySelector("img");
    var capTitle = dialog.querySelector("figcaption strong");
    var capLegend = dialog.querySelector("figcaption span");
    var current = 0;
    var showShot = function (i) {
      current = (i + shots.length) % shots.length;
      var link = shots[current];
      var thumb = link.querySelector("img");
      img.src = link.href;
      img.alt = thumb.alt;
      capTitle.textContent = link.getAttribute("data-title");
      capLegend.textContent = link.getAttribute("data-legend") || "";
    };
    if (shots.length < 2) {
      dialog.querySelectorAll('[data-lb="prev"], [data-lb="next"]').forEach(function (b) { b.hidden = true; });
    }
    shots.forEach(function (link, i) {
      link.addEventListener("click", function (e) { e.preventDefault(); showShot(i); dialog.showModal(); });
    });
    dialog.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-lb]");
      var action = btn ? btn.getAttribute("data-lb") : e.target === dialog ? "close" : null;
      if (action === "close") dialog.close();
      if (action === "prev") showShot(current - 1);
      if (action === "next") showShot(current + 1);
    });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") showShot(current - 1);
      if (e.key === "ArrowRight") showShot(current + 1);
    });
  }

  // Language menu: close on outside click or Escape
  document.querySelectorAll("[data-lang-menu]").forEach(function (menu) {
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
    });
  });

  // Weather in Ferney-Voltaire (home page): forecast from Open-Meteo, one
  // button per day; the chosen day shows icon, conditions and temperatures.
  var weather = document.querySelector("[data-weather]");
  if (weather && window.fetch) {
    var W_ICONS = {
      clear: '<circle cx="24" cy="24" r="8" class="w-sun"/><path class="w-sun" d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M11.3 36.7l3.5-3.5M33.2 14.8l3.5-3.5"/>',
      partly: '<circle cx="18" cy="18" r="6" class="w-sun"/><path class="w-sun" d="M18 5v4M5 18h4M8.8 8.8l2.8 2.8M27.2 8.8l-2.8 2.8"/><path d="M16 38h20a7 7 0 0 0 0-14 10 10 0 0 0-19 3 5.5 5.5 0 0 0-1 11z" class="w-cloud"/>',
      cloudy: '<path d="M13 36h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z" class="w-cloud"/>',
      fog: '<path d="M14 24h22a7 7 0 0 0-3-12 10 10 0 0 0-19 4" class="w-cloud"/><path d="M8 30h32M12 36h26M16 42h18"/>',
      drizzle: '<path d="M13 30h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z" class="w-cloud"/><path class="w-rain" d="M17 36v2M25 36v2M33 36v2M21 41v2M29 41v2"/>',
      rain: '<path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z" class="w-cloud"/><path class="w-rain" d="M17 33l-3 7M25 33l-3 7M33 33l-3 7"/>',
      showers: '<circle cx="15" cy="14" r="5" class="w-sun"/><path d="M15 30h22a7 7 0 0 0 0-14 10 10 0 0 0-19 3 5.5 5.5 0 0 0-3 11z" class="w-cloud"/><path class="w-rain" d="M20 35l-2 5M28 35l-2 5M36 35l-2 5"/>',
      snow: '<path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z" class="w-cloud"/><path class="w-snow" d="M17 34v6M14 37h6M29 34v6M26 37h6M23 40v4M21 42h4"/>',
      storm: '<path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z" class="w-cloud"/><path class="w-bolt" d="M25 30l-5 8h6l-4 8"/>'
    };
    var kind = function (code) {
      if (code === 0) return "clear";
      if (code <= 2) return "partly";
      if (code === 3) return "cloudy";
      if (code === 45 || code === 48) return "fog";
      if (code >= 51 && code <= 57) return "drizzle";
      if ((code >= 61 && code <= 67)) return "rain";
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
      if (code >= 80 && code <= 82) return "showers";
      return code >= 95 ? "storm" : "cloudy";
    };
    var svg = function (k, size) {
      return '<svg class="w-icon w-' + k + '" viewBox="0 0 48 48" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">' + W_ICONS[k] + "</svg>";
    };
    var wLocale = weather.getAttribute("data-locale");
    var codes = JSON.parse(weather.getAttribute("data-codes"));
    var now = weather.querySelector("[data-weather-now]");
    var daysEl = weather.querySelector("[data-weather-days]");
    var dayFmt = new Intl.DateTimeFormat(wLocale, { weekday: "short", day: "numeric", timeZone: "UTC" });
    var longFmt = new Intl.DateTimeFormat(wLocale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    var deg = function (v) { return Math.round(v) + " °C"; };
    weather.hidden = false;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=46.2558&longitude=6.1081&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FParis&forecast_days=14")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var d = data.daily;
        var showDay = function (i) {
          var k = kind(d.weather_code[i]);
          var date = new Date(d.time[i] + "T12:00:00Z");
          now.innerHTML = '<div class="weather-big">' + svg(k, 88) + '<div><p class="weather-date"></p><p class="weather-temp"><strong>' + deg(d.temperature_2m_max[i]) + '</strong> <span>' +
            weather.getAttribute("data-min") + " " + deg(d.temperature_2m_min[i]) + '</span></p><p class="weather-cond"></p></div></div>' +
            (d.precipitation_probability_max[i] != null ? '<p class="weather-rain"></p>' : "");
          now.querySelector(".weather-date").textContent = longFmt.format(date);
          now.querySelector(".weather-cond").textContent = codes[k];
          var rain = now.querySelector(".weather-rain");
          if (rain) rain.textContent = weather.getAttribute("data-rain") + (/^fr/.test(wLocale) ? "\u00a0: " : ": ") + d.precipitation_probability_max[i] + " %";
          Array.prototype.forEach.call(daysEl.children, function (b, j) { b.setAttribute("aria-pressed", String(i === j)); });
        };
        d.time.forEach(function (day, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "weather-day";
          var k = kind(d.weather_code[i]);
          b.innerHTML = '<span class="wd-name"></span>' + svg(k, 30) + '<span class="wd-temp">' + Math.round(d.temperature_2m_max[i]) + "°</span>";
          b.querySelector(".wd-name").textContent = dayFmt.format(new Date(day + "T12:00:00Z"));
          b.setAttribute("aria-label", longFmt.format(new Date(day + "T12:00:00Z")) + ", " + codes[k] + ", " + deg(d.temperature_2m_max[i]));
          b.addEventListener("click", function () { showDay(i); });
          daysEl.appendChild(b);
        });
        showDay(0);
      })
      .catch(function () { now.innerHTML = '<p class="weather-loading"></p>'; now.firstChild.textContent = weather.getAttribute("data-error"); });
  }

  // Booking request form (contact page)
  var form = document.querySelector("[data-booking-form]");
  if (!form) return;

  var status = form.querySelector("[data-form-status]");
  var submit = form.querySelector('button[type="submit"]');
  var params = new URLSearchParams(location.search);

  // Pre-fill from links such as ?type=corporate&tour=enlightenment
  var type = params.get("type");
  var typeSelect = form.elements.group_type;
  if (type && typeSelect.querySelector('option[value="' + CSS.escape(type) + '"]')) typeSelect.value = type;

  var tours = {};
  try { tours = JSON.parse(form.getAttribute("data-tours") || "{}"); } catch (e) {}
  var tour = params.get("tour");
  var themeSelect = form.elements.theme;
  if (tour && themeSelect.querySelector('option[value="' + CSS.escape(tour) + '"]')) themeSelect.value = tour;
  else if (tour === "thematic") themeSelect.value = themeSelect.options[1].value;
  if (tour && tours[tour] && !form.elements.message.value) {
    form.elements.message.value = form.getAttribute("data-tour-prefix") + " " + tours[tour] + "\n\n";
  }

  // No dates in the past
  var dateInput = form.elements.preferred_date;
  var today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);

  var show = function (msg, kind) {
    status.textContent = msg;
    status.className = "form-status" + (kind ? " is-" + kind : "");
  };

  form.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity()) e.target.removeAttribute("aria-invalid");
  });

  // Field names → labels used in the e-mail Sylvie receives (always English,
  // whatever the visitor's language).
  var MAIL_LABELS = {
    name: "Name", email: "Email", phone: "Phone", group_type: "Type of group", group_size: "Participants",
    theme: "Thematic visit", preferred_date: "Preferred date", tour_language: "Tour language",
    message: "Message", site_language: "Website language",
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var invalid = Array.prototype.filter.call(form.elements, function (el) {
      if (!el.willValidate) return false;
      var bad = !el.checkValidity();
      if (bad) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
      return bad;
    });
    if (invalid.length) {
      show(form.getAttribute("data-msg-invalid"), "error");
      invalid[0].focus();
      return;
    }
    if (form.elements.website.value) return; // honeypot: silently drop bots

    var data = {};
    new FormData(form).forEach(function (v, k) { if (k !== "website" && k !== "consent") data[k] = v; });

    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) {
      // No form service connected: say so instead of silently failing.
      show(form.getAttribute("data-msg-error"), "error");
      return;
    }

    var payload = {
      _subject: "Nouvelle demande de visite – " + data.name + " (" + data.group_size + " pers., " + data.preferred_date + ")",
      _replyto: data.email,
      _template: "table",
      _captcha: "false",
    };
    Object.keys(MAIL_LABELS).forEach(function (k) { if (data[k]) payload[MAIL_LABELS[k]] = data[k]; });

    var label = submit.textContent;
    submit.disabled = true;
    submit.textContent = form.getAttribute("data-msg-sending");

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (r) {
        // FormSubmit answers 200 with success "false" when something is wrong.
        if (!r.ok || String(r.body.success) === "false") throw new Error(r.body.message || "error");
        form.reset();
        show(form.getAttribute("data-msg-success"), "success");
      })
      .catch(function () {
        show(form.getAttribute("data-msg-error") + " ", "error");
        // The message invites visitors to write directly: give them the address.
        var addr = (endpoint.match(/[^/]+@[^/]+$/) || [])[0];
        if (addr) {
          var a = document.createElement("a");
          a.href = "mailto:" + addr + "?subject=" + encodeURIComponent(payload._subject);
          a.textContent = addr;
          status.appendChild(a);
        }
      })
      .then(function () { submit.disabled = false; submit.textContent = label; });
  });
})();
