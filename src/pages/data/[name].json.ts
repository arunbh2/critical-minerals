import type { APIRoute, GetStaticPaths } from 'astro';
import { EXPORTS, exportRecords, type ExportName } from '../../lib/exports';

export const getStaticPaths: GetStaticPaths = () => Object.keys(EXPORTS).map((name) => ({ params: { name } }));

export const GET: APIRoute = async ({ params, site }) => {
  const name = params.name as ExportName;
  const records = await exportRecords(name, site);
  const body = {
    collection: name,
    description: EXPORTS[name],
    generated: new Date().toISOString(),
    schema: `schema/${name}.schema.json`,
    count: records.length,
    records,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
