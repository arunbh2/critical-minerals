// The evidence gate as the site applies it: only claims that passed reach pages and AI files.
import { getCollection } from 'astro:content';
import { isPublishable } from '../../tools/evidence-gate.js';
export async function publishedClaims() {
  return (await getCollection('claims')).filter((c) => isPublishable(c));
}
export async function isPublished(id: string) {
  return (await publishedClaims()).some((c) => c.id === id);
}
