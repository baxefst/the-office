import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';
import { useAuth } from './AuthContext.tsx';
import {
  SharedWatchlistToken,
  PersonalWatchlistToken,
  TokenResearch,
  MonitoredWallet,
  PaperTrade,
  TeamActivity,
  TeamMember,
  TeamSettings,
} from '../types/index.ts';
import {
  DEMO_MEMBERS,
  DEMO_WATCHLIST,
  DEMO_RESEARCH,
  DEMO_WALLETS,
  DEMO_TRADES,
  DEMO_ACTIVITIES,
  DEMO_USER_PROFILES,
} from '../data/demoData.ts';
import { calculateTradePnl } from '../utils/calculations.ts';

interface TeamDataContextType {
  members: TeamMember[];
  sharedWatchlist: SharedWatchlistToken[];
  personalWatchlist: PersonalWatchlistToken[];
  tokenResearch: TokenResearch[];
  monitoredWallets: MonitoredWallet[];
  paperTrades: PaperTrade[];
  teamActivity: TeamActivity[];
  loadingData: boolean;
  activeStartingBalance: number;
  activeMemberProfiles: Record<string, { startingBalance: number }>;

  // Watchlist Actions
  addSharedWatchlistToken: (
    token: Omit<SharedWatchlistToken, 'id' | 'teamId' | 'createdAt' | 'updatedAt' | 'addedByUid' | 'addedByName'>
  ) => Promise<{ success: boolean; message?: string }>;
  updateSharedWatchlistToken: (id: string, updates: Partial<SharedWatchlistToken>) => Promise<void>;
  deleteSharedWatchlistToken: (id: string) => Promise<void>;
  togglePersonalWatchlistToken: (token: { mintAddress: string; symbol: string; name: string }) => Promise<void>;
  isTokenInPersonalWatchlist: (mintAddress: string) => boolean;

  // Research Actions
  createTokenResearch: (
    research: Omit<TokenResearch, 'id' | 'teamId' | 'createdAt' | 'updatedAt' | 'researcherUid' | 'researcherName' | 'reviewerComments'>
  ) => Promise<void>;
  updateTokenResearch: (id: string, updates: Partial<TokenResearch>) => Promise<void>;
  addResearchReviewComment: (researchId: string, commentText: string) => Promise<void>;

  // Wallet Intelligence Actions
  addMonitoredWallet: (
    wallet: Omit<MonitoredWallet, 'id' | 'teamId' | 'createdAt' | 'updatedAt' | 'addedByUid' | 'addedByName' | 'observedActivity'>
  ) => Promise<void>;
  addWalletActivityRecord: (
    walletId: string,
    activity: { action: 'buy' | 'sell' | 'deploy' | 'transfer'; tokenSymbol: string; amountSol?: number; details: string; txHash?: string }
  ) => Promise<void>;
  deleteMonitoredWallet: (walletId: string) => Promise<void>;

  // Paper Trading Actions
  createPaperTrade: (
    trade: Omit<PaperTrade, 'id' | 'teamId' | 'userId' | 'userDisplayName' | 'createdAt' | 'updatedAt' | 'realizedPnl' | 'unrealizedPnl'>
  ) => Promise<void>;
  closePaperPosition: (tradeId: string, exitPrice: number, exitRationale?: string, lessonsLearned?: string) => Promise<void>;
  updatePaperTrade: (tradeId: string, updates: Partial<PaperTrade>) => Promise<void>;

  // Team Management & Settings
  updateTeamSettings: (newSettings: Partial<TeamSettings>) => Promise<void>;
  approveMember: (userId: string) => Promise<void>;
  seedDemoDataToFirestore: () => Promise<void>;
  exportTradesToCsv: (userOnly?: boolean) => void;
}

const TeamDataContext = createContext<TeamDataContextType | undefined>(undefined);

export const TeamDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, currentTeam, isDemoMode, activeDemoUserIndex } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sharedWatchlist, setSharedWatchlist] = useState<SharedWatchlistToken[]>([]);
  const [personalWatchlist, setPersonalWatchlist] = useState<PersonalWatchlistToken[]>([]);
  const [tokenResearch, setTokenResearch] = useState<TokenResearch[]>([]);
  const [monitoredWallets, setMonitoredWallets] = useState<MonitoredWallet[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (isDemoMode) {
      setMembers(DEMO_MEMBERS);
      setSharedWatchlist(DEMO_WATCHLIST);
      setTokenResearch(DEMO_RESEARCH);
      setMonitoredWallets(DEMO_WALLETS);
      setPaperTrades(DEMO_TRADES);
      setTeamActivity(DEMO_ACTIVITIES);
      setPersonalWatchlist([
        {
          id: 'pw-1',
          userId: DEMO_MEMBERS[activeDemoUserIndex]?.userId || 'demo-user-1',
          mintAddress: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
          symbol: 'POPCAT',
          name: 'Popcat',
          addedAt: '2025-01-15T10:00:00Z',
        },
      ]);
      setLoadingData(false);
      return;
    }

    if (!currentUser || !currentTeam) {
      setMembers([]);
      setSharedWatchlist([]);
      setPersonalWatchlist([]);
      setTokenResearch([]);
      setMonitoredWallets([]);
      setPaperTrades([]);
      setTeamActivity([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const teamId = currentTeam.id;

    // 1. Members
    const membersPath = `teams/${teamId}/members`;
    const unsubMembers = onSnapshot(
      collection(db, 'teams', teamId, 'members'),
      (snapshot) => {
        const memList = snapshot.docs.map((d) => d.data() as TeamMember);
        setMembers(memList);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, membersPath)
    );

    // 2. Shared Watchlist
    const watchPath = `teams/${teamId}/sharedWatchlist`;
    const unsubWatchlist = onSnapshot(
      collection(db, 'teams', teamId, 'sharedWatchlist'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as SharedWatchlistToken);
        setSharedWatchlist(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, watchPath)
    );

    // 3. Token Research
    const resPath = `teams/${teamId}/tokenResearch`;
    const unsubResearch = onSnapshot(
      collection(db, 'teams', teamId, 'tokenResearch'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as TokenResearch);
        setTokenResearch(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, resPath)
    );

    // 4. Monitored Wallets
    const walPath = `teams/${teamId}/monitoredWallets`;
    const unsubWallets = onSnapshot(
      collection(db, 'teams', teamId, 'monitoredWallets'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as MonitoredWallet);
        setMonitoredWallets(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, walPath)
    );

    // 5. Paper Trades
    const tradePath = `teams/${teamId}/paperTrades`;
    const unsubTrades = onSnapshot(
      collection(db, 'teams', teamId, 'paperTrades'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as PaperTrade);
        setPaperTrades(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, tradePath)
    );

    // 6. Team Activity
    const actPath = `teams/${teamId}/activity`;
    const unsubActivity = onSnapshot(
      query(collection(db, 'teams', teamId, 'activity'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as TeamActivity);
        setTeamActivity(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, actPath)
    );

    // 7. Personal Watchlist
    const pwPath = `personalWatchlists/${currentUser.uid}/tokens`;
    const unsubPersonal = onSnapshot(
      collection(db, 'personalWatchlists', currentUser.uid, 'tokens'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as PersonalWatchlistToken);
        setPersonalWatchlist(list);
        setLoadingData(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pwPath)
    );

    return () => {
      unsubMembers();
      unsubWatchlist();
      unsubResearch();
      unsubWallets();
      unsubTrades();
      unsubActivity();
      unsubPersonal();
    };
  }, [currentUser, currentTeam, isDemoMode, activeDemoUserIndex]);

  // Derived member starting balances
  const activeStartingBalance = isDemoMode
    ? DEMO_USER_PROFILES[DEMO_MEMBERS[activeDemoUserIndex]?.userId]?.startingBalance || 100
    : userProfile?.startingBalance || 100;

  const activeMemberProfiles: Record<string, { startingBalance: number }> = isDemoMode
    ? Object.fromEntries(Object.entries(DEMO_USER_PROFILES).map(([k, v]) => [k, { startingBalance: v.startingBalance }]))
    : members.reduce((acc, m) => {
        acc[m.userId] = { startingBalance: m.userId === currentUser?.uid ? (userProfile?.startingBalance || 100) : 100 };
        return acc;
      }, {} as Record<string, { startingBalance: number }>);

  // Log Team Activity Helper
  const logActivity = async (
    type: TeamActivity['type'],
    summary: string,
    recordRef?: string,
    recordType?: string
  ) => {
    if (!currentTeam || !currentUser || isDemoMode) return;
    try {
      const actId = 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const activityData: TeamActivity = {
        id: actId,
        teamId: currentTeam.id,
        actorUid: currentUser.uid,
        actorDisplayName: currentUser.displayName || userProfile?.displayName || 'Trader',
        type,
        recordRef,
        recordType,
        summary,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'teams', currentTeam.id, 'activity', actId), activityData);
    } catch (err) {
      console.warn('Activity logging error:', err);
    }
  };

  // --- Watchlist Actions ---
  const addSharedWatchlistToken = async (
    tokenData: Omit<SharedWatchlistToken, 'id' | 'teamId' | 'createdAt' | 'updatedAt' | 'addedByUid' | 'addedByName'>
  ) => {
    if (isDemoMode) {
      const exists = sharedWatchlist.some((t) => t.mintAddress.toLowerCase() === tokenData.mintAddress.toLowerCase());
      if (exists) {
        return { success: false, message: 'This Solana mint address is already on the shared watchlist.' };
      }
      const newTok: SharedWatchlistToken = {
        ...tokenData,
        id: 'tok-' + Date.now(),
        teamId: DEMO_MEMBERS[0].teamId,
        addedByUid: DEMO_MEMBERS[activeDemoUserIndex].userId,
        addedByName: DEMO_MEMBERS[activeDemoUserIndex].displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSharedWatchlist([newTok, ...sharedWatchlist]);
      return { success: true };
    }

    if (!currentUser || !currentTeam) {
      return { success: false, message: 'Not authenticated with a team' };
    }

    // Check duplicate mint
    const exists = sharedWatchlist.some(
      (t) => t.mintAddress.toLowerCase() === tokenData.mintAddress.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'This Solana mint address is already on the shared watchlist.' };
    }

    const tokenId = 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newToken: SharedWatchlistToken = {
      ...tokenData,
      id: tokenId,
      teamId: currentTeam.id,
      mintAddress: tokenData.mintAddress.trim(),
      addedByUid: currentUser.uid,
      addedByName: currentUser.displayName || userProfile?.displayName || 'Team Member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'teams', currentTeam.id, 'sharedWatchlist', tokenId), newToken);
      await logActivity(
        'token_added',
        `Added $${newToken.symbol} (${newToken.name}) to Team Watchlist`,
        tokenId,
        'watchlist'
      );
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teams/${currentTeam.id}/sharedWatchlist/${tokenId}`);
      return { success: false, message: 'Failed to add token' };
    }
  };

  const updateSharedWatchlistToken = async (id: string, updates: Partial<SharedWatchlistToken>) => {
    if (isDemoMode) {
      setSharedWatchlist(sharedWatchlist.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)));
      return;
    }
    if (!currentTeam) return;
    try {
      await setDoc(
        doc(db, 'teams', currentTeam.id, 'sharedWatchlist', id),
        { ...updates, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}/sharedWatchlist/${id}`);
    }
  };

  const deleteSharedWatchlistToken = async (id: string) => {
    if (isDemoMode) {
      setSharedWatchlist(sharedWatchlist.filter((t) => t.id !== id));
      return;
    }
    if (!currentTeam) return;
    try {
      await deleteDoc(doc(db, 'teams', currentTeam.id, 'sharedWatchlist', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teams/${currentTeam.id}/sharedWatchlist/${id}`);
    }
  };

  const togglePersonalWatchlistToken = async (token: { mintAddress: string; symbol: string; name: string }) => {
    const existing = personalWatchlist.find((p) => p.mintAddress.toLowerCase() === token.mintAddress.toLowerCase());

    if (isDemoMode) {
      if (existing) {
        setPersonalWatchlist(personalWatchlist.filter((p) => p.mintAddress.toLowerCase() !== token.mintAddress.toLowerCase()));
      } else {
        const item: PersonalWatchlistToken = {
          id: 'pw-' + Date.now(),
          userId: DEMO_MEMBERS[activeDemoUserIndex].userId,
          mintAddress: token.mintAddress,
          symbol: token.symbol,
          name: token.name,
          addedAt: new Date().toISOString(),
        };
        setPersonalWatchlist([...personalWatchlist, item]);
      }
      return;
    }

    if (!currentUser) return;
    try {
      if (existing) {
        await deleteDoc(doc(db, 'personalWatchlists', currentUser.uid, 'tokens', existing.id));
      } else {
        const pwId = 'pw-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const item: PersonalWatchlistToken = {
          id: pwId,
          userId: currentUser.uid,
          mintAddress: token.mintAddress,
          symbol: token.symbol,
          name: token.name,
          addedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'personalWatchlists', currentUser.uid, 'tokens', pwId), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `personalWatchlists/${currentUser.uid}/tokens`);
    }
  };

  const isTokenInPersonalWatchlist = (mintAddress: string) => {
    return personalWatchlist.some((p) => p.mintAddress.toLowerCase() === mintAddress.toLowerCase());
  };

  // --- Research Actions ---
  const createTokenResearch = async (
    data: Omit<TokenResearch, 'id' | 'teamId' | 'createdAt' | 'updatedAt' | 'researcherUid' | 'researcherName' | 'reviewerComments'>
  ) => {
    if (isDemoMode) {
      const newRes: TokenResearch = {
        ...data,
        id: 'res-' + Date.now(),
        teamId: DEMO_MEMBERS[0].teamId,
        researcherUid: DEMO_MEMBERS[activeDemoUserIndex].userId,
        researcherName: DEMO_MEMBERS[activeDemoUserIndex].displayName,
        reviewerComments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTokenResearch([newRes, ...tokenResearch]);
      return;
    }

    if (!currentUser || !currentTeam) return;
    const resId = 'res-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newRecord: TokenResearch = {
      ...data,
      id: resId,
      teamId: currentTeam.id,
      researcherUid: currentUser.uid,
      researcherName: currentUser.displayName || userProfile?.displayName || 'Researcher',
      reviewerComments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'teams', currentTeam.id, 'tokenResearch', resId), newRecord);
      await logActivity(
        'research_created',
        `Published research report for $${newRecord.tokenSymbol}: "${newRecord.title}"`,
        resId,
        'research'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teams/${currentTeam.id}/tokenResearch/${resId}`);
    }
  };

  const updateTokenResearch = async (id: string, updates: Partial<TokenResearch>) => {
    if (isDemoMode) {
      setTokenResearch(tokenResearch.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)));
      return;
    }
    if (!currentTeam || !currentUser) return;
    try {
      await setDoc(
        doc(db, 'teams', currentTeam.id, 'tokenResearch', id),
        { ...updates, lastModifiedByUid: currentUser.uid, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      if (updates.researchStatus) {
        await logActivity(
          'research_status_changed',
          `Changed research status to "${updates.researchStatus.toUpperCase()}"`,
          id,
          'research'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}/tokenResearch/${id}`);
    }
  };

  const addResearchReviewComment = async (researchId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const comment = {
      id: 'c-' + Date.now(),
      authorUid: isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].userId : (currentUser?.uid || 'user'),
      authorName: isDemoMode ? DEMO_MEMBERS[activeDemoUserIndex].displayName : (currentUser?.displayName || 'Team Member'),
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };

    if (isDemoMode) {
      setTokenResearch(
        tokenResearch.map((r) =>
          r.id === researchId ? { ...r, reviewerComments: [...(r.reviewerComments || []), comment] } : r
        )
      );
      return;
    }

    if (!currentTeam) return;
    const target = tokenResearch.find((r) => r.id === researchId);
    if (!target) return;
    const updatedComments = [...(target.reviewerComments || []), comment];

    try {
      await setDoc(
        doc(db, 'teams', currentTeam.id, 'tokenResearch', researchId),
        { reviewerComments: updatedComments, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}/tokenResearch/${researchId}`);
    }
  };

  // --- Monitored Wallets Actions ---
  const addMonitoredWallet = async (
    walletData: Omit<MonitoredWallet, 'id' | 'teamId' | 'createdAt' | 'updatedAt' | 'addedByUid' | 'addedByName' | 'observedActivity'>
  ) => {
    if (isDemoMode) {
      const newWal: MonitoredWallet = {
        ...walletData,
        id: 'wal-' + Date.now(),
        teamId: DEMO_MEMBERS[0].teamId,
        observedActivity: [],
        addedByUid: DEMO_MEMBERS[activeDemoUserIndex].userId,
        addedByName: DEMO_MEMBERS[activeDemoUserIndex].displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMonitoredWallets([newWal, ...monitoredWallets]);
      return;
    }

    if (!currentUser || !currentTeam) return;
    const walId = 'wal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newRecord: MonitoredWallet = {
      ...walletData,
      id: walId,
      teamId: currentTeam.id,
      address: walletData.address.trim(),
      observedActivity: [],
      addedByUid: currentUser.uid,
      addedByName: currentUser.displayName || userProfile?.displayName || 'Researcher',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'teams', currentTeam.id, 'monitoredWallets', walId), newRecord);
      await logActivity(
        'wallet_added',
        `Added monitored wallet: ${newRecord.label} (${newRecord.address.slice(0, 4)}...${newRecord.address.slice(-4)})`,
        walId,
        'wallet'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teams/${currentTeam.id}/monitoredWallets/${walId}`);
    }
  };

  const addWalletActivityRecord = async (
    walletId: string,
    activityItem: { action: 'buy' | 'sell' | 'deploy' | 'transfer'; tokenSymbol: string; amountSol?: number; details: string; txHash?: string }
  ) => {
    const actRecord = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      ...activityItem,
    };

    if (isDemoMode) {
      setMonitoredWallets(
        monitoredWallets.map((w) =>
          w.id === walletId ? { ...w, observedActivity: [actRecord, ...(w.observedActivity || [])] } : w
        )
      );
      return;
    }

    if (!currentTeam) return;
    const wal = monitoredWallets.find((w) => w.id === walletId);
    if (!wal) return;
    const updatedList = [actRecord, ...(wal.observedActivity || [])];

    try {
      await setDoc(
        doc(db, 'teams', currentTeam.id, 'monitoredWallets', walletId),
        { observedActivity: updatedList, lastReviewedTimestamp: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}/monitoredWallets/${walletId}`);
    }
  };

  const deleteMonitoredWallet = async (walletId: string) => {
    if (isDemoMode) {
      setMonitoredWallets(monitoredWallets.filter((w) => w.id !== walletId));
      return;
    }
    if (!currentTeam) return;
    try {
      await deleteDoc(doc(db, 'teams', currentTeam.id, 'monitoredWallets', walletId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teams/${currentTeam.id}/monitoredWallets/${walletId}`);
    }
  };

  // --- Paper Trading Actions ---
  const createPaperTrade = async (
    tradeData: Omit<PaperTrade, 'id' | 'teamId' | 'userId' | 'userDisplayName' | 'createdAt' | 'updatedAt' | 'realizedPnl' | 'unrealizedPnl'>
  ) => {
    const pnlCalc = calculateTradePnl(tradeData);
    const tradeId = 'tr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    if (isDemoMode) {
      const activeUser = DEMO_MEMBERS[activeDemoUserIndex];
      const newTrade: PaperTrade = {
        ...tradeData,
        id: tradeId,
        teamId: DEMO_MEMBERS[0].teamId,
        userId: activeUser.userId,
        userDisplayName: activeUser.displayName,
        realizedPnl: tradeData.status === 'closed' ? pnlCalc.netPnl : 0,
        unrealizedPnl: tradeData.status === 'open' ? pnlCalc.netPnl : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPaperTrades([newTrade, ...paperTrades]);
      return;
    }

    if (!currentUser || !currentTeam) return;

    const newRecord: PaperTrade = {
      ...tradeData,
      id: tradeId,
      teamId: currentTeam.id,
      userId: currentUser.uid,
      userDisplayName: currentUser.displayName || userProfile?.displayName || 'Trader',
      realizedPnl: tradeData.status === 'closed' ? pnlCalc.netPnl : 0,
      unrealizedPnl: tradeData.status === 'open' ? pnlCalc.netPnl : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'teams', currentTeam.id, 'paperTrades', tradeId), newRecord);
      await logActivity(
        'trade_opened',
        `Opened ${newRecord.direction.toUpperCase()} paper trade on $${newRecord.tokenSymbol} (${newRecord.quantity.toLocaleString()} @ ${newRecord.entryPrice})`,
        tradeId,
        'paper_trade'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teams/${currentTeam.id}/paperTrades/${tradeId}`);
    }
  };

  const closePaperPosition = async (
    tradeId: string,
    exitPrice: number,
    exitRationale?: string,
    lessonsLearned?: string
  ) => {
    const trade = paperTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    const pnlCalc = calculateTradePnl({ ...trade, exitPrice, status: 'closed' });

    if (isDemoMode) {
      setPaperTrades(
        paperTrades.map((t) =>
          t.id === tradeId
            ? {
                ...t,
                status: 'closed',
                exitPrice,
                exitTimestamp: new Date().toISOString(),
                realizedPnl: pnlCalc.netPnl,
                unrealizedPnl: 0,
                exitRationale: exitRationale || t.exitRationale,
                lessonsLearned: lessonsLearned || t.lessonsLearned,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
      return;
    }

    if (!currentTeam || !currentUser) return;
    if (trade.userId !== currentUser.uid) {
      throw new Error('Unauthorized: You cannot close another member\'s private paper trade.');
    }

    const updates: Partial<PaperTrade> = {
      status: 'closed',
      exitPrice,
      exitTimestamp: new Date().toISOString(),
      realizedPnl: pnlCalc.netPnl,
      unrealizedPnl: 0,
      exitRationale: exitRationale || trade.exitRationale,
      lessonsLearned: lessonsLearned || trade.lessonsLearned,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'teams', currentTeam.id, 'paperTrades', tradeId), updates, { merge: true });
      await logActivity(
        'trade_closed',
        `Closed ${trade.direction.toUpperCase()} on $${trade.tokenSymbol} with ${pnlCalc.netPnl >= 0 ? '+' : ''}${pnlCalc.netPnl.toFixed(2)} PnL (${pnlCalc.returnPct.toFixed(1)}%)`,
        tradeId,
        'paper_trade'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}/paperTrades/${tradeId}`);
    }
  };

  const updatePaperTrade = async (tradeId: string, updates: Partial<PaperTrade>) => {
    const trade = paperTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    if (isDemoMode) {
      setPaperTrades(paperTrades.map((t) => (t.id === tradeId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)));
      return;
    }

    if (!currentTeam || !currentUser) return;
    if (trade.userId !== currentUser.uid) {
      throw new Error('Unauthorized: You cannot edit another member\'s private paper trade.');
    }

    try {
      await setDoc(
        doc(db, 'teams', currentTeam.id, 'paperTrades', tradeId),
        { ...updates, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}/paperTrades/${tradeId}`);
    }
  };

  // --- Team Management & Settings ---
  const updateTeamSettings = async (newSettings: Partial<TeamSettings>) => {
    if (isDemoMode) return;
    if (!currentTeam || !currentUser) return;
    if (currentTeam.ownerUid !== currentUser.uid) {
      throw new Error('Only the team owner can modify shared risk policies.');
    }

    const mergedSettings: TeamSettings = {
      ...currentTeam.settings,
      ...newSettings,
    };

    try {
      await setDoc(
        doc(db, 'teams', currentTeam.id),
        { settings: mergedSettings, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      await logActivity('settings_updated', 'Updated team shared risk and liquidity policies', currentTeam.id, 'team_settings');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}`);
    }
  };

  const approveMember = async (targetUserId: string) => {
    if (isDemoMode || !currentTeam || !currentUser) return;
    if (currentTeam.ownerUid !== currentUser.uid) {
      throw new Error('Only the team owner can approve memberships.');
    }

    // Check 3-member hard limit
    const approvedCount = members.filter((m) => m.status === 'approved').length;
    if (approvedCount >= 3) {
      throw new Error('Maximum limit reached: The team can have at most 3 approved members.');
    }

    try {
      await setDoc(
        doc(db, 'teams', currentTeam.id, 'members', targetUserId),
        { status: 'approved' },
        { merge: true }
      );
      await logActivity('member_joined', `Approved member slot for user`, targetUserId, 'member');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${currentTeam.id}/members/${targetUserId}`);
    }
  };

  const seedDemoDataToFirestore = async () => {
    if (!currentTeam || !currentUser) return;
    try {
      // Seed watchlist
      for (const tok of DEMO_WATCHLIST) {
        await setDoc(doc(db, 'teams', currentTeam.id, 'sharedWatchlist', tok.id), {
          ...tok,
          teamId: currentTeam.id,
          addedByUid: currentUser.uid,
          addedByName: currentUser.displayName || 'Owner',
        });
      }
      // Seed research
      for (const res of DEMO_RESEARCH) {
        await setDoc(doc(db, 'teams', currentTeam.id, 'tokenResearch', res.id), {
          ...res,
          teamId: currentTeam.id,
          researcherUid: currentUser.uid,
          researcherName: currentUser.displayName || 'Owner',
        });
      }
      // Seed wallets
      for (const wal of DEMO_WALLETS) {
        await setDoc(doc(db, 'teams', currentTeam.id, 'monitoredWallets', wal.id), {
          ...wal,
          teamId: currentTeam.id,
          addedByUid: currentUser.uid,
          addedByName: currentUser.displayName || 'Owner',
        });
      }
      // Seed trades for current user
      for (const tr of DEMO_TRADES.slice(0, 3)) {
        await setDoc(doc(db, 'teams', currentTeam.id, 'paperTrades', tr.id), {
          ...tr,
          teamId: currentTeam.id,
          userId: currentUser.uid,
          userDisplayName: currentUser.displayName || 'Trader',
        });
      }
      // Seed activities
      for (const act of DEMO_ACTIVITIES.slice(0, 4)) {
        await setDoc(doc(db, 'teams', currentTeam.id, 'activity', act.id), {
          ...act,
          teamId: currentTeam.id,
          actorUid: currentUser.uid,
          actorDisplayName: currentUser.displayName || 'Trader',
        });
      }
      await logActivity('settings_updated', 'Seeded sample research and paper trading templates', currentTeam.id, 'system');
    } catch (err) {
      console.error('Seed demo data error:', err);
    }
  };

  const exportTradesToCsv = (userOnly: boolean = false) => {
    const list = userOnly && currentUser ? paperTrades.filter((t) => t.userId === currentUser.uid) : paperTrades;
    if (list.length === 0) {
      alert('No paper trade records available to export.');
      return;
    }

    const headers = [
      'Trade ID',
      'Trader',
      'Token Symbol',
      'Mint Address',
      'Direction',
      'Status',
      'Entry Price',
      'Exit Price',
      'Quantity',
      'Entry Time',
      'Exit Time',
      'Est. Fees (SOL)',
      'Est. Slippage (%)',
      'Realized PnL',
      'Unrealized PnL',
      'Strategy',
      'Entry Rationale',
      'Exit Rationale',
      'Lessons Learned',
    ];

    const rows = list.map((t) => [
      t.id,
      `"${t.userDisplayName}"`,
      t.tokenSymbol,
      t.tokenMint,
      t.direction.toUpperCase(),
      t.status.toUpperCase(),
      t.entryPrice,
      t.exitPrice ?? '',
      t.quantity,
      t.entryTimestamp,
      t.exitTimestamp ?? '',
      t.estimatedFees,
      t.estimatedSlippage,
      t.realizedPnl ?? 0,
      t.unrealizedPnl ?? 0,
      `"${t.strategy}"`,
      `"${(t.entryRationale || '').replace(/"/g, '""')}"`,
      `"${(t.exitRationale || '').replace(/"/g, '""')}"`,
      `"${(t.lessonsLearned || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradesync_paper_trades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TeamDataContext.Provider
      value={{
        members,
        sharedWatchlist,
        personalWatchlist,
        tokenResearch,
        monitoredWallets,
        paperTrades,
        teamActivity,
        loadingData,
        activeStartingBalance,
        activeMemberProfiles,
        addSharedWatchlistToken,
        updateSharedWatchlistToken,
        deleteSharedWatchlistToken,
        togglePersonalWatchlistToken,
        isTokenInPersonalWatchlist,
        createTokenResearch,
        updateTokenResearch,
        addResearchReviewComment,
        addMonitoredWallet,
        addWalletActivityRecord,
        deleteMonitoredWallet,
        createPaperTrade,
        closePaperPosition,
        updatePaperTrade,
        updateTeamSettings,
        approveMember,
        seedDemoDataToFirestore,
        exportTradesToCsv,
      }}
    >
      {children}
    </TeamDataContext.Provider>
  );
};

export const useTeamData = () => {
  const context = useContext(TeamDataContext);
  if (!context) {
    throw new Error('useTeamData must be used within a TeamDataProvider');
  }
  return context;
};
