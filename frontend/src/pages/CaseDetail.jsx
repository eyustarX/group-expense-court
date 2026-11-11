import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { translations } from '../i18n';
import { formatETB } from '@shared/money';
import GavelButton from '../components/GavelButton';

export default function CaseDetail({ expenseId, currentMember, language, onBack }) {
  const t = translations[language] || translations.en;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim Filing Form State
  const [claimText, setClaimText] = useState('');
  const [claimedCount, setClaimedCount] = useState(1);
  const [filing, setFiling] = useState(false);
  const [claimError, setClaimError] = useState('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await api.getExpense(expenseId);
      setDetail(data);
    } catch (err) {
      setError(err.message || 'Failed to load case file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [expenseId]);

  const handleFileClaim = async (e) => {
    e.preventDefault();
    if (!claimText.trim()) {
      setClaimError('Please provide your claim description.');
      return;
    }
    setFiling(true);
    setClaimError('');

    try {
      const itemsCount = detail?.items?.length || 0;
      await api.fileClaim(expenseId, {
        memberId: currentMember.id,
        claimText: claimText.trim(),
        claimedCount: parseInt(claimedCount, 10) || 1,
        receiptCount: itemsCount,
        language,
      });
      setClaimText('');
      await fetchDetail();
    } catch (err) {
      setClaimError(err.message || 'Failed to submit claim.');
    } finally {
      setFiling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-4xl animate-bounce inline-block">⚖️</span>
        <p className="mt-3 font-serif text-gray-700">Examining official case archives...</p>
      </div>
    );
  }

  const expense = detail?.expense;
  const items = detail?.items || [];
  const claims = detail?.claims || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-serif text-[#c59b27] font-bold">
            Case File Docket
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0d1b2a]">{expense?.title}</h2>
          <p className="text-xs text-gray-500 font-serif mt-0.5">
            Payer: <span className="font-semibold text-gray-700">{expense?.payer_name}</span> ·{' '}
            {new Date(expense?.created_at).toLocaleDateString()}
          </p>
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

      {/* Bill Breakdown Card */}
      <div className="case-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif font-bold text-base text-[#0d1b2a]">Certified Items</h3>
          <span className="font-mono font-bold text-lg text-[#0d1b2a]">
            {formatETB(expense?.total_cents)}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-3 bg-[#faf8f4] border border-[#e8e2d5] rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-serif font-bold text-[#0d1b2a]">{item.name}</span>
                <span className="font-mono font-bold text-gray-800">{formatETB(item.price_cents)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {item.members?.map((m) => (
                  <span
                    key={m.id}
                    className="text-[11px] font-serif bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                  >
                    👤 {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {Number(expense?.extras_cents) > 0 && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-serif text-gray-600">
            <span>Taxes & Service Charge:</span>
            <span className="font-mono font-bold text-gray-800">{formatETB(expense?.extras_cents)}</span>
          </div>
        )}
      </div>

      {/* AI Debt Detective - File a Claim Section */}
      <div className="case-card p-5 border-t-4 border-t-[#c59b27] space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🕵️‍♂️</span>
          <div>
            <h3 className="font-serif font-bold text-base text-[#0d1b2a]">{t.fileAClaim}</h3>
            <p className="text-xs text-gray-600 font-serif">
              Contest any discrepancy. Code verifies the facts; AI delivers the verdict.
            </p>
          </div>
        </div>

        {claimError && (
          <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {claimError}
          </div>
        )}

        <form onSubmit={handleFileClaim} className="space-y-3">
          <div>
            <label className="block text-xs font-serif font-bold text-gray-700 mb-1">
              {t.claimPrompt}
            </label>
            <input
              type="text"
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder={t.claimPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-40">
              <label className="block text-xs font-serif font-bold text-gray-700 mb-1">
                {t.claimedCount}
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={claimedCount}
                onChange={(e) => setClaimedCount(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
              />
            </div>
            <div className="text-xs font-serif text-gray-500 pt-5">
              vs. {items.length} items certified on receipt
            </div>
          </div>

          <GavelButton disabled={filing} className="w-full text-xs py-2.5">
            {filing ? 'Deliberating in Court...' : t.submitClaim}
          </GavelButton>
        </form>
      </div>

      {/* Verdicts & Claims History */}
      {claims.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-base text-[#0d1b2a] flex items-center gap-2">
            <span>📜</span>
            <span>{t.verdictHeading} ({claims.length})</span>
          </h3>

          <div className="space-y-3">
            {claims.map((c) => {
              const isVerified = c.status === 'Verified';
              const isNeedsEvidence = c.status === 'Needs Evidence';
              return (
                <div
                  key={c.id}
                  className={`case-card p-4 border-l-4 ${
                    isVerified
                      ? 'border-l-green-600 bg-green-50/20'
                      : isNeedsEvidence
                      ? 'border-l-amber-500 bg-amber-50/20'
                      : 'border-l-red-500 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif font-bold text-[#0d1b2a]">
                      Filed by {c.member_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-serif font-bold ${
                        isVerified
                          ? 'bg-green-100 text-green-800'
                          : isNeedsEvidence
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.status === 'Verified'
                        ? t.statusVerified
                        : c.status === 'Needs Evidence'
                        ? t.statusNeedsEvidence
                        : t.statusDismissed}
                    </span>
                  </div>

                  <p className="text-xs font-serif italic text-gray-700 mb-2">
                    "{c.claim_text}"
                  </p>

                  <div className="p-3 bg-white/80 rounded border border-gray-200 text-xs font-serif text-[#0d1b2a] leading-relaxed">
                    <span className="font-bold text-[#c59b27] mr-1">⚖️ Verdict:</span>
                    {c.verdict}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
