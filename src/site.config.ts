// Site settings come from the shared text module so pages and AI files never drift.
import { SITE as S } from '../tools/site-text.js';
export const SITE = S;

export const NAV = [
  { href: 'start-here/', label: 'Start here' },
  { href: 'explore/', label: 'Explore' },
  { href: 'issues/', label: 'People & environment' },
  { href: 'finance/', label: 'Finance & policy' },
  { href: 'practice/', label: 'Evidence & practice' },
  { href: 'tools/community-benefit/', label: 'Tools' },
] as const;
