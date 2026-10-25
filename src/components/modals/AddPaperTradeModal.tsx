import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Plus, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTeamData } from '../../context/TeamDataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { TradeDirection, TradeStatus } from '../../types/index.ts';
import { calculateTradePnl } from '../../utils/calculations.ts';

interface AddPaperTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTokenMint?: string;
  defaultSymbol?: string;
}

export const AddPaperTradeModal: React.FC<AddPaperTradeModalProps> = ({
  isOpen,
  onClose,
  defaultTokenMint,
  defaultSymbol,
}) => {
  const { createPaperTrade, sharedWatchlist, activeStartingBalance } = useTeamData();
  const { userProfile } = useAuth();

  const [direction, setDirection] = useState<TradeDirection>('long');
  const [selectedMint, setSelectedMint] = useState<string>(defaultTokenMint || '');
  const [customMint, setCustomMint] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState(defaultSymbol || '');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [estimatedFees, setEstimatedFees] = useState<string>('0.005'); // in SOL / units
  const [estimatedSlippage, setEstimatedSlippage] = useState<string>('1.0'); // 1%
  const [strategy, setStrategy] = useState('Bonding Curve Breakout');
  const [entryRationale, setEntryRationale] = useState('');
  const [status, setStatus] = useState<TradeStatus>('open');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Selected token handling
  const handleSelectToken = (mint: string) => {
    setSelectedMint(mint);
    if (mint && mint !== 'custom') {
      const tok = sharedWatchlist.find((t) => t.mintAddress === mint);
      if (tok) {
        setTokenSymbol(tok.symbol);
        if (tok.price) setEntryPrice(String(tok.price));
      }
    }
  };

  // Calculations preview
  const numEntryPrice = parseFloat(entryPrice) || 0;
  const numQuantity = parseFloat(quantity) || 0;
  const numFees = parseFloat(estimatedFees) || 0;
  const numSlippage = parseFloat(estimatedSlippage) || 0;
  const costBasis = numEntryPrice * numQuantity;

  // Check personal risk limits
  const maxAllocPct = userProfile?.riskLimits?.maxAllocationPerTradePercent || 15;
  const isOverAllocated = activeStartingBalance > 0 && (costBasis / activeStartingBalance) * 100 > maxAllocPct;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalMint = selectedMint;
    if (selectedMint === 'custom' || !selectedMint) {
      if (!customMint.trim() || !tokenSymbol.trim()) {
        setErrorMsg('Please specify Token Mint and Symbol.');
        return;
      }
      finalMint = customMint.trim();
    }

    if (numEntryPrice <= 0 || numQuantity <= 0) {
      setErrorMsg('Entry price and quantity must be greater than zero.');
      return;
    }

    if (!entryRationale.trim()) {
      setErrorMsg('Please document your trade entry rationale.');
      return;
    }

    setLoading(true);
    try {
      await createPaperTrade({
        tokenMint: finalMint,
        tokenSymbol: tokenSymbol.trim().toUpperCase(),
        direction,
        entryPrice: numEntryPrice,
        quantity: numQuantity,
        entryTimestamp: new Date().toISOString(),
        estimatedFees: numFees,
        estimatedSlippage: numSlippage,
        status,
        strategy: strategy.trim(),
        entryRationale: entryRationale.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record paper trade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl bg-[#12161f] border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                direction === 'long'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              }`}
            >
              {direction === 'long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Paper Trade</h3>
              <p className="text-xs text-slate-400">Isolated member ledger with slippage and fee accounting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Direction Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#090b0e] border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setDirection('long')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                direction === 'long'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>LONG / BUY</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('short')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                direction === 'short'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>SHORT / SELL</span>
            </button>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select Token</label>
            <select
              value={selectedMint}
              onChange={(e) => handleSelectToken(e.target.value)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">-- Choose from Team Watchlist or Enter Custom --</option>
              {sharedWatchlist.map((t) => (
                <option key={t.mintAddress} value={t.mintAddress}>
                  ${t.symbol} — {t.name} ({t.category === 'new_launch' ? 'New Launch' : 'Established'})
                </option>
              ))}
              <option value="custom">+ Trade Different Token (Enter Mint)</option>
            </select>

            {(selectedMint === 'custom' || !selectedMint) && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="text"
                  value={customMint}
                  onChange={(e) => setCustomMint(e.target.value)}
                  placeholder="Solana Mint Address"
                  className="bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200"
                />
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  placeholder="Symbol (e.g. SOLCAT)"
                  className="bg-[#090b0e] border border-slate-700 rounded px-2.5 py-1.5 font-mono uppercase text-slate-200"
                />
              </div>
            )}
          </div>

          {/* Entry Price & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Entry Price <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="e.g. 0.00125"
                className="w-full bg-[#090b0e] border border-slate-700 font-mono text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Quantity (Tokens) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full bg-[#090b0e] border border-slate-700 font-mono text-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Fees & Slippage Accounting */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#090b0e]/70 border border-slate-800 rounded-xl">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Est. DEX Priority Fee</label>
              <input
                type="number"
                step="any"
                value={estimatedFees}
                onChange={(e) => setEstimatedFees(e.target.value)}
                placeholder="0.005"
                className="w-full bg-[#12161f] border border-slate-700 font-mono text-slate-200 rounded px-2.5 py-1.5"
              />
              <span className="text-[10px] text-slate-500">DEX + priority gas</span>
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Est. Slippage (%)</label>
              <input
                type="number"
                step="any"
                value={estimatedSlippage}
                onChange={(e) => setEstimatedSlippage(e.target.value)}
                placeholder="1.0"
                className="w-full bg-[#12161f] border border-slate-700 font-mono text-slate-200 rounded px-2.5 py-1.5"
              />
              <span className="text-[10px] text-slate-500">Price impact offset</span>
            </div>
          </div>

          {/* Cost Basis & Risk Alert */}
          {costBasis > 0 && (
            <div className="p-3 bg-[#12161f] border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Simulated Cost Basis:</span>
                <span className="font-mono text-white font-semibold">${costBasis.toFixed(2)}</span>
              </div>
              {isOverAllocated && (
                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Warning: Allocation exceeds your configured personal risk ceiling of {maxAllocPct}% per trade.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Strategy Label */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Strategy Framework</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-[#090b0e] border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
            >
              <option value="Bonding Curve Breakout">Bonding Curve Breakout</option>
              <option value="Whale Copy / Smart Money Tracking">Whale Copy / Smart Money Tracking</option>
              <option value="Volume Surge Momentum">Volume Surge Momentum</option>
              <option value="DCA Support Reversal">DCA Support Reversal</option>
              <option value="Community Takeover (CTO) Recovery">Community Takeover (CTO) Recovery</option>
              <option value="Sniper Cluster Fade (Short)">Sniper Cluster Fade (Short)</option>
            </select>
          </div>

          {/* Entry Rationale */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Entry Rationale <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={entryRationale}
              onChange={(e) => setEntryRationale(e.target.value)}
              placeholder="Why take this trade now? (e.g. 4h support confirmation, Raydium LP burn Tx verified, whale accumulator observed)"
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
              disabled={loading}
              className={`px-5 py-2 rounded-lg text-white font-semibold flex items-center gap-1.5 shadow-lg ${
                direction === 'long'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
              } disabled:opacity-50`}
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Logging Trade...' : `Open Paper ${direction.toUpperCase()}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
