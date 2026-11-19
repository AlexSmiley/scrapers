# Scrapers

A collection of legacy Python scrapers for classifieds, automotive, and property-listing websites across the Balkans.

## Web dashboard

A React + Vite dashboard and Node.js API bridge are available in [web/](web/README.md). The dashboard preserves the existing Python scraper implementations and invokes them through the XML-RPC service.

See [web/README.md](web/README.md) for requirements, setup instructions, configuration, and API endpoints.

## Legacy scraper service

The existing XML-RPC service is defined in `Service.py` and listens on `localhost:8000` at `/RPC2`. It depends on the original Python 2-era runtime and scraper libraries. The web dashboard does not modernize or replace that runtime.
