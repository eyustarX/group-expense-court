import React, { useState } from 'react';
import { api, resizeImageToJpegBase64 } from '../api';
import { translations } from '../i18n';
import { splitExpense } from '@shared/split';
import { toCents, formatETB } from '@shared/money';
import GavelButton from '../components/GavelButton';

export default function NewCase({ group, members, currentMember, language, onExpenseSaved, onCancel }) {
  const t = translations[language] || translations.en;

  // Wizard Step: 1 = receipt/manual, 2 = items & extras, 3 = assign members, 4 = payer
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([
    { id: '1', name: '', priceBirr: '', memberIds: [] },
  ]);
  const [extrasBirr, setExtrasBirr] = useState('0');
  const [payerId, setPayerId] = useState(currentMember?.id || (members[0]?.id || ''));

  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle Receipt Upload with Client-Side Resize
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setError('');
    setScanMessage(t.scanning);

    try {
      // 1. Resize image client-side to max 1600px, 0.8 JPEG quality
      const base64 = await resizeImageToJpegBase64(file);

      // 2. Scan via Amazon Textract AnalyzeExpense
      const result = await api.scanReceipt(base64);

      if (result.items && result.items.length > 0) {
        const mappedItems = result.items.map((it, idx) => ({
          id: String(idx + 1),
          name: it.name,
          priceBirr: (it.priceCents / 100).toFixed(2),
          memberIds: members.map((m) => m.id), // Default to all members
        }));
        setItems(mappedItems);
        setExtrasBirr((result.extrasCents / 100).toFixed(2));
        setScanMessage(result.message || 'Receipt scanned successfully!');
      } else {
        setScanMessage(result.message || 'No items extracted. You can type items manually.');
      }
      setStep(2);
    } catch (err) {
      setError('Receipt processing encountered an issue. Please enter items manually.');
      setStep(2);
    } finally {
      setScanning(false);
    }
  };

  // Add Item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', priceBirr: '', memberIds: members.map((m) => m.id) },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Toggle member on an item
  const handleToggleMember = (itemId, memberId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.memberIds.includes(memberId);
        const updated = exists
          ? item.memberIds.filter((id) => id !== memberId)
          : [...item.memberIds, memberId];
        return { ...item, memberIds: updated };
      })
    );
  };

  // Select all or none for an item
  const handleToggleAllMembers = (itemId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const allAssigned = item.memberIds.length === members.length;
        return {
          ...item,
          memberIds: allAssigned ? [] : members.map((m) => m.id),
        };
      })
    );
  };

  // Compute live split preview
  let previewShares = null;
  let previewError = null;
  try {
    const validItems = items
      .filter((it) => it.name.trim() && Number(it.priceBirr) > 0)
      .map((it) => ({
        id: it.id,
        name: it.name,
        priceCents: toCents(it.priceBirr || 0),
        memberIds: it.memberIds,
      }));

    if (validItems.length > 0) {
      previewShares = splitExpense({
        items: validItems,
        extrasCents: toCents(extrasBirr || 0),
      });
    }
  } catch (err) {
    previewError = err.message;
  }

  // Save Expense to Docket
  const handleSaveExpense = async () => {
    if (!title.trim()) {
      setError('Please provide a title for this case file (e.g. Habesha Dinner).');
      return;
    }
    if (!payerId) {
      setError('Please select who paid for the expense.');
      return;
    }

    const payloadItems = items.map((it) => ({
      name: it.name.trim() || 'Item',
      priceCents: toCents(it.priceBirr || 0),
      memberIds: it.memberIds.length > 0 ? it.memberIds : [payerId],
    }));

    if (payloadItems.some((it) => it.priceCents <= 0)) {
      setError('All items must have a valid price greater than 0.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.createExpense(group.code, {
        title: title.trim(),
        paidBy: payerId,
        items: payloadItems,
        extrasCents: toCents(extrasBirr || 0),
      });
      onExpenseSaved();
    } catch (err) {
      setError(err.message || 'Failed to record expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-serif text-[#c59b27] font-bold">
            Filing Docket
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0d1b2a]">{t.newCase}</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-serif text-gray-700 hover:text-black underline"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-1 text-center text-xs font-serif">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`py-2 rounded border ${
            step === 1 ? 'bg-[#0d1b2a] text-[#f8f5ee] font-bold border-[#c59b27]' : 'bg-white text-gray-600'
          }`}
        >
          1. Photo/Mode
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`py-2 rounded border ${
            step === 2 ? 'bg-[#0d1b2a] text-[#f8f5ee] font-bold border-[#c59b27]' : 'bg-white text-gray-600'
          }`}
        >
          2. Items
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className={`py-2 rounded border ${
            step === 3 ? 'bg-[#0d1b2a] text-[#f8f5ee] font-bold border-[#c59b27]' : 'bg-white text-gray-600'
          }`}
        >
          3. Split
        </button>
        <button
          type="button"
          onClick={() => setStep(4)}
          className={`py-2 rounded border ${
            step === 4 ? 'bg-[#0d1b2a] text-[#f8f5ee] font-bold border-[#c59b27]' : 'bg-white text-gray-600'
          }`}
        >
          4. Record
        </button>
      </div>

      {/* STEP 1: Upload or Manual */}
      {step === 1 && (
        <div className="case-card p-6 space-y-6 text-center">
          <div className="p-4 bg-[#f4efe4] rounded-lg border border-[#e2d9c8]">
            <span className="text-4xl block mb-2">📸</span>
            <h3 className="font-serif font-bold text-lg text-[#0d1b2a] mb-1">
              {t.uploadReceipt}
            </h3>
            <p className="text-xs text-gray-700 max-w-sm mx-auto mb-4 font-serif">
              Take or upload a photo of your restaurant bill. Amazon Textract will automatically extract line items and taxes.
            </p>

            <label className="inline-block cursor-pointer">
              <span className="bg-[#c59b27] hover:bg-[#e0b84c] text-[#0d1b2a] font-serif font-bold py-2.5 px-6 rounded-lg shadow transition-all inline-flex items-center gap-2 text-sm">
                <span>📁</span> Select Receipt Image
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleReceiptUpload}
                disabled={scanning}
                className="hidden"
              />
            </label>

            {scanning && (
              <div className="mt-3 text-xs text-[#412211] font-semibold animate-pulse">
                ⏳ {t.scanning}
              </div>
            )}
            {scanMessage && !scanning && (
              <p className="mt-2 text-xs text-green-700 font-serif">{scanMessage}</p>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <span className="bg-[#f8f5ee] px-3 text-xs font-serif text-gray-700 uppercase">Or</span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-serif font-bold text-gray-800 transition-colors"
            >
              ✍️ {t.typeManually}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Line Items & Extras */}
      {step === 2 && (
        <div className="case-card p-6 space-y-5">
          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1">
              Case Title / Restaurant
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Habesha Cultural Dinner, Bole Taxi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700">
              Line Items
            </label>
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, name: val } : it)));
                  }}
                  placeholder={`Item ${idx + 1} (e.g. Kitfo)`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
                />
                <div className="w-32 relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.priceBirr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, priceBirr: val } : it)));
                    }}
                    placeholder="0.00"
                    className="w-full px-2 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-400 font-mono">ETB</span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-serif font-bold text-[#c59b27] hover:underline"
            >
              {t.addItem}
            </button>
          </div>

          {/* Extras / Tax */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-serif font-bold text-gray-700">
                  {t.extras}
                </label>
                <span className="text-[11px] text-gray-500">VAT + Service Charge (Split proportionally)</span>
              </div>
              <div className="w-32 relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={extrasBirr}
                  onChange={(e) => setExtrasBirr(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-[#c59b27]"
                />
                <span className="absolute right-2 top-2.5 text-xs text-gray-400 font-mono">ETB</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border rounded text-xs font-serif"
            >
              Back
            </button>
            <GavelButton onClick={() => setStep(3)}>
              Continue to Member Assignment →
            </GavelButton>
          </div>
        </div>
      )}

      {/* STEP 3: Assign Who Ate What */}
      {step === 3 && (
        <div className="case-card p-6 space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0d1b2a]">{t.step3Assign}</h3>
            <p className="text-xs text-gray-600 font-serif">
              Tap member chips to toggle who shared each item. Shared items divide equally, with taxes distributed proportionally.
            </p>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="p-3 bg-[#faf8f4] border border-[#e8e2d5] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-sm text-[#0d1b2a]">
                    {item.name || `Item ${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-700">
                      {item.priceBirr || '0'} ETB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAllMembers(item.id)}
                      className="text-[11px] font-serif text-[#c59b27] underline"
                    >
                      {item.memberIds.length === members.length ? 'Clear' : 'All'}
                    </button>
                  </div>
                </div>

                {/* Member chips */}
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => {
                    const isSelected = item.memberIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => handleToggleMember(item.id, m.id)}
                        className={`px-3 py-1 rounded-full text-xs font-serif font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#0d1b2a] text-[#e0b84c] shadow-sm border border-[#c59b27]'
                            : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Live Preview Box */}
          {previewShares && (
            <div className="p-4 bg-[#f2ede2] border border-[#c59b27]/30 rounded-lg">
              <h4 className="text-xs font-serif font-bold uppercase tracking-wide text-[#412211] mb-2 flex items-center justify-between">
                <span>Live Share Preview</span>
                <span className="font-mono font-bold text-black">{formatETB(previewShares.totalCents)}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(previewShares.perMember).map(([mId, cents]) => {
                  const m = members.find((mem) => mem.id === mId);
                  return (
                    <div key={mId} className="flex justify-between py-1 border-b border-gray-200">
                      <span className="font-serif">{m?.name || 'Member'}:</span>
                      <span className="font-mono font-bold text-[#0d1b2a]">{formatETB(cents)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {previewError && (
            <p className="text-xs text-amber-700 italic font-serif">⚠️ {previewError}</p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border rounded text-xs font-serif"
            >
              Back
            </button>
            <GavelButton onClick={() => setStep(4)}>
              Proceed to Payer Selection →
            </GavelButton>
          </div>
        </div>
      )}

      {/* STEP 4: Choose Payer & Save */}
      {step === 4 && (
        <div className="case-card p-6 space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0d1b2a]">{t.step4Payer}</h3>
            <p className="text-xs text-gray-600 font-serif">
              Who paid the bill at the restaurant or counter?
            </p>
          </div>

          <div className="space-y-2">
            {members.map((m) => (
              <label
                key={m.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  payerId === m.id
                    ? 'border-[#c59b27] bg-[#f8f5ee] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payer"
                    checked={payerId === m.id}
                    onChange={() => setPayerId(m.id)}
                    className="accent-[#c59b27] h-4 w-4"
                  />
                  <span className="font-serif font-bold text-sm text-[#0d1b2a]">
                    {m.name} {currentMember?.id === m.id ? '(You)' : ''}
                  </span>
                </div>
                {payerId === m.id && (
                  <span className="text-xs bg-[#c59b27] text-[#0d1b2a] font-bold font-serif px-2 py-0.5 rounded">
                    Payer
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg text-xs space-y-1 font-serif text-gray-700">
            <p><strong>Case Title:</strong> {title || 'Untitled'}</p>
            <p><strong>Total Items:</strong> {items.length}</p>
            <p><strong>Total Bill:</strong> {previewShares ? formatETB(previewShares.totalCents) : '0.00 ETB'}</p>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 border rounded text-xs font-serif"
            >
              Back
            </button>
            <GavelButton
              disabled={saving}
              onClick={handleSaveExpense}
              variant="gold"
              className="py-3 px-6"
            >
              {saving ? 'Recording in Docket...' : t.saveCaseFile}
            </GavelButton>
          </div>
        </div>
      )}
    </div>
  );
}
