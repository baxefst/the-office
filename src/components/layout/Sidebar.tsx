import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Eye,
  Microscope,
  Wallet,
  BookOpen,
  ShieldAlert,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTeamData } from '../../context/TeamDataContext.tsx';

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
}) => {
  const { currentTeam, isDemoMode } = useAuth();
  const { members } = useTeamData();

  const approvedMembersCount = isDemoMode ? 3 : members.filter((m) => m.status === 'approved').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'performance', label: 'My Performance', icon: UserCheck },
    { id: 'team', label: 'Team Dashboard', icon: Users },
    { id: 'watchlist', label: 'Token Watchlist', icon: Eye },
    { id: 'research', label: 'Research Lab', icon: Microscope },
    { id: 'wallets', label: 'Wallet Intelligence', icon: Wallet },
    { id: 'journal', label: 'Paper Trading Journal', icon: BookOpen },
    { id: 'risk', label: 'Risk Monitor', icon: ShieldAlert },
    { id: 'activity', label: 'Team Activity', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-800/80 bg-[#090b0e] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <TrendingUp className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>TradeSync</span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium px-1 py-0.2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                  SOL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Team Trading Terminal</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-slate-950 font-bold" />
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Team Room Pill */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-[#12161f] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Trading Group</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {approvedMembersCount}/3 Members
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-white truncate">
              {currentTeam?.name || 'The Trading Room'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Paper trading & research collective</p>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 to-indigo-500/10 text-emerald-300 border-l-2 border-emerald-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Disclaimer / Accounting Notice */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-[#0c0f14]/50">
          <div className="flex items-start gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-500 leading-tight">
              <strong className="text-slate-400">Paper Trading Simulation:</strong> Zero live capital or blockchain wallet signing. All ledgers are simulated records.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
