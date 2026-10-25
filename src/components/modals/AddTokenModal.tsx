import React, { useState } from 'react';
import { X, Plus, AlertCircle, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { TokenCategory, ResearchStatus, RiskStatus } from '../../types/index.ts';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTokenModal: React.FC<AddTokenModalProps> = ({ isOpen, onClose }) => {
  const { addSharedWatchlistToken, members } = useTeamData();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [category, setCategory] = useState<TokenCategory>('new_launch');
  const [marketCap, setMarketCap] = useState<string>('');
  const [liquidity, setLiquidity] = useState<string>('');
  const [volume24h, setVolume24h] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [change24h, setChange24h] = useState<string>('');
  const [dataSource, setDataSource] = useState('Raydium CLMM / DexScreener');
  const [researchStatus, setResearchStatus] = useState<ResearchStatus>('unreviewed');
  const [riskStatus, setRiskStatus] = useState<RiskStatus>('medium');
  const [assignedResearcherUid, setAssignedResearcherUid] = useState<string>('');
  const [monitoringReason, setMonitoringReason] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMint = mintAddress.trim();
    if (!cleanMint || cleanMint.length < 32 || cleanMint.length > 46) {
      setErrorMsg('Please enter a valid Solana mint address (typically 32 to 44 characters).');
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      setErrorMsg('Token name and symbol are required.');
      return;
    }
    if (!monitoringReason.trim()) {
      setErrorMsg('Please record why this token is being monitored.');
      return;
    }

    setLoading(true);
    const assignedMember = members.find((m) => m.userId === assignedResearcherUid);

    const res = await addSharedWatchlistToken({
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      mintAddress: cleanMint,
      category,
      discoveryTimestamp: new Date().toISOString(),
      marketCap: marketCap ? parseFloat(marketCap) : null,
      liquidity: liquidity ? parseFloat(liquidity) : null,
      volume24h: volume24h ? parseFloat(volume24h) : null,
      price: price ? parseFloat(price) : null,
      change24h: change24h ? parseFloat(change24h) : null,
      dataSource: dataSource.trim() || 'Manual On-Chain Observation',
      lastUpdated: new Date().toISOString(),
      researchStatus,
      riskStatus,
      assignedResearcherUid: assignedResearcherUid || undefined,
      assignedResearcherName: assignedMember ? assignedMember.displayName : undefined,
      sharedNotes: sharedNotes.trim() || undefined,
      monitoringReason: monitoringReason.trim(),
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Failed to add token.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#12161f] border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Add Token to Team Watchlist</span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                SOLANA
              </span>
            </h3>
            <p className="text-xs text-slate-400">Track and assess memecoins collaboratively with the team</p>
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
          {/* Mint Address & Symbol */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Solana Mint Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="e.g. 7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"
              className="w-full bg-[#090b0e] border border-slate-700 font-mono text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Duplicates for the same mint are automatically prevented.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Token Symbol <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. POPCAT"
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Token Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Popcat"
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category, Risk & Research Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TokenCategory)}
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="new_launch">New Launch (Bonding / Post-migration)</option>
                <option value="established">Established Meme</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Initial Risk Status</label>
              <select
                value={riskStatus}
                onChange={(e) => setRiskStatus(e.target.value as RiskStatus)}
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low (Established / Deep LP)</option>
                <option value="medium">Medium (Moderate Volatility)</option>
                <option value="high">High (Thin LP / Fresh Migration)</option>
                <option value="extreme">Extreme (Suspicious Cluster / Unverified)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Research Status</label>
              <select
                value={researchStatus}
                onChange={(e) => setResearchStatus(e.target.value as ResearchStatus)}
                className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="unreviewed">Unreviewed</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved for Paper Testing</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Observed Metrics (Optional - if unavailable shows Data Unavailable cleanly) */}
          <div className="p-3 bg-[#090b0e]/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Observed Market Metrics (Leave empty if unavailable)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">No fabricated feeds</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">Price ($USD)</label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 0.0014"
                  className="w-full bg-[#12161f] border border-slate-700 font-mono rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">24h Change (%)</label>
                <input
                  type="number"
                  step="any"
                  value={change24h}
                  onChange={(e) => setChange24h(e.target.value)}
                  placeholder="e.g. 14.5"
                  className="w-full bg-[#12161f] border border-slate-700 font-mono rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">Liquidity ($USD)</label>
                <input
                  type="number"
                  step="any"
                  value={liquidity}
                  onChange={(e) => setLiquidity(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full bg-[#12161f] border border-slate-700 font-mono rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">Market Cap ($USD)</label>
                <input
                  type="number"
                  step="any"
                  value={marketCap}
                  onChange={(e) => setMarketCap(e.target.value)}
                  placeholder="e.g. 1200000"
                  className="w-full bg-[#12161f] border border-slate-700 font-mono rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">Data Source Reference</label>
                <input
                  type="text"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  placeholder="e.g. DexScreener / Raydium CLMM"
                  className="w-full bg-[#12161f] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5">Assign Lead Researcher</label>
                <select
                  value={assignedResearcherUid}
                  onChange={(e) => setAssignedResearcherUid(e.target.value)}
                  className="w-full bg-[#12161f] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Monitoring Reason & Shared Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Why is this token being monitored? <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={monitoringReason}
              onChange={(e) => setMonitoringReason(e.target.value)}
              placeholder="e.g. Tracking Raydium liquidity lock & sniper dispersion post-migration"
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Shared Team Notes (Optional)</label>
            <textarea
              rows={2}
              value={sharedNotes}
              onChange={(e) => setSharedNotes(e.target.value)}
              placeholder="Initial observations, community sentiment, telegram link, or key wallet connections..."
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add to Shared Watchlist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
