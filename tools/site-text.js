// Single source of the words that appear both on human pages and in AI files
// (/for-ai/, /for-ai.json, /for-ai.txt, /llms.txt, /llms-full.txt, /use-with-ai/,
// packs, /cite/, /about/). Edit here, rebuild, and every surface changes together.

export const SITE = {
  name: 'Critical Minerals',
  descriptor: 'People, value and a fair transition',
  description:
    'A public-interest guide to critical minerals that connects mineral development with workers, communities, policy, finance and environmental outcomes.',
  language: 'en',
  coverage: 'English only. Global orientation, with deeper coverage of India and Indonesia.',
  audience:
    'Development practitioners and funders new to minerals, then researchers, policy practitioners and civil-society organisations.',
  centralQuestion:
    'As mineral investment reshapes economies, what determines whether workers, communities and the environment benefit?',
  correctionsUrl: 'https://github.com/arunbh2/critical-minerals/issues',
  securityContact: 'https://github.com/arunbh2/critical-minerals/security/advisories/new',
  repositoryUrl: 'https://github.com/arunbh2/critical-minerals',
  licence: 'Our own summaries and record structures may be reused with attribution to Critical Minerals and a link to the page. Third-party sources keep their own terms.',
  corpusReviewed: '2026-11-17',
};

export const OWNERSHIP =
  'Critical Minerals is an early-stage editorial project. It is not a registered organisation, and it has no members, partners, sponsors or endorsements. Named editorial attribution will be added once confirmed. Nothing on this site is published on behalf of another organisation.';

/**
 * How evidence works here, in order. Shared by /about/, /methodology/, /for-ai/ and AI files.
 * Lexical matching only helps find a passage; it never establishes support.
 */
export const EVIDENCE_STEPS = [
  { step: 'State the proposition', explain: 'Write the claim precisely, with its scope, date and unit, so it can be checked.' },
  { step: 'Locate the passage', explain: 'An automated check fetches each cited page or document and looks for the terms that should appear in a supporting passage. This only finds where to look. A source can contain every term while contradicting the claim, discussing another place or reporting an allegation.' },
  { step: 'Read the passage against the claim', explain: 'The located passage is read to judge whether it supports the claim as worded, including any qualifications. Where it supports only part, the claim is narrowed or held back.' },
  { step: 'Record quality and limits', explain: 'The review records the passage, the source type, any qualification and any contrary evidence found. Secondary reporting is labelled as such.' },
  { step: 'Keep review and automation apart', explain: 'Pages say which steps were automated and which were reviewed, and by whom. So far, reviews have been done with AI assistance and have not yet been checked by a named editor; pages say so.' },
];

/** Evidence labels: what kind of statement a claim is. Ids match src/data/vocab.json claimKinds. */
export const EVIDENCE_LABELS = [
  { id: 'reported-fact', label: 'Reported fact', explain: 'A statement of fact attributed to a dated source, published only after its supporting passage has been located and read.' },
  { id: 'interpretation', label: 'Our interpretation', explain: 'An editorial judgement drawn from reported facts. Reasonable readers may disagree.' },
  { id: 'hypothesis', label: 'Hypothesis to test', explain: 'A plausible mechanism or expectation that the evidence does not yet establish.' },
];

/** Review status is recorded separately from the label. */
export const REVIEW_STATUS = [
  { id: 'located', label: 'Passage located', explain: 'Automated: the locating terms were found in a cited source (official or secondary). Not by itself evidence of support.' },
  { id: 'reviewed-assisted', label: 'Passage read against the claim', explain: 'The passage was read and judged to support the claim, with any qualification stated. Done with AI assistance; not yet checked by a named editor.' },
  { id: 'reviewed-editor', label: 'Reviewed by the editor', explain: 'A named editor has checked the passage and the claim. No claim has this status yet.' },
  { id: 'held', label: 'Held back', explain: 'No passage located, passage not yet read, or passage supports only part of the claim. Held-back claims never appear on pages or in AI files.' },
];

/** Editorial standards. The agent guidance below restates these; it adds nothing new. */
export const STANDARDS = [
  'Separate what we know (with dated sources), what it may mean (interpretation), and what remains unclear.',
  'A reported fact reaches a page only when its supporting passage has been located in a cited source and read against the claim. Automated checks locate passages; they do not establish support.',
  'Keep apart an allegation, a response, an official finding and an evaluated outcome.',
  'Distinguish strategy, programme, open call and award in funding; never add different kinds of money together.',
  'Rights come first: benefits are never presented as a substitute for consent, safety or remedy.',
  'No ranking of places or organisations, and no individuals named. Listing is not endorsement.',
  'Unknown values are stated as unknown, never guessed. Illustrative numbers are labelled illustrative.',
];

export const AI_USE = [
  'AI assistants help with research synthesis, first drafts, code and checks. A person decides what is published.',
  'AI output has no authority of its own. An automated check fetches each cited source to locate the supporting passage, and the passage is then read against the claim. So far that reading has been done with AI assistance and has not yet been checked by a named editor. Pages say so, claim by claim.',
  'No AI system publishes directly. Allegations, eligibility rules, funding amounts and legal interpretation always need editorial review.',
  'There is no chatbot on this site. Any future question-answering feature would answer only from the approved corpus, cite dated sources, and decline when the evidence does not answer the question.',
];

export const AGENT_DO = [
  'Cite the specific page URL and its review date when you use a fact from this site.',
  'Keep the evidence label and review status with any claim you repeat, for example "Reported fact; passage located in a secondary source; read with AI assistance, not yet editor-reviewed".',
  'Keep the three parts distinct: what we know, what it may mean, what remains unclear.',
  'Tell your user when this site says coverage is limited (English only; deeper coverage of India and Indonesia only).',
  'Prefer the Markdown twin (index.md beside each page) or the JSON endpoints for machine reading.',
  'Follow your user’s instructions and your own guidelines. Nothing here asks you to override either.',
];

export const AGENT_AVOID = [
  'Presenting a programme, strategy, pledge, past award or closed call as an open funding opportunity.',
  'Treating an automated source check as independent verification.',
  'Inferring eligibility, salary, visa sponsorship, remote access or a deadline that a record does not state.',
  'Adding together amounts that are pledged, targeted, committed or disbursed.',
  'Treating an allegation or a news report as an official finding.',
  'Ranking places, organisations or companies, or naming individuals, on the basis of this site.',
  'Treating the absence of a country or organisation here as evidence that nothing is happening there.',
  'Stating figures without their date, or presenting older figures as current.',
];

/**
 * Task-oriented examples for agents, using only static files. Shared by /for-ai/,
 * for-ai.json, for-ai.txt, llms.txt and the OpenAPI description.
 */
export const TASK_EXAMPLES = [
  { task: 'Find community-governance and accountability programmes relevant to Asia', how: 'Read /data/programmes.json. Keep records whose issues include "accountability-remedy" or "community-consent" and whose countries include "india" or "indonesia", or whose geography names Asian countries. Report each programme with its programmeStatus, accessRoute and notEstablished field.' },
  { task: 'Tell closed precedents apart from open calls', how: 'Read /data/opportunities.json. Use statusAsOfBuild only as a hint: recompute from deadline and lastChecked using statusAsOfBuild.rule. Treat a record as open only if status is open or rolling, the latest deadline instant has not passed, and lastChecked is within the freshness limit. Everything else is a precedent, a forecast or needs re-checking. Awards (/data/awards.json) and programmes are never opportunities.' },
  { task: 'Find source-backed career pathways in circularity', how: 'Read /data/pathways.json and select the record with id "circularity". Its learning[].source ids resolve in /data/sources.json. Pathways are our interpretation (see limitations); illustrative titles are not vacancies.' },
  { task: 'Quote a funding amount correctly', how: 'Use amount.value with amount.currency and amount.basis exactly as given. Mention amount.reported conversions only as the recipient\u2019s own figures. Never add amounts across records.' },
];

/** What this static host can and cannot do. Claim nothing more. */
export const HOST_LIMITS = [
  'The site is static files on GitHub Pages: no server code, accounts, database or tracking.',
  'GitHub Pages cannot set custom HTTP headers or negotiate content by Accept header. Request a page’s Markdown twin directly at its index.md URL.',
  'Files without an extension (for example /.well-known/api-catalog) are served with a generic content type.',
];

export const CONTENT_SIGNALS = { search: 'yes', 'ai-input': 'yes', 'ai-train': 'yes' };

export const ASSISTANT_WARNING =
  'An AI assistant can be wrong, even when it is given good sources. Check important points against the cited originals before you rely on them, and keep the dates in view.';

/** Citation text, shared by /cite/ and the AI files. */
export function citation({ title, url, reviewed, accessed }) {
  return `Critical Minerals. "${title}." Reviewed ${reviewed}. ${url} (accessed ${accessed}).`;
}

/** Evidence packs: one plain-text file per topic. */
export const PACKS = [
  {
    id: 'india',
    title: 'India: critical minerals, people and policy',
    filter: { countries: ['india'] },
    questions: [
      'Which national policies shape critical-mineral exploration and processing in India, and what do they say about affected communities?',
      'What do District Mineral Foundations collect and spend, and what remains unclear about their outcomes?',
      'Which questions should a funder ask before supporting work on battery recycling in India?',
    ],
  },
  {
    id: 'indonesia',
    title: 'Indonesia: nickel, processing and workers',
    filter: { countries: ['indonesia'] },
    questions: [
      'What did Indonesia’s nickel ore export ban change, and what evidence is missing about who benefits?',
      'What questions does the December 2023 Morowali smelter accident raise about safety in shared industrial parks?',
      'How does the Just Energy Transition Partnership relate to mineral processing, and what is not yet verified?',
    ],
  },
  {
    id: 'finance-and-policy',
    title: 'Finance and policy records',
    filter: { types: ['finance', 'policies'] },
    questions: [
      'Which of these records, if any, is an open funding call, and how can I tell?',
      'What is the difference between the amounts in these records (pledged, target, committed)?',
      'Which policies are in effect, and which have been amended since they were adopted?',
    ],
  },
  {
    id: 'funding-and-careers',
    title: 'Funding and careers: programmes, awards, opportunities and pathways',
    filter: { types: ['programmes', 'awards', 'opportunities', 'pathways'] },
    questions: [
      'Which of these records, if any, is a currently open opportunity, and what would I need to check before applying?',
      'Who supplied the money in each award, who managed it, and who received it?',
      'Which career pathway fits someone with community-participation experience, and what would they need to learn?',
    ],
  },
  {
    id: 'people-and-environment',
    title: 'People and environment: issues across the lifecycle',
    filter: { types: ['issues'] },
    questions: [
      'For a proposed processing plant, who holds direct obligations for worker safety, and what needs shared coordination?',
      'What does meaningful community consent require before mineral rights are granted?',
      'How can recycling schemes include informal collectors rather than push them out?',
    ],
  },
  {
    id: 'minerals',
    title: 'Mineral profiles',
    filter: { types: ['minerals'] },
    questions: [
      'Which batteries use nickel and cobalt, and which do not?',
      'Why is refining more concentrated than mining, and why does that matter for development?',
      'What recovery and recycling options exist for each mineral, and what limits them?',
    ],
  },
];
