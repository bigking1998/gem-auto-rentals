import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

const SITE_URL = process.env.WEB_URL || 'https://gemrentalcars.com';

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/vehicles', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
];

// Generate XML sitemap
router.get('/', async (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch all available vehicles
    let vehicleUrls: string[] = [];
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { status: 'AVAILABLE' },
        select: { id: true, updatedAt: true },
      });

      vehicleUrls = vehicles.map((v) => {
        const lastmod = v.updatedAt.toISOString().split('T')[0];
        return `
  <url>
    <loc>${SITE_URL}/vehicles/${v.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    } catch {
      // If database is unavailable, just return static pages
      console.log('Database unavailable for sitemap, returning static pages only');
    }

    // Generate static page URLs
    const staticUrls = staticPages.map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    );

    // Combine all URLs
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join('')}
${vehicleUrls.join('')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
