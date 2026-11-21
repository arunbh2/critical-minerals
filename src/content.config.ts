import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import vocab from './data/vocab.json';

const ids = <K extends keyof typeof vocab>(k: K) =>
  z.enum(vocab[k].map((v) => v.id) as [string, ...string[]]);

// YAML parses bare dates as Date objects; normalise to YYYY-MM-DD strings.
const date = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
);
// Deadlines keep their timezone: full ISO 8601 with offset.
const dateTimeTz = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/, 'Use ISO 8601 with offset');

const shared = {
  title: z.string(),
  /** 2-4 words for <title>; required when title is not already 2-4 words. */
  shortTitle: z.string().optional(),
  summary: z.string().max(320),
  published: date,
  updated: date.optional(),
  reviewed: date,
  reviewDue: date,
  countries: z.array(z.string()).default([]),
  minerals: z.array(z.string()).default([]),
  issues: z.array(z.string()).default([]),
  lifecycle: z.array(ids('lifecycle')).default([]),
  sources: z.array(z.string()).default([]),
  claims: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  limitations: z.string().optional(),
  meaning: z.array(z.string()).default([]),
  unclear: z.array(z.string()).default([]),
  editor: z.string().optional(),
  draft: z.boolean().default(false),
};

const learn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/learn' }),
  schema: z.object({ ...shared, order: z.number().int(), question: z.string() }),
});

const minerals = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/minerals' }),
  schema: z.object({ ...shared, group: z.boolean().default(false), uses: z.array(z.string()) }),
});

const countries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/countries' }),
  schema: z.object({ ...shared, region: z.string(), leadQuestion: z.string() }),
});

const issues = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/issues' }),
  schema: z.object({
    ...shared,
    order: z.number().int(),
    editorialQuestion: z.string(),
    responsibilities: z.object({
      direct: z.array(z.string()),
      shared: z.array(z.string()),
      systemic: z.array(z.string()),
    }),
  }),
});

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    ...shared,
    location: z.string(),
    period: z.string(),
    intervention: z.string(),
    actors: z.array(z.string()),
    financing: z.string(),
    mechanism: z.string(),
    relationship: ids('relationship'),
    reportedResults: z.string(),
    evidenceType: z.string(),
    transferConditions: z.string(),
    currentAsOf: z.string(),
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/updates' }),
  schema: z.object({ ...shared, eventDate: date, whyItMatters: z.string() }),
});

/** A short verbatim passage from a cited source, for traceability. */
const passage = z.object({ source: z.string(), quote: z.string().max(400) });
/** Native amount: never converted, never summed across bases. */
const money = z.object({
  value: z.number().nullable().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  basis: ids('amountBases'),
  /** Optional display string in the source's own convention (e.g. "₹1,500 crore"). */
  display: z.string().optional(),
  reported: z.array(z.object({ value: z.number(), currency: z.string(), note: z.string() })).default([]),
});
/** A date with optional time. utcOffset only when the source states a timezone. */
const moment = z.object({
  date,
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  utcOffset: z.string().regex(/^[+-]\d{2}:\d{2}$/).nullable(),
  /** The deadline exactly as the source words it. */
  stated: z.string(),
}).refine((m) => m.time !== null || m.utcOffset === null, { message: 'utcOffset without a time' });

const organisations = defineCollection({
  loader: file('./src/data/organisations.json'),
  schema: z.object({
    name: z.string(),
    shortTitle: z.string().optional(),
    type: ids('orgTypes'),
    role: z.string(),
    geography: z.string(),
    initiative: z.string(),
    deliveryModel: z.string(),
    evidenceNote: z.string(),
    /** Official website; null when we have not verified one. */
    url: z.string().url().nullable(),
    countries: z.array(z.string()).default([]),
    minerals: z.array(z.string()).default([]),
    issues: z.array(z.string()).default([]),
    sources: z.array(z.string()).default([]),
    reviewed: date,
    reviewDue: date,
    // Funding and employer roles. Roles describe what an organisation does in specific
    // transactions (see programmes and awards), not a permanent label.
    roles: z.array(ids('fundingRoles')).default([]),
    headquarters: z.string().nullable().optional(),
    mineralRelevance: ids('relevance').optional(),
    fundsWhere: z.string().optional(),
    instruments: z.array(ids('instruments')).default([]),
    /** null = no access route found in our sources (shown as such). */
    accessRoute: z.string().nullable().optional(),
    restrictions: z.string().nullable().optional(),
    /** Labelled editorial interpretation. */
    whyItMatters: z.string().optional(),
    /** What the evidence does not establish. Required whenever whyItMatters is given. */
    notEstablished: z.string().optional(),
    careersUrl: z.string().url().nullable().optional(),
    procurementUrl: z.string().url().nullable().optional(),
    functions: z.array(ids('roleFamilies')).default([]),
    employerNote: z.string().nullable().optional(),
    passages: z.array(passage).default([]),
  }).refine((o) => !o.whyItMatters || o.notEstablished, { message: 'whyItMatters needs a notEstablished statement beside it' }),
});

const amount = z.object({
  value: z.number().nullable(),
  currency: z.string().nullable(),
  basis: z.enum(['total-envelope', 'project-level', 'unknown']),
  stage: z.enum(['pledged', 'committed', 'awarded', 'disbursed', 'target', 'unknown']),
  note: z.string().optional(),
});

const finance = defineCollection({
  loader: file('./src/data/finance.json'),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string().optional(),
    provider: z.string(),
    programme: z.string(),
    purpose: z.string(),
    supports: z.array(ids('financeSupports')).min(1),
    instruments: z.array(ids('instruments')).min(1),
    recordState: ids('recordStates'),
    geography: z.string(),
    countries: z.array(z.string()).default([]),
    minerals: z.array(z.string()).default([]),
    issues: z.array(z.string()).default([]),
    eligibleEntities: z.string().nullable(),
    partnershipConditions: z.string().nullable(),
    coFinancing: z.string().nullable(),
    amount,
    applicationRoute: z.string().nullable(),
    opens: dateTimeTz.nullable(),
    closes: dateTimeTz.nullable(),
    sources: z.array(z.string()).min(1),
    lastVerified: date,
    verification: ids('verification'),
    uncertainties: z.string(),
    reviewDue: date,
  }),
});

const policies = defineCollection({
  loader: file('./src/data/policies.json'),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string().optional(),
    jurisdiction: z.string(),
    issuingBody: z.string(),
    state: ids('policyStates'),
    dates: z.object({
      announced: date.optional(),
      adopted: date.optional(),
      effective: date.optional(),
      amended: date.optional(),
    }),
    primaryDocument: z.string(),
    affectedActors: z.array(z.string()),
    mechanism: z.string(),
    funding: z.string().nullable(),
    summary: z.string(),
    implications: z.string(),
    countries: z.array(z.string()).default([]),
    minerals: z.array(z.string()).default([]),
    issues: z.array(z.string()).default([]),
    sources: z.array(z.string()).min(1),
    verification: ids('verification'),
    reviewed: date,
    reviewDue: date,
  }),
});

const programmes = defineCollection({
  loader: file('./src/data/programmes.json'),
  schema: z.object({
    title: z.string(), shortTitle: z.string().optional(), published: date, summary: z.string().max(400),
    funders: z.array(z.string()), administrators: z.array(z.string()),
    instruments: z.array(ids('instruments')).min(1), relevance: ids('relevance'),
    lifecycle: z.array(ids('lifecycle')).default([]), themes: z.array(ids('financeSupports')).default([]),
    geography: z.string(), countries: z.array(z.string()).default([]), minerals: z.array(z.string()).default([]), issues: z.array(z.string()).default([]),
    objectives: z.string(), mineralScope: z.string(),
    envelope: money.nullable(), perAward: money.nullable(), period: z.string().nullable(),
    applicants: z.string().nullable(), exclusions: z.string().nullable(), accessRoute: z.string(),
    programmeStatus: z.enum(['active', 'paused', 'closed', 'unknown']),
    whyItMatters: z.string(), notEstablished: z.string(),
    sources: z.array(z.string()).min(1), passages: z.array(passage).min(1),
    lastChecked: date, reviewDue: date,
  }),
});

const awards = defineCollection({
  loader: file('./src/data/awards.json'),
  schema: z.object({
    title: z.string(), shortTitle: z.string().optional(), published: date, funder: z.string(), administrator: z.string().nullable(), recipient: z.string(), programme: z.string().nullable(),
    instrument: ids('instruments'),
    period: z.object({ start: z.string().regex(/^\d{4}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}$/).nullable() }),
    amount: money, activity: z.string(), geography: z.string(), relevance: ids('relevance'),
    intendedOutcomes: z.string(), resultsEvidence: z.string().nullable(),
    countries: z.array(z.string()).default([]), minerals: z.array(z.string()).default([]), issues: z.array(z.string()).default([]),
    sources: z.array(z.string()).min(1), passages: z.array(passage).min(1), lastChecked: date, reviewDue: date,
  }),
});

const opportunities = defineCollection({
  loader: file('./src/data/opportunities.json'),
  schema: z.object({
    title: z.string(), shortTitle: z.string().optional(), summary: z.string().max(400),
    type: ids('opportunityTypes'), organisation: z.string(), programme: z.string().nullable(), administrator: z.string().nullable(),
    instrument: ids('instruments').nullable(), relevance: ids('relevance'),
    /** Status as recorded at lastChecked. Pages also apply deadline and freshness rules. */
    status: ids('opportunityStatus'), statusBasis: z.string(),
    eligibleApplicants: z.string(), applicantLocation: z.string(), beneficiaryGeography: z.string(),
    exclusions: z.string().nullable(), funding: money.nullable(), fee: z.string().nullable(),
    partnership: z.string().nullable(), coFinancing: z.string().nullable(),
    opens: moment.nullable(), deadline: moment.nullable(),
    applicationSteps: z.string().nullable(), documents: z.string().nullable(), questions: z.array(z.string()).default([]),
    /** Publication date only when the source states it. */
    published: date.nullable().default(null),
    roleFamilies: z.array(ids('roleFamilies')).default([]), seniority: z.string().nullable(), location: z.string().nullable(),
    remote: z.string().nullable(), duration: z.string().nullable(), workAuthorisation: z.string().nullable(),
    lifecycle: z.array(ids('lifecycle')).default([]),
    countries: z.array(z.string()).default([]), minerals: z.array(z.string()).default([]), issues: z.array(z.string()).default([]),
    sources: z.array(z.string()).min(1), passages: z.array(passage).min(1), lastChecked: date, reviewDue: date,
  }),
});

// Career pathways: evergreen guidance, labelled as our interpretation. Illustrative job
// titles are examples, not vacancies.
const pathways = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pathways' }),
  schema: z.object({
    title: z.string(), shortTitle: z.string().optional(), summary: z.string().max(320), order: z.number().int(),
    contribution: z.enum(['rights-communities', 'policy-governance', 'finance-partnerships', 'circularity-resilience']),
    problem: z.string(), responsibilities: z.array(z.string()).min(3), employerTypes: z.array(z.string()).min(2),
    titles: z.array(z.string()).min(2), transferable: z.array(z.string()).min(2), gaps: z.array(z.string()).min(2),
    routes: z.object({ entry: z.string(), mid: z.string(), senior: z.string() }),
    required: z.array(z.string()), desirable: z.array(z.string()), fieldwork: z.string(),
    portfolio: z.array(z.string()).length(2),
    learning: z.array(z.object({ source: z.string(), why: z.string() })).min(1),
    employers: z.array(z.string()).default([]), issues: z.array(z.string()).default([]), lifecycle: z.array(ids('lifecycle')).default([]),
    explorer: z.object({ experience: z.array(z.string()).min(1), interests: z.array(z.string()).min(1) }),
    /** Warning shown where regulated credentials apply; null when none. */
    regulated: z.string().nullable(),
    published: date, reviewed: date, reviewDue: date, draft: z.boolean().default(false),
  }),
});

const sources = defineCollection({
  loader: file('./src/data/sources.json'),
  schema: z.object({
    title: z.string(),
    publisher: z.string(),
    url: z.string().url(),
    type: ids('sourceTypes'),
    published: z.string().nullable(),
    retrieved: date,
    locator: z.string().optional(),
    reuse: z.string().default('Link and short attributed quotation only.'),
    note: z.string().optional(),
  }),
});

const claims = defineCollection({
  loader: file('./src/data/claims.json'),
  schema: z.object({
    text: z.string(),
    sources: z.array(z.string()).min(1),
    verification: ids('verification'),
    asOf: z.string(),
    note: z.string().optional(),
    checkedAt: date.optional(),
    batch: z.string().optional(),
    evidenceSources: z.array(z.string()).default([]),
    /** Reported fact, our interpretation, or hypothesis to test. */
    kind: ids('claimKinds').default('reported-fact'),
    /** Whether the located passage supports the claim as worded (tools/research-review.js). */
    review: z.object({
      outcome: ids('reviewOutcomes'),
      reviewer: ids('reviewers').nullable(),
      reviewedAt: date.nullable(),
      batch: z.string(),
      qualification: z.string().nullable(),
      history: z.string().nullable(),
      passages: z.array(z.object({ source: z.string(), locatedBy: z.string(), passage: z.string() })),
    }).default({ outcome: 'not-reviewed', reviewer: null, reviewedAt: null, batch: '', qualification: null, history: null, passages: [] }),
  }),
});

export const schemas = Object.fromEntries(
  Object.entries({ learn, minerals, countries, issues, cases, updates, organisations, finance, policies, sources, claims, programmes, awards, opportunities, pathways })
    .map(([k, c]) => [k, (c as any).schema]),
) as Record<string, z.ZodType>;

export const collections = {
  learn, minerals, countries, issues, cases, updates,
  organisations, finance, policies, sources, claims,
  programmes, awards, opportunities, pathways,
};
