import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Login from '../pages/Login.jsx'
import Backup from '../pages/Backup.jsx'
import Chapters from '../pages/Chapters.jsx'
import ChapterDetail from '../pages/ChapterDetail.jsx'
import Flashcards from '../pages/Flashcards.jsx'
import Vocabulary from '../pages/Vocabulary.jsx'
import VocabularyEdit from '../pages/VocabularyEdit.jsx'
import Settings from '../pages/Settings.jsx'
import OfflineHome from '../pages/OfflineHome.jsx'
import Presentation from '../pages/Presentation.jsx'
import NotFound from '../pages/NotFound.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/present', element: <Navigate to="/flashcards" replace /> },
      { path: '/present/:chapterId', element: <Presentation /> },
      {
        element: <AppShell />,
        children: [
      { index: true, element: <Dashboard /> },
      { path: 'chapters', element: <Chapters /> },
      { path: 'chapters/:chapterId', element: <ChapterDetail /> },
      { path: 'vocabulary', element: <Vocabulary /> },
      { path: 'vocabulary/new', element: <VocabularyEdit /> },
      { path: 'vocabulary/:wordId/edit', element: <VocabularyEdit /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'backup', element: <Backup /> },
      { path: 'offline', element: <OfflineHome embedded /> },
      { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])
