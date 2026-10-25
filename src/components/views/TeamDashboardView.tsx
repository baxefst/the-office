import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Microscope,
  BookOpen,
  PieChart,
  BarChart3,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { computeTeamStats, generateEquityPoints } from '../../utils/calculations.ts';
import { DEMO_MEMBERS } from '../../data/demoData.ts';

interface TeamDashboardViewProps {
  onNavigate: (section: string) => void;
  onOpenTradeModal: () => void;
}

type TimeFilter = 'today' | '7d' | '30d' | 'all';

export const TeamDashboardView: React.FC<TeamDashboardViewProps> = ({
  onNavigate,
  onOpenTradeModal,
}) => {
  const { currentTeam, isDemoMode } = useAuth();
  const {
    members,
    sharedWatchlist,
    tokenResearch,
    paperTrades,
    teamActivity,
    activeMemberProfiles,
  } = useTeamData();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Filter paper trades by selected timeframe
  const filteredTrades = useMemo(() => {
    if (timeFilter === 'all') return paperTrades;

    const now = Date.now();
    let cutoff = 0;
    if (timeFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      cutoff = today.getTime();
    } else if (timeFilter === '7d') {
      cutoff = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeFilter === '30d') {
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    }

    return paperTrades.filter((t) => {
      const ts = new Date(t.exitTimestamp || t.createdAt).getTime();
      return ts >= cutoff;
    });
  }, [paperTrades, timeFilter]);

  // Aggregate team statistics
  const activeMembersList = isDemoMode ? DEMO_MEMBERS : members.filter((m) => m.status === 'approved');

  const memberBalancesRecord = useMemo(() => {
    return Object.fromEntries(
      Object.entries(activeMemberProfiles).map(([uid, prof]) => [uid, prof.startingBalance])
    );
  }, [activeMemberProfiles]);

  const teamStats = useMemo(() => {
    return computeTeamStats(activeMembersList, memberBalancesRecord, filteredTrades);
  }, [activeMembersList, memberBalancesRecord, filteredTrades]);

  // Combined equity curve
  const combinedEquityPoints = useMemo(() => {
    return generateEquityPoints(filteredTrades, teamStats.startingCapital);
  }, [filteredTrades, teamStats.startingCapital]);

  // Member comparison chart dataset
  const memberComparisonData = useMemo(() => {
    return teamStats.members.map((m) => ({
      name: m.displayName.split(' ')[0],
      realizedPnl: parseFloat(m.realizedPnl.toFixed(2)),
      currentBalance: parseFloat(m.currentBalance.toFixed(2)),
      winRate: parseFloat(m.winRate.toFixed(1)),
      tradesCount: m.totalTrades,
    }));
  }, [teamStats.members]);

  // Open paper positions across team
  const openPositions = useMemo(() => {
    return paperTrades.filter((t) => t.status === 'open');
  }, [paperTrades]);

  return (
    <div className="space-y-6">
      {/* Team Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#12161f] via-[#151a24] to-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {currentTeam?.name || 'The Trading Room'} — Team Intelligence
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {activeMembersList.length}/3 Approved Seats
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated paper-trading performance & collaborative research for approved partners
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center bg-[#090b0e] border border-slate-800 rounded-xl p-1 text-xs">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                timeFilter === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounting Notice Banner */}
      <div className="p-3.5 rounded-xl bg-[#0e131d] border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-slate-300">Accounting Rules & Disclosures:</strong> Individual accounts and paper-trading ledgers are strictly segregated. Combined metrics represent simulated aggregate research performance and do not reflect pooled cash, real bank deposits, or co-mingled capital.
        </div>
      </div>

      {/* Team Aggregated KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Combined Starting Capital */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Team Starting Equity</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            ${teamStats.startingCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">{activeMembersList.length} members baseline</span>
        </div>

        {/* Combined Current Equity */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Combined Current Equity</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            ${teamStats.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Realized + Unrealized</span>
        </div>

        {/* Combined Realized P&L */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Combined Realized P&L</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              teamStats.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {teamStats.realizedPnl >= 0 ? '+' : ''}${teamStats.realizedPnl.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">{teamStats.closedTrades} closed paper trades</span>
        </div>

        {/* Combined Return % */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Team Net Return</span>
          <div
            className={`text-base font-bold font-mono mt-1 flex items-center gap-1 ${
              teamStats.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {teamStats.netReturnPct >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>
              {teamStats.netReturnPct >= 0 ? '+' : ''}
              {teamStats.netReturnPct.toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Across all members</span>
        </div>

        {/* Team Win Rate */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Team Win Rate</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            {teamStats.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500">
            {teamStats.winningTrades}W / {teamStats.losingTrades}L
          </div>
        </div>

        {/* Active Open Positions */}
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Open Team Positions</span>
          <div className="text-base font-bold font-mono text-indigo-400 mt-1">
            {teamStats.openTrades} Active
          </div>
          <span className="text-[10px] text-slate-500">
            Unrealized: {teamStats.unrealizedPnl >= 0 ? '+' : ''}${teamStats.unrealizedPnl.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Chart Section: Combined Equity Curve + Member Performance Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Combined Equity Curve */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Combined Team Equity Curve</span>
              </h3>
              <p className="text-[11px] text-slate-400">Collective research progression across all 3 members</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">{timeFilter}</span>
          </div>

          <div className="h-64 w-full mt-4">
            {combinedEquityPoints.length <= 1 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">No team closed trades found for this filter range.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Once members log closed paper trades, the team trajectory will chart here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedEquityPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
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
                    formatter={(val: any) => [`$${val}`, 'Combined Equity']}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#teamGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Member Comparison Chart */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Member Performance Comparison</span>
              </h3>
              <p className="text-[11px] text-slate-400">Authorized side-by-side trading metrics</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">3 Partners</span>
          </div>

          <div className="h-64 w-full mt-4">
            {memberComparisonData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No member data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090b0e',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="realizedPnl" name="Realized PnL ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="winRate" name="Win Rate (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Individual Member Comparison Cards */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Team Member Ledger Breakdowns</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teamStats.members.map((mem) => (
            <div
              key={mem.userId}
              className="p-4 rounded-2xl bg-[#12161f] border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  {mem.avatarUrl ? (
                    <img
                      src={mem.avatarUrl}
                      alt={mem.displayName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                      {mem.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                      {mem.displayName}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{mem.role}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono">Current Equity</span>
                  <div className="text-xs font-mono font-bold text-white">
                    ${mem.currentBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                <div className="p-2 rounded bg-[#090b0e] border border-slate-800/80">
                  <span className="text-[10px] text-slate-400">Realized PnL:</span>
                  <div className={`font-bold mt-0.5 ${mem.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {mem.realizedPnl >= 0 ? '+' : ''}${mem.realizedPnl.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#090b0e] border border-slate-800/80">
                  <span className="text-[10px] text-slate-400">Net Return:</span>
                  <div className={`font-bold mt-0.5 ${mem.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {mem.netReturnPct >= 0 ? '+' : ''}{mem.netReturnPct.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 rounded bg-[#090b0e] border border-slate-800/80">
                  <span className="text-[10px] text-slate-400">Win Rate:</span>
                  <div className="font-bold text-white mt-0.5">{mem.winRate.toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded bg-[#090b0e] border border-slate-800/80">
                  <span className="text-[10px] text-slate-400">Closed Trades:</span>
                  <div className="font-bold text-slate-300 mt-0.5">{mem.closedTrades}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Watchlist Preview & Open Positions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Paper Positions by Member */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Open Paper Positions ({openPositions.length})</span>
            </h3>
            <button
              onClick={() => onNavigate('journal')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Full Ledger →
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
            {openPositions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No active open paper positions across the team.
              </p>
            ) : (
              openPositions.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">${p.tokenSymbol}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold font-mono uppercase ${
                          p.direction === 'long'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.direction}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      By <span className="text-slate-300 font-medium">{p.userDisplayName}</span> · {p.quantity.toLocaleString()} tokens @ ${p.entryPrice}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-500 block">Est. Cost</span>
                    <span className="text-slate-200 font-bold">${(p.entryPrice * p.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Recently Researched Tokens */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Microscope className="w-4 h-4 text-indigo-400" />
              <span>Latest Research Reports</span>
            </h3>
            <button
              onClick={() => onNavigate('research')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Research Lab →
            </button>
          </div>

          <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto">
            {tokenResearch.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No token research submitted yet. Use the Research Lab to collaborate on token due diligence.
              </p>
            ) : (
              tokenResearch.slice(0, 4).map((r) => (
                <div key={r.id} className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">${r.tokenSymbol}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                        r.researchStatus === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : r.researchStatus === 'rejected'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {r.researchStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium truncate mt-1">{r.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">"{r.thesis}"</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-800/60">
                    <span>Researcher: {r.researcherName}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
