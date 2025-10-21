export function Watchlist(state) {
  const items = state.watchlist.items;
  return `
    <section class="space-y-6">
      <div class="border border-border rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3">Your Watchlist</h2>
        ${items.length ? `<ul class="space-y-2">
          ${items.map(s => `
            <li class="flex items-center justify-between p-2 border border-border/60 rounded">
              <div>
                <div class="font-medium">${s.name}</div>
                <div class="text-xs text-text/60">${s.symbol}</div>
              </div>
              <div class="flex items-center gap-2">
                <input data-alert-input data-symbol="${s.symbol}" value="${state.watchlist.alerts[s.symbol] || ''}" placeholder="Alert price" class="w-28 bg-transparent border border-border rounded-md px-2 py-1 text-sm" />
                <button data-remove-watch data-symbol="${s.symbol}" class="px-2 py-1 text-sm rounded-md border border-border hover:border-accent/30">Remove</button>
              </div>
            </li>
          `).join('')}
        </ul>` : `<p class="text-text/60">No stocks added yet.</p>`}
      </div>

      ${items.length >= 2 ? `<div class="border border-border rounded-xl p-4">
        <h3 class="font-medium mb-2">Performance (30d average % change)</h3>
        <canvas id="watchlistPerf" height="120"></canvas>
      </div>` : ''}
    </section>
  `;
}
