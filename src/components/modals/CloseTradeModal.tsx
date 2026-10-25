import React, { useState } from 'react';
import { X, CheckCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { PaperTrade } from '../../types/index.ts';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { calculateTradePnl } from '../../utils/calculations.ts';

interface CloseTradeModalProps {
  trade: PaperTrade | null;
  onClose: () => void;
}

export const CloseTradeModal: React.FC<CloseTradeModalProps> = ({ trade, onClose }) => {
  const { closePaperPosition } = useTeamData();

  const [exitPrice, setExitPrice] = useState<string>('');
  const [exitRationale, setExitRationale] = useState<string>('');
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!trade) return null;

  const numExit = parseFloat(exitPrice) || 0;
  const pnlPreview = numExit > 0 ? calculateTradePnl({ ...trade, exitPrice: numExit, status: 'closed' }) : null;

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numExit <= 0) {
      setErrorMsg('Please specify a positive exit price.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await closePaperPosition(trade.id, numExit, exitRationale.trim(), lessonsLearned.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to close position.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg bg-[#12161f] border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                trade.direction === 'long'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {trade.direction === 'long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Close Paper Position: ${trade.tokenSymbol}
              </h3>
              <p className="text-xs text-slate-400">
                {trade.direction.toUpperCase()} · {trade.quantity.toLocaleString()} tokens @ {trade.entryPrice}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleClose} className="mt-4 space-y-4 text-xs">
          {/* Exit Price */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Observed Exit Price <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="e.g. 0.00185"
              className="w-full bg-[#090b0e] border border-slate-700 font-mono text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Real-time PnL Preview Card */}
          {pnlPreview && (
            <div
              className={`p-3.5 rounded-xl border ${
                pnlPreview.netPnl >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-300">Simulated Net Realized P&L:</span>
                <span className="text-sm font-bold font-mono">
                  {pnlPreview.netPnl >= 0 ? '+' : ''}
                  {pnlPreview.netPnl.toFixed(2)} ({pnlPreview.returnPct >= 0 ? '+' : ''}
                  {pnlPreview.returnPct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60">
                <span>Gross: {pnlPreview.grossPnl.toFixed(2)}</span>
                <span>
                  Fees & Slippage deduction: -
                  {(trade.estimatedFees + (trade.entryPrice * trade.quantity * (trade.estimatedSlippage / 100))).toFixed(3)}
                </span>
              </div>
            </div>
          )}

          {/* Exit Rationale */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Exit Rationale</label>
            <textarea
              rows={2}
              value={exitRationale}
              onChange={(e) => setExitRationale(e.target.value)}
              placeholder="e.g. Hit take-profit target 1, or support broke down with rising sell volume"
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Journal & Lessons Learned</label>
            <textarea
              rows={2}
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="Key takeaway: Did the execution match the thesis? Was slippage higher than anticipated?"
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || numExit <= 0}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Closing...' : 'Confirm & Close Position'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
