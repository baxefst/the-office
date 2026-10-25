import React, { useState, useMemo } from 'react';
import {
  History,
  Users,
  Eye,
  Microscope,
  Wallet,
  TrendingUp,
  TrendingDown,
  Settings,
  Filter,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { ActivityType } from '../../types/index.ts';

export const TeamActivityView: React.FC = () => {
  const { teamActivity } = useTeamData();
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');

  const filteredActivity = useMemo(() => {
    if (typeFilter === 'all') return teamActivity;
    return teamActivity.filter((a) => a.type === typeFilter);
  }, [teamActivity, typeFilter]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'member_joined':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'token_added':
        return <Eye className="w-4 h-4 text-indigo-400" />;
      case 'research_created':
      case 'research_updated':
      case 'research_status_changed':
        return <Microscope className="w-4 h-4 text-cyan-400" />;
      case 'wallet_added':
        return <Wallet className="w-4 h-4 text-amber-400" />;
      case 'trade_opened':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'trade_closed':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      case 'settings_updated':
        return <Settings className="w-4 h-4 text-slate-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Team Activity Feed</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Audit Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological log of watchlist entries, due diligence, wallet tracking, and paper trade executions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-[#090b0e] border border-slate-800 rounded-xl p-1 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-transparent text-slate-300 font-medium px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="trade_opened">Trades Opened</option>
            <option value="trade_closed">Trades Closed</option>
            <option value="token_added">Tokens Added</option>
            <option value="research_created">Research Published</option>
            <option value="wallet_added">Wallets Added</option>
            <option value="settings_updated">Settings Updated</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="p-6 rounded-2xl bg-[#12161f] border border-slate-800 shadow-sm">
        {filteredActivity.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-medium">No activity events recorded yet.</p>
            <p className="text-slate-500 mt-1">Actions taken by team members will automatically appear in this feed.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {filteredActivity.map((act) => (
              <div key={act.id} className="relative flex items-start gap-3 text-xs">
                {/* Node icon */}
                <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-[#12161f] border-2 border-indigo-500 flex items-center justify-center translate-y-0.5" />

                <div className="w-8 h-8 rounded-lg bg-[#090b0e] border border-slate-800 flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(act.type)}
                </div>

                <div className="flex-1 p-3.5 rounded-xl bg-[#090b0e] border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
                    <span className="font-bold text-indigo-300">{act.actorDisplayName}</span>
                    <span className="text-slate-500 text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-200 mt-1 leading-relaxed text-xs">{act.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
