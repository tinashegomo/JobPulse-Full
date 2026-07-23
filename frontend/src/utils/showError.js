// Lightweight event bus for showing error toasts from anywhere
let listener = null;

export function showError(message) {
  if (listener) listener(message);
}

export function onShowError(cb) {
  listener = cb;
  return () => { listener = null; };
}
