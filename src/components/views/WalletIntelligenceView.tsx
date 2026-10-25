import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Trash2,
  AlertCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { MonitoredWallet, WalletCategory } from '../../types/index.ts';

interface WalletIntelligenceViewProps {
  onOpenAddWalletModal: () => void;
}

export const WalletIntelligenceView: React.FC<WalletIntelligenceViewProps> = ({
  onOpenAddWalletModal,
}) => {
  const { monitoredWallets, deleteMonitoredWallet, addWalletActivityRecord } = useTeamData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | WalletCategory>('all');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Modal state for recording new observed activity
  const [activeWalletForActivity, setActiveWalletForActivity] = useState<MonitoredWallet | null>(null);
  const [actionType, setActionType] = useState<'buy' | 'sell' | 'deploy' | 'transfer'>('buy');
  const [actionToken, setActionToken] = useState('');
  const [actionSol, setActionSol] = useState('');
  const [actionDetails, setActionDetails] = useState('');
  const [actionTx, setActionTx] = useState('');

  const filteredWallets = useMemo(() => {
    return monitoredWallets.filter((w) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        w.address.toLowerCase().includes(q) ||
        w.label.toLowerCase().includes(q) ||
        w.reason.toLowerCase().includes(q) ||
        w.associatedTokens.some((t) => t.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || w.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [monitoredWallets, searchQuery, categoryFilter]);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWalletForActivity || !actionToken.trim() || !actionDetails.trim()) return;

    await addWalletActivityRecord(activeWalletForActivity.id, {
      action: actionType,
      tokenSymbol: actionToken.trim().toUpperCase(),
      amountSol: actionSol ? parseFloat(actionSol) : undefined,
      details: actionDetails.trim(),
      txHash: actionTx.trim() || undefined,
    });

    setActiveWalletForActivity(null);
    setActionToken('');
    setActionSol('');
    setActionDetails('');
    setActionTx('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Wallet Intelligence</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {monitoredWallets.length} Monitored
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track Solana whales, serial deployers, and MEV snipers with read-only heuristics
          </p>
        </div>

        <button
          onClick={onOpenAddWalletModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Monitor New Wallet</span>
        </button>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
        <div className="leading-relaxed">
          <strong className="text-emerald-200">Read-Only Architecture:</strong> TradeSync tracks public addresses strictly for on-chain heuristics and behavior profiling. No private keys or wallet connections are ever required. Observed actions are grounded in verifiable explorer transactions.
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#12161f] border border-slate-800 rounded-xl text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, label, or token..."
            className="w-full bg-[#090b0e] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 text-[11px]">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="all">All Categories</option>
            <option value="whale">Whale / Smart Money</option>
            <option value="deployer">Deployer / Syndicate</option>
            <option value="trader">Sniper / MEV Bot</option>
            <option value="related">Related Wallet</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Wallets Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredWallets.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#12161f] border border-slate-800 text-xs text-slate-400">
            <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-medium">No monitored wallets found matching query.</p>
            <p className="text-slate-500 mt-1">Add a public Solana address to start profiling smart money.</p>
          </div>
        ) : (
          filteredWallets.map((wal) => (
            <div
              key={wal.id}
              className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                {/* Header with Label & Category */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">{wal.label}</h3>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-semibold ${
                          wal.category === 'whale'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : wal.category === 'deployer'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {wal.category}
                      </span>
                    </div>

                    {/* Address pill */}
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] text-slate-400">
                      <span className="bg-[#090b0e] px-2 py-0.5 rounded border border-slate-800">
                        {wal.address.slice(0, 8)}...{wal.address.slice(-8)}
                      </span>
                      <button
                        onClick={() => handleCopy(wal.address)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy Solana wallet address"
                      >
                        {copiedAddress === wal.address ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://solscan.io/account/${wal.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-indigo-400"
                        title="View address on Solscan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMonitoredWallet(wal.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove wallet from monitoring"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Reason & Notes */}
                <div className="mt-3 p-3 rounded-xl bg-[#090b0e] border border-slate-800/80 text-xs space-y-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Monitoring Rationale:</span>
                    <p className="text-slate-200 mt-0.5">{wal.reason}</p>
                  </div>
                  {wal.notes && (
                    <div className="pt-1.5 border-t border-slate-800/60">
                      <span className="text-[10px] uppercase font-mono text-slate-400">Heuristics & Notes:</span>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">{wal.notes}</p>
                    </div>
                  )}
                </div>

                {/* Associated Tokens & Risk Flags */}
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
                  {wal.associatedTokens?.map((tok, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    >
                      ${tok}
                    </span>
                  ))}
                  {wal.riskFlags?.map((flag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    >
                      ⚠ {flag}
                    </span>
                  ))}
                </div>

                {/* Observed On-Chain Activity Log */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-indigo-400" />
                      <span>Observed Activity Log ({wal.observedActivity?.length || 0})</span>
                    </span>
                    <button
                      onClick={() => setActiveWalletForActivity(wal)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      + Record Action
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {wal.observedActivity && wal.observedActivity.length > 0 ? (
                      wal.observedActivity.map((act) => (
                        <div
                          key={act.id}
                          className="p-2 rounded-lg bg-[#090b0e] border border-slate-800/60 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                act.action === 'buy'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : act.action === 'sell'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-indigo-500/10 text-indigo-300'
                              }`}
                            >
                              {act.action}
                            </span>
                            <span className="font-mono text-white font-bold">${act.tokenSymbol}</span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {act.details}
                            </span>
                          </div>
                          {act.amountSol && (
                            <span className="font-mono text-[11px] text-slate-300">
                              {act.amountSol} SOL
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 italic py-1">No observed events recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Added by: {wal.addedByName}</span>
                <span>Reviewed: {new Date(wal.lastReviewedTimestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Activity Modal */}
      {activeWalletForActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#12161f] border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">
              Record Observed Action for {activeWalletForActivity.label}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Document verifiable on-chain buy, sell, or deploy behavior
            </p>

            <form onSubmit={handleSaveActivity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="buy">Buy / Accumulate</option>
                    <option value="sell">Sell / Dump</option>
                    <option value="deploy">Token Deploy</option>
                    <option value="transfer">Cluster Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Token Symbol</label>
                  <input
                    type="text"
                    required
                    value={actionToken}
                    onChange={(e) => setActionToken(e.target.value.toUpperCase())}
                    placeholder="e.g. POPCAT"
                    className="w-full bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1.5 font-mono uppercase text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Amount (SOL)</label>
                <input
                  type="number"
                  step="any"
                  value={actionSol}
                  onChange={(e) => setActionSol(e.target.value)}
                  placeholder="e.g. 50.0"
                  className="w-full bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Observation Details</label>
                <input
                  type="text"
                  required
                  value={actionDetails}
                  onChange={(e) => setActionDetails(e.target.value)}
                  placeholder="e.g. Swapped 50 SOL via Jupiter into 72,000 tokens"
                  className="w-full bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Tx Hash / Signature (Optional)</label>
                <input
                  type="text"
                  value={actionTx}
                  onChange={(e) => setActionTx(e.target.value)}
                  placeholder="Explorer signature"
                  className="w-full bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveWalletForActivity(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 text-white font-semibold"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
