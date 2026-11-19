# Scrapers Web Console

A React dashboard and Node.js REST bridge for the repository's legacy Python XML-RPC scraper service.

## Architecture

- `src/`: React + Vite dashboard for browsing scraper sources and displaying listings.
- `server/`: Express API that exposes scraper metadata, health checks, and scraper execution.
- The Node.js bridge calls the existing XML-RPC methods; it does not reimplement or replace the Python scrapers.

## Requirements

- Node.js 18+
- The legacy Python scraper service running on port 8000 (see the repository's `Service.py`).
- The legacy scraper runtime dependencies. The original service uses Python 2-era libraries, including PyQt4 and `webscraping`.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173.

The development server starts the Express API on port 3001 and proxies `/api` requests to it. Configure the XML-RPC target with `SCRAPER_RPC_HOST`, `SCRAPER_RPC_PORT`, and `SCRAPER_RPC_PATH` (defaults: `127.0.0.1`, `8000`, and `/RPC2`).

For a production build:

```bash
npm run build
npm start
```

The production Express server serves the generated Vite app from `dist/`.

## API

- `GET /api/health` — checks the XML-RPC service.
- `GET /api/scrapers` — lists configured scraper integrations.
- `POST /api/scrapers/:id/run` — runs a scraper and returns normalized listing JSON.

Scraper execution can take time because some legacy implementations fetch listing details one by one. Keep the API private to a trusted local network; it intentionally does not expose an unauthenticated public scraping endpoint.

## Compatibility

The XML-RPC service returns scraper results as JSON text. `Utilities.py` serializes the collected ads with `json.dumps` so the Node.js bridge can safely parse the response.
