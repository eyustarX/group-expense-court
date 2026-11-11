import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { translations } from '../i18n';

export default function HallOfShame({ group, currentMember, language, onBack }) {
  const t = translations[language] || translations.en;

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaderboard(group.code);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      setError(err.message || 'Failed to load Hall of Shame.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [group.code]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-4xl animate-bounce inline-block">⚖️</span>
        <p className="mt-3 font-serif text-gray-700">Summoning the Hall of Shame records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-serif text-[#c59b27] font-bold">
            Public Hall of Records
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0d1b2a] flex items-center gap-2">
            <span>🏆</span> {t.shameTitle}
          </h2>
          <p className="text-xs text-gray-600 font-serif mt-0.5">{t.shameSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-serif text-gray-700 hover:text-black underline"
        >
          ← Back to Docket
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Leaderboard Cards */}
      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const isFirstShame = index === 0 && entry.pendingCount > 0;
          return (
            <div
              key={entry.memberId}
              className={`case-card p-5 transition-all ${
                isFirstShame
                  ? 'border-2 border-red-400 bg-red-50/30 shadow-md'
                  : 'hover:border-[#c59b27]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-serif font-bold text-sm ${
                      index === 0
                        ? 'bg-[#c59b27] text-[#0d1b2a]'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#0d1b2a]">
                      {entry.name} {currentMember?.id === entry.memberId ? '(You)' : ''}
                    </h3>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-serif font-bold bg-[#0d1b2a] text-[#e0b84c]">
                      {entry.title}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div>
                    <span className="text-gray-500 font-serif">{t.avgTimeToPay}: </span>
                    <span className="font-mono font-bold text-[#0d1b2a]">
                      {entry.avgHours !== null ? `${entry.avgHours} ${t.hours}` : t.neverPaid}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-serif">{t.pendingDebts}: </span>
                    <span
                      className={`font-mono font-bold ${
                        entry.pendingCount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {entry.pendingCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
