import React, { useState } from 'react';
import { TEMPLATES } from '../lib/templates.js';
import './TemplateGallery.css';

const CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'business', label: 'Business' },
];

export default function TemplateGallery({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hovered, setHovered] = useState(null);

  const visible = activeCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === activeCategory);

  const preview = hovered ? TEMPLATES.find(t => t.id === hovered) : null;

  function handleSelect(t) {
    onSelect({ title: t.title(), body: t.body(), tags: t.tags });
    onClose();
  }

  return (
    <div className="tg-backdrop" onClick={onClose}>
      <div className="tg-modal" onClick={e => e.stopPropagation()}>

        <div className="tg-header">
          <div>
            <h2 className="tg-title">Templates</h2>
            <p className="tg-sub">Start from a proven structure — edit it to make it yours.</p>
          </div>
          <button className="tg-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="tg-tabs">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`tg-tab${activeCategory === c.id ? ' tg-tab--active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="tg-body">
          <div className="tg-grid">
            {visible.map(t => (
              <button
                key={t.id}
                className={`tg-card${hovered === t.id ? ' tg-card--hover' : ''}`}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(t)}
              >
                <span className="tg-card-emoji">{t.emoji}</span>
                <span className="tg-card-name">{t.name}</span>
                <span className="tg-card-desc">{t.description}</span>
                <span className="tg-card-tags">
                  {t.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="tg-tag">#{tag}</span>
                  ))}
                </span>
              </button>
            ))}
          </div>

          {preview && (
            <div className="tg-preview">
              <div className="tg-preview-header">
                <span>{preview.emoji} {preview.name}</span>
              </div>
              <pre className="tg-preview-body">{preview.body()}</pre>
            </div>
          )}
        </div>

        <div className="tg-footer">
          <span className="tg-footer-hint">Hover a template to preview · Click to create</span>
        </div>
      </div>
    </div>
  );
}
