import log from '../data/changelog.json';
export type Change = { id: string; date: string; title: string; summary: string; paths: string[] };
export const CHANGES = (log as Change[]).slice().sort((a, b) => b.date.localeCompare(a.date) || 0);
