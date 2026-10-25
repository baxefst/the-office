import React, { useState } from 'react';
import { X, Microscope, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { ResearchStatus } from '../../types/index.ts';

interface AddResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTokenMint?: string;
}

export const AddResearchModal: React.FC<AddResearchModalProps> = ({ isOpen, onClose, defaultTokenMint }) => {
  const { createTokenResearch, sharedWatchlist } = useTeamData();

  const [selectedTokenMint, setSelectedTokenMint] = useState<string>(defaultTokenMint || '');
  const [customMint, setCustomMint] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');

  const [title, setTitle] = useState('');
  const [thesis, setThesis] = useState('');
  const [bullishPoints, setBullishPoints] = useState<string[]>(['']);
  const [bearishPoints, setBearishPoints] = useState<string[]>(['']);
  const [liquidityObservations, setLiquidityObservations] = useState('');
  const [holderDistributionObservations, setHolderDistributionObservations] = useState('');
  const [devWalletObservations, setDevWalletObservations] = useState('');
  const [manipulationIndicators, setManipulationIndicators] = useState('');
  const [txSignaturesText, setTxSignaturesText] = useState('');
  const [researchStatus, setResearchStatus] = useState<ResearchStatus>('in_review');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddBullish = () => setBullishPoints([...bullishPoints, '']);
  const handleRemoveBullish = (index: number) => setBullishPoints(bullishPoints.filter((_, i) => i !== index));
  const handleUpdateBullish = (index: number, val: string) => {
    const copy = [...bullishPoints];
    copy[index] = val;
    setBullishPoints(copy);
  };

  const handleAddBearish = () => setBearishPoints([...bearishPoints, '']);
  const handleRemoveBearish = (index: number) => setBearishPoints(bearishPoints.filter((_, i) => i !== index));
  const handleUpdateBearish = (index: number, val: string) => {
    const copy = [...bearishPoints];
    copy[index] = val;
    setBearishPoints(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let tokenMint = '';
    let tokenSymbol = '';
    let tokenName = '';

    if (selectedTokenMint === 'custom' || !selectedTokenMint) {
      if (!customMint.trim() || !customSymbol.trim() || !customName.trim()) {
        setErrorMsg('Please specify Token Mint, Symbol, and Name.');
        return;
      }
      tokenMint = customMint.trim();
      tokenSymbol = customSymbol.trim().toUpperCase();
      tokenName = customName.trim();
    } else {
      const match = sharedWatchlist.find((t) => t.mintAddress === selectedTokenMint);
      if (!match) {
        setErrorMsg('Selected token not found in watchlist.');
        return;
      }
      tokenMint = match.mintAddress;
      tokenSymbol = match.symbol;
      tokenName = match.name;
    }

    if (!title.trim() || !thesis.trim()) {
      setErrorMsg('Research title and core thesis are required.');
      return;
    }

    const cleanBullish = bullishPoints.map((s) => s.trim()).filter(Boolean);
    const cleanBearish = bearishPoints.map((s) => s.trim()).filter(Boolean);
    const cleanSigs = txSignaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await createTokenResearch({
        tokenMint,
        tokenSymbol,
        tokenName,
        title: title.trim(),
        thesis: thesis.trim(),
        bullishFactors: cleanBullish,
        bearishFactors: cleanBearish,
        liquidityObservations: liquidityObservations.trim(),
        holderDistributionObservations: holderDistributionObservations.trim(),
        devWalletObservations: devWalletObservations.trim(),
        manipulationIndicators: manipulationIndicators.trim(),
        txSignatures: cleanSigs,
        researchStatus,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish research report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#12161f] border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-[#12161f] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Token Research Report</h3>
              <p className="text-xs text-slate-400">Deep-dive due diligence, on-chain forensics & thesis recording</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Token Selection */}
          <div className="p-3 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
            <label className="block text-slate-300 font-semibold">Select Token to Research</label>
            <select
              value={selectedTokenMint}
              onChange={(e) => setSelectedTokenMint(e.target.value)}
              className="w-full bg-[#12161f] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">-- Choose from Team Watchlist or Select Custom --</option>
              {sharedWatchlist.map((tok) => (
                <option key={tok.mintAddress} value={tok.mintAddress}>
                  ${tok.symbol} — {tok.name} ({tok.mintAddress.slice(0, 6)}...{tok.mintAddress.slice(-4)})
                </option>
              ))}
              <option value="custom">+ Research a New Token (Enter Mint Manually)</option>
            </select>

            {(selectedTokenMint === 'custom' || !selectedTokenMint) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] text-slate-400">Mint Address</label>
                  <input
                    type="text"
                    value={customMint}
                    onChange={(e) => setCustomMint(e.target.value)}
                    placeholder="Solana Mint Address"
                    className="w-full bg-[#12161f] border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Token Symbol</label>
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. MEOW"
                    className="w-full bg-[#12161f] border border-slate-700 rounded px-2.5 py-1.5 font-mono uppercase text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Token Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Meow Coin"
                    className="w-full bg-[#12161f] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Research Title & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Report Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Liquidity Stability & Holder Concentration Forensics"
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Proposed Status</label>
              <select
                value={researchStatus}
                onChange={(e) => setResearchStatus(e.target.value as ResearchStatus)}
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              >
                <option value="in_review">In Review (Team Critique)</option>
                <option value="approved">Approved for Paper Testing</option>
                <option value="unreviewed">Draft / Unreviewed</option>
                <option value="rejected">Rejected (Safety Flags)</option>
              </select>
            </div>
          </div>

          {/* Thesis */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">
                Research Thesis & Core Rationale <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> Separate facts from opinions
              </span>
            </div>
            <textarea
              rows={3}
              required
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="State the core hypothesis: Why does this token warrant monitoring or paper execution? What on-chain evidence supports or contradicts the thesis?"
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          {/* Bullish & Bearish Factors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-[#090b0e] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span>▲ Bullish Observations</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddBullish}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Point
                </button>
              </div>
              {bullishPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleUpdateBullish(idx, e.target.value)}
                    placeholder="e.g. 100% LP burned at creation Tx"
                    className="w-full bg-[#12161f] border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                  {bullishPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBullish(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#090b0e] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <span>▼ Bearish Risks / Red Flags</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddBearish}
                  className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Point
                </button>
              </div>
              {bearishPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleUpdateBearish(idx, e.target.value)}
                    placeholder="e.g. High sniper cluster holding >15%"
                    className="w-full bg-[#12161f] border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                  {bearishPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBearish(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deep Forensics Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Liquidity Observations</label>
              <textarea
                rows={2}
                value={liquidityObservations}
                onChange={(e) => setLiquidityObservations(e.target.value)}
                placeholder="Pool pairs, locked status, LP burn Tx signature, orderbook depth..."
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Holder Distribution & Dispersion</label>
              <textarea
                rows={2}
                value={holderDistributionObservations}
                onChange={(e) => setHolderDistributionObservations(e.target.value)}
                placeholder="Top 10 holder percentage, multi-sig vs single wallets, cluster dispersion..."
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Developer Wallet Forensics</label>
              <textarea
                rows={2}
                value={devWalletObservations}
                onChange={(e) => setDevWalletObservations(e.target.value)}
                placeholder="Mint/freeze authority status, funding origin (e.g. FixedFloat, Kraken), deployer tokens history..."
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Manipulation & Wash Indicators</label>
              <textarea
                rows={2}
                value={manipulationIndicators}
                onChange={(e) => setManipulationIndicators(e.target.value)}
                placeholder="Coordinated bundled snipers at block 0, wash trading volume estimate, bot entropy..."
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Solscan / Explorer Tx Signatures */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Relevant Transaction Signatures / Explorer Links (One per line)
            </label>
            <textarea
              rows={2}
              value={txSignaturesText}
              onChange={(e) => setTxSignaturesText(e.target.value)}
              placeholder="e.g. 5kRqZb19M4e7hW2vX8yU3iO6pA9sD1fG4h7j0k3m6n8p"
              className="w-full bg-[#090b0e] border border-slate-700 font-mono text-slate-200 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-950/40 disabled:opacity-50"
            >
              <Microscope className="w-4 h-4" />
              <span>{loading ? 'Publishing...' : 'Publish Research Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
