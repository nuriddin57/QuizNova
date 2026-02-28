import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import QuizEditor from './pages/QuizEditor';
import HostGame from './pages/HostGame';
import JoinGame from './pages/JoinGame';
import PlayGame from './pages/PlayGame';
import SoloPractice from './pages/SoloPractice';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quiz/create" element={<QuizEditor />} />
          <Route path="/quiz/:id/edit" element={<QuizEditor />} />
          <Route path="/quiz/:id/host" element={<HostGame />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/play" element={<PlayGame />} />
          <Route path="/quiz/:id/practice" element={<SoloPractice />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
