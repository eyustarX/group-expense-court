import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { translations } from '../i18n';
import { formatETB } from '@shared/money';
import GavelButton from '../components/GavelButton';

export default function Group({ group, currentMember, language, onNavigate, onSelectExpense }) {
  const t = translations[language] || translations.en;

  const [courtData, setCourtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const data = await api.getGroup(group.code);
      setCourtData(data);
    } catch (err) {
      setError(err.message || 'Failed to load court docket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [group.code]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="text-4xl animate-bounce inline-block">⚖️</span>
        <p className="mt-3 font-serif text-gray-700">Convening the courtroom docket...</p>
      </div>
    );
  }

  const members = courtData?.members || [];
  const expenses = courtData?.expenses || [];
  const totalCents = expenses.reduce((sum, e) => sum + Number(e.total_cents || 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Court Header Card */}
      <div className="case-card p-5 bg-gradient-to-r from-[#0d1b2a] to-[#1b263b] text-[#f8f5ee] border-[#c59b27]/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#c59b27] font-serif font-bold">
              Official Docket
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">{group.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#c59b27]/20 border border-[#c59b27]/40 px-2 py-0.5 rounded text-xs font-mono font-bold text-[#e0b84c]">
                {group.code}
              </span>
              <span className="text-xs text-gray-300">
                {members.length} {t.members}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 block font-serif">{t.totalExpenses}</span>
            <span className="text-xl font-bold font-mono text-[#e0b84c]">
              {formatETB(totalCents)}
            </span>
          </div>
        </div>

        {/* Member Badges */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-1.5">
          {members.map((m) => (
            <span
              key={m.id}
              className={`px-2.5 py-1 rounded-full text-xs font-serif ${
                currentMember?.id === m.id
                  ? 'bg-[#c59b27] text-[#0d1b2a] font-bold shadow-sm'
                  : 'bg-white/10 text-gray-200'
              }`}
            >
              👤 {m.name} {currentMember?.id === m.id ? '(You)' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Main Action Gavel Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GavelButton
          variant="gold"
          onClick={() => onNavigate('new-case')}
          className="w-full text-sm py-3"
        >
          {t.newCase}
        </GavelButton>
        <GavelButton
          variant="navy"
          onClick={() => onNavigate('settle')}
          className="w-full text-sm py-3"
        >
          {t.settleUp}
        </GavelButton>
        <GavelButton
          variant="wood"
          onClick={() => onNavigate('shame')}
          className="w-full text-sm py-3"
        >
          {t.hallOfShame} 🏆
        </GavelButton>
      </div>

      {/* Case Files (Expenses) List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-serif font-bold text-[#0d1b2a] flex items-center gap-2">
            <span>📁</span>
            <span>{t.caseFiles} ({expenses.length})</span>
          </h3>
        </div>

        {expenses.length === 0 ? (
          <div className="case-card p-8 text-center border-dashed">
            <span className="text-3xl block mb-2">📜</span>
            <p className="font-serif text-gray-600 mb-4">{t.noCasesYet}</p>
            <GavelButton onClick={() => onNavigate('new-case')} variant="gold">
              {t.newCase}
            </GavelButton>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                onClick={() => onSelectExpense(exp.id)}
                className="case-card p-4 hover:border-[#c59b27] hover:shadow-md cursor-pointer transition-all border-l-4 border-l-[#c59b27]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-[#0d1b2a] text-base hover:text-[#c59b27] transition-colors">
                      {exp.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.payer}: <span className="font-semibold text-gray-700">{exp.payer_name}</span>
                      {exp.item_count ? ` · ${exp.item_count} items` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#0d1b2a] text-base block">
                      {formatETB(exp.total_cents)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(exp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
