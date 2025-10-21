export function StockAnalyzer(state) {
  const a = state.analyzer;
  const hasResult = !!a.result;
  return `
    <section class="space-y-6">
      <div class="bg-background/40 border border-border rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3">Analyze NSE Stocks</h2>
        <div class="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div class="flex-1 w-full">
            <label class="block text-sm mb-1">Symbols (comma separated)</label>
            <input id="symbol-input" value="${a.inputSymbols}" placeholder="RELIANCE, TCS" class="w-full bg-transparent border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40" />
          </div>
          <div class="flex items-center gap-4">
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="detailed" ${a.mode==='detailed'?'checked':''} /> Detailed
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="summary" ${a.mode==='summary'?'checked':''} /> Summary
            </label>
          </div>
          <button data-analyze class="px-4 py-2 rounded-md bg-accent/20 border border-accent/40 hover:bg-accent/30 disabled:opacity-50" ${a.loading?'disabled':''}>
            ${a.loading? 'Analyzing...' : 'Analyze'}
          </button>
          <button data-add-watch class="px-4 py-2 rounded-md border border-border hover:border-accent/40">Add to Watchlist</button>
        </div>
        ${a.error ? `<p class='text-red-400 mt-2 text-sm'>${a.error}</p>` : ''}
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-6">
          ${hasResult ? DetailTabs(state) : PlaceholderCard('Run an analysis to see insights.')}
        </div>
        <div class="space-y-6">
          ${MarketMovers(state)}
        </div>
      </div>
    </section>
  `;
}

function PlaceholderCard(text) {
  return `<div class="border border-border rounded-xl p-6 text-text/70">${text}</div>`;
}

function DetailTabs(state) {
  const a = state.analyzer;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'technicals', label: 'Technicals' },
    { id: 'news', label: 'News' },
    { id: 'sentiment', label: 'Sentiment' },
    { id: 'strategy', label: 'Strategy' },
  ];
  if (a.inputSymbols.split(',').map(s=>s.trim()).filter(Boolean).length>1) {
    tabs.push({ id: 'comparison', label: 'Comparison' });
  }
  return `
    <div>
      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        ${tabs.map(t => `<button data-detail-tab="${t.id}" class="px-3 py-1.5 rounded-lg border ${a.activeDetailTab===t.id? 'border-accent/60 bg-accent/10' : 'border-border hover:border-accent/30'} transition">${t.label}</button>`).join('')}
      </div>
      <div class="mt-4 border border-border rounded-xl p-4 min-h-[220px]">
        ${DetailContent(a.activeDetailTab, a.result)}
      </div>
    </div>
  `;
}

function DetailContent(tab, result) {
  switch (tab) {
    case 'overview':
      return `
        <div class="grid md:grid-cols-2 gap-4">
          <div class="p-3 border border-border rounded-lg">
            <h3 class="font-medium mb-2">Company</h3>
            <p class="text-sm text-text/70">${result?.overview?.company || '—'}</p>
            <p class="text-xs text-text/60 mt-1">${result?.overview?.description || ''}</p>
          </div>
          <div class="p-3 border border-border rounded-lg">
            <h3 class="font-medium mb-2">SWOT</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              ${['strengths','weaknesses','opportunities','threats'].map(k=>`<div class="p-2 border border-border/60 rounded capitalize">${k}: ${Array.isArray(result?.overview?.swot?.[k])? result.overview.swot[k].join(', ') : '—'}</div>`).join('')}
            </div>
          </div>
        </div>
      `;
    case 'fundamentals':
      return `
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${['pe','pb','roe','roce','de','eps'].map(m => `
            <div class="p-3 border border-border rounded-lg">
              <div class="flex items-baseline justify-between"><span class="text-sm text-text/70">${m.toUpperCase()}</span><span class="font-semibold">${result?.fundamentals?.metrics?.[m] ?? '—'}</span></div>
              <p class="mt-2 text-xs text-text/60">${result?.fundamentals?.notes?.[m] || ''}</p>
            </div>
          `).join('')}
        </div>
      `;
    case 'technicals':
      return `
        <div class="grid gap-4">
          <div class="p-3 border border-border rounded-lg">
            <h3 class="font-medium mb-2">Price & Moving Averages</h3>
            <canvas id="priceChart" height="120"></canvas>
          </div>
          <div class="p-3 border border-border rounded-lg">
            <h3 class="font-medium mb-2">Oscillators</h3>
            <canvas id="oscChart" height="100"></canvas>
          </div>
          <div class="p-3 border border-border rounded-lg">
            <h3 class="font-medium mb-2">Indicator Signals</h3>
            <ul class="list-disc list-inside text-sm text-text/70">
              ${(result?.technicals?.signals || []).map(s=>`<li>${s.label}: ${s.status}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    case 'news':
      return `<div class="space-y-2">${(result?.news || []).map(n=>`<div class='p-3 border border-border rounded-lg'><div class='font-medium'>${n.headline}</div><div class='text-sm text-text/70'>Impact: ${n.impact}</div></div>`).join('')}</div>`;
    case 'sentiment':
      return `
        <div>
          <div class="h-3 rounded bg-border/40 overflow-hidden">
            <div class="h-full bg-emerald-400" style="width: ${Number(result?.sentiment?.score ?? 0)}%"></div>
          </div>
          <p class="mt-2 text-sm">Sentiment: ${result?.sentiment?.label || '—'} (${result?.sentiment?.score ?? 0})</p>
        </div>
      `;
    case 'strategy':
      return `
        <div class="grid sm:grid-cols-2 gap-3 text-sm">
          <div class="p-3 border border-border rounded-lg">Time Horizon: ${result?.strategy?.horizon || '—'}</div>
          <div class="p-3 border border-border rounded-lg">Entry: ${result?.strategy?.entry ?? '—'}, Target: ${result?.strategy?.target ?? '—'}, Stop-loss: ${result?.strategy?.stopLoss ?? '—'}</div>
          <div class="p-3 border border-border rounded-lg">Risk Level: ${result?.strategy?.risk || '—'}</div>
          <div class="p-3 border border-border rounded-lg">Rationale: ${result?.strategy?.rationale || '—'}</div>
        </div>
      `;
    case 'comparison':
      return `
        <div class="text-sm">
          <div class="p-3 border border-border rounded-lg mb-3">AI Verdict: ${result?.comparison?.verdict || '—'}</div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="text-text/70 text-xs">
                <tr><th class="py-2 pr-4">Metric</th><th class="py-2 pr-4">Stock A</th><th class="py-2 pr-4">Stock B</th></tr>
              </thead>
              <tbody>
                ${(result?.comparison?.rows || []).map(row => `<tr><td class="py-1 pr-4">${row.metric}</td><td>${row.a}</td><td>${row.b}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    default:
      return '';
  }
}

function MarketMovers(state) {
  const tab = state.analyzer.moversTab;
  const tabs = [
    { id: 'gainers', label: 'Gainers' },
    { id: 'losers', label: 'Losers' },
  ];
  return `
    <div class="border border-border rounded-xl p-4">
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          ${tabs.map(t => `<button data-movers-tab="${t.id}" class="px-2 py-1 text-sm rounded-md border ${tab===t.id? 'border-accent/60 bg-accent/10' : 'border-border hover:border-accent/30'}">${t.label}</button>`).join('')}
        </div>
        <button data-refresh-movers class="px-2 py-1 text-sm rounded-md border border-border hover:border-accent/30">Refresh</button>
      </div>
      <ul class="mt-3 space-y-2 text-sm">
        ${Array.from({length:5}).map((_,i)=>`<li class='flex justify-between p-2 border border-border/60 rounded'>NIFTY50 ${tab} #${i+1}<span>-</span></li>`).join('')}
      </ul>
    </div>
  `;
}
