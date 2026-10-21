import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Nav from './components/Nav'
import Footer from './components/Footer'

function NotFound() {
  return (
    <>
      <Nav />
      <main className="scan-page">
        <div className="state container">
          <h1 className="t-title1">Page not found</h1>
          <p className="t-body secondary">That link doesn't go anywhere.</p>
          <div className="state-actions"><Link to="/" className="button button-primary">Go to Raptor</Link></div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan/:id" element={<Scan />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
