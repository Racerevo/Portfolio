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
