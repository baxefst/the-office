import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';
import { UserProfile, Team, TeamMember } from '../types/index.ts';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  currentTeam: Team | null;
  membership: TeamMember | null;
  loading: boolean;
  isDemoMode: boolean;
  activeDemoUserIndex: number;
  toggleDemoMode: (val?: boolean) => void;
  setActiveDemoUserIndex: (idx: number) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  createDefaultTeam: () => Promise<void>;
  joinTeamWithCode: (code: string) => Promise<{ success: boolean; message: string }>;
  updatePersonalProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [membership, setMembership] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [activeDemoUserIndex, setActiveDemoUserIndex] = useState<number>(0);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setCurrentTeam(null);
        setMembership(null);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        let profile: UserProfile;
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Solana Trader',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            startingBalance: 100.0,
            riskLimits: {
              maxAllocationPerTradePercent: 15,
              maxDailyLossPercent: 20,
              stopLossDefaultPercent: 25,
              maxOpenPositions: 5,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            await setDoc(userDocRef, newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
          profile = newProfile;
        } else {
          profile = userSnap.data() as UserProfile;
        }
        setUserProfile(profile);

        // Check if there is an active team
        if (profile.teamId) {
          await loadTeamData(profile.teamId, user.uid);
        } else {
          // Check if "The Trading Room" already exists in system to link or let user create
          const teamsSnap = await getDocs(collection(db, 'teams'));
          if (!teamsSnap.empty) {
            const firstTeamDoc = teamsSnap.docs[0];
            const teamData = firstTeamDoc.data() as Team;
            // Check if user is a member of this team
            const memberDoc = await getDoc(doc(db, 'teams', teamData.id, 'members', user.uid));
            if (memberDoc.exists()) {
              const memData = memberDoc.data() as TeamMember;
              setMembership(memData);
              setCurrentTeam(teamData);
              // Update user profile with teamId
              await setDoc(userDocRef, { ...profile, teamId: teamData.id, role: memData.role }, { merge: true });
              setUserProfile({ ...profile, teamId: teamData.id, role: memData.role });
            }
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadTeamData = async (teamId: string, uid: string) => {
    try {
      const teamDocRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamDocRef);
      if (teamSnap.exists()) {
        setCurrentTeam(teamSnap.data() as Team);
      }

      const memDocRef = doc(db, 'teams', teamId, 'members', uid);
      const memSnap = await getDoc(memDocRef);
      if (memSnap.exists()) {
        setMembership(memSnap.data() as TeamMember);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setCurrentTeam(null);
      setMembership(null);
      setIsDemoMode(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createDefaultTeam = async () => {
    if (!currentUser) return;
    const teamId = 'the-trading-room';
    const newTeam: Team = {
      id: teamId,
      name: 'The Trading Room',
      ownerUid: currentUser.uid,
      ownerEmail: currentUser.email || '',
      maxMembers: 3,
      inviteCode: 'SOL-ROOM-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      settings: {
        minLiquidityUsd: 50000,
        maxPositionAllocationPercent: 20,
        requireFreezeRevoked: true,
        maxTeamOpenPositions: 8,
        riskAlertThresholdDrawdownPercent: 15,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ownerMember: TeamMember = {
      userId: currentUser.uid,
      teamId,
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Team Owner',
      email: currentUser.email || '',
      avatarUrl: currentUser.photoURL || undefined,
      role: 'owner',
      status: 'approved',
      joinedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'teams', teamId), newTeam);
      await setDoc(doc(db, 'teams', teamId, 'members', currentUser.uid), ownerMember);
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { teamId, role: 'owner', updatedAt: new Date().toISOString() },
        { merge: true }
      );

      setCurrentTeam(newTeam);
      setMembership(ownerMember);
      if (userProfile) {
        setUserProfile({ ...userProfile, teamId, role: 'owner' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teams/${teamId}`);
    }
  };

  const joinTeamWithCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please sign in first' };
    try {
      const trimmedCode = code.trim().toUpperCase();
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, where('inviteCode', '==', trimmedCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        return { success: false, message: 'Invalid team invite code. Please verify with your team owner.' };
      }

      const teamDoc = snap.docs[0];
      const team = teamDoc.data() as Team;

      // Check current members count
      const membersRef = collection(db, 'teams', team.id, 'members');
      const membersSnap = await getDocs(membersRef);
      const approvedCount = membersSnap.docs.filter((d) => (d.data() as TeamMember).status === 'approved').length;

      if (approvedCount >= team.maxMembers) {
        return {
          success: false,
          message: `This trading team is strictly limited to ${team.maxMembers} approved members. All seats are filled.`,
        };
      }

      // Check if user already has membership record
      const existingMember = membersSnap.docs.find((d) => d.id === currentUser.uid);
      if (existingMember) {
        const memData = existingMember.data() as TeamMember;
        setMembership(memData);
        setCurrentTeam(team);
        await setDoc(doc(db, 'users', currentUser.uid), { teamId: team.id, role: memData.role }, { merge: true });
        return { success: true, message: `Welcome back to ${team.name}!` };
      }

      // Create member record (pending owner approval or auto-admit if slots remain)
      const newMember: TeamMember = {
        userId: currentUser.uid,
        teamId: team.id,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Member',
        email: currentUser.email || '',
        avatarUrl: currentUser.photoURL || undefined,
        role: 'member',
        status: approvedCount < 3 ? 'approved' : 'pending',
        joinedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'teams', team.id, 'members', currentUser.uid), newMember);
      await setDoc(doc(db, 'users', currentUser.uid), { teamId: team.id, role: 'member' }, { merge: true });

      setCurrentTeam(team);
      setMembership(newMember);
      if (userProfile) {
        setUserProfile({ ...userProfile, teamId: team.id, role: 'member' });
      }

      return {
        success: true,
        message: newMember.status === 'approved' ? `Successfully joined ${team.name}!` : 'Request submitted for owner approval.',
      };
    } catch (err) {
      console.error('Join team error:', err);
      return { success: false, message: 'Failed to join team: ' + (err instanceof Error ? err.message : String(err)) };
    }
  };

  const updatePersonalProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    try {
      const merged = { ...userProfile, ...updates, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'users', currentUser.uid), merged, { merge: true });
      setUserProfile(merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const toggleDemoMode = (val?: boolean) => {
    setIsDemoMode((prev) => (typeof val === 'boolean' ? val : !prev));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        currentTeam,
        membership,
        loading,
        isDemoMode,
        activeDemoUserIndex,
        toggleDemoMode,
        setActiveDemoUserIndex,
        loginWithGoogle,
        logout,
        createDefaultTeam,
        joinTeamWithCode,
        updatePersonalProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
