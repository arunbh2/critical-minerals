// Central, public-safe site settings. Keep private material out of this file.
export const SITE = {
  name: 'Critical Minerals',
  descriptor: 'People, value and a fair transition',
  description:
    'A public-interest guide to critical minerals that connects mineral development with workers, communities, policy, finance and environmental outcomes.',
  language: 'en',
  coverage: 'English only. Global orientation, with deeper coverage of India and Indonesia.',
  // Real, public correction route. Change here if a dedicated address is set up.
  correctionsUrl: 'https://github.com/arunbh2/critical-minerals/issues',
  // Date the editorial corpus was last reviewed as a whole.
  corpusReviewed: '2026-11-17',
};

export const NAV = [
  { href: 'start-here/', label: 'Start here' },
  { href: 'explore/', label: 'Explore' },
  { href: 'issues/', label: 'People & environment' },
  { href: 'finance/', label: 'Finance & policy' },
  { href: 'practice/', label: 'Evidence & practice' },
  { href: 'tools/community-benefit/', label: 'Tools' },
] as const;
