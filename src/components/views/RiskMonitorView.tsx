import React, { useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Percent,
  PieChart as PieIcon,
  TrendingDown,
  Layers,
  Clock,
  ExternalLink,
  Sliders,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DEMO_MEMBERS } from '../../data/demoData.ts';

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const RiskMonitorView: React.FC<{ onNavigate: (section: string) => void }> = ({
  onNavigate,
}) => {
  const {
    paperTrades,
    sharedWatchlist,
    tokenResearch,
    monitoredWallets,
    activeStartingBalance,
  } = useTeamData();
  const { userProfile, currentTeam, isDemoMode } = useAuth();

  // 1. Open positions and total capital committed
  const openPositions = useMemo(() => {
    return paperTrades.filter((t) => t.status === 'open');
  }, [paperTrades]);

  const totalCommitted = useMemo(() => {
    return openPositions.reduce((acc, t) => acc + t.entryPrice * t.quantity, 0);
  }, [openPositions]);

  // 2. Token Concentration (% of open exposure)
  const tokenConcentrationData = useMemo(() => {
    const map: Record<string, number> = {};
    openPositions.forEach((t) => {
      const value = t.entryPrice * t.quantity;
      map[t.tokenSymbol] = (map[t.tokenSymbol] || 0) + value;
    });

    return Object.entries(map).map(([symbol, value]) => ({
      name: symbol,
      value: parseFloat(value.toFixed(2)),
      pct: totalCommitted > 0 ? parseFloat(((value / totalCommitted) * 100).toFixed(1)) : 0,
    }));
  }, [openPositions, totalCommitted]);

  // 3. Strategy Exposure
  const strategyExposureData = useMemo(() => {
    const map: Record<string, number> = {};
    openPositions.forEach((t) => {
      const val = t.entryPrice * t.quantity;
      map[t.strategy] = (map[t.strategy] || 0) + val;
    });

    return Object.entries(map).map(([strategy, value]) => ({
      name: strategy,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [openPositions]);

  // 4. Stale Research Warnings (reports unupdated > 7 days)
  const staleResearchList = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return tokenResearch.filter((r) => {
      const ts = new Date(r.updatedAt || r.createdAt).getTime();
      return ts < sevenDaysAgo;
    });
  }, [tokenResearch]);

  // 5. Liquidity Risk Flags (tokens with liquidity < team minLiquidity setting or unburned LP)
  const minLiqRequired = currentTeam?.settings?.minLiquidityUsd || 50000;
  const liquidityRiskTokens = useMemo(() => {
    return sharedWatchlist.filter(
      (tok) => tok.liquidity !== null && tok.liquidity !== undefined && tok.liquidity < minLiqRequired
    );
  }, [sharedWatchlist, minLiqRequired]);

  // 6. Missing Market Data Flags
  const missingDataTokens = useMemo(() => {
    return sharedWatchlist.filter(
      (tok) => tok.price === null || tok.liquidity === null || tok.marketCap === null
    );
  }, [sharedWatchlist]);

  // 7. Token Safety Warnings (Extreme risk tokens)
  const extremeRiskTokens = useMemo(() => {
    return sharedWatchlist.filter((t) => t.riskStatus === 'extreme' || t.researchStatus === 'rejected');
  }, [sharedWatchlist]);

  // Personal risk limits checks
  const maxAllocPct = userProfile?.riskLimits?.maxAllocationPerTradePercent || 15;
  const maxOpenPosLimit = userProfile?.riskLimits?.maxOpenPositions || 5;
  const isPositionsExceeded = openPositions.length > maxOpenPosLimit;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Team Risk Monitor</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Advisory Surveillance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exposure concentration, liquidity thresholds, stale research audits, and risk limits
          </p>
        </div>

        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181e2b] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Configure Policies</span>
        </button>
      </div>

      {/* Advisory Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-amber-200">Non-Execution Warning System:</strong> Passing TradeSync risk checks does not make a memecoin safe. High volatility, honeypots, and sudden liquidity drains are inherent risks of the Solana meme ecosystem. Warnings are advisory calculations to guide team consensus.
        </div>
      </div>

      {/* Primary Risk Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Paper Exposure</span>
          <div className="text-base font-bold font-mono text-white mt-1">
            ${totalCommitted.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">{openPositions.length} active positions</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Team Min Liquidity Floor</span>
          <div className="text-base font-bold font-mono text-indigo-400 mt-1">
            ${minLiqRequired.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Shared policy rule</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Sub-threshold LP Tokens</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              liquidityRiskTokens.length > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {liquidityRiskTokens.length} Tokens
          </div>
          <span className="text-[10px] text-slate-500">Under ${minLiqRequired / 1000}k liquidity</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-400">Stale Due Diligence</span>
          <div
            className={`text-base font-bold font-mono mt-1 ${
              staleResearchList.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {staleResearchList.length} Reports
          </div>
          <span className="text-[10px] text-slate-500">Unreviewed for &gt;7 days</span>
        </div>
      </div>

      {/* Concentration Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Concentration Pie */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <span>Exposure by Token</span>
              </h3>
              <p className="text-[11px] text-slate-400">Concentration across open paper positions</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{openPositions.length} Positions</span>
          </div>

          <div className="h-64 w-full mt-4">
            {tokenConcentrationData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No open positions to calculate concentration.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090b0e',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`$${val}`, 'Committed Value']}
                  />
                  <Pie
                    data={tokenConcentrationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {tokenConcentrationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-2 text-xs font-mono">
            {tokenConcentrationData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#090b0e] border border-slate-800">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                <span className="text-slate-300">${d.name}:</span>
                <span className="text-white font-bold">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Exposure Bar Chart */}
        <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Exposure by Strategy Framework</span>
              </h3>
              <p className="text-[11px] text-slate-400">Capital distribution by trading thesis</p>
            </div>
            <span className="text-[11px] font-mono text-indigo-400">Live Breakdown</span>
          </div>

          <div className="h-64 w-full mt-4">
            {strategyExposureData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No active strategy exposure.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyExposureData} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090b0e',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`$${val}`, 'Committed Value']}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Surveillance & Alert Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Extreme Risk & Flagged Tokens */}
        <div className="p-4 rounded-2xl bg-[#12161f] border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-bold text-white">Extreme Risk Tokens ({extremeRiskTokens.length})</h4>
            </div>
          </div>

          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto text-xs">
            {extremeRiskTokens.length === 0 ? (
              <p className="text-slate-500 text-[11px] italic py-4 text-center">
                No tokens flagged as extreme risk.
              </p>
            ) : (
              extremeRiskTokens.map((t) => (
                <div key={t.id} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-white">${t.symbol}</span>
                    <span className="text-[10px] uppercase text-rose-300 font-bold">{t.riskStatus}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">{t.monitoringReason}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{t.mintAddress.slice(0, 10)}...</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Liquidity Risk Alerts */}
        <div className="p-4 rounded-2xl bg-[#12161f] border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">Thin Liquidity (&lt;${minLiqRequired / 1000}k)</h4>
            </div>
          </div>

          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto text-xs">
            {liquidityRiskTokens.length === 0 ? (
              <p className="text-slate-500 text-[11px] italic py-4 text-center">
                All tracked tokens satisfy minimum liquidity criteria.
              </p>
            ) : (
              liquidityRiskTokens.map((t) => (
                <div key={t.id} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-white">${t.symbol}</span>
                    <span className="text-[10px] text-amber-300 font-bold">
                      ${t.liquidity?.toLocaleString()} LP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{t.name}</p>
                  <span className="text-[10px] text-amber-400/90 block mt-0.5">
                    Deficit: ${((minLiqRequired - (t.liquidity || 0))).toLocaleString()} below floor
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stale Research Audits */}
        <div className="p-4 rounded-2xl bg-[#12161f] border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white">Stale Research (&gt;7 Days)</h4>
            </div>
          </div>

          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto text-xs">
            {staleResearchList.length === 0 ? (
              <p className="text-slate-500 text-[11px] italic py-4 text-center">
                All token research reports are freshly updated.
              </p>
            ) : (
              staleResearchList.map((r) => (
                <div key={r.id} className="p-2.5 rounded-xl bg-[#090b0e] border border-slate-800">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-white">${r.tokenSymbol}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-1">{r.title}</p>
                  <span className="text-[10px] text-indigo-400 block mt-0.5">
                    Lead: {r.researcherName}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
