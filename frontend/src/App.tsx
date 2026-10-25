import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import RequesterDashboard from './pages/RequesterDashboard'
import PostFavor from './pages/PostFavor'
import Matches from './pages/Matches'
import GiverProfilePage from './pages/GiverProfilePage'
import MyBookings from './pages/MyBookings'
import BookingDetail from './pages/BookingDetail'
import Rate from './pages/Rate'
import GiverDashboard from './pages/GiverDashboard'
import Browse from './pages/Browse'
import GiverOnboarding from './pages/GiverOnboarding'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

/** Giver-only accounts have no requester dashboard: send them to the giver side (or its setup). */
function Home() {
  const { me } = useAuth()
  if (me && !me.requester) return <Navigate to={me.giver ? '/giver' : '/giver/onboarding'} replace />
  return <RequesterDashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<Layout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/post" element={<PostFavor />} />
          <Route path="/favors/:id/matches" element={<Matches />} />
          <Route path="/favors/:id/edit" element={<PostFavor />} />
          <Route path="/givers/:id" element={<GiverProfilePage />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/bookings/:id/rate" element={<Rate />} />
          <Route path="/giver" element={<GiverDashboard />} />
          <Route path="/giver/onboarding" element={<GiverOnboarding />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  )
}
