import type { APIRoute } from 'astro';
import { forAiText } from '../lib/for-ai-text';
export const GET: APIRoute = ({ site }) => new Response(forAiText(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
