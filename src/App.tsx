import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { TeamDataProvider, useTeamData } from './context/TeamDataContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { OverviewView } from './components/views/OverviewView.tsx';
import { PersonalOverviewView } from './components/views/PersonalOverviewView.tsx';
import { TeamDashboardView } from './components/views/TeamDashboardView.tsx';
import { TokenWatchlistView } from './components/views/TokenWatchlistView.tsx';
import { ResearchLabView } from './components/views/ResearchLabView.tsx';
import { WalletIntelligenceView } from './components/views/WalletIntelligenceView.tsx';
import { PaperTradingJournalView } from './components/views/PaperTradingJournalView.tsx';
import { RiskMonitorView } from './components/views/RiskMonitorView.tsx';
import { TeamActivityView } from './components/views/TeamActivityView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { AddTokenModal } from './components/modals/AddTokenModal.tsx';
import { AddResearchModal } from './components/modals/AddResearchModal.tsx';
import { AddWalletModal } from './components/modals/AddWalletModal.tsx';
import { AddPaperTradeModal } from './components/modals/AddPaperTradeModal.tsx';
import { TeamJoinModal } from './components/modals/TeamJoinModal.tsx';

function MainLayout() {
  const { currentUser, isDemoMode, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [isAddResearchOpen, setIsAddResearchOpen] = useState(false);
  const [researchTokenMint, setResearchTokenMint] = useState<string | undefined>(undefined);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [tradeDefaultMint, setTradeDefaultMint] = useState<string | undefined>(undefined);
  const [tradeDefaultSymbol, setTradeDefaultSymbol] = useState<string | undefined>(undefined);

  const handleOpenTradeForToken = (mint: string, symbol: string) => {
    setTradeDefaultMint(mint);
    setTradeDefaultSymbol(symbol);
    setIsAddTradeOpen(true);
  };

  const handleOpenResearchForToken = (mint: string) => {
    setResearchTokenMint(mint);
    setIsAddResearchOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Initializing TradeSync Terminal...
        </span>
      </div>
    );
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <OverviewView
            onNavigate={setCurrentSection}
            onOpenTradeModal={() => {
              setTradeDefaultMint(undefined);
              setTradeDefaultSymbol(undefined);
              setIsAddTradeOpen(true);
            }}
            onOpenResearchModal={() => {
              setResearchTokenMint(undefined);
              setIsAddResearchOpen(true);
            }}
          />
        );
      case 'performance':
        return (
          <PersonalOverviewView
            onNavigate={setCurrentSection}
            onOpenTradeModal={() => {
              setTradeDefaultMint(undefined);
              setTradeDefaultSymbol(undefined);
              setIsAddTradeOpen(true);
            }}
            onOpenResearchModal={() => {
              setResearchTokenMint(undefined);
              setIsAddResearchOpen(true);
            }}
          />
        );
      case 'team':
        return (
          <TeamDashboardView
            onNavigate={setCurrentSection}
            onOpenTradeModal={() => {
              setTradeDefaultMint(undefined);
              setTradeDefaultSymbol(undefined);
              setIsAddTradeOpen(true);
            }}
          />
        );
      case 'watchlist':
        return (
          <TokenWatchlistView
            onOpenAddTokenModal={() => setIsAddTokenOpen(true)}
            onSelectTokenForTrade={handleOpenTradeForToken}
            onSelectTokenForResearch={handleOpenResearchForToken}
          />
        );
      case 'research':
        return (
          <ResearchLabView
            onOpenAddResearchModal={() => {
              setResearchTokenMint(undefined);
              setIsAddResearchOpen(true);
            }}
            onOpenTradeModalForToken={handleOpenTradeForToken}
          />
        );
      case 'wallets':
        return (
          <WalletIntelligenceView
            onOpenAddWalletModal={() => setIsAddWalletOpen(true)}
          />
        );
      case 'journal':
        return (
          <PaperTradingJournalView
            onOpenNewTradeModal={() => {
              setTradeDefaultMint(undefined);
              setTradeDefaultSymbol(undefined);
              setIsAddTradeOpen(true);
            }}
          />
        );
      case 'risk':
        return <RiskMonitorView onNavigate={setCurrentSection} />;
      case 'activity':
        return <TeamActivityView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <OverviewView
            onNavigate={setCurrentSection}
            onOpenTradeModal={() => setIsAddTradeOpen(true)}
            onOpenResearchModal={() => setIsAddResearchOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-sans">
      {/* Team Founding / Join Modal for unassigned authenticated users */}
      <TeamJoinModal />

      {/* Top Header */}
      <Header onNavigate={setCurrentSection} currentSection={currentSection} />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={setCurrentSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderCurrentSection()}</div>
        </main>
      </div>

      {/* Action Modals */}
      <AddTokenModal
        isOpen={isAddTokenOpen}
        onClose={() => setIsAddTokenOpen(false)}
      />

      <AddResearchModal
        isOpen={isAddResearchOpen}
        onClose={() => setIsAddResearchOpen(false)}
        defaultTokenMint={researchTokenMint}
      />

      <AddWalletModal
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
      />

      <AddPaperTradeModal
        isOpen={isAddTradeOpen}
        onClose={() => setIsAddTradeOpen(false)}
        defaultTokenMint={tradeDefaultMint}
        defaultSymbol={tradeDefaultSymbol}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TeamDataProvider>
        <MainLayout />
      </TeamDataProvider>
    </AuthProvider>
  );
}
