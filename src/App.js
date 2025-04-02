import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Login from './Components/Login/Login';
import SignUp from './Components/SignUp/SignUp';
import LevelSelection from './Components/Levels/LevelSelection';
import GameInterface from './Components/Games/GameInterface';
import AdminDashboard from './Components/Admin/AdminDashboard';
import process from 'process';
import Test from './Components/Tangram/test';
import RatingsPage from './Components/Ratings/RatingsPage';
import SolutionsPage from './Components/Games/SolutionsPage'; 
import LevelVideoPage from './Components/Levels/LevelVideoPage';

window.process = process;

function App() {
  const VITE_API_URL = "http://192.168.7.31:3001"


  

  useEffect(() => {
    const fetchUserAndSetPlaying = async () => {
      try {
        const responseUser = await fetch(`${VITE_API_URL}/api/me`, {
          credentials: "include",
        });
  
        if (!responseUser.ok) {
          console.error("Error obteniendo usuario.");
          return;
        }
  
        const user = await responseUser.json();
        await fetch(`${VITE_API_URL}/api/update-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: user.id, status: 'playing' }),
        });
  
        console.log('✅ Usuario establecido en playing:', user.id);
      } catch (err) {
        console.error("Error al actualizar el estado del usuario:", err);
      }
    };
  
    fetchUserAndSetPlaying();
  
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/game/:levelId" element={<GameInterface />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/levels" element={<LevelSelection />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/test" element={<Test />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/solutions/:levelId" element={<SolutionsPage />} />
        <Route path="/level-video/:levelId" element={<LevelVideoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
