export function Header(state) {
  const user = state.auth.user;
  return `
  <header class="border-b border-border/50 sticky top-0 z-40 backdrop-blur bg-background/70">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-accent"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V19h-2v-2.07a8.001 8.001 0 01-6.32-6.32H4v-2h2.68A8.001 8.001 0 0111 5.07V3h2v2.07a8.001 8.001 0 016.32 6.32H20v2h-2.68A8.001 8.001 0 0113 16.93z"/></svg>
        <span class="font-semibold tracking-wide">Finsights</span>
      </div>
      <div>
        ${user ? `
          <div class="flex items-center gap-3">
            <span class="text-sm text-text/80">Welcome, ${user.name}</span>
            <button data-sign-out class="px-3 py-1.5 rounded-md border border-border hover:border-accent/50 transition">Sign Out</button>
          </div>
        ` : `
          <button data-open-login class="px-3 py-1.5 rounded-md border border-border hover:border-accent/50 transition">Sign In</button>
        `}
      </div>
    </div>
    ${state.auth.loginModalOpen ? LoginModal() : ''}
  </header>
  `;
}

function LoginModal() {
  return `
  <div class="fixed inset-0 bg-black/60 grid place-items-center">
    <div class="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
      <h2 class="text-lg font-semibold mb-4">Sign In</h2>
      <label class="block text-sm mb-2">Name</label>
      <input id="login-name" class="w-full bg-transparent border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Your name" />
      <div class="mt-6 flex justify-end gap-3">
        <button data-close-login class="px-3 py-1.5 rounded-md border border-border">Cancel</button>
        <button data-sign-in class="px-3 py-1.5 rounded-md bg-accent/20 border border-accent/40 hover:bg-accent/30">Sign In</button>
      </div>
    </div>
  </div>
  `;
}
