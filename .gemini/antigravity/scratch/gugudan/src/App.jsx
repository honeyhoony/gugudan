import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Learn from './pages/Learn';
import './index.css';

function App() {
  return (
    <Router>
      <UserProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/learn/:dan" element={<Learn />} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;
