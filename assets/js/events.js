 // =====================================================
    // CONFIG
    // =====================================================
    const EVENTS_JSON_URL = "/data/events.json";
    const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

    // =====================================================
    // ESCAPE HTML
    // =====================================================
    function esc(str) {
      return (str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    // =====================================================
    // PARSE eventMMDDYYHH
    // =====================================================
    function parseEventId(id) {
      const m = id?.match(/event(\d{2})(\d{2})(\d{2})(\d{2})/);
      if (!m) return null;
      const month = parseInt(m[1], 10) - 1;
      const day   = parseInt(m[2], 10);
      const year  = 2000 + parseInt(m[3], 10);
      const hour  = parseInt(m[4], 10);
      const date  = new Date(year, month, day, hour);
      return {
        day,
        month,
        year,
        monthLabel: MONTHS[month],
        weekday:    date.toLocaleDateString("en-US", { weekday: "short" }),
        timeLabel:  `${hour.toString().padStart(2, "0")}:00`,
        ts:         date.getTime()
      };
    }

    // =====================================================
    // STATUS LABEL
    // =====================================================
    function statusLabel(status) {
      if (status === "filling")  return "Almost Full";
      if (status === "featured") return "Featured";
      return "";
    }

    // =====================================================
    // TAG → CSS
    // =====================================================
    function tagClass(tag) {
      if (tag === "Free") return "etag--free";
      if (tag === "Paid") return "etag--coral";
      if (["Workshop","Conference","Meetup","Concert","Community"].includes(tag)) return "etag--blue";
      if (["Online","In-Person"].includes(tag)) return "etag--teal";
      return "";
    }

    // =====================================================
    // AVATAR HELPERS
    // =====================================================
    function isImagePath(value) {
      return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(value);
    }

    function getInitials(value) {
      if (!value) return "?";
      if (value.length <= 3 && !value.includes("/")) return value.toUpperCase();
      const file  = value.split("/").pop();
      const name  = file.split(".")[0];
      const parts = name.split(/[-_ ]+/);
      return parts.filter(Boolean).map(p => p[0].toUpperCase()).slice(0, 2).join("") || "?";
    }

    function avatarHtml(value) {
      if (!value) return "";
      if (isImagePath(value)) {
        const initials = getInitials(value);
        return `<span class="avatar">
          <img src="${esc(value)}" alt="" loading="lazy"
               onerror="this.remove();this.parentNode.textContent='${initials}'">
        </span>`;
      }
      return `<span class="avatar">${getInitials(value)}</span>`;
    }

    // =====================================================
    // RESOLVE PHOTOS — empty array → auto-generate from id
    // =====================================================
    function resolvePhotos(ev) {
      if (ev.photos && ev.photos.length > 0) return ev.photos;
      return [1, 2, 3].map(n => `events/${ev.id}-${n}.jpg`);
    }

    // =====================================================
    // RESOLVE MATERIALS — missing keys → auto-generate
    // =====================================================
    function resolveMaterials(ev) {
      const base = `events/${ev.id}`;
      const m    = ev.materials || {};
      return {
        video:   m.video   ?? `${base}.mp4`,
        slides:  m.slides  ?? `${base}.pdf`,
        summary: m.summary ?? `${base}-summary.html`
      };
    }

    // =====================================================
    // RENDER UPCOMING EVENT CARD
    // =====================================================
    function renderEventCard(ev) {
      const d = parseEventId(ev.id);
      if (!d) return "";

      const statusHtml = ev.status
        ? `<div class="event-card__status event-card__status--${ev.status}">${statusLabel(ev.status)}</div>`
        : "";

      const tagsHtml = (ev.tags || [])
        .map(t => `<span class="etag ${tagClass(t)}">${esc(t)}</span>`)
        .join("");

      const avatarsHtml = (ev.avatars || []).map(avatarHtml).join("");
      const moreCount   = Math.max(0, (ev.going || 0) - (ev.avatars?.length || 0));

      const calendarBtn = ev.calendar?.google
        ? `<a class="btn-ev-cal" href="${ev.calendar.google}" target="_blank" rel="noopener">Add to Calendar</a>`
        : `<button class="btn-ev-cal">Add to Calendar</button>`;

      const registerBtn = ev.registerUrl
        ? `<a class="btn-ev-register" href="${ev.registerUrl}" target="_blank" rel="noopener">Register</a>`
        : "";

      const connectBtn = ev.connectUrl
        ? `<a class="btn-ev-connect" href="${ev.connectUrl}" target="_blank" rel="noopener">Connect</a>`
        : `<button class="btn-ev-connect">Connect</button>`;

      const titleHtml = ev.registerUrl
        ? `<a href="${ev.registerUrl}" target="_blank" rel="noopener">${esc(ev.title)}</a>`
        : esc(ev.title);

      return `
<div class="card event-card evh evh--v1 mb-3">
  <div class="evh__img">
    <img src="${esc(ev.image)}" alt="${esc(ev.title)}">
    <div class="evh__img-overlay"></div>
    ${statusHtml}
    <div class="event-card__date">
      <span class="event-card__date-day">${String(d.day).padStart(2, "0")}</span>
      <span class="event-card__date-month">${d.monthLabel}</span>
    </div>
  </div>
  <div class="evh__body">
    <div class="evh__title-row">
      <h3 class="evh__title">${titleHtml}</h3>
      <div class="evh__tags">${tagsHtml}</div>
    </div>
    <p class="evh__desc">${esc(ev.description)}</p>
    <div class="evh__meta">
      <div class="evh__meta-item">${d.weekday}, ${d.monthLabel} ${d.day} · ${d.timeLabel}</div>
      <div class="evh__meta-item">${esc(ev.location)}</div>
      <div class="evh__meta-item">${ev.going || 0} going</div>
    </div>
    <div class="evh__footer">
      <div class="evh__btns">
        ${calendarBtn}
        ${registerBtn}
        ${connectBtn}
      </div>
      <div class="avatar-stack">
        ${avatarsHtml}
        ${moreCount > 0 ? `<span class="avatar avatar-more">+${moreCount}</span>` : ""}
        <span class="av-label">${ev.going || 0} going</span>
      </div>
    </div>
  </div>
</div>`;
    }

    // =====================================================
    // RENDER CAROUSEL for past card
    // =====================================================
    function renderCarousel(ev, index) {
      const images = resolvePhotos(ev);
      const id     = `carousel-past-${index}`;

      if (images.length === 1) {
        return `<div class="past-card__carousel past-card__carousel--single">
          <img src="${esc(images[0])}" alt="${esc(ev.title)}" loading="lazy">
        </div>`;
      }

      const indicators = images.map((_, i) => `
        <button type="button"
          data-bs-target="#${id}" data-bs-slide-to="${i}"
          ${i === 0 ? 'class="active" aria-current="true"' : ''}
          aria-label="Slide ${i + 1}">
        </button>`).join("");

      const slides = images.map((src, i) => `
        <div class="carousel-item ${i === 0 ? "active" : ""}">
          <img src="${esc(src)}" alt="${esc(ev.title)} photo ${i + 1}" loading="lazy">
        </div>`).join("");

      return `<div class="past-card__carousel">
        <div id="${id}" class="carousel slide h-100" data-bs-ride="false">
          <div class="carousel-indicators">${indicators}</div>
          <div class="carousel-inner h-100">${slides}</div>
          <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>
        </div>
      </div>`;
    }

    // =====================================================
    // RENDER SINGLE PAST CARD
    // =====================================================
    function renderPastCard(ev, index) {
      const d = parseEventId(ev.id);
      if (!d) return "";

      const mat = resolveMaterials(ev);

      const highlightsHtml = (ev.highlights || []).slice(0, 3)
        .map(h => `<li>${esc(h)}</li>`)
        .join("");

      const speakersHtml = ev.speakers?.length
        ? `<div class="past-card__speakers">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            ${ev.speakers.map(esc).join(" · ")}
          </div>`
        : "";

      const matLinks = [
        mat.video   ? `<a href="${esc(mat.video)}"   target="_blank" rel="noopener">Watch</a>`   : "",
        mat.slides  ? `<a href="${esc(mat.slides)}"  target="_blank" rel="noopener">Slides</a>`  : "",
        mat.summary ? `<a href="${esc(mat.summary)}" target="_blank" rel="noopener">Summary</a>` : ""
      ].filter(Boolean);

      const materialsHtml = matLinks.length
        ? `<div class="past-card__section">
            <div class="past-card__section-label">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Materials
            </div>
            <div class="past-card__materials">
              ${matLinks.join('<span class="past-card__dot">·</span>')}
            </div>
          </div>`
        : "";

      const connectHtml = (ev.communityUrl || ev.connectUrl)
        ? `<div class="past-card__section">
            <a href="${esc(ev.communityUrl || ev.connectUrl)}"
               class="past-card__connect"
               target="_blank" rel="noopener">
              Join community →
            </a>
          </div>`
        : "";

      return `
<div class="past-card">
  ${renderCarousel(ev, index)}
  <div class="past-card__body">
    <div class="past-card__header">
      <h3 class="past-card__title">${esc(ev.title)}</h3>
      ${ev.attendees ? `<span class="past-card__attendees">${ev.attendees} attended</span>` : ""}
    </div>
    <div class="past-card__meta">
      ${d.weekday}, ${d.monthLabel} ${d.day} ${d.year} · ${esc(ev.location)}
    </div>
    ${speakersHtml}
    ${highlightsHtml ? `
      <div class="past-card__section">
        <div class="past-card__section-label">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Highlights
        </div>
        <ul class="past-card__highlights">${highlightsHtml}</ul>
      </div>` : ""}
    ${materialsHtml}
    ${connectHtml}
  </div>
</div>`;
    }

    // =====================================================
    // RENDER PAST GRID — 2 cards per row
    // =====================================================
    function renderPastGrid(pastEvents) {
      if (!pastEvents.length) return "";
      const rows = [];
      for (let i = 0; i < pastEvents.length; i += 2) {
        const card1 = renderPastCard(pastEvents[i], i);
        const card2 = pastEvents[i + 1] ? renderPastCard(pastEvents[i + 1], i + 1) : "";
        rows.push(`<div class="past-grid__row">${card1}${card2}</div>`);
      }
      return rows.join("");
    }

    // =====================================================
    // LOAD + RENDER
    // =====================================================
    async function loadEvents() {
      try {
        const res    = await fetch(EVENTS_JSON_URL);
        const events = await res.json();
        const now    = Date.now();

        const upcoming = events.filter(ev => (parseEventId(ev.id)?.ts || 0) >= now);
        const past     = events.filter(ev => (parseEventId(ev.id)?.ts || 0) <  now);

        upcoming.sort((a, b) => (parseEventId(a.id)?.ts || 0) - (parseEventId(b.id)?.ts || 0));
        past.sort(    (a, b) => (parseEventId(b.id)?.ts || 0) - (parseEventId(a.id)?.ts || 0));

        const upcomingEl = document.getElementById("events-container");
        if (upcomingEl) {
          upcomingEl.innerHTML = upcoming.length
            ? upcoming.map(renderEventCard).join("")
            : `<div class="text-muted">No upcoming events.</div>`;
        }

        const pastEl = document.getElementById("past-events-container");
        if (pastEl) {
          pastEl.innerHTML = past.length
            ? renderPastGrid(past)
            : `<div class="text-muted">No past events yet.</div>`;
        }

      } catch (err) {
        console.error("Events load error:", err);
        const el = document.getElementById("events-container");
        if (el) el.innerHTML = `<div class="text-muted">Events unavailable.</div>`;
      }
    }

    document.addEventListener("DOMContentLoaded", loadEvents);