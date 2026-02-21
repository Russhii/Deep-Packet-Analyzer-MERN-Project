import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CaptureDetail from './pages/CaptureDetail';
import Rules from './pages/Rules';

function App() {
  return (
    <BrowserRouter>
      <div style={styles.layout}>
        <nav style={styles.nav}>
          <div style={styles.navBrand}>Packet Analyzer</div>
          <NavLink to="/" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })} end>
            Captures
          </NavLink>
          <NavLink to="/rules" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
            Rules
          </NavLink>
        </nav>
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/capture/:id" element={<CaptureDetail />} />
            <Route path="/rules" element={<Rules />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  nav: {
    width: 220,
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    padding: '1.5rem 0',
  },
  navBrand: {
    fontWeight: 700,
    fontSize: '1.1rem',
    padding: '0 1.5rem',
    marginBottom: '1.5rem',
    color: 'var(--accent)',
  },
  navLink: {
    display: 'block',
    padding: '0.6rem 1.5rem',
    color: 'var(--text-muted)',
    textDecoration: 'none',
  },
  navLinkActive: {
    color: 'var(--text)',
    background: 'rgba(88, 166, 255, 0.1)',
    borderLeft: '3px solid var(--accent)',
  },
  main: {
    flex: 1,
    padding: '2rem',
    overflow: 'auto',
  },
};

export default App;
