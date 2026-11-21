// Shared definitions for the skills-to-pathways explorer. The rules are transparent:
// a pathway matches when it lists one of the selected experiences, interests or the
// chosen contribution. Results are ordered by the number of matches. No scoring of
// people, no accounts, nothing stored or sent.
export const EXPERIENCE = [
  { id: 'community-participation', label: 'Community participation or engagement' },
  { id: 'fundraising', label: 'Fundraising or proposal writing' },
  { id: 'programme-management', label: 'Programme or project management' },
  { id: 'policy-research', label: 'Policy research or advocacy' },
  { id: 'finance-economics', label: 'Finance, economics or budgets' },
  { id: 'law-rights', label: 'Law, rights or safeguarding' },
  { id: 'health-safety', label: 'Health, safety or public health' },
  { id: 'environment-science', label: 'Environmental science or geography' },
  { id: 'supply-chain', label: 'Procurement, supply chains or audit' },
  { id: 'data-analysis', label: 'Data analysis or research methods' },
  { id: 'communications', label: 'Writing, communications or journalism' },
] as const;
export const INTERESTS = [
  { id: 'people-rights', label: 'People, rights and fairness' },
  { id: 'rules-institutions', label: 'Rules, institutions and accountability' },
  { id: 'money', label: 'How money flows and what it achieves' },
  { id: 'materials', label: 'Materials, reuse and recovery' },
  { id: 'water-climate', label: 'Water, land and climate risk' },
  { id: 'evidence', label: 'Evidence, data and explanation' },
] as const;
export const CONTRIBUTIONS = [
  { id: 'rights-communities', label: 'Rights and communities' },
  { id: 'policy-governance', label: 'Policy and governance' },
  { id: 'finance-partnerships', label: 'Finance and partnerships' },
  { id: 'circularity-resilience', label: 'Circularity and resilience' },
] as const;
