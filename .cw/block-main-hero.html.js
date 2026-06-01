// block-main-hero.html.js

(()=>{
  const rules = `
USES:
- badge badge-pill bg-primary-lt — kicker pill
- badge-dot bg-primary — dot indicator
- avatar-list avatar-list-stacked — stacked avatars
- avatar avatar-sm rounded-circle — background-image only, no <img> child
- collage-main, collage-small — custom, no Tabler equivalent
- stats-card, stat-val, stat-label — custom, positioned overlay
- feature-list — custom, border-left list

DOES NOT USE:
- .kicker-pill, .kicker-dot — replaced by badge
- <img> inside .avatar — use background-image on span
- avatar-stack, avatar-more — not Tabler classes

EXCEPTIONS:
- style="line-height:1.1" on h1 — no Tabler utility
- style="width:64px" on step-number — no Tabler utility
  `;

  const issues = [];
  const validSizes = ['avatar-xxs','avatar-xs','avatar-sm','avatar-md','avatar-lg','avatar-xl','avatar-2xl'];
  const validMods = ['avatar-list','avatar-list-stacked','avatar-rounded','avatar-square','avatar-upload','avatar-cover','avatar-brand','avatar-icon'];

  document.querySelectorAll('.avatar img').forEach(el =>
    issues.push({ rule: 'avatar-no-img', msg: 'Use background-image on .avatar, not <img>', el: el.parentElement.outerHTML.slice(0,120) }));

  document.querySelectorAll('[class*="avatar-"]').forEach(el =>
    [...el.classList]
      .filter(c => c.startsWith('avatar-') && !validSizes.includes(c) && !validMods.includes(c) && !c.startsWith('avatar-list-'))
      .forEach(c => issues.push({ rule: 'avatar-unknown-size', msg: `Unknown avatar class: .${c}`, el: el.outerHTML.slice(0,120) })));

  document.querySelectorAll('.kicker-pill').forEach(el =>
    issues.push({ rule: 'kicker-pill-deprecated', msg: 'Replace .kicker-pill with badge badge-pill bg-primary-lt', el: el.outerHTML.slice(0,120) }));

  document.querySelectorAll('.avatar-stack').forEach(el =>
    issues.push({ rule: 'avatar-stack-invalid', msg: 'Replace .avatar-stack with .avatar-list.avatar-list-stacked', el: el.outerHTML.slice(0,120) }));

  console.group('block-main-hero');
  console.log(rules);
  if (!issues.length) { console.log('✓ no issues'); }
  else issues.forEach(i => console.warn(`[${i.rule}] ${i.msg}\n  ${i.el}`));
  console.groupEnd();
})();