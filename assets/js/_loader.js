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

// ─── Audience resolution ─────────────────────────────────────────────────────

var audience = document.querySelector('meta[name="audience"]')
  ?.getAttribute("content") || "default";

function resolveAudience(root) {
  var variants = root.querySelectorAll("[data-audience]");
  if (!variants.length) return;

  var hasMatch = Array.from(variants)
    .some(function (el) { return el.dataset.audience === audience; });

  variants.forEach(function (el) {
    var show = el.dataset.audience === audience
      || (el.dataset.audience === "default" && !hasMatch);
    el.style.display = show ? "" : "none";
  });
}

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
      resolveAudience(inserted);
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


//--loader for categories ---

// ─── db.json cache ────────────────────────────────────────────────────────────

var _db = null;

function loadDb() {
  if (_db) return Promise.resolve(_db);
  return fetch('/data/db.json')
    .then(function(r) { return r.json(); })
    .then(function(data) { _db = data; return data; })
    .catch(function(err) { console.warn('db.json failed:', err); return []; });
}

// ─── Doc lookup helpers ───────────────────────────────────────────────────────

function getDoc(doctype, name) {
  return (_db || []).find(function(d) {
    return d.doctype === doctype && d.name === name;
  });
}

function getDocByPageName(pageName) {
  return (_db || []).find(function(d) {
    return d.page_name === pageName;
  });
}

// ─── Name generator ───────────────────────────────────────────────────────────

function generateName(doctype) {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var random = '';
  for (var i = 0; i < 8; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return doctype + random;
}

// ─── Image fallback ───────────────────────────────────────────────────────────
// Cascade: item.image → {page_name}.png → {page_name}.jpg
//        → {content_category}.png → {content_category}.jpg → empty (stop)
// data-img-step tracks position so onerror never loops

function buildImgTag(item, alt) {
  var base      = '/images/' + item.page_name;
  var primary   = item.image || (base + '.png');
  var fallback1 = base + '.jpg';
  var fallback2 = '/images/' + (item.content_category || 'default') + '.png';
  var fallback3 = '/images/' + (item.content_category || 'default') + '.jpg';

  return '<img src="' + primary + '" alt="' + (alt || '') + '" data-img-step="0" '
       + 'onerror="'
       +   'var s=parseInt(this.dataset.imgStep||0);'
       +   'if(s===0){this.src=\'' + fallback1 + '\';this.dataset.imgStep=1;}'
       +   'else if(s===1){this.src=\'' + fallback2 + '\';this.dataset.imgStep=2;}'
       +   'else if(s===2){this.src=\'' + fallback3 + '\';this.dataset.imgStep=3;}'
       +   'else{this.onerror=null;this.src=\'\';}'
       + '">';
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

function parseEventSlot(slot) {
  // "20260409T220000Z" → Date
  // handles event_slot "20260409T220000Z/20260410T000000Z" — takes start
  var start = (slot || '').split('/')[0];
  return new Date(
    start.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    '$1-$2-$3T$4:$5:$6Z')
  );
}

function sortItems(items, section) {
  if (section === 'event') {
    // ascending — nearest event first, future events lower
    return items.slice().sort(function(a, b) {
      return parseEventSlot(a.data && a.data.event_slot)
           - parseEventSlot(b.data && b.data.event_slot);
    });
  }
  // descending — newest published first for blog, people, program
  return items.slice().sort(function(a, b) {
    return new Date(b.published_date) - new Date(a.published_date);
  });
}

// ─── Load more — state per section ───────────────────────────────────────────

var _loadMoreState = {
  blog:    { page: 0, hardcoded: 4, batchSize: 6 },
  event:   { page: 0, hardcoded: 3, batchSize: 6 },
  people:  { page: 0, hardcoded: 0, batchSize: 9 },
  program: { page: 0, hardcoded: 0, batchSize: 6 }
};

function resetLoadMore() {
  Object.keys(_loadMoreState).forEach(function(key) {
    _loadMoreState[key].page = 0;
  });
  document.querySelectorAll('.btn-more').forEach(function(btn) {
    btn.style.display = '';
    btn.disabled = false;
    var section = btn.dataset.section;
    btn.textContent = 'Load more ' + (section || 'items') + 's \u2192';
  });
}

function initLoadMore() {
  document.querySelectorAll('.btn-more').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var self = this;
      var section = self.dataset.section;
      var state = _loadMoreState[section];
      if (!state) return;

      self.textContent = 'Loading\u2026';
      self.disabled = true;

      loadDb().then(function(db) {
        var activeFilter = document.querySelector('[data-filter].ed-topic-pill--active')
          ?.dataset.filter || 'all';

        var items = db.filter(function(d) {
          return d.docstatus === 1 &&
                 d.category === section &&
                 (activeFilter === 'all' || d.content_category === activeFilter);
        });

        items = sortItems(items, section);

        var start = state.hardcoded + (state.page * state.batchSize);
        var batch = items.slice(start, start + state.batchSize);

        if (batch.length === 0) {
          self.style.display = 'none';
          return;
        }

        var grid = self.closest('.ed-section').querySelector('.ed-grid-3');
        batch.forEach(function(item) {
          grid.insertAdjacentHTML('beforeend', buildCard(item, section));
        });

        state.page++;

        var nextStart = state.hardcoded + (state.page * state.batchSize);
        if (nextStart >= items.length) {
          self.style.display = 'none';
        } else {
          self.textContent = 'Load more ' + section + 's \u2192';
          self.disabled = false;
        }
      });
    });
  });
}

// ─── Card builders ────────────────────────────────────────────────────────────

function buildCard(item, section) {
  switch (section) {
    case 'blog':    return buildBlogCard(item);
    case 'event':   return buildEventCard(item);
    case 'people':  return buildPeopleCard(item);
    case 'program': return buildProgramCard(item);
    default:        return buildBlogCard(item);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatEventSlot(slot) {
  if (!slot) return '';
  var d = parseEventSlot(slot);
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function buildBlogCard(post) {
  return [
    '<div class="ed-card" data-category="' + (post.audience || 'default') + '">',
      '<a href="' + post.url + '" class="ed-card__img ed-img ed-img--16-9">',
        buildImgTag(post, post.title),
      '</a>',
      '<div class="ed-card__body">',
        '<span class="ed-kicker">' + (post.kicker || '') + '</span>',
        '<h3 class="ed-title"><a href="' + post.url + '">' + post.title + '</a></h3>',
        '<p class="ed-deck" style="font-size:15px;">' + (post.deck || '') + '</p>',
        '<div class="ed-byline">',
          '<strong>' + formatDate(post.published_date) + '</strong>',
          '<span class="ed-byline__dot">\u00b7</span>',
          (post.content_category || ''),
          post.data && post.data.read_time_minutes
            ? '<span class="ed-byline__dot">\u00b7</span>' + post.data.read_time_minutes + ' min read'
            : '',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}

function buildEventCard(event) {
  var slot    = event.data && event.data.event_slot ? formatEventSlot(event.data.event_slot) : '';
  var going   = event.data && event.data.going ? event.data.going + ' going' : '';
  var price   = event.data && event.data.price === 0 ? 'Free'
              : event.data && event.data.price ? '$' + event.data.price : '';
  var city    = event.data && event.data.city ? event.data.city : '';
  return [
    '<div class="ed-card" data-category="' + (event.audience || 'default') + '">',
      '<a href="' + event.url + '" class="ed-card__img ed-img ed-img--16-9">',
        buildImgTag(event, event.title),
      '</a>',
      '<div class="ed-card__body">',
        '<span class="ed-kicker">' + (event.kicker || '') + '</span>',
        '<h3 class="ed-title"><a href="' + event.url + '">' + event.title + '</a></h3>',
        '<p class="ed-deck" style="font-size:15px;">' + (event.deck || '') + '</p>',
        '<div class="ed-byline">',
          slot ? '<strong>' + slot + '</strong>' : '',
          city ? '<span class="ed-byline__dot">\u00b7</span>' + city : '',
          going ? '<span class="ed-byline__dot">\u00b7</span>' + going : '',
          price ? '<span class="ed-byline__dot">\u00b7</span>' + price : '',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}

function buildPeopleCard(person) {
  var role    = person.data && person.data.role ? person.data.role : '';
  var company = person.data && person.data.company ? person.data.company : '';
  return [
    '<div class="ed-card" data-category="' + (person.audience || 'default') + '">',
      '<a href="' + person.url + '" class="ed-card__img ed-img ed-img--1-1">',
        buildImgTag(person, person.title),
      '</a>',
      '<div class="ed-card__body">',
        '<span class="ed-kicker">' + (person.kicker || '') + '</span>',
        '<h3 class="ed-title"><a href="' + person.url + '">' + person.title + '</a></h3>',
        role || company
          ? '<p class="ed-deck" style="font-size:15px;">'
              + (role ? role : '')
              + (role && company ? ' · ' : '')
              + (company ? company : '')
            + '</p>'
          : '',
      '</div>',
    '</div>'
  ].join('');
}

function buildProgramCard(program) {
  return [
    '<div class="ed-card" data-category="' + (program.audience || 'default') + '">',
      '<a href="' + program.url + '" class="ed-card__img ed-img ed-img--16-9">',
        buildImgTag(program, program.title),
      '</a>',
      '<div class="ed-card__body">',
        '<span class="ed-kicker">' + (program.kicker || '') + '</span>',
        '<h3 class="ed-title"><a href="' + program.url + '">' + program.title + '</a></h3>',
        '<p class="ed-deck" style="font-size:15px;">' + (program.deck || '') + '</p>',
        '<div class="ed-byline">',
          formatDate(program.published_date),
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}

// ─── Chip filter ──────────────────────────────────────────────────────────────

function initChipFilter() {
  document.querySelectorAll('[data-filter].ed-topic-pill').forEach(function(pill) {
    pill.addEventListener('click', function() {
      document.querySelectorAll('[data-filter].ed-topic-pill')
        .forEach(function(p) { p.classList.remove('ed-topic-pill--active'); });
      this.classList.add('ed-topic-pill--active');

      var activeFilter = this.dataset.filter;
      var activeSection = document.querySelector('[data-section].ed-topic-pill--active')
        ?.dataset.section || 'all';

      document.querySelectorAll('.ed-card, .ed-featured').forEach(function(card) {
        var sectionMatch = activeSection === 'all' || getSection(card) === activeSection;
        var categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
        card.style.display = (sectionMatch && categoryMatch) ? '' : 'none';
      });

      resetLoadMore();
    });
  });

  document.querySelectorAll('[data-section].ed-topic-pill').forEach(function(pill) {
    pill.addEventListener('click', function() {
      document.querySelectorAll('[data-section].ed-topic-pill')
        .forEach(function(p) { p.classList.remove('ed-topic-pill--active'); });
      this.classList.add('ed-topic-pill--active');

      var activeSection = this.dataset.section;
      var activeFilter = document.querySelector('[data-filter].ed-topic-pill--active')
        ?.dataset.filter || 'all';

      document.querySelectorAll('.ed-card, .ed-featured').forEach(function(card) {
        var sectionMatch = activeSection === 'all' || getSection(card) === activeSection;
        var categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
        card.style.display = (sectionMatch && categoryMatch) ? '' : 'none';
      });

      resetLoadMore();
    });
  });
}

function getSection(card) {
  var href = card.querySelector('a')?.getAttribute('href') || '';
  if (href.includes('/blog/'))     return 'blog';
  if (href.includes('/events/'))   return 'event';
  if (href.includes('/people/'))   return 'people';
  if (href.includes('/programs/')) return 'program';
  return 'other';
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  initLoadMore();
  initChipFilter();
});