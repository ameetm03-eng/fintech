// Finsights SPA Entry
import { Header } from './components/Header.js';
import { Tabs } from './components/Tabs.js';
import { StockAnalyzer } from './components/Analyzer/StockAnalyzer.js';
import { AIScreener } from './components/AIScreener.js';
import { Watchlist } from './components/Watchlist.js';
import { LearnCenter } from './components/LearnCenter.js';
import { NotificationBar } from './components/NotificationBar.js';
import { createEventDelegation } from './utils/dom.js';
import { getOrInitUser, getUserWatchlistKey, setUser } from './utils/storage.js';
import * as Gemini from './services/geminiService.js';

export const AppState = {
  activeMainTab: 'analyzer',
  analyzer: {
    inputSymbols: '',
    mode: 'detailed',
    loading: false,
    error: null,
    result: null,
    activeDetailTab: 'overview',
    moversTab: 'gainers',
  },
  screener: {
    filters: { mcMin: '', mcMax: '', peMin: '', peMax: '', dyMin: '', rating: 'Any' },
    loading: false,
    error: null,
    results: [],
  },
  watchlist: {
    items: [],
    alerts: {},
    performanceSeries: [],
  },
  learn: {
    modal: { open: false, topicId: null, content: null, loading: false, error: null },
  },
  auth: {
    user: null,
    loginModalOpen: false,
  },
  notifications: [],
};

export function setState(partialUpdater) {
  const next = typeof partialUpdater === 'function' ? partialUpdater(AppState) : { ...AppState, ...partialUpdater };
  if (typeof partialUpdater === 'function') {
    // updated in place by function, keep reference
  } else {
    Object.assign(AppState, next);
  }
  render();
}

function initFromStorage() {
  const user = getOrInitUser();
  AppState.auth.user = user;
  try {
    const key = getUserWatchlistKey(user?.name);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      AppState.watchlist.items = parsed.items || [];
      AppState.watchlist.alerts = parsed.alerts || {};
    }
  } catch (e) {
    console.error('Failed to load watchlist', e);
  }
}

function saveWatchlist() {
  try {
    const key = getUserWatchlistKey(AppState.auth.user?.name);
    localStorage.setItem(key, JSON.stringify({ items: AppState.watchlist.items, alerts: AppState.watchlist.alerts }));
  } catch (e) {
    console.error('Failed to save watchlist', e);
  }
}

async function refreshWatchlistPerformance() {
  const symbols = AppState.watchlist.items.map(s => s.symbol);
  if (symbols.length < 2) {
    AppState.watchlist.performanceSeries = [];
    return;
  }
  try {
    const data = await Gemini.getWatchlistPerformance(symbols);
    const dates = data?.dates || [];
    const series = data?.avgSeries || [];
    AppState.watchlist.performanceSeries = dates.map((d, i) => ({ date: d, avgPct: series[i] ?? 0 }));
  } catch (e) {
    // ignore silently in UI; could add notification
  }
}

function mountEventHandlers(root) {
  const on = createEventDelegation(root);

  // Main tabs
  on('click', '[data-main-tab]')(e => {
    const tab = e.target.closest('[data-main-tab]').dataset.mainTab;
    AppState.activeMainTab = tab;
    render();
  });

  // Auth
  on('click', '[data-open-login]')(() => { AppState.auth.loginModalOpen = true; render(); });
  on('click', '[data-close-login]')(() => { AppState.auth.loginModalOpen = false; render(); });
  on('click', '[data-sign-in]')(() => {
    const name = root.querySelector('#login-name')?.value?.trim();
    if (!name) return;
    AppState.auth.user = { name };
    AppState.auth.loginModalOpen = false;
    setUser(AppState.auth.user);
    saveWatchlist();
    render();
  });
  on('click', '[data-sign-out]')(() => {
    AppState.auth.user = null;
    setUser(null);
    render();
  });

  // Analyzer inputs
  on('input', '#symbol-input')(e => { AppState.analyzer.inputSymbols = e.target.value; });
  on('change', 'input[name="mode"]')(e => { AppState.analyzer.mode = e.target.value; render(); });

  on('click', '[data-analyze]')(() => {
    const symbols = AppState.analyzer.inputSymbols.trim();
    if (!symbols) return;
    AppState.analyzer.loading = true;
    AppState.analyzer.error = null;
    render();
    Gemini.generateReport({ symbols, mode: AppState.analyzer.mode })
      .then(json => { AppState.analyzer.result = json; })
      .catch(err => { AppState.analyzer.error = err.message || 'Failed to analyze'; })
      .finally(() => { AppState.analyzer.loading = false; render(); });
  });

  // Screener filters and actions
  on('input', '[data-filter]')(e => {
    const key = e.target.getAttribute('data-filter');
    AppState.screener.filters[key] = e.target.value;
  });
  on('click', '[data-find-stocks]')(() => {
    AppState.screener.loading = true;
    AppState.screener.error = null;
    render();
    Gemini.runStockScreener(AppState.screener.filters)
      .then(results => { AppState.screener.results = Array.isArray(results) ? results : (results.results || []); })
      .catch(err => { AppState.screener.error = err.message || 'Failed to run screener'; })
      .finally(() => { AppState.screener.loading = false; render(); });
  });

  on('click', '[data-detail-tab]')(e => {
    const tab = e.target.closest('[data-detail-tab]').dataset.detailTab;
    AppState.analyzer.activeDetailTab = tab;
    render();
  });

  // Market movers
  on('click', '[data-movers-tab]')(e => {
    const tab = e.target.closest('[data-movers-tab]').dataset.moversTab;
    AppState.analyzer.moversTab = tab;
    render();
  });
  on('click', '[data-refresh-movers]')(() => {
    Gemini.getMarketMovers()
      .then(json => {
        AppState.notifications.push({ id: Date.now(), type: 'info', text: 'Market movers refreshed' });
      })
      .catch(() => {
        AppState.notifications.push({ id: Date.now(), type: 'error', text: 'Failed to refresh movers' });
      })
      .finally(() => render());
  });

  // Watchlist actions
  on('click', '[data-add-watch]')(() => {
    const symbol = AppState.analyzer.inputSymbols.split(',')[0]?.trim();
    if (!symbol) return;
    if (!AppState.watchlist.items.find(s => s.symbol === symbol)) {
      AppState.watchlist.items.push({ symbol, name: symbol });
      saveWatchlist();
      refreshWatchlistPerformance().then(render);
    }
  });
  on('click', '[data-remove-watch]')(e => {
    const symbol = e.target.closest('[data-remove-watch]').dataset.symbol;
    AppState.watchlist.items = AppState.watchlist.items.filter(s => s.symbol !== symbol);
    saveWatchlist();
    refreshWatchlistPerformance().then(render);
  });
  on('input', '[data-alert-input]')(e => {
    const symbol = e.target.dataset.symbol;
    AppState.watchlist.alerts[symbol] = e.target.value;
    saveWatchlist();
  });

  // Simulated alert check on analyze and screener actions could be extended
  // Here we periodically fetch quotes for alerting if API key is set
  try {
    if (!mountEventHandlers._quotesTimer) {
      mountEventHandlers._quotesTimer = setInterval(async () => {
        const symbols = AppState.watchlist.items.map(s => s.symbol);
        if (!symbols.length) return;
        try {
          const quotes = await Gemini.getQuotes(symbols);
          const arr = Array.isArray(quotes) ? quotes : (quotes.quotes || []);
          arr.forEach(q => {
            const target = Number(AppState.watchlist.alerts[q.symbol]);
            if (target && Number(q.ltpNumber) >= target) {
              const id = Date.now() + Math.random();
              AppState.notifications.push({ id, type: 'alert', text: `${q.symbol} crossed alert: ${q.ltpNumber} ≥ ${target}` });
            }
          });
          render();
        } catch (_) {}
      }, 15000);
    }
  } catch (_) {}

  on('click', '[data-dismiss-notice]')(e => {
    const id = Number(e.target.closest('[data-dismiss-notice]').dataset.id);
    AppState.notifications = AppState.notifications.filter(n => n.id !== id);
    render();
  });

  // Learn Center modal controls
  on('click', '[data-open-topic]')(e => {
    const id = e.target.closest('[data-open-topic]').dataset.id;
    AppState.learn.modal.open = true;
    AppState.learn.modal.topicId = id;
    AppState.learn.modal.loading = true;
    AppState.learn.modal.error = null;
    render();
    Gemini.learnTopic(id)
      .then(data => { AppState.learn.modal.content = data; })
      .catch(err => { AppState.learn.modal.error = err.message || 'Failed to load content'; })
      .finally(() => { AppState.learn.modal.loading = false; render(); });
  });
  on('click', '[data-close-topic]')(() => {
    AppState.learn.modal.open = false;
    AppState.learn.modal.topicId = null;
    AppState.learn.modal.content = null;
    AppState.learn.modal.error = null;
    AppState.learn.modal.loading = false;
    render();
  });
}

function MainView(state) {
  const tabs = [
    { id: 'analyzer', label: 'Stock Analyzer' },
    { id: 'screener', label: 'AI Stock Screener' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'learn', label: 'Learn' },
  ];
  let content = '';
  if (state.activeMainTab === 'analyzer') content = StockAnalyzer(state);
  if (state.activeMainTab === 'screener') content = AIScreener(state);
  if (state.activeMainTab === 'watchlist') content = Watchlist(state);
  if (state.activeMainTab === 'learn') content = LearnCenter(state);

  return `
    ${NotificationBar(state)}
    ${Header(state)}
    <main class="max-w-6xl mx-auto px-4 pb-24">
      ${Tabs({ tabs, activeId: state.activeMainTab })}
      <section class="mt-6">
        ${content}
      </section>
    </main>
  `;
}

export function render() {
  const root = document.getElementById('app');
  root.innerHTML = MainView(AppState);
  if (!render._mounted) {
    mountEventHandlers(root);
    render._mounted = true;
  }

  // Initialize charts if canvases exist and data available
  try {
    if (AppState.analyzer.result && document.getElementById('priceChart')) {
      const ctx = document.getElementById('priceChart').getContext('2d');
      const series = AppState.analyzer.result?.technicals?.priceSeries || [];
      const labels = series.map(p => p.date);
      const prices = series.map(p => p.close);
      const ma20 = AppState.analyzer.result?.technicals?.ma20 || [];
      const ma50 = AppState.analyzer.result?.technicals?.ma50 || [];
      if (render._priceChart) render._priceChart.destroy();
      render._priceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Close', data: prices, borderColor: '#67e8f9', tension: 0.2 },
            { label: 'MA20', data: ma20, borderColor: '#22d3ee', borderDash: [6,4], tension: 0.2 },
            { label: 'MA50', data: ma50, borderColor: '#0ea5e9', borderDash: [2,4], tension: 0.2 },
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  } catch (_) {}

  try {
    if (AppState.analyzer.result && document.getElementById('oscChart')) {
      const ctx = document.getElementById('oscChart').getContext('2d');
      const labels = AppState.analyzer.result?.technicals?.osc?.labels || [];
      const rsi = AppState.analyzer.result?.technicals?.osc?.rsi || [];
      const macd = AppState.analyzer.result?.technicals?.osc?.macd || [];
      if (render._oscChart) render._oscChart.destroy();
      render._oscChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [ { label: 'RSI', data: rsi, borderColor: '#f97316' }, { label: 'MACD', data: macd, borderColor: '#a78bfa' } ] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  } catch (_) {}

  try {
    if (AppState.watchlist.performanceSeries?.length && document.getElementById('watchlistPerf')) {
      const ctx = document.getElementById('watchlistPerf').getContext('2d');
      const labels = AppState.watchlist.performanceSeries.map(p => p.date);
      const values = AppState.watchlist.performanceSeries.map(p => p.avgPct);
      if (render._watchChart) render._watchChart.destroy();
      render._watchChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [ { label: 'Avg %', data: values, borderColor: '#67e8f9' } ] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  } catch (_) {}
}

// Boot
initFromStorage();
render();
