import React, { useState, useMemo } from 'react';
import {
  Microscope,
  Plus,
  Search,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { TokenResearch, ResearchStatus } from '../../types/index.ts';

interface ResearchLabViewProps {
  onOpenAddResearchModal: () => void;
  onOpenTradeModalForToken?: (mint: string, symbol: string) => void;
}

export const ResearchLabView: React.FC<ResearchLabViewProps> = ({
  onOpenAddResearchModal,
  onOpenTradeModalForToken,
}) => {
  const {
    tokenResearch,
    updateTokenResearch,
    addResearchReviewComment,
  } = useTeamData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ResearchStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(tokenResearch[0]?.id || null);
  const [newCommentMap, setNewCommentMap] = useState<Record<string, string>>({});

  const filteredReports = useMemo(() => {
    return tokenResearch.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        r.tokenSymbol.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.thesis.toLowerCase().includes(q) ||
        r.researcherName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || r.researchStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tokenResearch, searchQuery, statusFilter]);

  const handlePostComment = async (researchId: string) => {
    const text = newCommentMap[researchId];
    if (!text || !text.trim()) return;
    await addResearchReviewComment(researchId, text.trim());
    setNewCommentMap((prev) => ({ ...prev, [researchId]: '' }));
  };

  const handleStatusChange = async (researchId: string, newStatus: ResearchStatus) => {
    await updateTokenResearch(researchId, { researchStatus: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#12161f] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Research Lab</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tokenResearch.length} Reports
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Collaborative due diligence, on-chain forensics & peer reviews for Solana memecoins
          </p>
        </div>

        <button
          onClick={onOpenAddResearchModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Report</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
        <div className="leading-relaxed">
          <strong className="text-amber-200">Critical Due Diligence Rule:</strong> A high research score or bullish thesis is not proof that a token is safe or profitable. On-chain metrics can change rapidly. Always verify LP locks and revoke authorities directly before paper testing.
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#12161f] border border-slate-800 rounded-xl text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research reports by token, thesis..."
            className="w-full bg-[#090b0e] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 text-[11px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#090b0e] border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved for Paper Testing</option>
            <option value="in_review">In Review</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Research Reports Accordion / Cards List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#12161f] border border-slate-800 text-xs text-slate-400">
            <Microscope className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-medium">No research reports found matching query.</p>
            <p className="text-slate-500 mt-1">Submit due diligence findings to build team intelligence.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div
                key={report.id}
                className="rounded-2xl bg-[#12161f] border border-slate-800 overflow-hidden transition-all shadow-sm"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm flex-shrink-0">
                      ${report.tokenSymbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight">{report.title}</h3>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-semibold ${
                            report.researchStatus === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : report.researchStatus === 'rejected'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {report.researchStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                        "{report.thesis}"
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 font-mono">
                        <span>Lead: <strong className="text-slate-300">{report.researcherName}</strong></span>
                        <span>·</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span className="text-slate-400">{report.reviewerComments?.length || 0} peer comments</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {onOpenTradeModalForToken && report.researchStatus === 'approved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTradeModalForToken(report.tokenMint, report.tokenSymbol);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                      >
                        Paper Trade
                      </button>
                    )}
                    <button className="p-1 text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 bg-[#0c0f14]/40 space-y-5 text-xs">
                    {/* Mint & Explorer info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#090b0e] border border-slate-800 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Mint Address:</span>
                        <span className="text-slate-200">{report.tokenMint}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`https://solscan.io/token/${report.tokenMint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <span>Solscan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://dexscreener.com/solana/${report.tokenMint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <span>DexScreener</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Core Thesis Card */}
                    <div className="p-4 rounded-xl bg-[#090b0e] border border-slate-800">
                      <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                        Research Thesis
                      </h4>
                      <p className="text-slate-200 leading-relaxed text-xs">{report.thesis}</p>
                    </div>

                    {/* Bullish & Bearish Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bullish */}
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <span>▲ Bullish Observations & Catalysts</span>
                        </h4>
                        <ul className="space-y-1.5 text-slate-300">
                          {report.bullishFactors?.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Bearish */}
                      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                        <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                          <span>▼ Bearish Risks & Vulnerabilities</span>
                        </h4>
                        <ul className="space-y-1.5 text-slate-300">
                          {report.bearishFactors?.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-rose-400 mt-0.5">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Deep Forensics 4-Card Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#090b0e] border border-slate-800">
                        <h5 className="font-semibold text-slate-300 mb-1">Liquidity & Pool Health</h5>
                        <p className="text-slate-400 leading-snug">
                          {report.liquidityObservations || 'No specific observations noted.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#090b0e] border border-slate-800">
                        <h5 className="font-semibold text-slate-300 mb-1">Holder Distribution</h5>
                        <p className="text-slate-400 leading-snug">
                          {report.holderDistributionObservations || 'No specific observations noted.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#090b0e] border border-slate-800">
                        <h5 className="font-semibold text-slate-300 mb-1">Developer Wallet Forensics</h5>
                        <p className="text-slate-400 leading-snug">
                          {report.devWalletObservations || 'No specific observations noted.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#090b0e] border border-slate-800">
                        <h5 className="font-semibold text-slate-300 mb-1">Manipulation & Bot Indicators</h5>
                        <p className="text-slate-400 leading-snug">
                          {report.manipulationIndicators || 'No specific observations noted.'}
                        </p>
                      </div>
                    </div>

                    {/* Explorer Signatures */}
                    {report.txSignatures && report.txSignatures.length > 0 && (
                      <div>
                        <h5 className="text-[11px] font-mono text-slate-400 mb-1">
                          Verified Transaction Signatures:
                        </h5>
                        <div className="space-y-1 font-mono text-[11px]">
                          {report.txSignatures.map((sig, i) => (
                            <div key={i} className="flex items-center gap-2 text-indigo-400">
                              <span>{sig}</span>
                              <a
                                href={`https://solscan.io/tx/${sig}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-slate-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Management Bar */}
                    <div className="p-3 rounded-xl bg-[#12161f] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs font-medium">Update Status:</span>
                        <button
                          onClick={() => handleStatusChange(report.id, 'approved')}
                          className="px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs"
                        >
                          Approve for Testing
                        </button>
                        <button
                          onClick={() => handleStatusChange(report.id, 'in_review')}
                          className="px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs"
                        >
                          Mark In Review
                        </button>
                        <button
                          onClick={() => handleStatusChange(report.id, 'rejected')}
                          className="px-2.5 py-1 rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs"
                        >
                          Reject
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-500">
                        Updated {new Date(report.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Peer Reviewer Comments Feed */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Team Peer Reviews & Critiques ({report.reviewerComments?.length || 0})</span>
                      </h4>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {report.reviewerComments && report.reviewerComments.length > 0 ? (
                          report.reviewerComments.map((c) => (
                            <div key={c.id} className="p-2.5 rounded-lg bg-[#090b0e] border border-slate-800 text-xs">
                              <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                                <span className="font-bold text-indigo-300">{c.authorName}</span>
                                <span>{new Date(c.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-200 mt-1 leading-relaxed font-sans">{c.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 text-[11px] italic">No team comments posted yet.</p>
                        )}
                      </div>

                      {/* Post comment input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newCommentMap[report.id] || ''}
                          onChange={(e) =>
                            setNewCommentMap({ ...newCommentMap, [report.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePostComment(report.id);
                          }}
                          placeholder="Add team critique or feedback on this token..."
                          className="flex-1 bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handlePostComment(report.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Post</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
