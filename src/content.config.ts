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

const organisations = defineCollection({
  loader: file('./src/data/organisations.json'),
  schema: z.object({
    name: z.string(),
    type: ids('orgTypes'),
    role: z.string(),
    geography: z.string(),
    initiative: z.string(),
    deliveryModel: z.string(),
    evidenceNote: z.string(),
    url: z.string().url(),
    countries: z.array(z.string()).default([]),
    minerals: z.array(z.string()).default([]),
    issues: z.array(z.string()).default([]),
    sources: z.array(z.string()).default([]),
    reviewed: date,
    reviewDue: date,
  }),
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
  }),
});

export const schemas = Object.fromEntries(
  Object.entries({ learn, minerals, countries, issues, cases, updates, organisations, finance, policies, sources, claims })
    .map(([k, c]) => [k, (c as any).schema]),
) as Record<string, z.ZodType>;

export const collections = {
  learn, minerals, countries, issues, cases, updates,
  organisations, finance, policies, sources, claims,
};
