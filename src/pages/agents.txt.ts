import type { APIRoute } from 'astro';
import { forAiText } from '../lib/for-ai-text';
// agents.txt restates /for-ai.txt so both always say the same thing.
export const GET: APIRoute = ({ site }) => new Response(forAiText(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
