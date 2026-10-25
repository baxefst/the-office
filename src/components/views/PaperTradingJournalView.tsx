import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PaperTrade } from '../../types/index.ts';
import { CloseTradeModal } from '../modals/CloseTradeModal.tsx';
import { DEMO_MEMBERS } from '../../data/demoData.ts';

interface PaperTradingJournalViewProps {
  onOpenNewTradeModal: () => void;
}

export const PaperTradingJournalView: React.FC<PaperTradingJournalViewProps> = ({
  onOpenNewTradeModal,
}) => {
  const { paperTrades, members, exportTradesToCsv } = useTeamData();
  const { currentUser, isDemoMode, activeDemoUserIndex } = useAuth();

  const currentUid = isDemoMode
    ? DEMO_MEMBERS[activeDemoUserIndex].userId
    : currentUser?.uid || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');

  // Trade being closed
  const [tradeToClose, setTradeToClose] = useState<PaperTrade | null>(null);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Distinct strategies list
  const strategies = useMemo(() => {
    const set = new Set<string>();
    paperTrades.forEach((t) => {
      if (t.strategy) set.add(t.strategy);
    });
    return Array.from(set);
  }, [paperTrades]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return paperTrades.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        t.tokenSymbol.toLowerCase().includes(q) ||
        t.strategy.toLowerCase().includes(q) ||
        (t.entryRationale && t.entryRationale.toLowerCase().includes(q)) ||
        (t.exitRationale && t.exitRationale.toLowerCase().includes(q));

      const matchesMember = memberFilter === 'all' || t.userId === memberFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesStrategy = strategyFilter === 'all' || t.strategy === strategyFilter;

      return matchesSearch && matchesMember && matchesStatus && matchesStrategy;
    });
  }, [paperTrades, searchQuery, memberFilter, statusFilter, strategyFilter]);

  // Aggregate metrics for displayed selection
  const metrics = useMemo(() => {
    let realizedPnl = 0;
    let winning = 0;
    let closed = 0;
    let totalFees = 0;

    filteredTrades.forEach((t) => {
      totalFees += t.estimatedFees;
      if (t.status === 'closed') {
        closed += 1;
        const pnl = t.realizedPnl ?? 0;
        realizedPnl += pnl;
        if (pnl > 0) winning += 1;
      }
    });

    const winRate = closed > 0 ? (winning / closed) * 100 : 0;
    return { realizedPnl, winRate, closed, totalFees };
  }, [filteredTrades]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Paper Trading Journal</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {paperTrades.length} Trades Recorded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Separately accounted member ledgers with fee, slippage, and rationale tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportTradesToCsv(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181e2b] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
            title="Download CSV of all authorized paper trades"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenNewTradeModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Paper Trade</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Filtered Realized P&L</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              metrics.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {metrics.realizedPnl >= 0 ? '+' : ''}${metrics.realizedPnl.toFixed(2)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Filtered Win Rate</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            {metrics.winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500">{metrics.closed} closed positions</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Est. Fees Accounted</span>
          <div className="text-base font-bold font-mono text-slate-300 mt-1">
            ${metrics.totalFees.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-500">DEX priority & swap fees</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Displayed Trades</span>
          <div className="text-base font-bold font-mono text-indigo-400 mt-1">
            {filteredTrades.length}
          </div>
          <span className="text-[10px] text-slate-500">Active query records</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-xl bg-[#12161f] border border-slate-800 space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token, rationale, strategy..."
              className="w-full bg-[#090b0e] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Member Filter */}
          <div>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Team Members</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Positions (Open & Closed)</option>
              <option value="open">Open Positions Only</option>
              <option value="closed">Closed Positions Only</option>
            </select>
          </div>

          {/* Strategy Filter */}
          <div>
            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Trading Strategies</option>
              {strategies.map((strat) => (
                <option key={strat} value={strat}>
                  {strat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="rounded-2xl bg-[#12161f] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredTrades.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-medium">No paper trades match the selected filters.</p>
              <p className="text-slate-500 mt-1">Record a paper trade or broaden your filter criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#090b0e]/70 text-slate-400 text-[11px] font-mono uppercase">
                  <th className="py-3 px-4">Token & Direction</th>
                  <th className="py-3 px-4">Trader</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Entry / Exit Price</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Net Realized P&L</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTrades.map((t) => {
                  const isOwner = t.userId === currentUid;
                  const isExpanded = expandedTradeId === t.id;

                  return (
                    <React.Fragment key={t.id}>
                      <tr
                        onClick={() => setExpandedTradeId(isExpanded ? null : t.id)}
                        className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                      >
                        {/* Token & Direction */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">${t.tokenSymbol}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                t.direction === 'long'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {t.direction}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {new Date(t.entryTimestamp).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Trader */}
                        <td className="py-3 px-4 font-sans text-slate-300">
                          <span className="font-medium">{t.userDisplayName}</span>
                          {isOwner && (
                            <span className="ml-1.5 text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20">
                              You
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 font-sans">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase inline-block ${
                              t.status === 'closed'
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        {/* Entry / Exit Price */}
                        <td className="py-3 px-4">
                          <div className="text-slate-200">${t.entryPrice}</div>
                          {t.exitPrice ? (
                            <span className="text-[10px] text-slate-400 block">Exit: ${t.exitPrice}</span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 block italic">Live Position</span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 text-slate-300">
                          {t.quantity.toLocaleString()}
                          <span className="text-[10px] text-slate-500 block">
                            ${(t.entryPrice * t.quantity).toFixed(2)} basis
                          </span>
                        </td>

                        {/* Net Realized PnL */}
                        <td className="py-3 px-4">
                          {t.status === 'closed' ? (
                            <div>
                              <span
                                className={`text-sm font-bold ${
                                  (t.realizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {(t.realizedPnl ?? 0) >= 0 ? '+' : ''}${t.realizedPnl?.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Fee: -${t.estimatedFees}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic font-sans text-[11px]">
                              Open (Unrealized)
                            </span>
                          )}
                        </td>

                        {/* Strategy */}
                        <td className="py-3 px-4 font-sans text-slate-300 max-w-[150px] truncate">
                          {t.strategy}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right font-sans">
                          <div className="flex items-center justify-end gap-2">
                            {t.status === 'open' && isOwner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTradeToClose(t);
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm transition-colors"
                              >
                                Close Position
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTradeId(isExpanded ? null : t.id);
                              }}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Journal Details */}
                      {isExpanded && (
                        <tr className="bg-[#0c0f14]/80">
                          <td colSpan={8} className="p-4 border-t border-slate-800/80 font-sans text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Rationale */}
                              <div className="p-3 rounded-lg bg-[#090b0e] border border-slate-800">
                                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                                  Entry Rationale
                                </span>
                                <p className="text-slate-200 leading-relaxed">
                                  {t.entryRationale || 'No entry rationale recorded.'}
                                </p>
                              </div>

                              {/* Exit Rationale */}
                              <div className="p-3 rounded-lg bg-[#090b0e] border border-slate-800">
                                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                                  Exit Rationale
                                </span>
                                <p className="text-slate-200 leading-relaxed">
                                  {t.exitRationale || (t.status === 'open' ? 'Position is still open.' : 'No exit notes provided.')}
                                </p>
                              </div>

                              {/* Lessons Learned */}
                              <div className="p-3 rounded-lg bg-[#090b0e] border border-slate-800">
                                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                                  Journal Lessons Learned
                                </span>
                                <p className="text-slate-200 leading-relaxed">
                                  {t.lessonsLearned || 'No reflection recorded.'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                              <span>Solana Mint: {t.tokenMint}</span>
                              <span>
                                Slippage Impact Modeled: {t.estimatedSlippage}% · Priority Gas: ${t.estimatedFees}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Close Position Modal */}
      {tradeToClose && (
        <CloseTradeModal trade={tradeToClose} onClose={() => setTradeToClose(null)} />
      )}
    </div>
  );
};
