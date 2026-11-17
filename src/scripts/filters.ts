// URL-addressable filters. Progressive enhancement: without JavaScript every
// record is listed. With it, filter state lives in the query string, survives
// reloads, and works with browser back/forward.
import { accessStatus, verificationStatus } from '../lib/status.js';

function init(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-filter-form]');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-filter-item]'));
  const empty = root.querySelector<HTMLElement>('[data-filter-empty]');
  const count = root.querySelector<HTMLElement>('[data-filter-count]');
  const reset = root.querySelector<HTMLAnchorElement>('[data-filter-reset]');
  if (!form) return;
  form.hidden = false;
  root.querySelector('[data-filter-nojs]')?.setAttribute('hidden', '');
  const selects = Array.from(form.querySelectorAll<HTMLSelectElement>('select[name]'));
  const names = selects.map((s) => s.name);

  const readUrl = () => {
    const p = new URLSearchParams(location.search);
    for (const s of selects) {
      const v = p.get(s.name) ?? '';
      s.value = Array.from(s.options).some((o) => o.value === v) ? v : '';
    }
  };

  const apply = () => {
    const active = selects.filter((s) => s.value);
    let shown = 0;
    for (const el of items) {
      const ok = active.every((s) => (el.dataset[s.name] ?? '').split(' ').includes(s.value));
      el.hidden = !ok;
      if (ok) shown++;
    }
    if (count) count.textContent = `Showing ${shown} of ${items.length} records`;
    if (empty) {
      empty.hidden = shown > 0;
      const desc = empty.querySelector('[data-filter-desc]');
      if (desc) desc.textContent = active.map((s) => `${s.labels?.[0]?.textContent?.trim()}: ${s.selectedOptions[0].text}`).join('; ');
    }
    if (reset) reset.hidden = active.length === 0;
  };

  const writeUrl = () => {
    const p = new URLSearchParams(location.search);
    for (const n of names) p.delete(n);
    for (const s of selects) if (s.value) p.set(s.name, s.value);
    const qs = p.toString();
    history.pushState(null, '', qs ? `?${qs}` : location.pathname);
  };

  form.addEventListener('change', () => { writeUrl(); apply(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); writeUrl(); apply(); });
  reset?.addEventListener('click', (e) => {
    e.preventDefault();
    for (const s of selects) s.value = '';
    writeUrl(); apply();
    selects[0]?.focus();
  });
  window.addEventListener('popstate', () => { readUrl(); apply(); });
  readUrl();
  apply();
}

// Recompute time-dependent statuses in the browser, so an elapsed deadline
// stops showing as open even if the site has not been rebuilt.
function refreshStatuses() {
  const now = new Date();
  document.querySelectorAll<HTMLElement>('[data-access-status]').forEach((el) => {
    const s = accessStatus({ recordState: el.dataset.state!, opens: el.dataset.opens || null, closes: el.dataset.closes || null }, now);
    el.textContent = s.label;
    el.className = `status status-${s.tone}`;
    const row = el.closest<HTMLElement>('[data-filter-item]');
    if (row) row.dataset.access = s.key;
  });
  document.querySelectorAll<HTMLElement>('[data-verification-status]').forEach((el) => {
    const v = verificationStatus({ lastVerified: el.dataset.checked, reviewDue: el.dataset.due! }, now);
    const label = el.querySelector('[data-label]');
    if (label) label.textContent = v.label;
    el.classList.toggle('status-review', v.key === 'due');
  });
}

refreshStatuses();
document.querySelectorAll<HTMLElement>('[data-filter-root]').forEach(init);
