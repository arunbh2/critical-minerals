// The evidence gate as the site applies it: only claims that passed reach pages and AI files.
import { getCollection } from 'astro:content';
export async function publishedClaims() {
  return (await getCollection('claims')).filter((c) => c.data.verification !== 'not-verified');
}
export async function isPublished(id: string) {
  return (await publishedClaims()).some((c) => c.id === id);
}
