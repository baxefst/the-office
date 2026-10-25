export type MemberRole = 'owner' | 'member';
export type MemberStatus = 'approved' | 'pending' | 'invited';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  teamId?: string;
  role?: MemberRole;
  startingBalance: number; // in SOL (or USD benchmark)
  riskLimits: {
    maxAllocationPerTradePercent: number; // e.g. 15%
    maxDailyLossPercent: number; // e.g. 20%
    stopLossDefaultPercent: number; // e.g. 25%
    maxOpenPositions: number; // e.g. 5
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamSettings {
  minLiquidityUsd: number; // e.g. $50,000
  maxPositionAllocationPercent: number; // e.g. 20%
  requireFreezeRevoked: boolean;
  maxTeamOpenPositions: number; // e.g. 10
  riskAlertThresholdDrawdownPercent: number; // e.g. 15%
}

export interface Team {
  id: string;
  name: string;
  ownerUid: string;
  ownerEmail: string;
  maxMembers: number; // Exactly 3
  inviteCode: string;
  settings: TeamSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  userId: string;
  teamId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
}

export type TokenCategory = 'new_launch' | 'established';
export type ResearchStatus = 'unreviewed' | 'in_review' | 'approved' | 'rejected';
export type RiskStatus = 'low' | 'medium' | 'high' | 'extreme';

export interface SharedWatchlistToken {
  id: string;
  teamId: string;
  name: string;
  symbol: string;
  mintAddress: string;
  category: TokenCategory;
  discoveryTimestamp: string;
  marketCap?: number | null;
  liquidity?: number | null;
  volume24h?: number | null;
  price?: number | null;
  change24h?: number | null;
  dataSource: string;
  lastUpdated: string;
  researchStatus: ResearchStatus;
  riskStatus: RiskStatus;
  addedByUid: string;
  addedByName: string;
  assignedResearcherUid?: string;
  assignedResearcherName?: string;
  sharedNotes?: string;
  monitoringReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalWatchlistToken {
  id: string;
  userId: string;
  mintAddress: string;
  symbol: string;
  name: string;
  personalNotes?: string;
  addedAt: string;
}

export interface ReviewerComment {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface TokenResearch {
  id: string;
  teamId: string;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  title: string;
  thesis: string;
  bullishFactors: string[];
  bearishFactors: string[];
  liquidityObservations: string;
  holderDistributionObservations: string;
  devWalletObservations: string;
  manipulationIndicators: string;
  txSignatures: string[];
  researcherUid: string;
  researcherName: string;
  researchStatus: ResearchStatus;
  reviewerComments: ReviewerComment[];
  createdAt: string;
  updatedAt: string;
  lastModifiedByUid?: string;
}

export type WalletCategory = 'deployer' | 'trader' | 'whale' | 'related' | 'unknown';

export interface ObservedWalletActivity {
  id: string;
  timestamp: string;
  action: 'buy' | 'sell' | 'deploy' | 'transfer';
  tokenSymbol: string;
  amountSol?: number;
  details: string;
  txHash?: string;
}

export interface MonitoredWallet {
  id: string;
  teamId: string;
  address: string;
  label: string;
  category: WalletCategory;
  reason: string;
  associatedTokens: string[];
  txSignatures: string[];
  observedActivity: ObservedWalletActivity[];
  notes: string;
  riskFlags: string[];
  addedByUid: string;
  addedByName: string;
  lastReviewedTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';

export interface PaperTrade {
  id: string;
  teamId: string;
  userId: string;
  userDisplayName: string;
  tokenMint: string;
  tokenSymbol: string;
  direction: TradeDirection;
  entryPrice: number; // in SOL or USD benchmark
  exitPrice?: number | null;
  quantity: number; // units of tokens
  entryTimestamp: string;
  exitTimestamp?: string | null;
  estimatedFees: number; // e.g. 0.005 SOL
  estimatedSlippage: number; // e.g. 1.0 (for 1%)
  status: TradeStatus;
  realizedPnl?: number | null;
  unrealizedPnl?: number | null;
  strategy: string;
  entryRationale: string;
  exitRationale?: string;
  lessonsLearned?: string;
  isPrivateNotes?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'member_joined'
  | 'token_added'
  | 'research_created'
  | 'research_updated'
  | 'wallet_added'
  | 'trade_opened'
  | 'trade_closed'
  | 'research_status_changed'
  | 'settings_updated';

export interface TeamActivity {
  id: string;
  teamId: string;
  actorUid: string;
  actorDisplayName: string;
  type: ActivityType;
  recordRef?: string;
  recordType?: string;
  summary: string;
  createdAt: string;
}

export interface MemberPerformanceStats {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: MemberRole;
  startingBalance: number;
  currentBalance: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  netReturnPct: number;
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdownPct: number;
  trades: PaperTrade[];
}

export interface TeamPerformanceStats {
  startingCapital: number;
  currentEquity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  netReturnPct: number;
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winRate: number;
  winningTrades: number;
  losingTrades: number;
  members: MemberPerformanceStats[];
}
