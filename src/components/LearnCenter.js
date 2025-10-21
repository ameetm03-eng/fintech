export function LearnCenter(state) {
  const topics = [
    { id: 'fa_pe', cat: 'Fundamental Analysis', title: 'Price to Earnings (P/E)' },
    { id: 'fa_roe', cat: 'Fundamental Analysis', title: 'Return on Equity (ROE)' },
    { id: 'ta_rsi', cat: 'Technical Analysis', title: 'Relative Strength Index (RSI)' },
    { id: 'ta_macd', cat: 'Technical Analysis', title: 'MACD' },
    { id: 'inv_dca', cat: 'Investing Concepts', title: 'Dollar-Cost Averaging' },
  ];
  return `
    <section class="space-y-6">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${topics.map(t => `
          <button data-open-topic data-id="${t.id}" class="p-4 border border-border rounded-xl text-left hover:border-accent/40 transition">
            <div class="text-xs text-text/60">${t.cat}</div>
            <div class="font-medium mt-1">${t.title}</div>
          </button>
        `).join('')}
      </div>
      ${state.learn.modal.open ? TopicModal(state) : ''}
    </section>
  `;
}

function TopicModal(state) {
  const m = state.learn.modal;
  return `
    <div class="fixed inset-0 bg-black/60 grid place-items-center">
      <div class="bg-background border border-border rounded-xl p-6 w-full max-w-2xl shadow-xl">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-semibold">${m.content?.title || 'Topic'}</h2>
          <button data-close-topic class="px-2 py-1 text-sm rounded-md border border-border">Close</button>
        </div>
        <div class="prose prose-invert max-w-none">
          ${m.loading ? '<p>Loading...</p>' : (m.error ? `<p class='text-red-400 text-sm'>${m.error}</p>` : (m.content?.html || '<p>Content here.</p>'))}
        </div>
      </div>
    </div>
  `;
}
