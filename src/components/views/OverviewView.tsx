import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Microscope,
  BookOpen,
  ShieldAlert,
  ArrowRight,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { computeMemberStats, computeTeamStats } from '../../utils/calculations.ts';
import { DEMO_MEMBERS } from '../../data/demoData.ts';

interface OverviewViewProps {
  onNavigate: (section: string) => void;
  onOpenTradeModal: () => void;
  onOpenResearchModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenTradeModal,
  onOpenResearchModal,
}) => {
  const { currentUser, userProfile, currentTeam, isDemoMode, activeDemoUserIndex } = useAuth();
  const {
    members,
    sharedWatchlist,
    tokenResearch,
    monitoredWallets,
    paperTrades,
    teamActivity,
    activeStartingBalance,
    activeMemberProfiles,
  } = useTeamData();

  const currentUid = isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].userId : currentUser?.uid || '';
  const currentDisplayName = isDemoMode
    ? DEMO_MEMBERS[activeDemoUserIndex].displayName
    : userProfile?.displayName || 'Trader';

  // Personal statistics
  const personalStats = useMemo(() => {
    return computeMemberStats(
      {
        userId: currentUid,
        displayName: currentDisplayName,
        email: isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].email : userProfile?.email || '',
        avatarUrl: isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].avatarUrl : userProfile?.photoURL,
        role: isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].role : userProfile?.role || 'member',
        startingBalance: activeStartingBalance,
      },
      paperTrades
    );
  }, [currentUid, currentDisplayName, isDemoMode, activeDemoUserIndex, userProfile, activeStartingBalance, paperTrades]);

  // Team statistics
  const activeMembersList = isDemoMode ? DEMO_MEMBERS : members.filter((m) => m.status === 'approved');
  const memberBalancesRecord = useMemo(() => {
    return Object.fromEntries(
      Object.entries(activeMemberProfiles).map(([uid, prof]) => [uid, prof.startingBalance])
    );
  }, [activeMemberProfiles]);

  const teamStats = useMemo(() => {
    return computeTeamStats(activeMembersList, memberBalancesRecord, paperTrades);
  }, [activeMembersList, memberBalancesRecord, paperTrades]);

  // Open trades
  const openTrades = useMemo(() => paperTrades.filter((t) => t.status === 'open'), [paperTrades]);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-[#12161f] via-[#161c28] to-[#12161f] border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">
                Room Terminal Live
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentTeam?.name || 'The Trading Room'} · {activeMembersList.length}/3 Members
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Welcome back, {currentDisplayName.split(' ')[0]}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Real-time Solana memecoin intelligence, isolated paper-trading ledgers, and team due diligence forensics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenTradeModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Trade</span>
            </button>
            <button
              onClick={onOpenResearchModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#181e2b] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Microscope className="w-4 h-4 text-indigo-400" />
              <span>New Research</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dual Perspective KPI Cards (Personal vs Team) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Snapshot Card */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                P
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  My Performance Snapshot
                </h3>
                <span className="text-[10px] text-slate-500">Private account metrics</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('performance')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono">
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">Balance</span>
              <div className="text-sm font-bold text-white mt-0.5">
                ${personalStats.currentBalance.toFixed(2)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">Realized P&L</span>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  personalStats.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {personalStats.realizedPnl >= 0 ? '+' : ''}${personalStats.realizedPnl.toFixed(2)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {personalStats.winRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Team Aggregate Snapshot Card */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                T
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Team Collective Status
                </h3>
                <span className="text-[10px] text-slate-500">Aggregated group metrics</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('team')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono">
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">Team Equity</span>
              <div className="text-sm font-bold text-white mt-0.5">
                ${teamStats.currentEquity.toFixed(2)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">Team Net P&L</span>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  teamStats.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {teamStats.realizedPnl >= 0 ? '+' : ''}${teamStats.realizedPnl.toFixed(2)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {teamStats.winRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards (Watchlist, Research, Wallets, Risk) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('watchlist')}
          className="p-4 rounded-xl bg-[#12161f] border border-slate-800 hover:border-slate-700 text-left transition-all group"
        >
          <div className="flex items-center justify-between">
            <Eye className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold text-slate-300">{sharedWatchlist.length}</span>
          </div>
          <h4 className="text-xs font-semibold text-white mt-2">Token Watchlist</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Explore tracked launches & pairs</p>
        </button>

        <button
          onClick={() => onNavigate('research')}
          className="p-4 rounded-xl bg-[#12161f] border border-slate-800 hover:border-slate-700 text-left transition-all group"
        >
          <div className="flex items-center justify-between">
            <Microscope className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold text-slate-300">{tokenResearch.length}</span>
          </div>
          <h4 className="text-xs font-semibold text-white mt-2">Research Lab</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Read due diligence & forensics</p>
        </button>

        <button
          onClick={() => onNavigate('wallets')}
          className="p-4 rounded-xl bg-[#12161f] border border-slate-800 hover:border-slate-700 text-left transition-all group"
        >
          <div className="flex items-center justify-between">
            <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold text-slate-300">{monitoredWallets.length}</span>
          </div>
          <h4 className="text-xs font-semibold text-white mt-2">Wallet Intelligence</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Track smart money & deployers</p>
        </button>

        <button
          onClick={() => onNavigate('risk')}
          className="p-4 rounded-xl bg-[#12161f] border border-slate-800 hover:border-slate-700 text-left transition-all group"
        >
          <div className="flex items-center justify-between">
            <ShieldAlert className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold text-rose-300">
              {sharedWatchlist.filter((t) => t.riskStatus === 'extreme').length} Flags
            </span>
          </div>
          <h4 className="text-xs font-semibold text-white mt-2">Risk Surveillance</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Audit concentration & LP depth</p>
        </button>
      </div>

      {/* Lower Section: Active Positions + Latest Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Open Positions */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Active Open Paper Trades ({openTrades.length})</span>
            </h3>
            <button
              onClick={() => onNavigate('journal')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Journal →
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-800/60 max-h-56 overflow-y-auto font-mono text-xs">
            {openTrades.length === 0 ? (
              <p className="text-slate-500 py-6 text-center font-sans text-xs">
                No active open paper trades.
              </p>
            ) : (
              openTrades.slice(0, 4).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">${t.tokenSymbol}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          t.direction === 'long'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans mt-0.5 block">
                      Trader: {t.userDisplayName} · {t.quantity.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">${t.entryPrice}</span>
                    <span className="text-[10px] text-slate-500 block font-sans">Entry Price</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed Snapshot */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Latest Room Events</span>
            </h3>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Full Feed →
            </button>
          </div>

          <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto text-xs">
            {teamActivity.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No recent events recorded.</p>
            ) : (
              teamActivity.slice(0, 4).map((a) => (
                <div key={a.id} className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800/80">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-300">{a.actorDisplayName}</span>
                    <span>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-200 mt-1 leading-snug">{a.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
