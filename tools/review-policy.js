// Editorial review cadence: configurable policy for one accountable editor. Changing a
// number here changes what the content-health report flags; it never edits records.
// Automated retrieval is a technical check, not an editorial review, so nothing here
// resets a review date.
export const REVIEW_DAYS = {
  opportunityActive: 7,      // open calls, vacancies and tenders: at least weekly
  opportunityNearDeadline: 3, // within 14 days of a deadline: every few days
  opportunityRolling: 30,
  programme: 91,             // programmes and funders: quarterly
  funder: 91,
  award: 182,
  evergreen: 182,            // explainers, pathways: every six months or on material change
};
export const NEAR_DEADLINE_DAYS = 14;
