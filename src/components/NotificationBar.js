export function NotificationBar(state) {
  if (!state.notifications.length) return '';
  return `
  <div class="sticky top-0 z-50">
    ${state.notifications.map(n => `
      <div class="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-4 py-2 flex items-center justify-between">
        <span>${n.text}</span>
        <button data-dismiss-notice data-id="${n.id}" class="text-sm underline">Dismiss</button>
      </div>
    `).join('')}
  </div>
  `;
}
