import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Award,
  ShieldCheck,
  Plus,
  BookOpen,
  Eye,
  Microscope,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { computeMemberStats, generateEquityPoints } from '../../utils/calculations.ts';
import { DEMO_MEMBERS } from '../../data/demoData.ts';

interface PersonalOverviewViewProps {
  onNavigate: (section: string) => void;
  onOpenTradeModal: () => void;
  onOpenResearchModal: () => void;
}

export const PersonalOverviewView: React.FC<PersonalOverviewViewProps> = ({
  onNavigate,
  onOpenTradeModal,
  onOpenResearchModal,
}) => {
  const { currentUser, userProfile, isDemoMode, activeDemoUserIndex } = useAuth();
  const {
    paperTrades,
    personalWatchlist,
    tokenResearch,
    activeStartingBalance,
  } = useTeamData();

  const currentUid = isDemoMode
    ? DEMO_MEMBERS[activeDemoUserIndex].userId
    : currentUser?.uid || '';

  const memberProfile = useMemo(() => {
    return {
      userId: currentUid,
      displayName: isDemoMode
        ? DEMO_MEMBERS[activeDemoUserIndex].displayName
        : userProfile?.displayName || 'Trader',
      email: isDemoMode
        ? DEMO_MEMBERS[activeDemoUserIndex].email
        : userProfile?.email || '',
      avatarUrl: isDemoMode
        ? DEMO_MEMBERS[activeDemoUserIndex].avatarUrl
        : userProfile?.photoURL,
      role: isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].role : userProfile?.role || 'member',
      startingBalance: activeStartingBalance,
    };
  }, [currentUid, isDemoMode, activeDemoUserIndex, userProfile, activeStartingBalance]);

  // Compute strictly authorized metrics for this member only
  const stats = useMemo(() => {
    return computeMemberStats(memberProfile, paperTrades);
  }, [memberProfile, paperTrades]);

  // Equity curve data points
  const equityPoints = useMemo(() => {
    return generateEquityPoints(stats.trades, stats.startingBalance);
  }, [stats.trades, stats.startingBalance]);

  // Recent contributions by this user
  const myResearch = useMemo(() => {
    return tokenResearch.filter((r) => r.researcherUid === currentUid);
  }, [tokenResearch, currentUid]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#12161f] via-[#151a24] to-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Personal Trader Overview
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Private Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Performance metrics and paper positions for{' '}
            <span className="text-slate-200 font-medium">{memberProfile.displayName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTradeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Paper Trade</span>
          </button>
          <button
            onClick={onOpenResearchModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181e2b] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Microscope className="w-3.5 h-3.5 text-indigo-400" />
            <span>Submit Research</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Starting Capital */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Starting Balance</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            ${stats.startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Configured baseline</span>
        </div>

        {/* Current Balance */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Current Balance</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            ${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
            <span>Net:</span>
            <span
              className={`font-mono font-medium ${
                stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Realized P&L */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Realized P&L</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              stats.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.realizedPnl >= 0 ? '+' : ''}${stats.realizedPnl.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">{stats.closedTrades} closed trades</span>
        </div>

        {/* Net Return % */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Net Return</span>
          <div
            className={`text-base font-bold font-mono mt-1 flex items-center gap-1 ${
              stats.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.netReturnPct >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>
              {stats.netReturnPct >= 0 ? '+' : ''}
              {stats.netReturnPct.toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Since inception</span>
        </div>

        {/* Win Rate */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Win Rate</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500">
            {stats.winningTrades}W / {stats.losingTrades}L
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Max Drawdown</span>
          <div className="text-base font-bold font-mono text-rose-400 mt-1">
            -{stats.maxDrawdownPct.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500">Peak-to-trough</span>
        </div>
      </div>

      {/* Main Section: Equity Curve + Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Personal Equity Curve */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Personal Equity Curve</span>
                <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.2 bg-indigo-500/10 border border-indigo-500/20 rounded">
                  Closed Trades P&L
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Cumulative balance progression over closed paper trades</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Profit Factor:</span>
              <span className="ml-1 text-xs font-mono font-bold text-emerald-400">
                {stats.profitFactor.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            {equityPoints.length <= 1 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">No closed trades recorded yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Log your paper trades and close positions to visualize your equity curve.
                </p>
                <button
                  onClick={onOpenTradeModal}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  Record First Trade
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="personalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090b0e',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`$${val}`, 'Equity Balance']}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#personalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Average Win vs Average Loss metrics */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="p-2.5 rounded-lg bg-[#090b0e] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Average Win:</span>
              <span className="font-mono text-emerald-400 font-semibold">+${stats.avgWin.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#090b0e] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Average Loss:</span>
              <span className="font-mono text-rose-400 font-semibold">-${stats.avgLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right (1 col): Personal Watchlist & Contributions */}
        <div className="space-y-4">
          {/* Personal Watchlist Card */}
          <div className="p-4 rounded-2xl bg-[#12161f] border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-white">Personal Watchlist</h4>
              </div>
              <button
                onClick={() => onNavigate('watchlist')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                View Watchlist →
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {personalWatchlist.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Your personal watchlist is empty. Star tokens from the team watchlist to track them here.
                </p>
              ) : (
                personalWatchlist.map((tok) => (
                  <div key={tok.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-white">${tok.symbol}</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{tok.name}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {tok.mintAddress.slice(0, 4)}...{tok.mintAddress.slice(-4)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Research Contributions */}
          <div className="p-4 rounded-2xl bg-[#12161f] border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-semibold text-white">My Research Contributions</h4>
              </div>
              <button
                onClick={() => onNavigate('research')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                Research Lab →
              </button>
            </div>

            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {myResearch.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No research reports authored yet.
                </p>
              ) : (
                myResearch.map((res) => (
                  <div key={res.id} className="p-2 rounded-lg bg-[#090b0e] border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">${res.tokenSymbol}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                          res.researchStatus === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : res.researchStatus === 'rejected'
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {res.researchStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium truncate mt-1">{res.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Paper Trades Table for this Member */}
      <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>My Recent Paper Trades</span>
            </h3>
            <p className="text-[11px] text-slate-400">Strictly personal trading entries and journal rationales</p>
          </div>
          <button
            onClick={() => onNavigate('journal')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Full Paper Journal ({stats.trades.length}) →
          </button>
        </div>

        <div className="overflow-x-auto mt-3">
          {stats.trades.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No paper trades logged for your account yet. Click "New Paper Trade" above to begin paper testing.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono uppercase">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Exit Price</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Net Realized P&L</th>
                  <th className="py-2.5 px-3">Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stats.trades.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-white">${t.tokenSymbol}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          t.direction === 'long'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                          t.status === 'closed'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">${t.entryPrice}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {t.exitPrice ? `$${t.exitPrice}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{t.quantity.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      {t.status === 'closed' ? (
                        <span
                          className={`font-semibold ${
                            (t.realizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {(t.realizedPnl ?? 0) >= 0 ? '+' : ''}${t.realizedPnl?.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Open Position</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-[11px] truncate max-w-[140px]">
                      {t.strategy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
