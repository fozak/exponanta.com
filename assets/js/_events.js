// ─── _events.js — Events page loader ─────────────────────────────────────────
// Reads from /data/db.json, category=event, uses new schema with data.event_slot

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str) {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseSlot(slot) {
  if (!slot) return null;
  var start = slot.split('/')[0];
  var d = new Date(
    start.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    '$1-$2-$3T$4:$5:$6Z')
  );
  return isNaN(d.getTime()) ? null : d;
}

function formatSlotDisplay(slot) {
  var d = parseSlot(slot);
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short', month: 'short', day: 'numeric'
  }) + ' · ' + d.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: '2-digit'
  });
}

function formatSlotDay(slot) {
  var d = parseSlot(slot);
  if (!d) return { day: '', month: '' };
  return {
    day: d.toLocaleDateString('en-US', { timeZone: 'America/New_York', day: 'numeric' }),
    month: d.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short' }).toUpperCase()
  };
}

function tagClass(tag) {
  if (tag === 'Free') return 'etag--free';
  if (tag === 'Paid') return 'etag--coral';
  if (['Workshop','Conference','Meetup','Concert','Community','Outdoor'].includes(tag)) return 'etag--blue';
  if (['Online','In-Person','Hybrid'].includes(tag)) return 'etag--teal';
  return '';
}

function isImagePath(v) { return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(v); }

function getInitials(v) {
  if (!v) return '?';
  if (v.length <= 3 && !v.includes('/')) return v.toUpperCase();
  var parts = v.split('/').pop().split('.')[0].split(/[-_ ]+/);
  return parts.filter(Boolean).map(function(p) { return p[0].toUpperCase(); }).slice(0, 2).join('') || '?';
}

function avatarHtml(value) {
  if (!value || value === 'PH') {
    return '<span class="avatar avatar--ph">+</span>';
  }
  if (isImagePath(value)) {
    var initials = getInitials(value);
    return '<span class="avatar">'
      + '<img src="' + esc(value) + '" alt="" loading="lazy" '
      + 'onerror="this.remove();this.parentNode.textContent=\'' + initials + '\'">'
      + '</span>';
  }
  return '<span class="avatar">' + getInitials(value) + '</span>';
}

// ─── Upcoming event card ──────────────────────────────────────────────────────

function renderEventCard(ev) {
  var d = ev.data || {};
  var slot = formatSlotDisplay(d.event_slot);
  var dateParts = formatSlotDay(d.event_slot);
  var going = d.going || 0;
  var price = d.price === 0 ? 'Free' : (d.price ? '$' + d.price : '');
  var tags = (ev.tags || []).map(function(t) {
    return '<span class="etag ' + tagClass(t) + '">' + esc(t) + '</span>';
  }).join('');
  var avatars = (d.avatars || []).map(avatarHtml).join('');
  var calBtn = d.calendar && d.calendar.google
    ? '<a class="btn-ev-cal" href="' + esc(d.calendar.google) + '" target="_blank" rel="noopener">Add to Calendar</a>'
    : '';
  var regBtn = d.registerUrl
    ? '<a class="btn-ev-register" href="' + esc(d.registerUrl) + '" target="_blank" rel="noopener">Register</a>'
    : '';
  var connectBtn = d.connectUrl
    ? '<a class="btn-ev-connect" href="' + esc(d.connectUrl) + '" target="_blank" rel="noopener">Connect</a>'
    : '';

  return [
    '<div class="ed-event-card evh evh--v1 mb-3"',
    ' data-content-category="' + esc(ev.content_category || '') + '"',
    ' data-audience="' + esc(ev.audience || '') + '">',
      '<div class="evh__img">',
        '<img src="' + esc(ev.image || '') + '" alt="' + esc(ev.title) + '"',
          ' onerror="var s=parseInt(this.dataset.imgStep||0);',
            'if(s===0){this.src=\'/images/' + ev.page_name + '.jpg\';this.dataset.imgStep=1;}',
            'else if(s===1){this.src=\'/images/' + (ev.content_category||'default') + '.png\';this.dataset.imgStep=2;}',
            'else{this.onerror=null;this.src=\'\';}" data-img-step="0">',
        '<div class="evh__img-overlay"></div>',
        '<div class="event-card__date">',
          '<span class="event-card__date-day">' + dateParts.day + '</span>',
          '<span class="event-card__date-month">' + dateParts.month + '</span>',
        '</div>',
      '</div>',
      '<div class="evh__body">',
        '<div class="evh__title-row">',
          '<h3 class="evh__title">',
            d.registerUrl
              ? '<a href="' + esc(d.registerUrl) + '" target="_blank" rel="noopener">' + esc(ev.title) + '</a>'
              : esc(ev.title),
          '</h3>',
          '<div class="evh__tags">' + tags + '</div>',
        '</div>',
        '<p class="evh__desc">' + esc(ev.deck || '') + '</p>',
        '<div class="evh__meta">',
          slot ? '<div class="evh__meta-item">' + slot + '</div>' : '',
          d.location ? '<div class="evh__meta-item">' + esc(d.location) + '</div>' : '',
          price ? '<div class="evh__meta-item">' + price + '</div>' : '',
        '</div>',
        '<div class="evh__footer">',
          '<div class="evh__btns">' + calBtn + regBtn + connectBtn + '</div>',
          '<div class="avatar-stack">',
            avatars,
            going ? '<span class="av-label">' + going + ' going</span>' : '',
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}

// ─── Past event card ──────────────────────────────────────────────────────────

function renderPastCard(ev, index) {
  var d = ev.data || {};
  var start = parseSlot(d.event_slot);
  var dateStr = start ? start.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  }) : '';

  var photos = (d.photos && d.photos.length) ? d.photos
    : [1,2,3].map(function(n) { return 'events/' + ev.page_name + '-' + n + '.jpg'; });

  var carouselId = 'carousel-past-' + index;
  var carouselHtml;
  if (photos.length === 1) {
    carouselHtml = '<div class="past-card__carousel past-card__carousel--single">'
      + '<img src="' + esc(photos[0]) + '" alt="' + esc(ev.title) + '" loading="lazy">'
      + '</div>';
  } else {
    var indicators = photos.map(function(_, i) {
      return '<button type="button" data-bs-target="#' + carouselId + '" data-bs-slide-to="' + i + '" '
        + (i === 0 ? 'class="active" aria-current="true"' : '') + ' aria-label="Slide ' + (i+1) + '"></button>';
    }).join('');
    var slides = photos.map(function(src, i) {
      return '<div class="carousel-item ' + (i === 0 ? 'active' : '') + '">'
        + '<img src="' + esc(src) + '" alt="' + esc(ev.title) + ' photo ' + (i+1) + '" loading="lazy">'
        + '</div>';
    }).join('');
    carouselHtml = '<div class="past-card__carousel">'
      + '<div id="' + carouselId + '" class="carousel slide h-100" data-bs-ride="false">'
      + '<div class="carousel-indicators">' + indicators + '</div>'
      + '<div class="carousel-inner h-100">' + slides + '</div>'
      + '<button class="carousel-control-prev" type="button" data-bs-target="#' + carouselId + '" data-bs-slide="prev"><span class="carousel-control-prev-icon"></span></button>'
      + '<button class="carousel-control-next" type="button" data-bs-target="#' + carouselId + '" data-bs-slide="next"><span class="carousel-control-next-icon"></span></button>'
      + '</div></div>';
  }

  var highlights = (d.highlights || []).slice(0,3).map(function(h) {
    return '<li>' + esc(h) + '</li>';
  }).join('');

  var matHtml = '';
  if (d.materials && (d.materials.recording_url || d.materials.video || d.materials.slides_url || d.materials.slides)) {
    var links = [];
    if (d.materials.recording_url || d.materials.video)
      links.push('<a href="' + esc(d.materials.recording_url || d.materials.video) + '" target="_blank" rel="noopener">Watch</a>');
    if (d.materials.slides_url || d.materials.slides)
      links.push('<a href="' + esc(d.materials.slides_url || d.materials.slides) + '" target="_blank" rel="noopener">Slides</a>');
    if (links.length) {
      matHtml = '<div class="past-card__section"><div class="past-card__section-label">Materials</div>'
        + '<div class="past-card__materials">' + links.join('<span class="past-card__dot">·</span>') + '</div></div>';
    }
  }

  var connectHtml = d.connectUrl
    ? '<div class="past-card__section"><a href="' + esc(d.connectUrl) + '" class="past-card__connect" target="_blank" rel="noopener">Join community →</a></div>'
    : '';

  return '<div class="past-card">'
    + carouselHtml
    + '<div class="past-card__body">'
      + '<div class="past-card__header">'
        + '<h3 class="past-card__title">' + esc(ev.title) + '</h3>'
        + (d.going ? '<span class="past-card__attendees">' + d.going + ' attended</span>' : '')
      + '</div>'
      + (dateStr ? '<div class="past-card__meta">' + dateStr + (d.city ? ' · ' + esc(d.city) : '') + '</div>' : '')
      + (highlights ? '<div class="past-card__section"><ul class="past-card__highlights">' + highlights + '</ul></div>' : '')
      + matHtml
      + connectHtml
    + '</div>'
  + '</div>';
}

function renderPastGrid(events) {
  if (!events.length) return '';
  var rows = [];
  for (var i = 0; i < events.length; i += 2) {
    rows.push('<div class="past-grid__row">'
      + renderPastCard(events[i], i)
      + (events[i+1] ? renderPastCard(events[i+1], i+1) : '')
      + '</div>');
  }
  return rows.join('');
}

// ─── Load + render ────────────────────────────────────────────────────────────

function loadEvents() {
  fetch('/data/db.json')
    .then(function(r) { return r.json(); })
    .then(function(db) {
      var events = db.filter(function(d) {
        return d.doctype === 'webpage' && d.category === 'event' && d.docstatus === 1;
      });

      var now = Date.now();

      var upcoming = events.filter(function(ev) {
        var d = parseSlot(ev.data && ev.data.event_slot);
        return d && d.getTime() >= now;
      }).sort(function(a, b) {
        return parseSlot(a.data.event_slot) - parseSlot(b.data.event_slot);
      });

      var past = events.filter(function(ev) {
        var d = parseSlot(ev.data && ev.data.event_slot);
        return d && d.getTime() < now;
      }).sort(function(a, b) {
        return parseSlot(b.data.event_slot) - parseSlot(a.data.event_slot);
      });

      var upcomingEl = document.getElementById('events-container');
      if (upcomingEl) {
        upcomingEl.innerHTML = upcoming.length
          ? upcoming.map(renderEventCard).join('')
          : '<div class="text-muted py-4">No upcoming events.</div>';
      }

      var pastEl = document.getElementById('past-events-container');
      if (pastEl) {
        pastEl.innerHTML = past.length
          ? renderPastGrid(past)
          : '<div class="text-muted py-4">No past events yet.</div>';
      }
    })
    .catch(function(err) {
      console.error('Events load error:', err);
      var el = document.getElementById('events-container');
      if (el) el.innerHTML = '<div class="text-muted">Events unavailable.</div>';
    });
}

// ─── Chip filter — event delegation on document ───────────────────────────────
// Attached once at script parse time — immune to DOM changes from _loader.js
// Queries cards at click time so cards always exist when filter runs

document.addEventListener('click', function(e) {
  var pill = e.target.closest('[data-filter].ed-topic-pill');
  if (!pill) return;

  e.preventDefault();

  document.querySelectorAll('[data-filter].ed-topic-pill')
    .forEach(function(p) { p.classList.remove('ed-topic-pill--active'); });
  pill.classList.add('ed-topic-pill--active');

  var filter = pill.getAttribute('data-filter');

  document.querySelectorAll('.ed-event-card').forEach(function(card) {
    var cat = card.getAttribute('data-content-category');
    card.style.display = (filter === 'all' || cat === filter) ? '' : 'none';
  });
});

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadEvents);