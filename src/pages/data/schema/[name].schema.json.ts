import type { APIRoute, GetStaticPaths } from 'astro';
import { z } from 'astro/zod';
import { schemas } from '../../../content.config';
import { EXPORTS } from '../../../lib/exports';

export const getStaticPaths: GetStaticPaths = () => Object.keys(EXPORTS).map((name) => ({ params: { name } }));

export const GET: APIRoute = ({ params }) => {
  const schema = schemas[params.name as string];
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
  json.title = `Critical Minerals: ${params.name} record`;
  json.description = `${EXPORTS[params.name as keyof typeof EXPORTS]}. Records in the export also carry "id" and, where applicable, "url".`;
  return new Response(JSON.stringify(json, null, 2), { headers: { 'Content-Type': 'application/schema+json; charset=utf-8' } });
};
