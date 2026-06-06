event schema runner · JS
// ============================================================
// IIEE AUTOMATED RUNNER — Event Schema
// 1. Sends TASK + current Schema to Claude
// 2. Parses JSON response → updates CW.Schema['Event']
// 3. Runs IIEE tests
// 4. Reports pass/fail
// Paste entire file into browser console
// ============================================================
 
(async () => {
 
  // ── 0. CONFIG ─────────────────────────────────────────────
  const TASK = 'Analyze this CW Schema for doctype=Event. Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with minimal changes needed to efficiently filter past vs future events using data.event_start as an ISO datetime field inside a PocketBase JSON data column. Preserve all existing fields. Add event_start (Datetime, reqd:1, in_list_view:1, read_only:1) and event_end (Datetime, reqd:0, read_only:1) after event_slot if not already present.'
 
  const Schema = {
  "name": "Event",
  "schema_name": "Event",
  "doctype": "Schema",
  "is_submittable": 1,
  "is_public": 1,
  "title_field": "title",
  "autoname": "generateId",
  "view_components": {
    "list": { "component": "UniversalGrid", "container": "right_pane" },
    "form": { "component": "MainForm",      "container": "right_pane" }
  },
  "fields": [
    { "fieldname": "name",                "fieldtype": "Data",            "label": "Name",                  "in_list_view": 1, "read_only": 1, "hidden": 0 },
    { "fieldname": "section_identity",    "fieldtype": "Section Break",   "label": "Event" },
    { "fieldname": "title",               "fieldtype": "Data",            "label": "Title",                 "reqd": 1, "in_list_view": 1 },
    { "fieldname": "relationship_parent", "fieldtype": "Table",           "label": "Event Relationships",   "options": "Relationship", "in_list_view": 0, "search_index": 1 },
    { "fieldname": "deck",                "fieldtype": "Text",            "label": "Tagline" },
    { "fieldname": "kicker",              "fieldtype": "Data",            "label": "Kicker" },
    { "fieldname": "featured",            "fieldtype": "Check",           "label": "Featured" },
    { "fieldname": "lang",                "fieldtype": "Select",          "label": "Language",              "options": "en\nru\nes" },
    { "fieldname": "section_classify",    "fieldtype": "Section Break",   "label": "Classification" },
    { "fieldname": "category",            "fieldtype": "Data",            "label": "Category" },
    { "fieldname": "content_category",    "fieldtype": "Data",            "label": "Content Category" },
    { "fieldname": "audience",            "fieldtype": "Data",            "label": "Primary Audience" },
    { "fieldname": "tags",                "fieldtype": "Data",            "label": "Tags" },
    { "fieldname": "section_logistics",   "fieldtype": "Section Break",   "label": "Logistics" },
    { "fieldname": "event_slot",          "fieldtype": "Data",            "label": "Date/Time Slot",        "component": "./slot-picker.js", "display": "SlotBadge", "reqd": 1, "in_list_view": 1 },
    { "fieldname": "event_start",         "fieldtype": "Datetime",        "label": "Event Start",           "reqd": 1, "in_list_view": 1, "read_only": 1, "description": "Derived from event_slot. Used for filtering past vs future events." },
    { "fieldname": "event_end",           "fieldtype": "Datetime",        "label": "Event End",             "reqd": 0, "read_only": 1,    "description": "Derived from event_slot. Used for detecting in-progress events." },
    { "fieldname": "availability_rule",   "fieldtype": "Link",            "label": "Availability Rule",     "options": "AvailabilityRule", "reqd": 0 },
    { "fieldname": "format",              "fieldtype": "Select",          "label": "Format",                "options": "in-person\nonline\nhybrid" },
    { "fieldname": "docsubtype",          "fieldtype": "Select",          "label": "Type",                  "options": "conference\nmeetup\nworkshop\nwebinar\n1-1\nother", "reqd": 0, "in_list_view": 1 },
    { "fieldname": "location",            "fieldtype": "Data",            "label": "Location" },
    { "fieldname": "city",                "fieldtype": "Data",            "label": "City" },
    { "fieldname": "region",              "fieldtype": "Data",            "label": "Region" },
    { "fieldname": "country",             "fieldtype": "Data",            "label": "Country" },
    { "fieldname": "virtual_url",         "fieldtype": "Data",            "label": "Virtual URL" },
    { "fieldname": "price",               "fieldtype": "Currency",        "label": "Price" },
    { "fieldname": "currency",            "fieldtype": "Data",            "label": "Currency" },
    { "fieldname": "capacity",            "fieldtype": "Int",             "label": "Capacity" },
    { "fieldname": "section_settings",    "fieldtype": "Section Break",   "label": "Settings" },
    { "fieldname": "allow_guest_booking", "fieldtype": "Check",           "label": "Allow Guest Booking" },
    { "fieldname": "guest_verification",  "fieldtype": "Select",          "label": "Guest Verification",    "options": "none\nemail\napproval" },
    { "fieldname": "section_content",     "fieldtype": "Section Break",   "label": "Content" },
    { "fieldname": "body",                "fieldtype": "Text",            "label": "Description" },
    { "fieldname": "highlights",          "fieldtype": "Code",            "label": "Highlights",            "options": "JSON" },
    { "fieldname": "photos",              "fieldtype": "Code",            "label": "Photos",                "options": "JSON" },
    { "fieldname": "section_web",         "fieldtype": "Section Break",   "label": "Web Page" },
    { "fieldname": "webpage",             "fieldtype": "Table",           "label": "Web Page",              "options": "WebPage" },
    { "fieldname": "section_people",      "fieldtype": "Section Break",   "label": "People & Organizations" },
    { "fieldname": "relationships",       "fieldtype": "Relationship Panel", "label": "Relationships" }
  ],
  "permissions": [{ "role": "Event Manager", "read": 1, "write": 1, "create": 1, "delete": 1 }],
  "relationship_roles": {
    "User": {
      "Organizer":       { "transitions": ["0_1", "0_2", "1_2", "2_0"] },
      "Attendee":        { "transitions": ["0_1", "0_2", "1_2"] },
      "Speaker":         { "transitions": ["0_2", "1_2"] },
      "Volunteer":       { "transitions": ["0_2", "1_2"] },
      "Sponsor Contact": { "transitions": ["0_2", "1_2"] }
    }
  },
  "_state": {
    "0": {
      "values": [0, 1, 2],
      "options": ["Draft", "Published", "Archived"],
      "transitions": { "0": [1, 2], "1": [2], "2": [0] },
      "labels":      { "0_1": "Publish", "0_2": "Archive", "1_2": "Archive", "2_0": "Restore" },
      "views":       { "0": "edit", "1": "read", "2": "read" },
      "requires":    { "0_1": { "is_submittable": 1 } },
      "sideEffects": {}, "rules": {}, "primary": { "0_1": true }
    }
  },
  "field_order": ["name"]
}
 
  const report = { steps: [], pass: null }
  const step = (label, ok, detail) => {
    report.steps.push({ label, ok, detail })
    console.log(ok ? `✅ ${label}` : `❌ ${label}`, detail ?? '')
  }
 
  // ── 1. CALL CLAUDE ────────────────────────────────────────
  console.log('▶ Step 1: asking Claude for updated schema JSON...')
  let updatedSchema
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `${TASK}\n\nSchema:\n${JSON.stringify(Schema, null, 2)}`
        }]
      })
    })
    const data = await res.json()
    const raw = data.content.map(b => b.text || '').join('').trim()
    // strip markdown fences if present
    const clean = raw.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim()
    updatedSchema = JSON.parse(clean)
    step('Claude returned valid JSON schema', true, `fields: ${updatedSchema.fields?.length}`)
  } catch (e) {
    step('Claude returned valid JSON schema', false, e.message)
    console.error('Aborting — schema parse failed'); return
  }
 
  // ── 2. VALIDATE REQUIRED FIELDS PRESENT ──────────────────
  console.log('▶ Step 2: validating event_start / event_end in schema...')
  const fieldNames = updatedSchema.fields.map(f => f.fieldname)
  const hasStart = fieldNames.includes('event_start')
  const hasEnd   = fieldNames.includes('event_end')
  step('event_start field present', hasStart)
  step('event_end field present',   hasEnd)
 
  const startField = updatedSchema.fields.find(f => f.fieldname === 'event_start')
  step('event_start is Datetime type', startField?.fieldtype === 'Datetime', startField?.fieldtype)
  step('event_start reqd:1',          startField?.reqd === 1)
 
  // ── 3. ASSIGN TO CW.Schema ───────────────────────────────
  console.log('▶ Step 3: assigning to CW.Schema[\'Event\']...')
  try {
    CW.Schema['Event'] = updatedSchema
    const live = CW.Schema['Event'].fields.map(f => f.fieldname)
    step('CW.Schema[\'Event\'] updated', live.includes('event_start'), `${live.length} fields`)
  } catch (e) {
    step('CW.Schema[\'Event\'] updated', false, e.message)
    console.error('Aborting — CW not available'); return
  }
 
  // ── 4. IIEE FETCH TESTS ───────────────────────────────────
  console.log('▶ Step 4: running IIEE fetch tests...')
  const now = new Date().toISOString()
 
  const future = await CW.run({
    operation: 'select', target_doctype: 'Event',
    query: {
      filter: `doctype = "Event" && data.event_start >= "${now}"`,
      sort: 'data.event_start'
    }
  })
 
  const past = await CW.run({
    operation: 'select', target_doctype: 'Event',
    query: {
      filter: `doctype = "Event" && data.event_start < "${now}"`,
      sort: '-data.event_start'
    }
  })
 
  const futureOk = future.success && future.target.data.every(e => e.event_start >= now)
  const pastOk   = past.success   && past.target.data.every(e => e.event_start < now)
 
  step('select future events', futureOk, `count: ${future.target.data.length}`)
  step('select past events',   pastOk,   `count: ${past.target.data.length}`)
  step('future sorted asc',    future.target.data.length < 2 || future.target.data.every((e,i,a) => i === 0 || e.event_start >= a[i-1].event_start), 'asc by event_start')
  step('past sorted desc',     past.target.data.length   < 2 || past.target.data.every((e,i,a)   => i === 0 || e.event_start <= a[i-1].event_start), 'desc by event_start')
 
  // ── 5. FINAL REPORT ───────────────────────────────────────
  console.log('\n── IIEE REPORT ──────────────────────────────────────')
  console.table(report.steps.map(s => ({ test: s.label, pass: s.ok, detail: s.detail ?? '' })))
  const allPass = report.steps.every(s => s.ok)
  console.log(allPass ? '✅ ALL PASS' : '❌ SOME FAILED')
  return allPass
 
})()