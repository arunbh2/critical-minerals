// Site settings come from the shared text module so pages and AI files never drift.
import { SITE as S } from '../tools/site-text.js';
export const SITE = S;

// Six primary destinations. `match` lists the sections each one owns, so the current
// item is marked on every page beneath it. Policy sits under Explore and Funding.
export const NAV = [
  { href: 'start-here/', label: 'Learn', match: ['start-here/', 'learn/'] },
  { href: 'explore/', label: 'Explore', match: ['explore/', 'countries/', 'minerals/', 'policies/', 'landscape/', 'updates/'] },
  { href: 'issues/', label: 'People & planet', match: ['issues/'] },
  { href: 'funding/', label: 'Funding', match: ['funding/', 'finance/'] },
  { href: 'careers/', label: 'Careers', match: ['careers/'] },
  { href: 'evidence/', label: 'Evidence & tools', match: ['evidence/', 'practice/', 'tools/', 'sources/', 'methodology/', 'data/', 'use-with-ai/', 'cite/'] },
] as const;
