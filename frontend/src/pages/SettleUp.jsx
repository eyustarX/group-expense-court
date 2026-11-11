import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { translations } from '../i18n';
import { formatETB } from '@shared/money';
import GavelButton from '../components/GavelButton';

export default function SettleUp({ group, currentMember, language, onBack }) {
  const t = translations[language] || translations.en;

  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [markingId, setMarkingId] = useState(null);

  const fetchSettlement = async () => {
    try {
      setLoading(true);
      const data = await api.getSettlement(group.code);
      setSettlement(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate settlement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, [group.code]);

  const handleMarkPaid = async (paymentId) => {
    setMarkingId(paymentId);
    try {
      await api.markPaymentPaid(paymentId);
      await fetchSettlement();
    } catch (err) {
      alert(err.message || 'Failed to mark as paid');
    } finally {
      setMarkingId(null);
    }
  };

  const handleCopyPaymentMessage = (payment) => {
    const text = `Hi ${payment.fromMemberName}, please send ${formatETB(payment.amountCents)} to ${payment.toMemberName} for ${group.name} on Group Expense Court.`;
    navigator.clipboard.writeText(text);
    setCopiedId(payment.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-4xl animate-bounce inline-block">⚖️</span>
        <p className="mt-3 font-serif text-gray-700">Calculating fewest courtroom transactions...</p>
      </div>
    );
  }

  const balances = settlement?.balances || [];
  const payments = settlement?.payments || [];
  const totalNet = balances.reduce((sum, b) => sum + Number(b.netCents || 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-serif text-[#c59b27] font-bold">
            Settlement Chamber
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0d1b2a]">{t.settleUp}</h2>
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

      {/* Reduction Banner */}
      <div className="p-4 bg-[#0d1b2a] text-[#f8f5ee] rounded-xl border border-[#c59b27]/40 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs uppercase text-[#e0b84c] font-serif font-bold tracking-wider">
            Fewest-Payments Optimization
          </span>
          <p className="font-serif font-bold text-base mt-0.5 text-white">
            {t.paymentsReduced(settlement?.rawCount || payments.length, settlement?.reducedCount || payments.length)}
          </p>
        </div>
        <div className="text-3xl">🤝</div>
      </div>

      {/* Net Balances Table with Sum = 0 check */}
      <div className="case-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#0d1b2a]">{t.netBalances}</h3>
          <span className="text-xs font-mono bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full border border-green-300">
            {t.sumZeroCheck} ({totalNet} ETB)
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {balances.map((b) => {
            const isOwed = b.netCents > 0;
            const owes = b.netCents < 0;
            return (
              <div key={b.memberId} className="py-2.5 flex items-center justify-between text-sm">
                <span className="font-serif font-semibold text-gray-800">
                  {b.memberName} {currentMember?.id === b.memberId ? '(You)' : ''}
                </span>
                <span
                  className={`font-mono font-bold ${
                    isOwed ? 'text-green-700' : owes ? 'text-amber-700' : 'text-gray-500'
                  }`}
                >
                  {isOwed ? `+${formatETB(b.netCents)}` : formatETB(b.netCents)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimized Payments List */}
      <div className="space-y-3">
        <h3 className="font-serif font-bold text-base text-[#0d1b2a]">{t.fewestPayments}</h3>

        {payments.length === 0 ? (
          <div className="case-card p-6 text-center text-gray-500 font-serif">
            🎉 All accounts are fully settled! No payments required.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const isPaid = p.status === 'paid';
              return (
                <div
                  key={p.id}
                  className={`case-card p-4 transition-all ${
                    isPaid ? 'bg-gray-50 opacity-80 border-gray-200' : 'border-l-4 border-l-[#c59b27]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="font-serif text-sm">
                      <span className="font-bold text-[#0d1b2a]">{p.fromMemberName}</span>
                      <span className="text-gray-500 mx-1.5">pays</span>
                      <span className="font-bold text-[#0d1b2a]">{p.toMemberName}</span>
                    </div>
                    <span className="font-mono font-bold text-base text-[#0d1b2a]">
                      {formatETB(p.amountCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopyPaymentMessage(p)}
                      className="text-gray-600 hover:text-[#c59b27] font-serif underline flex items-center gap-1"
                    >
                      <span>📋</span>
                      <span>{copiedId === p.id ? t.msgCopied : t.copyPaymentMsg}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isPaid ? t.paid : t.pending}
                      </span>
                      {!isPaid && (
                        <button
                          type="button"
                          disabled={markingId === p.id}
                          onClick={() => handleMarkPaid(p.id)}
                          className="px-3 py-1 bg-[#c59b27] hover:bg-[#e0b84c] text-[#0d1b2a] font-serif font-bold rounded shadow-sm text-xs transition-colors"
                        >
                          {markingId === p.id ? 'Settling...' : t.markPaid}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
