import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Discover from '../pages/Discover'
import GameLobby from '../pages/GameLobby'
import GamePlay from '../pages/GamePlay'
import SetDetail from '../pages/SetDetail'
import LegalInfo from '../pages/LegalInfo'
import MySets from '../pages/MySets'

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/discover" element={<Discover />} />
    <Route path="/sets/:id" element={<SetDetail />} />
    <Route path="/my-sets" element={<MySets />} />
    <Route path="/host" element={<GameLobby />} />
    <Route path="/join" element={<GameLobby />} />
    <Route path="/lobby" element={<GameLobby />} />
    <Route path="/room/:code" element={<GameLobby />} />
    <Route path="/play" element={<GamePlay />} />
    <Route path="/game/:id" element={<GamePlay />} />
    <Route path="/privacy" element={<LegalInfo />} />
    <Route path="/terms" element={<LegalInfo />} />
    <Route path="/support" element={<LegalInfo />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default AppRoutes
