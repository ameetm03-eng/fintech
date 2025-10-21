export function Tabs({ tabs, activeId }) {
  return `
    <div class="flex gap-2 overflow-x-auto no-scrollbar">
      ${tabs.map(t => `
        <button data-main-tab="${t.id}" class="px-3 py-1.5 rounded-lg border ${activeId===t.id? 'border-accent/60 bg-accent/10' : 'border-border hover:border-accent/30'} transition whitespace-nowrap">${t.label}</button>
      `).join('')}
    </div>
  `;
}
