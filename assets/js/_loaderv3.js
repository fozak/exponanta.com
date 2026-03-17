/* _loader.js */

// Define the variable from the parentlink meta tag
var parentLinkMeta = document.querySelector('meta[name="parentlink"]');
/*var parentLink = parentLinkMeta ? parentLinkMeta.getAttribute("content") : null;

if (parentLink) {
  var linkParts = parentLink.split("/");
  var lastPart = linkParts.pop();
  var additionalContentUrl =
    linkParts.join("/") + "/" + lastPart + "-about.html";

  fetch(additionalContentUrl)
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text();
    })
    .then((data) => {
      var additionalContent = document.getElementById("additional-content");
      if (additionalContent) {
        additionalContent.innerHTML = data;
      } else {
        console.error("#additional-content element not found.");
      }
    })
    .catch((error) => {
      console.error("Error loading additional content:", error);
    });
} else {
  console.error("No parentlink meta tag found.");
}*/

// ─── Component loader ────────────────────────────────────────────────────────

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadComponents);
} else {
  loadComponents();
}

function loadComponents() {
  var loaders = document.querySelectorAll("[data-loader]");
  var promises = Array.from(loaders).map(loadOne);
  Promise.all(promises).then(hydrateStats);
}

function loadOne(el) {
  var url = el.getAttribute("data-loader");
  var props = el.dataset.props ? JSON.parse(el.dataset.props) : null;

  return fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error("Failed to load: " + url);
      return response.text();
    })
    .then(function (html) {
      var temp = document.createElement("div");
      temp.innerHTML = html;
      var inserted = temp.firstElementChild;
      el.replaceWith(inserted);
      if (props) resolveProps(inserted, props);
    })
    .catch(function (err) {
      console.warn("Component load failed:", err.message);
    });
}

function resolveProps(root, props) {
  root.querySelectorAll("[data-prop]").forEach(function (node) {
    var val = props[node.dataset.prop];
    if (val !== undefined) node.textContent = val;
  });
}

// ─── Stats hydration (runs after all components inserted) ────────────────────

function hydrateStats() {
  var stats = document.querySelectorAll("[data-stat]");
  if (!stats.length) return;

  fetch("/data/stats.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      stats.forEach(function (el) {
        var key = el.dataset.stat;
        if (data[key] !== undefined) el.textContent = data[key];
      });
    })
    .catch(function (err) { console.warn("Stats fetch failed:", err); });
}

// ─── Navbar toggler ──────────────────────────────────────────────────────────

function navbartoggle(x) {
  x.classList.toggle("change");
}

// ─── Number counter animation ────────────────────────────────────────────────

document
  .querySelectorAll(
    ".number-counter .number-counter__number-counter-column_counter-count .count"
  )
  .forEach(function (element) {
    const target = parseFloat(element.textContent);
    const duration = 4000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      element.textContent = Math.ceil(easing * target);
      if (progress < 1) requestAnimationFrame(updateCounter);
    }

    requestAnimationFrame(updateCounter);
  });

// ─── Bootstrap collapse (mobile nav) ─────────────────────────────────────────

document.addEventListener("click", function (e) {
  const toggleButton = e.target.closest('[data-toggle="collapse"]');
  if (toggleButton) {
    const targetId = toggleButton.getAttribute("data-target");
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
      toggleButton.setAttribute("aria-expanded", !isExpanded);
      targetElement.classList.toggle("show");
      navbartoggle(toggleButton);
    }
  }
});

// ─── Blog sidebar image ───────────────────────────────────────────────────────

function loadSidebarImage() {
  const currentUrl = window.location.pathname;
  if (!currentUrl.includes("/blog/")) return;

  const urlParts = currentUrl.split("/");
  let slug = urlParts[urlParts.length - 1].replace(/\.html$/, "");
  if (!slug) slug = "home";

  const svgPath = `/images/${slug}.svg`;
  const pngPath = `/images/${slug}.png`;

  const img = new Image();
  img.onload = function () {
    const sidebar = document.createElement("div");
    sidebar.id = "sidebar-image";
    sidebar.innerHTML = `<img src="${img.src}" alt="">`;
    document.getElementById("main-content")
      .insertAdjacentElement("afterbegin", sidebar);
  };
  img.onerror = function () {
    const pngImg = new Image();
    pngImg.onload = function () {
      const sidebar = document.createElement("div");
      sidebar.id = "sidebar-image";
      sidebar.innerHTML = `<img src="${pngPath}" alt="">`;
      document.getElementById("main-content")
        .insertAdjacentElement("afterbegin", sidebar);
    };
    pngImg.src = pngPath;
  };
  img.src = svgPath;
}

document.addEventListener("DOMContentLoaded", loadSidebarImage);

// ─── Scrolling text custom element ───────────────────────────────────────────

if (typeof ScrollingText !== "function") {
  class ScrollingText extends HTMLElement {
    constructor() {
      super();

      const getWidth = (element) => {
        const rect = element.getBoundingClientRect();
        return rect.right - rect.left;
      };

      class ScrollingController {
        constructor(box, speed) {
          const innerElement = box.children?.[0];
          if (!innerElement) throw new Error("No child node found");

          innerElement.style.position = "relative";
          this.position = 0;
          this.speed = speed;
          this.box = box;
          this.innerElement = innerElement.cloneNode(true);
          this.boxWidth = 0;
          this.innerElementWidth = 0;
          this._running = false;

          this.refreshWidths();
          this.setupChildren();
        }

        refreshWidths() {
          this.boxWidth = getWidth(this.box);
          this.innerElementWidth = getWidth(this.box.children[0]);
        }

        calculateNumElements() {
          return Math.ceil(this.boxWidth / this.innerElementWidth) + 1;
        }

        setupChildren() {
          const qty = this.calculateNumElements();
          const currentChildren = this.box.children.length;
          if (qty > currentChildren) {
            for (let i = currentChildren; i < qty; i++)
              this.box.appendChild(this.innerElement.cloneNode(true));
          } else if (qty < currentChildren) {
            for (let i = qty; i < currentChildren; i++)
              this.box.removeChild(this.box.lastChild);
          }
        }

        nextFrame(delta, direction) {
          this.refreshWidths();
          this.setupChildren();
          Array.from(this.box.children).forEach((el) => {
            el.style.transform = `translateX(${
              direction === "rtl" ? this.position : -this.position
            }px)`;
          });
          this.position += (this.speed * delta) / 1000;
          if (this.position >= this.innerElementWidth)
            this.position = this.position % this.innerElementWidth;
        }

        start(direction) {
          this._running = true;
          let lastTime = null;
          const loop = () => {
            if (!this._running) return;
            const now = Date.now();
            const delta = lastTime === null ? 0 : now - lastTime;
            this.nextFrame(delta, direction);
            lastTime = now;
            window.requestAnimationFrame(loop);
          };
          window.requestAnimationFrame(loop);
        }

        stop() {
          this._running = false;
        }
      }

      const speed =
        window.innerWidth > 768
          ? parseInt(this.dataset.scrollingSpeed)
          : parseInt(this.dataset.scrollingSpeed) / 1.5;

      const direction = this.dataset.scrollingDirection || "ltr";
      const scrollingText = new ScrollingController(this, speed);

      if (this.dataset.pauseOnHover === "true") {
        let windowInFocus = true;
        window.addEventListener("blur", () => (windowInFocus = false));
        window.addEventListener("focus", () => (windowInFocus = true));
        this.addEventListener("mouseover", () => {
          if (windowInFocus) scrollingText.stop();
        });
        this.addEventListener("mouseout", () => {
          if (windowInFocus) scrollingText.start(direction);
        });
      }

      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) scrollingText.start(direction);
        else scrollingText.stop();
      }).observe(this);
    }
  }

  if (typeof customElements.get("scrolling-text") === "undefined") {
    customElements.define("scrolling-text", ScrollingText);
  }
}

// ─── Sidebar mobile toggle ────────────────────────────────────────────────────

function toggleMobileSidebar() {
  const sidebar = document.getElementById("siteSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const isOpen = sidebar.classList.toggle("site-sidebar--mobile-open");
  backdrop.classList.toggle("sidebar-backdrop--visible", isOpen);
  document.body.style.overflow = isOpen ? "hidden" : "";
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    const sidebar = document.getElementById("siteSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar) sidebar.classList.remove("site-sidebar--mobile-open");
    if (backdrop) backdrop.classList.remove("sidebar-backdrop--visible");
    document.body.style.overflow = "";
  }
});
