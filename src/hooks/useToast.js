import { useCallback, useRef } from 'react';

export function useToast() {
  const containerRef = useRef(null);

  const toast = useCallback((msg, type = 'ok', duration = 2800) => {
    let container = document.getElementById('olai-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'olai-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);

    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));

    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    }, duration);
  }, []);

  return toast;
}
