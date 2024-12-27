import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Login from './Components/Login/Login';
import SignUp from './Components/SignUp/SignUp';
import LevelSelection from './Components/Levels/LevelSelection';
import GameInterface from './Components/Games/GameInterface';
import AdminDashboard from './Components/Admin/AdminDashboard';
import process from 'process';
window.process = process;


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/game/:levelId" element={<GameInterface />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/levels" element={<LevelSelection />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;