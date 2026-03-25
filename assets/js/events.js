// =====================================================
// events.js — Exponanta event renderer
// Supports:
//   • old schema: /data/events.json  id:"event03052618" flat fields
//   • new schema: /data/db.json      category:"event" data.event_slot page_name
// Exposes globals: parseEventId, esc, slotToDate (for calendar.html)
// =====================================================

const EVENTS_JSON_URL = "/data/db.json";   // change to /data/events.json for legacy

const MONTHS = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC"
];
const MONTHS_LONG = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// =====================================================
// ESCAPE HTML
// =====================================================
function esc(str) {
  return (str ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =====================================================
// PARSE OLD SCHEMA: eventMMDDYYHH → date object
// id format: "event03052618"  = month03 day05 year26 hour18
// =====================================================
function parseEventId(id) {
  const m = String(id || "").match(/event(\d{2})(\d{2})(\d{2})(\d{2})/);
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
    timeLabel:  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    ts:         date.getTime()
  };
}

// =====================================================
// PARSE NEW SCHEMA: event_slot "20260319T220000Z/..." → Date
// =====================================================
function slotToDate(slot) {
  if (!slot) return null;
  const s = slot.split("/")[0]; // "20260319T220000Z"
  try {
    return new Date(
      s.slice(0,4) + "-" + s.slice(4,6) + "-" + s.slice(6,8) +
      "T" + s.slice(9,11) + ":" + s.slice(11,13) + ":00Z"
    );
  } catch { return null; }
}

// =====================================================
// NORMALISE — returns a unified event object
// regardless of which schema the raw record uses
// =====================================================
function normaliseEvent(raw) {
  // ── new db.json schema ──
  if (raw.doctype === "webpage" || raw.page_name) {
    const d   = raw.data || {};
    const dt  = slotToDate(d.event_slot);
    const ts  = dt ? dt.getTime() : 0;
    const mon = dt ? MONTHS[dt.getMonth()] : "";
    const day = dt ? dt.getDate() : "";
    const yr  = dt ? dt.getFullYear() : "";
    const wd  = dt ? dt.toLocaleDateString("en-US", { weekday: "short" }) : "";
    const tl  = dt ? dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) : "";
    return {
      _ts:         ts,
      _schema:     "new",
      id:          raw.page_name || raw.name,
      page_name:   raw.page_name || "",
      title:       raw.title || "",
      description: raw.deck  || "",
      image:       raw.image || "",
      tags:        raw.tags  || [],
      location:    d.location || raw.kicker || "",
      going:       d.going   || 0,
      attendees:   d.going   || 0,
      avatars:     d.avatars || [],
      status:      d.status  || "",
      highlights:  d.highlights || [],
      speakers:    d.speakers   || [],
      photos:      d.photos     || [],
      materials:   d.materials  || {},
      registerUrl: d.registerUrl  || `/events/event-detail.html?slug=${raw.page_name}`,
      connectUrl:  d.connectUrl  || "",
      communityUrl:"",
      calendar:    d.calendar   || {},
      presenter:   d.presenter  || "",
      source:      d.source     || "",
      _date: { day, month: dt?.getMonth() ?? 0, year: yr, monthLabel: mon, weekday: wd, timeLabel: tl, ts }
    };
  }

  // ── old events.json schema ──
  const d = parseEventId(raw.id);
  return {
    _ts:         d?.ts || 0,
    _schema:     "old",
    id:          raw.id,
    page_name:   "",
    title:       raw.title       || "",
    description: raw.description || "",
    image:       raw.image       || "",
    tags:        raw.tags        || [],
    location:    raw.location    || "",
    going:       raw.going       || 0,
    attendees:   raw.attendees   || raw.going || 0,
    avatars:     raw.avatars     || [],
    status:      raw.status      || "",
    highlights:  raw.highlights  || [],
    speakers:    raw.speakers    || [],
    photos:      raw.photos      || [],
    materials:   raw.materials   || {},
    registerUrl: raw.registerUrl || "",
    connectUrl:  raw.connectUrl  || "",
    communityUrl:raw.communityUrl|| "",
    calendar:    raw.calendar    || {},
    presenter:   raw.presenter   || "",
    source:      raw.source      || "",
    _date:       d || { day:0, month:0, year:0, monthLabel:"", weekday:"", timeLabel:"", ts:0 }
  };
}

// =====================================================
// STATUS LABEL
// =====================================================
function statusLabel(status) {
  const map = {
    filling:  "Almost Full",
    featured: "Featured",
    soldout:  "Sold Out",
    cancelled:"Cancelled",
  };
  return map[status] || "";
}

// =====================================================
// TAG → CSS CLASS (etag--*)
// =====================================================
function tagClass(tag) {
  if (tag === "Free")    return "etag--free";
  if (tag === "Paid")    return "etag--coral";
  if (["Workshop","Conference","Meetup","Concert","Community"].includes(tag)) return "etag--blue";
  if (["Online","In-Person"].includes(tag)) return "etag--teal";
  return "";
}

// =====================================================
// AVATAR HELPERS
// =====================================================
function isImagePath(value) {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(value || "");
}

function getInitials(value) {
  if (!value || value === "PH") return "?";
  if (value.length <= 3 && !value.includes("/")) return value.toUpperCase();
  const file  = value.split("/").pop().split(".")[0];
  const parts = file.split(/[-_ ]+/);
  return parts.filter(Boolean).map(p => p[0]?.toUpperCase() || "").slice(0, 2).join("") || "?";
}

function avatarHtml(value) {
  if (!value || value === "PH") return "";
  const initials = getInitials(value);
  if (isImagePath(value)) {
    return `<span class="avatar">
      <img src="${esc(value)}" alt="${esc(initials)}" loading="lazy"
           onerror="this.remove();this.parentNode.textContent='${initials}'">
    </span>`;
  }
  return `<span class="avatar">${esc(initials)}</span>`;
}

// =====================================================
// RESOLVE PHOTOS — fills blanks from id convention
// =====================================================
function resolvePhotos(ev) {
  if (ev.photos && ev.photos.length) return ev.photos;
  const base = `events/${ev.id}`;
  return [`${base}-1.jpg`, `${base}-2.jpg`, `${base}-3.jpg`];
}

// =====================================================
// RESOLVE MATERIALS — fills blanks from id convention
// =====================================================
function resolveMaterials(ev) {
  const m   = ev.materials || {};
  const base = `events/${ev.id}`;
  return {
    video:   m.video   || `${base}.mp4`,
    slides:  m.slides  || `${base}.pdf`,
    summary: m.summary || `${base}-summary.html`,
  };
}

// =====================================================
// RENDER CAROUSEL (for past cards)
// =====================================================
function renderCarousel(ev, index) {
  const photos = resolvePhotos(ev);
  const id     = `carousel-${index}`;
  const indicators = photos.map((_, i) =>
    `<button type="button" data-bs-target="#${id}" data-bs-slide-to="${i}"
       ${i === 0 ? 'class="active" aria-current="true"' : ""}
       aria-label="Slide ${i + 1}"></button>`
  ).join("");
  const slides = photos.map((src, i) =>
    `<div class="carousel-item ${i === 0 ? "active" : ""}">
      <img src="${esc(src)}" alt="${esc(ev.title)} photo ${i + 1}" loading="lazy">
    </div>`
  ).join("");
  return `
<div class="past-card__carousel">
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
// RENDER UPCOMING EVENT CARD (evh horizontal card)
// =====================================================
function renderEventCard(ev) {
  const d = ev._date;
  if (!d || !d.ts) return "";

  const statusHtml = ev.status
    ? `<div class="event-card__status event-card__status--${esc(ev.status)}">${esc(statusLabel(ev.status))}</div>`
    : "";

  const tagsHtml = ev.tags
    .map(t => `<span class="etag ${tagClass(t)}">${esc(t)}</span>`)
    .join("");

  const avatarsHtml = ev.avatars
    .filter(a => a && a !== "PH")
    .slice(0, 4)
    .map(avatarHtml)
    .join("");

  const moreCount = Math.max(0, (ev.going || 0) - (ev.avatars?.filter(a => a && a !== "PH").length || 0));

  const calendarBtn = ev.calendar?.google
    ? `<a class="btn-ev-cal" href="${esc(ev.calendar.google)}" target="_blank" rel="noopener">Add to Calendar</a>`
    : `<button class="btn-ev-cal" disabled>Add to Calendar</button>`;

  const registerBtn = ev.registerUrl
    ? `<a class="btn-ev-register" href="${esc(ev.registerUrl)}" target="_blank" rel="noopener">Register</a>`
    : "";

  const connectBtn = ev.connectUrl
    ? `<a class="btn-ev-connect" href="${esc(ev.connectUrl)}" target="_blank" rel="noopener">Connect</a>`
    : "";

  const titleHtml = ev.registerUrl
    ? `<a href="${esc(ev.registerUrl)}" target="_blank" rel="noopener">${esc(ev.title)}</a>`
    : esc(ev.title);

  return `
<div class="card event-card evh evh--v1 mb-3">
  <div class="evh__img">
    <img src="${esc(ev.image)}" alt="${esc(ev.title)}" loading="lazy"
         onerror="this.src='https://via.placeholder.com/400x220?text=Event'">
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
      <div class="evh__meta-item">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${d.weekday}, ${d.monthLabel} ${d.day} · ${d.timeLabel}
      </div>
      ${ev.location ? `<div class="evh__meta-item">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        ${esc(ev.location)}
      </div>` : ""}
      ${ev.going ? `<div class="evh__meta-item">${ev.going} going</div>` : ""}
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
        ${ev.going ? `<span class="av-label">${ev.going} going</span>` : ""}
      </div>
    </div>
  </div>
</div>`;
}

// =====================================================
// RENDER PAST EVENT CARD (carousel + body)
// =====================================================
function renderPastCard(ev, index) {
  const d = ev._date;
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
    mat.summary ? `<a href="${esc(mat.summary)}" target="_blank" rel="noopener">Summary</a>` : "",
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

  const connectUrl = ev.communityUrl || ev.connectUrl;
  const connectHtml = connectUrl
    ? `<div class="past-card__section">
        <a href="${esc(connectUrl)}" target="_blank" rel="noopener" class="past-card__connect">
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
    const res  = await fetch(EVENTS_JSON_URL);
    const data = await res.json();
    const now  = Date.now();

    // Support both flat array (events.json) and db.json wrapper
    const raw = Array.isArray(data) ? data : (data.items || data.events || []);

    // Normalise all records, filter to events only
    const events = raw
      .filter(r =>
        r.category === "event" ||                        // new schema
        String(r.id || "").startsWith("event")          // old schema
      )
      .filter(r =>
        r.docstatus === undefined || r.docstatus === 1  // published only
      )
      .map(normaliseEvent)
      .filter(ev => ev._ts > 0);                        // must have a valid date

    // Split upcoming / past
    const upcoming = events
      .filter(ev => ev._ts >= now)
      .sort((a, b) => a._ts - b._ts);    // nearest first ↑

    const past = events
      .filter(ev => ev._ts < now)
      .sort((a, b) => b._ts - a._ts);    // most recent first ↓

    // Render upcoming
    const upcomingEl = document.getElementById("events-container");
    if (upcomingEl) {
      upcomingEl.innerHTML = upcoming.length
        ? upcoming.map(renderEventCard).join("")
        : `<div class="text-muted">No upcoming events.</div>`;
    }

    // Render past
    const pastEl = document.getElementById("past-events-container");
    if (pastEl) {
      pastEl.innerHTML = past.length
        ? renderPastGrid(past)
        : `<div class="text-muted">No past events yet.</div>`;
    }

    // Expose normalised events globally for calendar.html fetch intercept
    window.__eventsLoaded = events;
    if (typeof window.__calReady === "function") window.__calReady(events);

  } catch (err) {
    console.error("Events load error:", err);
    const el = document.getElementById("events-container");
    if (el) el.innerHTML = `<div class="text-muted">Events unavailable.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadEvents);
