import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, CarFront, CheckCircle2, Clock3, Globe2, Home, LoaderCircle, PackageSearch, RefreshCw, Search, Server, ShieldAlert, SlidersHorizontal, Tag, X } from 'lucide-react';

const iconFor = (category) => category === 'Automotive' ? CarFront : category === 'Property' ? Home : PackageSearch;
const money = (ad) => ad.value && ad.value !== '/' ? [ad.value, ad.currency && ad.currency !== '/' ? ad.currency : ''].filter(Boolean).join(' ') : 'Price on request';

export default function App() {
  const [scrapers, setScrapers] = useState([]);
  const [health, setHealth] = useState('checking');
  const [selected, setSelected] = useState('all');
  const [query, setQuery] = useState('');
  const [ads, setAds] = useState([]);
  const [activeScraper, setActiveScraper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRun, setLastRun] = useState(null);

  const refreshHealth = async () => {
    try {
      const response = await fetch('/api/health');
      setHealth(response.ok ? 'connected' : 'disconnected');
    } catch {
      setHealth('disconnected');
    }
  };

  useEffect(() => {
    fetch('/api/scrapers')
      .then((response) => { if (!response.ok) throw new Error('Could not load scraper list'); return response.json(); })
      .then((data) => setScrapers(data.scrapers || []))
      .catch((err) => setError(err.message));
    refreshHealth();
  }, []);

  const filteredScrapers = useMemo(() => scrapers.filter((item) => {
    const matchesCategory = selected === 'all' || item.category === selected;
    const term = query.toLowerCase();
    return matchesCategory && [item.name, item.country, item.category].some((value) => value.toLowerCase().includes(term));
  }), [scrapers, selected, query]);

  const runScraper = async (scraper) => {
    setLoading(true);
    setActiveScraper(scraper.id);
    setError('');
    try {
      const response = await fetch(`/api/scrapers/${scraper.id}/run`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Scraper request failed');
      setAds(data.ads || []);
      setLastRun({ name: scraper.name, count: data.count, at: data.completedAt });
    } catch (err) {
      setError(err.message);
      setAds([]);
    } finally {
      setLoading(false);
      setActiveScraper(null);
      refreshHealth();
    }
  };

  const categories = ['all', 'Classifieds', 'Automotive', 'Property'];
  const total = scrapers.length;
  const countries = new Set(scrapers.map((item) => item.country)).size;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark"><Activity size={21} /></span><span>scrapers<span className="brand-dot">.</span></span></a>
        <div className="side-label">WORKSPACE</div>
        <button className="nav-item active"><SlidersHorizontal size={17} /> Overview</button>
        <div className="side-label sources-label">SOURCES</div>
        {categories.slice(1).map((category) => <button key={category} className={selected === category ? 'nav-item active' : 'nav-item'} onClick={() => setSelected(selected === category ? 'all' : category)}><Tag size={16} /> {category}</button>)}
        <div className="sidebar-bottom">
          <div className="connection-card">
            <span className={health === 'connected' ? 'status-dot online' : 'status-dot'} />
            <div><strong>Scraper service</strong><small>{health === 'checking' ? 'Checking connection…' : health === 'connected' ? 'Connected' : 'Not connected'}</small></div>
            <button className="icon-button" aria-label="Refresh connection" onClick={refreshHealth}><RefreshCw size={14} /></button>
          </div>
          <small className="version">WEB CONSOLE · 1.0.0</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Overview</div><div className="topbar-right"><span className="region-pill"><Globe2 size={14} /> Balkans sources</span><span className="avatar">AS</span></div></header>
        <section className="page-heading">
          <div><div className="eyebrow">DATA COLLECTION WORKSPACE</div><h1>Scraper overview</h1><p>Run your marketplace scrapers and explore collected listings in one place.</p></div>
          <button className="secondary-button" onClick={refreshHealth}><RefreshCw size={15} /> Check service</button>
        </section>

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Available sources</span><PackageSearch size={17} /></div><strong>{total}</strong><small>Registered scraper integrations</small></div>
          <div className="stat-card"><div className="stat-top"><span>Countries covered</span><Globe2 size={17} /></div><strong>{countries}</strong><small>North Macedonia, Serbia & Bulgaria</small></div>
          <div className="stat-card"><div className="stat-top"><span>Latest result set</span><Activity size={17} /></div><strong>{lastRun ? lastRun.count.toLocaleString() : '—'}</strong><small>{lastRun ? `Listings from ${lastRun.name}` : 'Run a source to collect listings'}</small></div>
        </section>

        <section className="section-heading"><div><h2>Data sources</h2><p>Select a source to start collecting listings.</p></div><div className="source-count">{filteredScrapers.length} SOURCES</div></section>
        <div className="toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources or countries…" /></div><div className="filter-tabs">{categories.map((category) => <button key={category} onClick={() => setSelected(category)} className={selected === category ? 'filter-tab selected' : 'filter-tab'}>{category === 'all' ? 'All sources' : category}</button>)}</div></div>

        {error && <div className="error-banner"><ShieldAlert size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
        <div className="source-grid">
          {filteredScrapers.map((scraper) => {
            const Icon = iconFor(scraper.category);
            const isRunning = activeScraper === scraper.id;
            return <article className="source-card" key={scraper.id}>
              <div className="source-card-top"><span className="source-icon"><Icon size={19} /></span><span className="category-label">{scraper.category}</span></div>
              <h3>{scraper.name}</h3><p className="source-country"><Globe2 size={13} /> {scraper.country}</p>
              <div className="source-card-footer"><span className="source-state"><span className="tiny-dot" /> Ready to run</span><button className="run-button" disabled={loading} onClick={() => runScraper(scraper)}>{isRunning ? <><LoaderCircle className="spin" size={15} /> Running</> : <>Run scraper <ArrowUpRight size={15} /></>}</button></div>
            </article>;
          })}
        </div>
        {filteredScrapers.length === 0 && <div className="empty-state">No sources match your search.</div>}

        <section className="results-section">
          <div className="section-heading results-heading"><div><h2>Collected listings</h2><p>{lastRun ? `Results from ${lastRun.name}` : 'Your latest scraper results will appear here.'}</p></div>{lastRun && <span className="result-total"><CheckCircle2 size={14} /> {ads.length} listings</span>}</div>
          {loading && <div className="loading-state"><LoaderCircle className="spin" size={20} /> Running {scrapers.find((item) => item.id === activeScraper)?.name}… This may take a little while.</div>}
          {!loading && ads.length > 0 && <div className="listing-grid">{ads.map((ad, index) => <article className="listing-card" key={ad.url || index}>
            <div className="listing-image">{ad.imageUrl && ad.imageUrl !== '/' ? <img src={ad.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <PackageSearch size={26} />}</div>
            <div className="listing-body"><div className="listing-meta">{ad.category && ad.category !== '/' ? ad.category : 'Listing'} <span>·</span> {ad.region || 'Region not specified'}</div><h3>{ad.title || 'Untitled listing'}</h3><p>{ad.description && ad.description !== '/' ? ad.description : 'No description provided.'}</p><div className="listing-footer"><strong>{money(ad)}</strong>{ad.url && <a href={ad.url} target="_blank" rel="noreferrer">View listing <ArrowUpRight size={13} /></a>}</div></div>
          </article>)}</div>}
          {!loading && ads.length === 0 && !error && <div className="empty-results"><div className="empty-icon"><PackageSearch size={23} /></div><strong>No listings to display</strong><span>Run any scraper above to fetch its latest marketplace listings.</span></div>}
        </section>
        <footer className="footer"><span>Scrapers Web Console</span><span><Server size={13} /> Connected through local API bridge</span></footer>
      </main>
    </div>
  );
}
