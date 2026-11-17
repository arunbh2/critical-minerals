import type { APIRoute, GetStaticPaths } from 'astro';
import { exportRecords, type ExportName } from '../../lib/exports';
import { CSV_EXPORTS } from '../../lib/ai';

export const getStaticPaths: GetStaticPaths = () => CSV_EXPORTS.map((name) => ({ params: { name } }));

const cell = (v: unknown) => {
  const s = v == null ? '' : Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const GET: APIRoute = async ({ params, site }) => {
  const rows = await exportRecords(params.name as ExportName, site);
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => cell((r as any)[c])).join(','))].join('\n') + '\n';
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
