import { Routes, Route, Link } from 'react-router-dom';
import { AppDataProvider } from './state/AppDataContext.jsx';
import { ToastProvider } from './state/ToastContext.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SubjectsPage from './pages/SubjectsPage.jsx';
import SubjectDetailPage from './pages/SubjectDetailPage.jsx';
import ChaptersPage from './pages/ChaptersPage.jsx';
import ChapterDetailPage from './pages/ChapterDetailPage.jsx';
import RevisionPage from './pages/RevisionPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ImportPage from './pages/ImportPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MorePage from './pages/MorePage.jsx';
import ComingSoonPage from './pages/ComingSoonPage.jsx';
import StudyPage from './pages/StudyPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import QuizDetailPage from './pages/QuizDetailPage.jsx';
import QuizResultPage from './pages/QuizResultPage.jsx';
import { EmptyState } from './components/ui/index.jsx';
import { PHASE_INFO } from './components/layout/navItems.js';

/**
 * Routes. Phase-1 screens are real; later-phase screens exist as honest
 * placeholders so navigation never dead-ends (spec §33).
 */
export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
            <Route path="/subjects/:subjectId/chapters/:chapterId" element={<ChapterDetailPage />} />
            <Route path="/chapters" element={<ChaptersPage />} />
            <Route path="/revision" element={<RevisionPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/quiz/results/:resultId" element={<QuizResultPage />} />
            <Route path="/quiz/:quizId" element={<QuizDetailPage />} />
            <Route
              path="/ai"
              element={
                <ComingSoonPage
                  phase={4}
                  title="AI Study Assistant"
                  description="সহজ বাংলায় explanation, note, MCQ ও viva question"
                  points={PHASE_INFO[4].points}
                />
              }
            />
            <Route
              path="*"
              element={
                <EmptyState
                  title="পেজটি পাওয়া যায়নি"
                  description="ঠিকানাটি ভুল হতে পারে।"
                  action={
                    <Link to="/" className="btn-ghost mt-2">
                      Dashboard-এ ফিরে যান
                    </Link>
                  }
                />
              }
            />
          </Route>
        </Routes>
      </AppDataProvider>
    </ToastProvider>
  );
}
