// Sylvie · Château de Voltaire — small progressive enhancements.
// Everything works without JavaScript; this adds the mobile menu,
// remembers the chosen language and makes the booking form friendlier.
(function () {
  "use strict";

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
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
  }

  // Remember the language choice so "/" sends returning visitors home.
  // Links in the switcher keep the current anchor and query (e.g. a
  // pre-selected tour) when changing language.
  try { localStorage.setItem("lang", document.documentElement.lang); } catch (e) {}
  document.querySelectorAll(".lang-switch a[data-lang]").forEach(function (a) {
    a.addEventListener("click", function () {
      try { localStorage.setItem("lang", a.getAttribute("data-lang")); } catch (e) {}
      if (location.search || location.hash) a.href = a.pathname + location.search + location.hash;
    });
  });

  // Gallery lightbox (plain links to the full image without JavaScript)
  var dialog = document.querySelector("[data-lightbox-dialog]");
  var shots = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  if (dialog && shots.length && dialog.showModal) {
    var img = dialog.querySelector("img");
    var cap = dialog.querySelector("figcaption");
    var current = 0;
    var showShot = function (i) {
      current = (i + shots.length) % shots.length;
      var link = shots[current];
      var thumb = link.querySelector("img");
      img.src = link.href;
      img.alt = thumb.alt;
      cap.textContent = thumb.alt;
    };
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

  // Booking form
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
    new FormData(form).forEach(function (v, k) { if (k !== "website") data[k] = v; });
    var labels = {};
    Array.prototype.forEach.call(form.querySelectorAll("label[for]"), function (l) {
      var el = document.getElementById(l.htmlFor);
      if (el && el.name) labels[el.name] = l.textContent.replace("*", "").trim();
    });
    if (typeSelect.value) data.group_type = typeSelect.options[typeSelect.selectedIndex].text;

    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) {
      // No form service configured: hand the request to the visitor's mail app.
      var lines = Object.keys(data).filter(function (k) { return k !== "consent"; }).map(function (k) {
        return (labels[k] || k) + ": " + data[k];
      });
      location.href = "mailto:" + form.getAttribute("data-email") +
        "?subject=" + encodeURIComponent(form.getAttribute("data-subject")) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      show(form.getAttribute("data-msg-mailto"), "success");
      return;
    }

    var label = submit.textContent;
    submit.disabled = true;
    submit.textContent = form.getAttribute("data-msg-sending");
    data._subject = form.getAttribute("data-subject");

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        show(form.getAttribute("data-msg-success"), "success");
      })
      .catch(function () { show(form.getAttribute("data-msg-error"), "error"); })
      .then(function () { submit.disabled = false; submit.textContent = label; });
  });
})();
