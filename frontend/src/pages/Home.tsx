import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="animate-fade-in">
          <div className="text-8xl mb-6">⚡</div>
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent">
            QuizNova
          </h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-xl">
            The most exciting way to learn! Host live quiz games, challenge friends, and earn XP.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-lg hover:shadow-purple-200">
              🎓 Create a Quiz
            </Link>
            <Link to="/join" className="bg-white border-2 border-purple-600 text-purple-700 font-bold text-lg px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-lg">
              🎮 Join a Game
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-12">Why QuizNova?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🚀', title: 'Live Multiplayer', desc: 'Host real-time quiz battles with friends and classmates' },
              { icon: '🏆', title: 'Earn XP & Levels', desc: 'Progress through 6 levels from Novice to Legend' },
              { icon: '📊', title: 'Live Leaderboard', desc: 'See real-time rankings after every question' },
            ].map(f => (
              <div key={f.title} className="card text-center hover:shadow-xl transition-shadow">
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
