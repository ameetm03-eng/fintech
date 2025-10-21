export function AIScreener(state) {
  const f = state.screener.filters;
  return `
    <section class="space-y-6">
      <div class="bg-background/40 border border-border rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3">AI Stock Screener</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${InputNumber('Market Cap Min (INR Cr)', 'mcMin', f.mcMin)}
          ${InputNumber('Market Cap Max (INR Cr)', 'mcMax', f.mcMax)}
          ${InputNumber('P/E Min', 'peMin', f.peMin)}
          ${InputNumber('P/E Max', 'peMax', f.peMax)}
          ${InputNumber('Min Dividend Yield (%)', 'dyMin', f.dyMin)}
          <div>
            <label class="block text-sm mb-1">Analyst Rating</label>
            <select data-filter="rating" class="w-full bg-transparent border border-border rounded-md px-3 py-2">
              ${['Any','Strong Buy','Buy','Hold','Sell','Strong Sell'].map(v=>`<option ${f.rating===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="mt-4">
          <button data-find-stocks class="px-4 py-2 rounded-md bg-accent/20 border border-accent/40 hover:bg-accent/30 disabled:opacity-50" ${state.screener.loading?'disabled':''}>
            ${state.screener.loading? 'Finding...' : 'Find Stocks'}
          </button>
        </div>
      </div>
      <div class="border border-border rounded-xl p-4 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-text/70 text-xs">
            <tr>
              <th class="py-2 pr-4">Symbol</th>
              <th class="py-2 pr-4">Company</th>
              <th class="py-2 pr-4">LTP</th>
              <th class="py-2 pr-4">Market Cap</th>
              <th class="py-2 pr-4">P/E</th>
              <th class="py-2 pr-4">Dividend Yield</th>
            </tr>
          </thead>
          <tbody>
            ${state.screener.results.length? state.screener.results.map(r=>`<tr>
              <td class="py-1 pr-4">${r.symbol}</td>
              <td class="py-1 pr-4">${r.name}</td>
              <td class="py-1 pr-4">${r.ltp}</td>
              <td class="py-1 pr-4">${r.marketCap}</td>
              <td class="py-1 pr-4">${r.pe}</td>
              <td class="py-1 pr-4">${r.dy}</td>
            </tr>`).join('') : `<tr><td colspan="6" class="py-2 text-text/60">No results yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function InputNumber(label, key, value) {
  return `
    <div>
      <label class="block text-sm mb-1">${label}</label>
      <input data-filter="${key}" value="${value}" inputmode="decimal" class="w-full bg-transparent border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40" />
    </div>
  `;
}
