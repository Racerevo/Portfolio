document.addEventListener("DOMContentLoaded", function () {
  // Navigation par points à droite : construite sur toute page
  // ayant au moins deux sections marquées d'un attribut data-dot.
  var dotSections = document.querySelectorAll("[data-dot]");
  if (dotSections.length > 1) {
    var dotsNav = document.createElement("nav");
    dotsNav.className = "fp-dots";
    dotsNav.setAttribute("aria-label", "Navigation des sections");
    var dots = [];
    dotSections.forEach(function (section) {
      if (!section.id) return;
      var dot = document.createElement("a");
      dot.className = "fp-dot";
      dot.href = "#" + section.id;
      dot.title = section.getAttribute("data-dot");
      dot.setAttribute("aria-label", section.getAttribute("data-dot"));
      dotsNav.appendChild(dot);
      dots.push(dot);
    });
    document.body.appendChild(dotsNav);

    if ("IntersectionObserver" in window) {
      var dotObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              dots.forEach(function (dot) {
                dot.classList.toggle("active", dot.getAttribute("href") === "#" + entry.target.id);
              });
            }
          });
        },
        { threshold: 0.4 }
      );
      dotSections.forEach(function (s) { dotObserver.observe(s); });
    }
  }

  // Page Projets plein écran : révélation au scroll
  var fpSections = document.querySelectorAll(".fp-section");
  if (fpSections.length) {
    if (!("IntersectionObserver" in window)) {
      fpSections.forEach(function (s) { s.classList.add("in-view"); });
    } else {
      var fpObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle("in-view", entry.isIntersecting);
          });
        },
        { threshold: 0.4 }
      );
      fpSections.forEach(function (s) { fpObserver.observe(s); });
    }
  }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Barre de progression de lecture en haut de page
  if (!reduced) {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    var ticking = false;
    var updateBar = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = "scaleX(" + ratio + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  // En-tête : classe "is-scrolled" dès qu'on quitte le haut de page
  var header = document.querySelector(".site-header");
  if (header) {
    var headerTicking = false;
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      headerTicking = false;
    };
    window.addEventListener("scroll", function () {
      if (!headerTicking) { headerTicking = true; window.requestAnimationFrame(updateHeader); }
    }, { passive: true });
    updateHeader();
  }

  // Révélation au scroll générique : la classe est posée en JS, donc le contenu
  // reste visible si le script ne s'exécute pas.
  var revealGroups = [
    ".page-header > *",
    ".page-content > *",
    ".contact-panel > *",
    ".section-title",
    ".hero-copy > *"
  ];
  var revealTargets = [];
  revealGroups.forEach(function (sel) {
    var found = document.querySelectorAll(sel);
    found.forEach(function (el, i) {
      if (el.closest(".fp-section") || el.classList.contains("sk-reveal") || el.classList.contains("fp-reveal")) return;
      el.classList.add("reveal");
      el.style.setProperty("--d", Math.min(i, 6) * 80 + "ms");
      revealTargets.push(el);
    });
  });

  if (revealTargets.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      revealTargets.forEach(function (el) { el.classList.add("in-view"); });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
      );
      revealTargets.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  // Page Compétences : révélation au scroll, élément par élément
  var skReveals = document.querySelectorAll(".sk-reveal");
  if (skReveals.length) {
    if (!("IntersectionObserver" in window)) {
      skReveals.forEach(function (el) { el.classList.add("in-view"); });
    } else {
      var skObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              skObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      skReveals.forEach(function (el) { skObserver.observe(el); });
    }
  }

  // Logos de technos : si le CDN ne répond pas, on retombe sur l'initiale
  document.querySelectorAll(".skill-chip-icon img").forEach(function (img) {
    img.addEventListener("error", function () {
      var span = document.createElement("span");
      span.className = "skill-chip-emoji";
      span.textContent = img.getAttribute("data-fallback") || "•";
      img.replaceWith(span);
    });
  });

  // ---------------------------------------------------------------------
  // Page Contact : panneau de rédaction déroulant + envoi
  // ---------------------------------------------------------------------
  var contactToggle = document.querySelector("[data-contact-toggle]");
  var contactPanel = document.getElementById("contact-form-panel");
  var contactForm = document.querySelector("[data-contact-form]");

  if (contactToggle && contactPanel) {
    contactToggle.addEventListener("click", function () {
      var open = contactPanel.classList.toggle("is-open");
      contactToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        window.setTimeout(function () {
          var first = contactPanel.querySelector("input[name=name]");
          if (first) first.focus({ preventScroll: true });
          contactPanel.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
        }, 380);
      }
    });
  }

  if (contactForm) {
    var feedback = contactForm.querySelector(".contact-feedback");
    var submitBtn = contactForm.querySelector(".contact-submit");

    var say = function (text, state) {
      if (!feedback) return;
      feedback.textContent = text;
      feedback.classList.remove("is-success", "is-error");
      if (state) feedback.classList.add(state);
    };

    // Validation maison : on garde la main sur les messages, en français.
    var checkFields = function () {
      var missing = null;
      contactForm.querySelectorAll("[required]").forEach(function (el) {
        var bad = !el.value.trim() || (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
        el.classList.toggle("is-invalid", bad);
        if (bad && !missing) missing = el;
      });
      return missing;
    };

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var missing = checkFields();
      if (missing) {
        say("Merci de compléter les champs en rouge.", "is-error");
        missing.focus();
        return;
      }

      var data = new FormData(contactForm);
      var accessKey = contactForm.getAttribute("data-key") || "";

      // Sans clé d'accès : on retombe sur la messagerie du visiteur.
      if (!accessKey) {
        var to = contactForm.getAttribute("data-mailto") || "";
        var corps =
          data.get("message") +
          "\n\n—\n" + data.get("name") +
          (data.get("company") ? " — " + data.get("company") : "") +
          "\n" + data.get("email");
        say("Ouverture de votre messagerie…");
        window.location.href =
          "mailto:" + to +
          "?subject=" + encodeURIComponent(data.get("subject")) +
          "&body=" + encodeURIComponent(corps);
        return;
      }

      // Avec clé : envoi direct, sans quitter la page.
      data.set("access_key", accessKey);
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = contactForm.getAttribute("data-sending") || "Envoi…";
      }
      say("");

      fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (res) {
          if (res && res.success) {
            contactForm.reset();
            say(contactForm.getAttribute("data-success") || "Message envoyé.", "is-success");
          } else {
            say(contactForm.getAttribute("data-error") || "L'envoi a échoué.", "is-error");
          }
        })
        .catch(function () {
          say(contactForm.getAttribute("data-error") || "L'envoi a échoué.", "is-error");
        })
        .then(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = contactForm.getAttribute("data-submit") || "Envoyer";
          }
        });
    });

    contactForm.addEventListener("input", function (e) {
      if (e.target.classList.contains("is-invalid")) e.target.classList.remove("is-invalid");
    });
  }

  var cards = document.querySelectorAll(".project-3d");
  if (!cards.length) return;

  if (!("IntersectionObserver" in window)) {
    cards.forEach(function (card) { card.classList.add("in-view"); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  cards.forEach(function (card) { observer.observe(card); });
});
