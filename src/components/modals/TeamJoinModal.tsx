import React, { useState } from 'react';
import { Users, Key, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const TeamJoinModal: React.FC = () => {
  const { currentUser, currentTeam, createDefaultTeam, joinTeamWithCode, toggleDemoMode } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If user already has a team, no need to show this modal
  if (currentTeam || !currentUser) return null;

  const handleCreateTeam = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await createDefaultTeam();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize team room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await joinTeamWithCode(inviteCode.trim());
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error joining team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-[#12161f] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Team Room Setup</h2>
            <p className="text-xs text-slate-400">TradeSync collaborative intelligence for 3 trading partners</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 my-6">
          {/* Option 1: Create The Trading Room */}
          <div className="p-4 rounded-xl bg-[#090b0e] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Initialize Team</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Found "The Trading Room" as the Owner. You will receive an invite code to approve exactly 2 other members.
              </p>
            </div>
            <button
              onClick={handleCreateTeam}
              disabled={loading}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span>Found "The Trading Room"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 2: Join with Code */}
          <div className="p-4 rounded-xl bg-[#090b0e] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Enter Invite Code</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Have an invite code from your team owner? Enter it below to claim an approved seat.
              </p>
            </div>
            <form onSubmit={handleJoin} className="mt-4 space-y-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="SOL-ROOM-XXXX"
                className="w-full bg-[#12161f] border border-slate-700 text-xs font-mono rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>Join Team Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Demo Mode Fallback Option */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Want to test the full 3-person terminal first?</span>
          <button
            onClick={() => toggleDemoMode(true)}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Demo Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
