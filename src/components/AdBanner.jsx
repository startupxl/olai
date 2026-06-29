import React, { useEffect, useRef } from 'react';

const CLIENT  = import.meta.env.VITE_ADSENSE_CLIENT  || 'ca-pub-2370042398000168';
const SLOT_NL = import.meta.env.VITE_ADSENSE_SLOT_NL || '0000000000'; // note-list slot
const SLOT_SB = import.meta.env.VITE_ADSENSE_SLOT_SB || '1111111111'; // sidebar slot

function loadAdSense() {
  if (document.querySelector('script[src*="adsbygoogle"]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src   = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}

export default function AdBanner({ slot = 'notelist', isPro = false }) {
  const ref = useRef(null);
  const slotId = slot === 'sidebar' ? SLOT_SB : SLOT_NL;

  useEffect(() => {
    if (isPro || !slotId || slotId.trim() === '') return;
    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [isPro]);

  if (isPro) return null;

  const isSidebar = slot === 'sidebar';

  // Placeholder when slot IDs haven't been configured yet
  if (!slotId || slotId.trim() === '') {
    return (
      <div style={{
        margin: isSidebar ? '12px 8px' : '8px 12px',
        padding: isSidebar ? '10px' : '12px',
        border: '1px dashed var(--border)',
        borderRadius: 4,
        fontSize: 10,
        color: 'var(--text-tertiary)',
        textAlign: 'center',
        lineHeight: 1.4,
        background: 'var(--bg-secondary)',
      }}>
        Ad slot ({slot})<br />
        Set VITE_ADSENSE_CLIENT + VITE_ADSENSE_SLOT_{slot.toUpperCase()}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ margin: isSidebar ? '12px 8px' : '8px 12px', overflow: 'hidden' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slotId}
        data-ad-format={isSidebar ? 'rectangle' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
}
