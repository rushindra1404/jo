import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { ExamTabScreen } from './components/ExamTabScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { MoreScreen } from './components/MoreScreen';

const MainAppContent: React.FC = () => {
  const { activeRoute, loadingQuestions, settings } = useApp();

  const renderActiveScreen = () => {
    if (loadingQuestions) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-350 mt-4">Loading question bank...</p>
          <p className="text-xs text-slate-400 mt-1">Caching chapters for offline study.</p>
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
        className={`max-w-md w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden ${getFontSizeClass()}`}
      >
        {/* Top Header */}
        <TopBar />
        
        {/* Screen Content Area */}
        {renderActiveScreen()}
        
        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

