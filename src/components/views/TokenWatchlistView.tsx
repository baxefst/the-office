import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Star,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Microscope,
  BookOpen,
  Trash2,
  Edit2,
  Info,
} from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { SharedWatchlistToken, TokenCategory, ResearchStatus, RiskStatus } from '../../types/index.ts';

interface TokenWatchlistViewProps {
  onOpenAddTokenModal: () => void;
  onSelectTokenForTrade: (mint: string, symbol: string) => void;
  onSelectTokenForResearch: (mint: string) => void;
}

export const TokenWatchlistView: React.FC<TokenWatchlistViewProps> = ({
  onOpenAddTokenModal,
  onSelectTokenForTrade,
  onSelectTokenForResearch,
}) => {
  const {
    sharedWatchlist,
    deleteSharedWatchlistToken,
    togglePersonalWatchlistToken,
    isTokenInPersonalWatchlist,
    updateSharedWatchlistToken,
  } = useTeamData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TokenCategory>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskStatus>('all');
  const [researchFilter, setResearchFilter] = useState<'all' | ResearchStatus>('all');
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  // Filtered Tokens
  const filteredTokens = useMemo(() => {
    return sharedWatchlist.filter((tok) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        tok.symbol.toLowerCase().includes(q) ||
        tok.name.toLowerCase().includes(q) ||
        tok.mintAddress.toLowerCase().includes(q) ||
        (tok.monitoringReason && tok.monitoringReason.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || tok.category === categoryFilter;
      const matchesRisk = riskFilter === 'all' || tok.riskStatus === riskFilter;
      const matchesResearch = researchFilter === 'all' || tok.researchStatus === researchFilter;

      return matchesSearch && matchesCat && matchesRisk && matchesResearch;
    });
  }, [sharedWatchlist, searchQuery, categoryFilter, riskFilter, researchFilter]);

  const handleCopy = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Token Watchlist</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {sharedWatchlist.length} Monitored
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Collaborative tracking of new launches and established Solana memecoins
          </p>
        </div>

        <button
          onClick={onOpenAddTokenModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Token to Watchlist</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 rounded-xl bg-[#12161f] border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol, mint, name..."
              className="w-full bg-[#090b0e] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="new_launch">New Launch</option>
              <option value="established">Established</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="extreme">Extreme Risk</option>
            </select>
          </div>

          {/* Research Status Filter */}
          <div>
            <select
              value={researchFilter}
              onChange={(e) => setResearchFilter(e.target.value as any)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Research Statuses</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved for Paper Testing</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Watchlist Table / Grid */}
      <div className="rounded-2xl bg-[#12161f] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredTokens.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p className="text-slate-300 font-medium">No tokens matched your filters.</p>
              <p className="text-slate-500 mt-1">Try resetting search parameters or add a new token.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#090b0e]/70 text-slate-400 text-[11px] font-mono uppercase">
                  <th className="py-3 px-4 w-10">★</th>
                  <th className="py-3 px-4">Token & Mint</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / 24h</th>
                  <th className="py-3 px-4">Liquidity / MC</th>
                  <th className="py-3 px-4">Research Status</th>
                  <th className="py-3 px-4">Risk Rating</th>
                  <th className="py-3 px-4">Monitoring Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTokens.map((tok) => {
                  const isStarred = isTokenInPersonalWatchlist(tok.mintAddress);
                  return (
                    <tr key={tok.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Personal Watchlist Star */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            togglePersonalWatchlistToken({
                              mintAddress: tok.mintAddress,
                              symbol: tok.symbol,
                              name: tok.name,
                            })
                          }
                          className="text-slate-500 hover:text-amber-400 transition-colors"
                          title={isStarred ? 'Remove from Personal Watchlist' : 'Add to Personal Watchlist'}
                        >
                          <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Token & Mint */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">${tok.symbol}</span>
                          <span className="text-[11px] font-sans text-slate-400">({tok.name})</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                          <span>
                            {tok.mintAddress.slice(0, 6)}...{tok.mintAddress.slice(-4)}
                          </span>
                          <button
                            onClick={() => handleCopy(tok.mintAddress)}
                            title="Copy Solana mint address"
                            className="text-slate-500 hover:text-slate-300"
                          >
                            {copiedMint === tok.mintAddress ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`https://solscan.io/token/${tok.mintAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-indigo-400"
                            title="View on Solscan Explorer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                            tok.category === 'new_launch'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {tok.category === 'new_launch' ? 'New Launch' : 'Established'}
                        </span>
                      </td>

                      {/* Price & 24h Change */}
                      <td className="py-3 px-4">
                        {tok.price !== null && tok.price !== undefined ? (
                          <div>
                            <div className="text-slate-200 font-bold">${tok.price}</div>
                            {tok.change24h !== null && tok.change24h !== undefined ? (
                              <span
                                className={`text-[10px] font-medium flex items-center gap-0.5 ${
                                  tok.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {tok.change24h >= 0 ? '+' : ''}
                                {tok.change24h}%
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px] font-sans">Data unavailable</span>
                        )}
                      </td>

                      {/* Liquidity / Market Cap */}
                      <td className="py-3 px-4">
                        {tok.liquidity ? (
                          <div className="text-slate-300">
                            ${tok.liquidity.toLocaleString()} <span className="text-[10px] text-slate-500">LP</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px] font-sans block">Data unavailable</span>
                        )}
                        {tok.marketCap ? (
                          <div className="text-[10px] text-slate-400">
                            MC: ${tok.marketCap.toLocaleString()}
                          </div>
                        ) : null}
                      </td>

                      {/* Research Status */}
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase inline-block ${
                            tok.researchStatus === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : tok.researchStatus === 'rejected'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : tok.researchStatus === 'in_review'
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {tok.researchStatus.replace('_', ' ')}
                        </span>
                        {tok.assignedResearcherName && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Lead: {tok.assignedResearcherName}
                          </span>
                        )}
                      </td>

                      {/* Risk Rating */}
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold inline-block ${
                            tok.riskStatus === 'low'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tok.riskStatus === 'medium'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {tok.riskStatus}
                        </span>
                      </td>

                      {/* Monitoring Reason */}
                      <td className="py-3 px-4 font-sans max-w-[200px]">
                        <p className="text-[11px] text-slate-300 truncate" title={tok.monitoringReason}>
                          {tok.monitoringReason}
                        </p>
                        {tok.sharedNotes && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5" title={tok.sharedNotes}>
                            Note: {tok.sharedNotes}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectTokenForTrade(tok.mintAddress, tok.symbol)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                            title="Open Paper Trade"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectTokenForResearch(tok.mintAddress)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors"
                            title="Submit Research"
                          >
                            <Microscope className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSharedWatchlistToken(tok.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Remove from shared watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
