import { PaperTrade, MemberPerformanceStats, TeamPerformanceStats, TeamMember } from '../types/index.ts';

export function calculateTradePnl(trade: Partial<PaperTrade>, currentMarketPrice?: number | null): {
  grossPnl: number;
  netPnl: number;
  returnPct: number;
} {
  const direction = trade.direction || 'long';
  const entryPrice = trade.entryPrice || 0;
  const quantity = trade.quantity || 0;
  const fees = trade.estimatedFees || 0;
  const slippagePct = trade.estimatedSlippage || 0;

  if (entryPrice <= 0 || quantity <= 0) {
    return { grossPnl: 0, netPnl: 0, returnPct: 0 };
  }

  const effectiveExitPrice =
    trade.status === 'closed'
      ? trade.exitPrice ?? entryPrice
      : currentMarketPrice ?? trade.exitPrice ?? entryPrice;

  const costBasis = entryPrice * quantity;
  const slippageCost = costBasis * (slippagePct / 100);

  let grossPnl = 0;
  if (direction === 'long') {
    grossPnl = (effectiveExitPrice - entryPrice) * quantity;
  } else {
    grossPnl = (entryPrice - effectiveExitPrice) * quantity;
  }

  const netPnl = grossPnl - fees - slippageCost;
  const returnPct = costBasis > 0 ? (netPnl / costBasis) * 100 : 0;

  return { grossPnl, netPnl, returnPct };
}

export function computeMemberStats(
  member: { userId: string; displayName: string; email: string; avatarUrl?: string; role: any; startingBalance: number },
  trades: PaperTrade[]
): MemberPerformanceStats {
  const userTrades = trades.filter((t) => t.userId === member.userId);
  const closedTrades = userTrades.filter((t) => t.status === 'closed');
  const openTrades = userTrades.filter((t) => t.status === 'open');

  let realizedPnl = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalWinAmount = 0;
  let totalLossAmount = 0;

  // Track equity curve for max drawdown
  let runningBalance = member.startingBalance;
  let peakBalance = member.startingBalance;
  let maxDrawdownPct = 0;

  // Sort closed trades chronologically by exitTimestamp or createdAt
  const sortedClosed = [...closedTrades].sort((a, b) => {
    const tA = new Date(a.exitTimestamp || a.createdAt).getTime();
    const tB = new Date(b.exitTimestamp || b.createdAt).getTime();
    return tA - tB;
  });

  sortedClosed.forEach((trade) => {
    const pnl = trade.realizedPnl ?? calculateTradePnl(trade).netPnl;
    realizedPnl += pnl;
    runningBalance += pnl;

    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
    } else if (peakBalance > 0) {
      const dd = ((peakBalance - runningBalance) / peakBalance) * 100;
      if (dd > maxDrawdownPct) {
        maxDrawdownPct = dd;
      }
    }

    if (pnl > 0) {
      winningTrades += 1;
      totalWinAmount += pnl;
    } else if (pnl < 0) {
      losingTrades += 1;
      totalLossAmount += Math.abs(pnl);
    }
  });

  let unrealizedPnl = 0;
  openTrades.forEach((trade) => {
    unrealizedPnl += trade.unrealizedPnl ?? calculateTradePnl(trade).netPnl;
  });

  const totalTradesCount = closedTrades.length;
  const winRate = totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0;
  const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0;
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99.9 : 1.0;
  const currentBalance = member.startingBalance + realizedPnl + unrealizedPnl;
  const netReturnPct = member.startingBalance > 0 ? ((currentBalance - member.startingBalance) / member.startingBalance) * 100 : 0;

  return {
    userId: member.userId,
    displayName: member.displayName,
    email: member.email,
    avatarUrl: member.avatarUrl,
    role: member.role,
    startingBalance: member.startingBalance,
    currentBalance,
    realizedPnl,
    unrealizedPnl,
    totalPnl: realizedPnl + unrealizedPnl,
    netReturnPct,
    totalTrades: userTrades.length,
    closedTrades: totalTradesCount,
    openTrades: openTrades.length,
    winningTrades,
    losingTrades,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    maxDrawdownPct,
    trades: userTrades,
  };
}

export function computeTeamStats(
  members: TeamMember[],
  memberBalances: Record<string, number>,
  trades: PaperTrade[]
): TeamPerformanceStats {
  const memberStatsList: MemberPerformanceStats[] = members.map((m) => {
    const startBal = memberBalances[m.userId] ?? 100; // default 100 SOL
    return computeMemberStats(
      {
        userId: m.userId,
        displayName: m.displayName,
        email: m.email,
        avatarUrl: m.avatarUrl,
        role: m.role,
        startingBalance: startBal,
      },
      trades
    );
  });

  let startingCapital = 0;
  let currentEquity = 0;
  let realizedPnl = 0;
  let unrealizedPnl = 0;
  let totalClosedTrades = 0;
  let totalOpenTrades = 0;
  let totalWinningTrades = 0;
  let totalLosingTrades = 0;

  memberStatsList.forEach((stat) => {
    startingCapital += stat.startingBalance;
    currentEquity += stat.currentBalance;
    realizedPnl += stat.realizedPnl;
    unrealizedPnl += stat.unrealizedPnl;
    totalClosedTrades += stat.closedTrades;
    totalOpenTrades += stat.openTrades;
    totalWinningTrades += stat.winningTrades;
    totalLosingTrades += stat.losingTrades;
  });

  const winRate = totalClosedTrades > 0 ? (totalWinningTrades / totalClosedTrades) * 100 : 0;
  const netReturnPct = startingCapital > 0 ? ((currentEquity - startingCapital) / startingCapital) * 100 : 0;

  return {
    startingCapital,
    currentEquity,
    realizedPnl,
    unrealizedPnl,
    netReturnPct,
    totalTrades: totalClosedTrades + totalOpenTrades,
    closedTrades: totalClosedTrades,
    openTrades: totalOpenTrades,
    winRate,
    winningTrades: totalWinningTrades,
    losingTrades: totalLosingTrades,
    members: memberStatsList,
  };
}

export function generateEquityPoints(trades: PaperTrade[], startingBalance: number) {
  // Sort closed trades chronologically
  const closed = [...trades]
    .filter((t) => t.status === 'closed')
    .sort((a, b) => new Date(a.exitTimestamp || a.createdAt).getTime() - new Date(b.exitTimestamp || b.createdAt).getTime());

  let bal = startingBalance;
  const points: { date: string; balance: number; pnl: number; token: string }[] = [
    {
      date: 'Start',
      balance: startingBalance,
      pnl: 0,
      token: 'Baseline',
    },
  ];

  closed.forEach((trade) => {
    const pnl = trade.realizedPnl ?? calculateTradePnl(trade).netPnl;
    bal += pnl;
    const dateStr = new Date(trade.exitTimestamp || trade.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    points.push({
      date: dateStr,
      balance: parseFloat(bal.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      token: trade.tokenSymbol,
    });
  });

  return points;
}
