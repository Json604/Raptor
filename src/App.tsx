import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/home/Home'
import Results from './pages/results/Results'
import SignUp from './pages/sign-up/signup'
import MonitoringDashboard from './pages/monitoring/MonitoringDashboard'
import Waitlist from './pages/waitlist/Waitlist'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Waitlist />} />
        <Route path="/home" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/monitoring-dashboard" element={<MonitoringDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
