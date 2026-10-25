import React, { useState } from 'react';
import {
  Search,
  Bell,
  Shield,
  Users,
  Copy,
  Check,
  Sparkles,
  LogOut,
  LogIn,
  SlidersHorizontal,
  ChevronDown,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { DEMO_MEMBERS } from '../../data/demoData.ts';

interface HeaderProps {
  onNavigate: (section: string) => void;
  currentSection: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentSection }) => {
  const {
    currentUser,
    userProfile,
    currentTeam,
    membership,
    isDemoMode,
    toggleDemoMode,
    activeDemoUserIndex,
    setActiveDemoUserIndex,
    loginWithGoogle,
    logout,
  } = useAuth();
  const { teamActivity } = useTeamData();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyInvite = () => {
    if (currentTeam?.inviteCode) {
      navigator.clipboard.writeText(currentTeam.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const displayName = isDemoMode
    ? DEMO_MEMBERS[activeDemoUserIndex].displayName
    : currentUser?.displayName || userProfile?.displayName || 'Solana Trader';

  const avatar = isDemoMode
    ? DEMO_MEMBERS[activeDemoUserIndex].avatarUrl
    : currentUser?.photoURL || userProfile?.photoURL;

  const role = isDemoMode
    ? DEMO_MEMBERS[activeDemoUserIndex].role
    : membership?.role || userProfile?.role || 'member';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#090b0e]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Global Search & Team Status */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens by symbol, mint address, wallet, or research tags..."
            className="w-full bg-[#12161f] border border-slate-800 text-sm rounded-lg pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          />
        </div>

        {/* Demo Mode Badge */}
        {isDemoMode && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            DEMO PREVIEW
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Demo Toggle Button */}
        <button
          onClick={() => toggleDemoMode()}
          title="Toggle between Live Firebase Data and Demo Preview"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            isDemoMode
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{isDemoMode ? 'Exit Demo' : 'Demo Data'}</span>
        </button>

        {/* In Demo Mode: Switch simulated team member */}
        {isDemoMode && (
          <div className="hidden md:flex items-center bg-[#12161f] border border-slate-800 rounded-lg p-0.5 text-xs">
            {DEMO_MEMBERS.map((m, idx) => (
              <button
                key={m.userId}
                onClick={() => setActiveDemoUserIndex(idx)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  activeDemoUserIndex === idx
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch view to ${m.displayName}`}
              >
                {m.displayName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Team Invite Pill (When connected to team) */}
        {currentTeam && (
          <button
            onClick={handleCopyInvite}
            title="Click to copy team invite code"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#12161f] hover:bg-[#181e2b] border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-indigo-300 font-semibold">{currentTeam.inviteCode}</span>
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-[#12161f] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title="Recent Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {teamActivity.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#12161f] border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team Notifications</span>
                <span className="text-[11px] text-slate-500">{teamActivity.length} events</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 my-2">
                {teamActivity.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No recent alerts or team activity.</p>
                ) : (
                  teamActivity.slice(0, 5).map((act) => (
                    <div key={act.id} className="py-2.5 text-xs">
                      <p className="text-slate-200 leading-snug">{act.summary}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span className="text-indigo-400">{act.actorDisplayName}</span>
                        <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  setShowNotifications(false);
                  onNavigate('activity');
                }}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 pt-1 font-medium"
              >
                View Full Team Activity Feed →
              </button>
            </div>
          )}
        </div>

        {/* User Account / Profile */}
        <div className="relative">
          {currentUser || isDemoMode ? (
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg bg-[#12161f] border border-slate-800 hover:border-slate-700 transition-colors"
            >
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center justify-center ring-1 ring-indigo-500/40">
                  {displayName.charAt(0)}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-slate-200 leading-tight flex items-center gap-1.5">
                  <span className="max-w-[110px] truncate">{displayName}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase ${
                      role === 'owner' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-[#12161f] border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].email : currentUser?.email}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Authenticated Member
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('performance');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  My Trading Ledger
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  Team & Risk Settings
                </button>
              </div>

              <div className="pt-1 border-t border-slate-800">
                {isDemoMode ? (
                  <button
                    onClick={() => {
                      toggleDemoMode(false);
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Exit Demo Mode
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
