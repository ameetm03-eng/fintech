export function createEventDelegation(rootEl) {
  return function on(eventName, selector) {
    return function (handler) {
      rootEl.addEventListener(eventName, function (event) {
        const target = event.target.closest(selector);
        if (target && rootEl.contains(target)) {
          handler(event);
        }
      });
    };
  };
}
