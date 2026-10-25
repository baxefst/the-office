import React, { useState } from 'react';
import {
  Settings,
  User,
  Users,
  Shield,
  Sliders,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Key,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { DEMO_MEMBERS } from '../../data/demoData.ts';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    currentTeam,
    membership,
    isDemoMode,
    activeDemoUserIndex,
    updatePersonalProfile,
    toggleDemoMode,
  } = useAuth();
  const {
    members,
    updateTeamSettings,
    approveMember,
    seedDemoDataToFirestore,
  } = useTeamData();

  // Personal Settings State
  const [displayName, setDisplayName] = useState(
    isDemoMode
      ? DEMO_MEMBERS[activeDemoUserIndex].displayName
      : userProfile?.displayName || ''
  );
  const [startingBalance, setStartingBalance] = useState(
    String(
      isDemoMode
        ? 100
        : userProfile?.startingBalance ?? 100
    )
  );
  const [maxAllocation, setMaxAllocation] = useState(
    String(userProfile?.riskLimits?.maxAllocationPerTradePercent ?? 15)
  );
  const [maxDailyLoss, setMaxDailyLoss] = useState(
    String(userProfile?.riskLimits?.maxDailyLossPercent ?? 20)
  );
  const [stopLossDefault, setStopLossDefault] = useState(
    String(userProfile?.riskLimits?.stopLossDefaultPercent ?? 25)
  );
  const [maxOpenPositions, setMaxOpenPositions] = useState(
    String(userProfile?.riskLimits?.maxOpenPositions ?? 5)
  );

  // Shared Team Settings State (Owner only)
  const isOwner = isDemoMode
    ? DEMO_MEMBERS[activeDemoUserIndex].role === 'owner'
    : currentTeam?.ownerUid === currentUser?.uid || membership?.role === 'owner';

  const [minLiquidity, setMinLiquidity] = useState(
    String(currentTeam?.settings?.minLiquidityUsd ?? 50000)
  );
  const [teamMaxAllocation, setTeamMaxAllocation] = useState(
    String(currentTeam?.settings?.maxPositionAllocationPercent ?? 20)
  );
  const [requireFreeze, setRequireFreeze] = useState(
    currentTeam?.settings?.requireFreezeRevoked ?? true
  );
  const [maxTeamPositions, setMaxTeamPositions] = useState(
    String(currentTeam?.settings?.maxTeamOpenPositions ?? 8)
  );

  const [copiedCode, setCopiedCode] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);
  const [teamSaved, setTeamSaved] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyCode = () => {
    if (currentTeam?.inviteCode) {
      navigator.clipboard.writeText(currentTeam.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      setPersonalSaved(true);
      setTimeout(() => setPersonalSaved(false), 2500);
      return;
    }

    try {
      await updatePersonalProfile({
        displayName: displayName.trim(),
        startingBalance: parseFloat(startingBalance) || 100,
        riskLimits: {
          maxAllocationPerTradePercent: parseFloat(maxAllocation) || 15,
          maxDailyLossPercent: parseFloat(maxDailyLoss) || 20,
          stopLossDefaultPercent: parseFloat(stopLossDefault) || 25,
          maxOpenPositions: parseInt(maxOpenPositions) || 5,
        },
      });
      setPersonalSaved(true);
      setTimeout(() => setPersonalSaved(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save personal profile.');
    }
  };

  const handleSaveTeamSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || isDemoMode) return;

    try {
      await updateTeamSettings({
        minLiquidityUsd: parseFloat(minLiquidity) || 50000,
        maxPositionAllocationPercent: parseFloat(teamMaxAllocation) || 20,
        requireFreezeRevoked: requireFreeze,
        maxTeamOpenPositions: parseInt(maxTeamPositions) || 8,
      });
      setTeamSaved(true);
      setTimeout(() => setTeamSaved(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save team settings.');
    }
  };

  const handleSeedDemoData = async () => {
    if (isDemoMode) {
      alert('Demo data is already active in memory preview.');
      return;
    }
    const confirm = window.confirm(
      'Populate your team with realistic Solana token research and verified paper trades for testing?'
    );
    if (!confirm) return;

    try {
      await seedDemoDataToFirestore();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to seed sample data.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Terminal Settings & Governance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure personal paper-trading risk limits and manage team member slots
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Team Membership & Invite Code Section */}
      <div className="p-6 rounded-2xl bg-[#12161f] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Team Roster: {currentTeam?.name || 'The Trading Room'}</h3>
              <p className="text-xs text-slate-400">Strictly limited to 3 approved team members</p>
            </div>
          </div>

          {currentTeam && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#090b0e] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentTeam.inviteCode}</span>
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          )}
        </div>

        {/* Member Slots List */}
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.userId}
              className="p-3 rounded-xl bg-[#090b0e] border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.displayName} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    {m.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{m.displayName}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                        m.role === 'owner' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{m.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                    m.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {m.status}
                </span>
                {isOwner && m.status === 'pending' && (
                  <button
                    onClick={() => approveMember(m.userId)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Empty Member Slots indication */}
          {Array.from({ length: Math.max(0, 3 - members.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="p-3 rounded-xl border border-dashed border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono"
            >
              <span>Slot {members.length + i + 1} of 3: Open Seat</span>
              <span>Invite code: {currentTeam?.inviteCode || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Personal Risk Limits & Baseline Capital */}
      <div className="p-6 rounded-2xl bg-[#12161f] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Personal Profile & Risk Parameters</h3>
            <p className="text-xs text-slate-400">Isolated settings applied to your individual paper ledger</p>
          </div>
        </div>

        <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#090b0e] border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Personal Starting Capital Baseline ($USD)
              </label>
              <input
                type="number"
                step="any"
                required
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="100.0"
                className="w-full bg-[#090b0e] border border-slate-700 font-mono rounded-lg px-3 py-2 text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#090b0e] border border-slate-800 rounded-xl">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Max Allocation Per Trade (%)</label>
              <input
                type="number"
                value={maxAllocation}
                onChange={(e) => setMaxAllocation(e.target.value)}
                className="w-full bg-[#12161f] border border-slate-700 font-mono rounded px-2.5 py-1.5 text-slate-200"
              />
              <span className="text-[10px] text-slate-500">Triggers advisory warning</span>
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Max Daily Loss Limit (%)</label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(e.target.value)}
                className="w-full bg-[#12161f] border border-slate-700 font-mono rounded px-2.5 py-1.5 text-slate-200"
              />
              <span className="text-[10px] text-slate-500">Personal circuit breaker</span>
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Default Stop Loss (%)</label>
              <input
                type="number"
                value={stopLossDefault}
                onChange={(e) => setStopLossDefault(e.target.value)}
                className="w-full bg-[#12161f] border border-slate-700 font-mono rounded px-2.5 py-1.5 text-slate-200"
              />
              <span className="text-[10px] text-slate-500">Paper stop guideline</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {personalSaved && (
              <span className="text-emerald-400 text-xs flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Personal settings saved successfully!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40"
              >
                Save Personal Profile
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Team Owner Shared Policies */}
      {isOwner && (
        <div className="p-6 rounded-2xl bg-[#12161f] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Owner Shared Research & Liquidity Policies</h3>
              <p className="text-xs text-slate-400">Rules enforced across all 3 members on the Risk Monitor</p>
            </div>
          </div>

          <form onSubmit={handleSaveTeamSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Min Verified Liquidity ($USD)
                </label>
                <input
                  type="number"
                  value={minLiquidity}
                  onChange={(e) => setMinLiquidity(e.target.value)}
                  className="w-full bg-[#090b0e] border border-slate-700 font-mono rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Team Position Size (%)
                </label>
                <input
                  type="number"
                  value={teamMaxAllocation}
                  onChange={(e) => setTeamMaxAllocation(e.target.value)}
                  className="w-full bg-[#090b0e] border border-slate-700 font-mono rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Team Open Positions
                </label>
                <input
                  type="number"
                  value={maxTeamPositions}
                  onChange={(e) => setMaxTeamPositions(e.target.value)}
                  className="w-full bg-[#090b0e] border border-slate-700 font-mono rounded-lg px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="p-3 bg-[#090b0e] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Require Developer Freeze Authority Revoked</span>
                <span className="text-[11px] text-slate-400">
                  Flags any token on the Risk Monitor where freeze authority has not been permanently renounced.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireFreeze}
                onChange={(e) => setRequireFreeze(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {teamSaved && (
                <span className="text-purple-400 text-xs flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Shared policies updated!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-950/40"
                >
                  Save Team Policies
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. Development & Testing Playground */}
      <div className="p-6 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Sample Dataset & Visual Testing</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Seed real Firestore with verified research models & paper trades for instant demonstration
          </p>
          {seedSuccess && (
            <span className="text-emerald-400 text-[11px] flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" /> Successfully seeded research and trades!
            </span>
          )}
        </div>

        <button
          onClick={handleSeedDemoData}
          className="px-4 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Seed Real Firestore</span>
        </button>
      </div>
    </div>
  );
};
