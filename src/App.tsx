import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DayEditorPage } from './pages/DayEditorPage'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { ProgramEditorPage } from './pages/ProgramEditorPage'
import { ProgramsPage } from './pages/ProgramsPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { TrackHubPage } from './pages/TrackHubPage'
import { TrackPickerPage } from './pages/TrackPickerPage'
import { WorkoutTrackPage } from './pages/WorkoutTrackPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/track" element={<TrackHubPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:programId" element={<ProgramEditorPage />} />
        <Route path="/programs/:programId/track" element={<TrackPickerPage />} />
        <Route path="/programs/:programId/track/:dayId" element={<WorkoutTrackPage />} />
        <Route path="/programs/:programId/sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="/programs/:programId/days/:dayId" element={<DayEditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
