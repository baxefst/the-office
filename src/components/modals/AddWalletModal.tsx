import React, { useState } from 'react';
import { X, Wallet, Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { WalletCategory } from '../../types/index.ts';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({ isOpen, onClose }) => {
  const { addMonitoredWallet } = useTeamData();

  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<WalletCategory>('whale');
  const [reason, setReason] = useState('');
  const [associatedTokensText, setAssociatedTokensText] = useState('');
  const [txSignaturesText, setTxSignaturesText] = useState('');
  const [notes, setNotes] = useState('');
  const [riskFlagsText, setRiskFlagsText] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanAddress = address.trim();
    if (!cleanAddress || cleanAddress.length < 32 || cleanAddress.length > 46) {
      setErrorMsg('Please enter a valid Solana public wallet address (typically 32 to 44 characters).');
      return;
    }
    if (!label.trim() || !reason.trim()) {
      setErrorMsg('Wallet label and monitoring reason are required.');
      return;
    }

    const tokens = associatedTokensText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const sigs = txSignaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const flags = riskFlagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await addMonitoredWallet({
        address: cleanAddress,
        label: label.trim(),
        category,
        reason: reason.trim(),
        associatedTokens: tokens,
        txSignatures: sigs,
        notes: notes.trim(),
        riskFlags: flags,
        lastReviewedTimestamp: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add monitored wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl bg-[#12161f] border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Monitored Solana Wallet</h3>
              <p className="text-xs text-slate-400">Track smart money, deployer clusters, and sniper behavior</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Safety Banner */}
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Read-only monitoring. Never enter private keys or seed phrases. Only public addresses are stored.</span>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Public Address */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Public Solana Wallet Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
              className="w-full bg-[#090b0e] border border-slate-700 font-mono text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Label & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Wallet Label / Tag <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Smart Whale #04 (Meme Rotator)"
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WalletCategory)}
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="whale">Whale / Smart Money</option>
                <option value="deployer">Deployer / Creator Syndicate</option>
                <option value="trader">Sniper / MEV Bot Trader</option>
                <option value="related">Related / Co-funded Wallet</option>
                <option value="unknown">Unknown / Under Observation</option>
              </select>
            </div>
          </div>

          {/* Reason for Monitoring */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Why is this wallet being monitored? <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Accumulates 24h prior to major momentum run; observed 4x accurate entries on Raydium pool breakouts."
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Associated Tokens & Risk Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Associated Tokens (Comma separated)</label>
              <input
                type="text"
                value={associatedTokensText}
                onChange={(e) => setAssociatedTokensText(e.target.value)}
                placeholder="POPCAT, WIF, SOLCAT"
                className="w-full bg-[#090b0e] border border-slate-700 font-mono text-slate-200 rounded-lg px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Risk Flags (Comma separated)</label>
              <input
                type="text"
                value={riskFlagsText}
                onChange={(e) => setRiskFlagsText(e.target.value)}
                placeholder="High market impact, Fast dump history"
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Additional Observations & Heuristics</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observed holding time, average trade size, DEX routing preferences..."
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
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
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add Monitored Wallet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
