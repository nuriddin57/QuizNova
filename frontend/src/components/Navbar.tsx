import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-purple-700 to-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">⚡</span>
          <span className="text-white font-extrabold text-2xl tracking-tight">QuizNova</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link to="/dashboard" className="text-purple-100 hover:text-white font-medium transition-colors">Dashboard</Link>
          <Link to="/join" className="bg-white text-purple-700 font-bold px-4 py-2 rounded-lg hover:bg-purple-50 transition-all hover:scale-105">Join Game</Link>
        </div>
      </div>
    </nav>
  );
}
