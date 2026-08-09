// accessibile a tutti i file js e angular
export const ShellStore = (function () {
  const state = {
    user: null,
    token: localStorage.getItem('token') || null,
  };

  const listeners = {};

  function get(key) { return state[key]; }

  function set(key, value) {
    state[key] = value;
    if (key === 'token') {
      value ? localStorage.setItem('token', value)
             : localStorage.removeItem('token');
    }
    (listeners[key] || []).forEach(fn => fn(value));
  }

  function on(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
    return () => { listeners[key] = listeners[key].filter(l => l !== fn); };
  }

  // Interfacce per interagire con gli attributi della funzione
  return { get, set, on };
})();

window.ShellStore = ShellStore; // Rende ShellStore accessibile globalmente
