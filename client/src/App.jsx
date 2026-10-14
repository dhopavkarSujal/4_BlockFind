
import { BrowserRouter, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AppRoutes from './routes/AppRoutes'

function AppContent() {
  const location = useLocation()

  // DashboardLayout provides its own authenticated navigation.
  const isDashboard = location.pathname.startsWith('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!isDashboard && <Navbar />}

      <AppRoutes />

      {!isDashboard && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
