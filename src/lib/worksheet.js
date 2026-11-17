// Single definition of the community-benefit worksheet, shared by the page,
// the browser script and unit tests. No scoring, by design: rights cannot be
// offset by points for jobs or investment.

const triad = (prefix) => [
  { id: `${prefix}_documented`, label: 'What is documented', hint: 'Facts you can point to a source for. Note the source and its date.', kind: 'documented' },
  { id: `${prefix}_assumed`, label: 'What is assumed or claimed', hint: 'Statements, promises or beliefs that are not yet backed by evidence.', kind: 'assumed' },
  { id: `${prefix}_missing`, label: 'What is missing or unknown', hint: 'Information you would need but do not have.', kind: 'missing' },
];

export const WORKSHEET_VERSION = 1;

export const STEPS = [
  {
    id: 'place',
    title: 'Place, activity and affected groups',
    intro: 'Describe the place and the activity you are assessing, and who is affected.',
    prompts: ['Where exactly is this, and what is proposed or already happening?', 'Who lives, works or depends on resources here?', 'Which groups might be affected differently, for example women, Indigenous peoples, migrant or contract workers, informal workers?'],
    fields: [
      { id: 'place', label: 'Place', hint: 'Village, district, industrial area or region.', kind: 'context', required: true, short: true },
      { id: 'activity', label: 'Activity', hint: 'For example: a proposed lithium mine, an expanding nickel smelter, a battery recycling scheme.', kind: 'context', required: true, short: true },
      { id: 'groups', label: 'Affected groups', hint: 'List the groups you know of. You can add more later.', kind: 'context' },
      ...triad('place'),
    ],
  },
  {
    id: 'participation',
    title: 'Participation, decision rights and consent',
    intro: 'Who decides, and how much influence do affected people have?',
    prompts: ['Were affected people informed before rights or permits were granted?', 'Could they influence the decision, including saying no?', 'Where Indigenous peoples are affected, was free, prior and informed consent sought and respected?', 'Who represents the community, and how were they chosen?'],
    fields: triad('participation'),
  },
  {
    id: 'livelihoods',
    title: 'Livelihoods, local enterprise and distribution of value',
    intro: 'Who gains economically, and who loses?',
    prompts: ['Which livelihoods are affected, including farming, fishing, forest use and informal work?', 'What jobs and contracts are promised, for whom, and on what terms?', 'How do taxes, royalties or earmarked funds reach the local area, and who decides how they are spent?'],
    fields: triad('livelihoods'),
  },
  {
    id: 'workers',
    title: 'Worker conditions and protection',
    intro: 'Are the people doing the work safe and fairly treated, including contractors?',
    prompts: ['Who is responsible for safety on site, including for contractors and subcontractors?', 'Can workers organise and raise concerns without retaliation?', 'How are workers protected from heat, chemicals, dust and other hazards?', 'Are there emergency and evacuation plans, and have they been practised?'],
    fields: triad('workers'),
  },
  {
    id: 'environment',
    title: 'Environment, climate risks and shared infrastructure',
    intro: 'How does the activity affect land, water and resilience, and how do climate hazards affect it?',
    prompts: ['How are water use, discharges, tailings and other wastes managed and monitored? Is the data public?', 'How could heat, floods or drought affect the site, its workers and nearby communities?', 'Who coordinates early warning and evacuation across the area?', 'Who pays for shared infrastructure and preparedness?'],
    fields: triad('environment'),
  },
  {
    id: 'accountability',
    title: 'Accountable actors, financing, evidence and remedy',
    intro: 'Who is responsible, who pays, and what happens if harm occurs?',
    prompts: ['Which company, authority or financier is responsible for each commitment?', 'What financing is involved, and what conditions come with it?', 'What independent evidence exists about results, as opposed to targets or plans?', 'How can affected people raise grievances and obtain remedy?'],
    fields: triad('accountability'),
  },
  {
    id: 'questions',
    title: 'Unanswered questions and next steps',
    intro: 'Bring together what you still need to find out.',
    prompts: ['What are the most important unanswered questions?', 'Who could answer them, and how should they be approached respectfully?', 'What would change your understanding of this proposition?'],
    fields: [
      { id: 'open_questions', label: 'Most important unanswered questions', hint: 'One per line.', kind: 'missing' },
      { id: 'next_steps', label: 'Next investigation steps', hint: 'Documents to obtain, people to speak with, sites to visit.', kind: 'context' },
      { id: 'who_to_ask', label: 'Who could help answer them', hint: 'Roles or organisations. Do not record personal contact details here.', kind: 'context' },
    ],
  },
];

export const ALL_FIELDS = STEPS.flatMap((s) => s.fields.map((f) => ({ ...f, step: s.id })));

/** @param {Record<string,string>} data */
export function validateStep(stepId, data) {
  const step = STEPS.find((s) => s.id === stepId);
  if (!step) return [];
  return step.fields
    .filter((f) => f.required && !(data[f.id] || '').trim())
    .map((f) => ({ id: f.id, message: `Enter the ${f.label.toLowerCase()} before continuing.` }));
}

export function isEmpty(data) {
  return ALL_FIELDS.every((f) => !(data[f.id] || '').trim());
}

const DISCLAIMER =
  'All content in this worksheet was entered by the user. It has not been checked or endorsed by Critical Minerals. ' +
  'This worksheet gives no score, certification or verdict: rights cannot be offset by jobs or investment.';

/**
 * @param {Record<string,string>} data
 * @param {{ generated?: string, source?: string }} opts
 */
export function toMarkdown(data, opts = {}) {
  const generated = opts.generated || new Date().toISOString();
  const out = [];
  out.push(`# Community-benefit assessment: ${data.place?.trim() || 'Untitled place'}`);
  out.push('');
  out.push(`- Activity: ${data.activity?.trim() || 'Not stated'}`);
  out.push(`- Prepared: ${generated.slice(0, 10)}`);
  if (opts.source) out.push(`- Worksheet: ${opts.source}`);
  out.push('');
  out.push(`> ${DISCLAIMER}`);
  for (const step of STEPS) {
    out.push('', `## ${step.title}`, '');
    for (const f of step.fields) {
      if (f.id === 'place' || f.id === 'activity') continue;
      const v = (data[f.id] || '').trim();
      out.push(`### ${f.label} (user-entered)`, '', v ? v : '_Not answered._', '');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

/** @param {Record<string,string>} data */
export function toJSON(data, opts = {}) {
  return {
    schema: 'critical-minerals/community-benefit-worksheet',
    version: WORKSHEET_VERSION,
    generated: opts.generated || new Date().toISOString(),
    disclaimer: DISCLAIMER,
    userEntered: true,
    score: null,
    place: (data.place || '').trim() || null,
    activity: (data.activity || '').trim() || null,
    sections: STEPS.map((s) => ({
      id: s.id,
      title: s.title,
      answers: s.fields
        .filter((f) => f.id !== 'place' && f.id !== 'activity')
        .map((f) => ({ id: f.id, label: f.label, kind: f.kind, value: (data[f.id] || '').trim() || null })),
    })),
  };
}

export function fileSlug(data, date = new Date()) {
  const place = (data.place || 'assessment').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'assessment';
  return `community-benefit-${place}-${date.toISOString().slice(0, 10)}`;
}
