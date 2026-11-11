import React, { useState } from 'react';
import { api } from '../api';
import { translations } from '../i18n';
import GavelButton from '../components/GavelButton';

export default function Home({ onJoinSuccess, language }) {
  const t = translations[language] || translations.en;

  const [tab, setTab] = useState('join'); // 'join' or 'create'
  const [courtName, setCourtName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!courtName.trim() || !memberName.trim()) {
      setError('Please provide both court name and your member name.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { group, code } = await api.createGroup(courtName.trim());
      const { member } = await api.joinGroup(code, memberName.trim());
      onJoinSuccess(group, member);
    } catch (err) {
      setError(err.message || 'Failed to create court.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim() || !memberName.trim()) {
      setError('Please provide court code and your member name.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { group, member } = await api.joinGroup(joinCode.trim(), memberName.trim());
      onJoinSuccess(group, member);
    } catch (err) {
      setError(err.message || 'Failed to join court. Check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const { group, member } = await api.joinGroup('COURT-4821', 'Selam');
      onJoinSuccess(group, member);
    } catch (err) {
      setError(err.message || 'Failed to connect to Demo Court.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Court Crest & Tagline */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-[#0d1b2a] rounded-full border-2 border-[#c59b27] shadow-lg mb-3">
          <span className="text-5xl" role="img" aria-label="Scales of Justice">⚖️</span>
        </div>
        <h1 className="text-3xl font-serif font-extrabold text-[#0d1b2a] tracking-tight">
          {t.appTitle}
        </h1>
        <p className="text-sm text-gray-700 mt-2 font-serif italic max-w-xs mx-auto">
          "{t.tagline}"
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-[#e8e2d5] p-1 rounded-xl mb-6 border border-[#d6ccb8]">
        <button
          type="button"
          onClick={() => { setTab('join'); setError(''); }}
          className={`flex-1 py-2 text-sm font-serif font-bold rounded-lg transition-all ${
            tab === 'join' ? 'bg-[#0d1b2a] text-[#f8f5ee] shadow-sm' : 'text-gray-700 hover:text-black'
          }`}
        >
          {t.joinCourt}
        </button>
        <button
          type="button"
          onClick={() => { setTab('create'); setError(''); }}
          className={`flex-1 py-2 text-sm font-serif font-bold rounded-lg transition-all ${
            tab === 'create' ? 'bg-[#0d1b2a] text-[#f8f5ee] shadow-sm' : 'text-gray-700 hover:text-black'
          }`}
        >
          {t.createCourt}
        </button>
      </div>

      {/* Form Card */}
      <div className="case-card p-6 border-t-4 border-t-[#c59b27]">
        {error && (
          <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-800 text-sm rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {tab === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                {t.courtCode}
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t.courtCodePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c59b27] font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                {t.yourName}
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder={t.yourNamePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
                required
              />
            </div>

            <GavelButton disabled={loading} className="w-full mt-2">
              {loading ? 'Convening...' : t.enterCourt}
            </GavelButton>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                {t.courtName}
              </label>
              <input
                type="text"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                placeholder={t.courtNamePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
                {t.yourName}
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder={t.yourNamePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
                required
              />
            </div>

            <GavelButton disabled={loading} className="w-full mt-2">
              {loading ? 'Establishing Court...' : t.createCourt}
            </GavelButton>
          </form>
        )}

        {/* Quick Demo Court Access for instant evaluation */}
        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-700 font-serif mb-2">Want to test right now with real Habesha bills?</p>
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full text-xs font-serif font-bold py-2 px-3 bg-[#e8e2d5] hover:bg-[#ded5c3] text-[#412211] rounded-lg border border-[#c59b27]/40 transition-colors"
          >
            🏛️ Enter "COURT-4821" (Demo Court as Selam)
          </button>
        </div>
      </div>
    </div>
  );
}

