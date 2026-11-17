import type { APIRoute } from 'astro';
import { SITE } from '../site.config';
import { url } from '../lib/url';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: SITE.name,
        short_name: SITE.name,
        description: SITE.description,
        start_url: url(''),
        scope: url(''),
        display: 'browser',
        background_color: '#F5F4EF',
        theme_color: '#141F52',
        icons: [
          { src: url('brand/apple-touch-icon.png'), sizes: '180x180', type: 'image/png' },
          { src: url('brand/avatar-512.png'), sizes: '512x512', type: 'image/png' },
          { src: url('brand/favicon.svg'), sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
