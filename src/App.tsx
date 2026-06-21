import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { ChapterSelectionScreen } from './components/ChapterSelectionScreen';
import { StudyModeScreen } from './components/StudyModeScreen';
import { ExamModeScreen } from './components/ExamModeScreen';
import { RandomRevisionScreen } from './components/RandomRevisionScreen';
import { MistakesScreen } from './components/MistakesScreen';
import { BookmarksScreen } from './components/BookmarksScreen';
import { SearchScreen } from './components/SearchScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { StudyLibraryScreen } from './components/StudyLibraryScreen';
import { PDFViewer } from './components/PDFViewer';
import { LearnScreen } from './components/LearnScreen';
import { FlashCardsPracticeScreen } from './components/FlashCardsPracticeScreen';
import { FlashCardsLandingScreen } from './components/FlashCardsLandingScreen';
import { FlashCardsChaptersScreen } from './components/FlashCardsChaptersScreen';
import { ExamTabScreen } from './components/ExamTabScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { MoreScreen } from './components/MoreScreen';
import { LoginScreen } from './components/LoginScreen';
import { FirstTimeScreen } from './components/FirstTimeScreen';
import { ProfileDrawer } from './components/ProfileDrawer';

import logo from './assets/jo logo.png';

const MainAppContent: React.FC = () => {
  const { user, loading, isFirstTimeUser } = useAuth();
  const { activeRoute, loadingQuestions, settings, profileDrawerOpen, setProfileDrawerOpen } = useApp();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 1. Session Initialization Gate & Premium Splash Screen
  if (showSplash || loading) {
    return (
      <div className="h-full flex justify-center bg-slate-100 dark:bg-slate-950/80 transition-colors duration-200">
        <div className="max-w-md w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden animate-in fade-in duration-500">
          {/* Decorative background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 my-auto z-10">
            {/* Logo */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-teal-500 rounded-3xl blur opacity-25" />
              <div className="relative w-28 h-28 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl flex items-center justify-center shadow-lg p-4">
                <img src={logo} alt="JO Sphere Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Text Headers */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight leading-tight">
                JO Sphere
              </h1>
              <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                Learn • Revise • Succeed
              </p>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="pb-12 flex flex-col items-center space-y-3 z-10">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-cyan-600 rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider animate-pulse">
              {loading ? 'Initializing session...' : 'Loading resources...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authentication Gate (Protected Routes Check)
  if (!user) {
    return (
      <div className="h-full flex justify-center bg-slate-100 dark:bg-slate-950/80 transition-colors duration-200">
        <div className="max-w-md w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
          <LoginScreen />
        </div>
      </div>
    );
  }

  // 3. First-Time User Experience Onboarding Gate
  if (isFirstTimeUser) {
    return (
      <div className="h-full flex justify-center bg-slate-100 dark:bg-slate-950/80 transition-colors duration-200">
        <div className="max-w-md w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
          <FirstTimeScreen />
        </div>
      </div>
    );
  }

  const renderActiveScreen = () => {
    if (loadingQuestions) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200 space-y-6">
          <div className="relative w-20 h-20 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-md p-3">
            <img src={logo} alt="JO Sphere Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-sans leading-none">JO Sphere</h3>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-black tracking-widest">Learn • Revise • Succeed</p>
          </div>
          <div className="flex flex-col items-center space-y-2 pt-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-cyan-600"></div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading question bank...</p>
            <p className="text-[9px] text-slate-400">Caching chapters for offline study.</p>
          </div>
        </div>
      );
    }

    switch (activeRoute) {
      case 'home':
        return <DashboardScreen />;
      case 'chapter-select':
        return <ChapterSelectionScreen />;
      case 'study':
        return <StudyModeScreen />;
      case 'exam':
        return <ExamModeScreen />;
      case 'random-revision':
        return <RandomRevisionScreen />;
      case 'mistakes':
        return <MistakesScreen />;
      case 'bookmarks':
        return <BookmarksScreen />;
      case 'search':
        return <SearchScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'learn':
        return <LearnScreen />;
      case 'flashcards-landing':
        return <FlashCardsLandingScreen />;
      case 'flashcards-chapters':
        return <FlashCardsChaptersScreen />;
      case 'flashcards-viewer':
      case 'flashcards-practice':
        return <FlashCardsPracticeScreen />;
      case 'exam-tab':
        return <ExamTabScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'more':
        return <MoreScreen />;
      case 'study-library':
        return <StudyLibraryScreen />;
      case 'pdf-viewer':
        return <PDFViewer />;
      default:
        return <DashboardScreen />;
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small':
        return 'font-size-small';
      case 'large':
        return 'font-size-large';
      case 'xlarge':
        return 'font-size-xlarge';
      case 'medium':
      default:
        return 'font-size-medium';
    }
  };

  return (
    <div className="h-full flex justify-center bg-slate-100 dark:bg-slate-950/80 transition-colors duration-200">
      <div
        className={`max-w-md w-full h-full flex flex-col bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden ${getFontSizeClass()}`}
      >
        {/* Background Watermark Logo */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.025] z-0 overflow-hidden">
          <img src={logo} alt="" className="w-4/5 object-contain max-h-[50%] select-none filter dark:invert" />
        </div>
        {/* Top Header */}
        <TopBar />
        
        {/* Screen Content Area */}
        {renderActiveScreen()}
        
        {/* Bottom Navigation */}
        <BottomNav />

        {/* Global Slide-up Profile Menu Drawer */}
        <ProfileDrawer
          isOpen={profileDrawerOpen}
          onClose={() => setProfileDrawerOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <MainAppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


