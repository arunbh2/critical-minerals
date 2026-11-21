// Recompute opportunity statuses with the reader's clock. Without JavaScript the
// build-time status stays, with its check date beside it.
import { effectiveStatus } from '../lib/opportunity.js';

function refresh() {
  const now = new Date();
  document.querySelectorAll<HTMLElement>('[data-op-status]').forEach((el) => {
    const op = JSON.parse(el.dataset.op!);
    const s = effectiveStatus(op, now);
    el.textContent = s.label;
    el.className = `status status-${s.tone}`;
    const card = el.closest('[data-op-card]');
    const stale = card?.querySelector<HTMLElement>('[data-op-stale]');
    if (stale) stale.hidden = !s.stale;
    const scope = el.closest('[data-op-scope]') ?? document;
    scope.querySelectorAll<HTMLElement>('[data-apply]').forEach((a) => { a.hidden = !s.canApply; });
    scope.querySelectorAll<HTMLElement>('[data-apply-closed]').forEach((a) => { a.hidden = s.canApply; });
    const row = el.closest<HTMLElement>('[data-filter-item]');
    if (row) row.dataset.status = s.key.startsWith('closed') ? 'closed' : s.key;
  });
}
refresh();
