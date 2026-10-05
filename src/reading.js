export function revealHash(hash) {
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
  const target = id && document.getElementById(id);
  const detail = target && (target.matches('details') ? target : target.closest('details'));
  if (detail) {
    for (let ancestor = detail; ancestor; ancestor = ancestor.parentElement?.closest('details')) ancestor.open = true;
    if (target.matches('details')) target.querySelectorAll('details').forEach(item => { item.open = true; });
  }
  if (target) target.scrollIntoView({ block: 'start' });
}
