import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import xmlrpc from 'xmlrpc';

const app = express();
const port = Number(process.env.PORT || 3001);
const rpcHost = process.env.SCRAPER_RPC_HOST || '127.0.0.1';
const rpcPort = Number(process.env.SCRAPER_RPC_PORT || 8000);
const rpcPath = process.env.SCRAPER_RPC_PATH || '/RPC2';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scrapers = [
  { id: 'reklama5', name: 'Reklama5', country: 'North Macedonia', category: 'Classifieds', method: 'scrapeReklama5' },
  { id: 'pazar3', name: 'Pazar3', country: 'North Macedonia', category: 'Classifieds', method: 'scrapePazar3' },
  { id: 'avto-delovi', name: 'Avto Delovi', country: 'North Macedonia', category: 'Automotive', method: 'scrapeAvtoDelovi' },
  { id: 'avto-oglasi', name: 'Avto Oglasi', country: 'North Macedonia', category: 'Automotive', method: 'scrapeAvtoOglasi' },
  { id: 'koli', name: 'Koli', country: 'North Macedonia', category: 'Automotive', method: 'scrapeKoli' },
  { id: 'baram-dom', name: 'Baram Dom', country: 'North Macedonia', category: 'Property', method: 'scrapeBaramDom' },
  { id: 'halo-oglasi', name: 'Halo Oglasi', country: 'Serbia', category: 'Classifieds', method: 'scrapeHaloOglasi' },
  { id: 'kupujem-prodajem', name: 'KupujemProdajem', country: 'Serbia', category: 'Classifieds', method: 'scrapeKupujemProdajem' },
  { id: 'mobile24', name: 'Mobile24', country: 'North Macedonia', category: 'Automotive', method: 'scrapeMobile24' },
  { id: 'mobile-bg', name: 'Mobile.bg', country: 'Bulgaria', category: 'Automotive', method: 'scrapeMobileBg' },
  { id: 'nadji-dom', name: 'Nadji Dom', country: 'Serbia', category: 'Property', method: 'scrapeNadjiDom' },
  { id: 'nedviznosti-makedonija', name: 'Nedviznosti Makedonija', country: 'North Macedonia', category: 'Property', method: 'scrapeNedviznostiMakedonija' },
  { id: 'oglasi-rs', name: 'Oglasi.rs', country: 'Serbia', category: 'Classifieds', method: 'scrapeOglasiRs' },
  { id: 'pobaraj-oglasi', name: 'Pobaraj Oglasi', country: 'North Macedonia', category: 'Classifieds', method: 'scrapePobarajOglasi' },
  { id: 'vip-market5', name: 'Vip Market5', country: 'North Macedonia', category: 'Classifieds', method: 'scrapeVipMarket5' }
];

function rpcCall(method) {
  return new Promise((resolve, reject) => {
    const client = xmlrpc.createClient({ host: rpcHost, port: rpcPort, path: rpcPath });
    client.methodCall(method, [], (error, value) => {
      client.close?.();
      if (error) reject(error);
      else resolve(value);
    });
  });
}

function normalizeAds(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return Object.entries(payload).map(([url, ad]) => ({ url, ...ad }));
  if (typeof payload !== 'string' || !payload.trim()) return [];
  const parsed = JSON.parse(payload);
  if (Array.isArray(parsed)) return parsed;
  return Object.entries(parsed).map(([url, ad]) => ({ url, ...ad }));
}

app.get('/api/health', async (_req, res) => {
  try {
    await rpcCall('system.listMethods');
    res.json({ status: 'ok', rpc: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unavailable', rpc: 'disconnected', message: error.message });
  }
});

app.get('/api/scrapers', (_req, res) => {
  res.json({ scrapers });
});

app.get('/api/scrapers/:id/run', async (req, res) => {
  const scraper = scrapers.find((item) => item.id === req.params.id);
  if (!scraper) return res.status(404).json({ error: 'Unknown scraper.' });

  try {
    const startedAt = new Date().toISOString();
    const raw = await rpcCall(scraper.method);
    const ads = normalizeAds(raw);
    res.json({
      scraper: scraper.id,
      scraperName: scraper.name,
      startedAt,
      completedAt: new Date().toISOString(),
      count: ads.length,
      ads
    });
  } catch (error) {
    res.status(502).json({
      error: 'The scraper could not be executed.',
      details: error.message,
      hint: 'Check that the legacy Python XML-RPC service is running and that this scraper is registered.'
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  const webRoot = path.resolve(__dirname, '../dist');
  app.use(express.static(webRoot));
  app.get('*', (_req, res) => res.sendFile(path.join(webRoot, 'index.html')));
}

app.listen(port, '127.0.0.1', () => {
  console.log(`Scrapers web API listening at http://127.0.0.1:${port}`);
  console.log(`XML-RPC target: http://${rpcHost}:${rpcPort}${rpcPath}`);
});
