import React from 'react';
import { translations } from '../i18n';

export default function Navbar({ currentCourt, currentMember, language, setLanguage, onNavigate }) {
  const t = translations[language] || translations.en;

  return (
    <header className="bg-[#0d1b2a] text-[#f8f5ee] border-b border-[#c59b27]/40 sticky top-0 z-50 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div
          onClick={() => onNavigate(currentCourt ? 'group' : 'home')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl" role="img" aria-label="Gavel">⚖️</span>
          <div>
            <h1 className="text-lg md:text-xl font-bold font-serif tracking-wide text-[#e0b84c]">
              {t.appTitle}
            </h1>
            {currentCourt && (
              <p className="text-xs text-gray-300">
                {currentCourt.name} ({currentCourt.code})
                {currentMember && <span className="ml-1 text-[#e0b84c]">· {currentMember.name}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-[#1b263b] p-1 rounded border border-[#c59b27]/30 text-xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded transition-colors ${
              language === 'en' ? 'bg-[#c59b27] text-[#0d1b2a] font-bold' : 'text-gray-300 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('am')}
            className={`px-2 py-1 rounded transition-colors ${
              language === 'am' ? 'bg-[#c59b27] text-[#0d1b2a] font-bold' : 'text-gray-300 hover:text-white'
            }`}
          >
            አማ
          </button>
          <button
            type="button"
            onClick={() => setLanguage('om')}
            className={`px-2 py-1 rounded transition-colors ${
              language === 'om' ? 'bg-[#c59b27] text-[#0d1b2a] font-bold' : 'text-gray-300 hover:text-white'
            }`}
          >
            OM
          </button>
        </div>
      </div>
    </header>
  );
}
