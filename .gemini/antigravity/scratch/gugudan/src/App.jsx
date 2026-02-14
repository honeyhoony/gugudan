import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import VedicPractice from './pages/VedicPractice';
import LearningMenu from './pages/LearningMenu';
import Magic248 from './pages/games/Magic248';
import Magic37 from './pages/games/Magic37';
import Magic6 from './pages/games/Magic6';
import Magic10 from './pages/games/Magic10';
import './index.css';

function App() {
  return (
    <Router>
      <UserProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Interactive Learning */}
            <Route path="/learning" element={<LearningMenu />} />
            <Route path="/practice/magic-248" element={<Magic248 />} />
            <Route path="/practice/magic-37" element={<Magic37 />} />
            <Route path="/practice/magic-6" element={<Magic6 />} />
            <Route path="/practice/magic-10" element={<Magic10 />} />

            {/* Practical Quiz */}
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice/:dan" element={<Practice />} />
            <Route path="/vedic-practice" element={<VedicPractice />} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;
