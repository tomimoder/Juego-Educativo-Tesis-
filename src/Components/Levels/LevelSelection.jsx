import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { Button } from "../ui/button"; // Importamos el botón reutilizable

const LevelButton = ({ level, name, unlocked, stars, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-24 h-24 rounded-lg flex flex-col items-center justify-center ${
        unlocked ? "bg-purple-300 hover:bg-purple-400" : "bg-gray-400"
      }`}
      disabled={!unlocked}
    >
      <span className="text-xl font-bold">{level}</span>
      <span className="text-xs mt-1">{name}</span>
      <div className="flex mt-1">
        {[...Array(3)].map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${i < stars ? "text-yellow-400" : "text-gray-300"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </button>
  );
};

export default function LevelSelection() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const VITE_API_URL = "http://192.168.7.31:3001"


  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const userResponse = await fetch(`${VITE_API_URL}/api/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!userResponse.ok) throw new Error("Usuario no autenticado");

        const user = await userResponse.json();
        console.log("✅ Usuario obtenido desde sesión:", user);

        const response = await fetch(`${VITE_API_URL}/api/levels/progress/${user.id}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📌 Niveles obtenidos:", data);
        setLevels(data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error obteniendo niveles:", err);
        setError("No se pudieron cargar los niveles. Intenta nuevamente.");
        setLoading(false);
      }
    };

    fetchLevels();
  }, []);


  const handleLevelSelect = async (levelId) => {
    try {
      const userResponse = await fetch(`${VITE_API_URL}/api/me`, {
        method: "GET",
        credentials: "include",
      });
  
      if (!userResponse.ok) {
        throw new Error("Usuario no autenticado");
      }
  
      const user = await userResponse.json();
      if (!user || !user.id) {
        throw new Error("Error: Datos de usuario inválidos en la sesión.");
      }
  
      const unlockResponse = await fetch(`${VITE_API_URL}/api/levels/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: user.id, currentLevelId: levelId }),
      });
  
      if (!unlockResponse.ok) {
        throw new Error(`HTTP error! status: ${unlockResponse.status}`);
      }
  
      const selectedLevel = levels.find((level) => level.level === levelId);
      if (!selectedLevel) {
        throw new Error("Nivel seleccionado no encontrado.");
      }
  
      // Muestra el modal de video solo después de verificar todo lo anterior
      setSelectedLevel(selectedLevel);
      setShowVideoModal(true);
  
    } catch (err) {
      console.error("Error desbloqueando nivel:", err);
      setError("No se pudo iniciar el nivel. Intenta nuevamente.");
    }
  };
  

  const handleVideoEnded = () => {
    setShowVideoModal(false);
    navigate(`/game/${selectedLevel.level}`, { state: selectedLevel });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-200 flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-700">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-yellow-200 flex items-center justify-center">
        <div className="text-2xl font-bold text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-200 flex items-center justify-center">
      <div className="bg-yellow-300 p-8 rounded-3xl shadow-lg">
        <h1 className="text-4xl font-bold text-purple-800 text-center mb-8">Selecciona un nivel</h1>
        <div className="grid grid-cols-5 gap-4">
          {levels.map((level) => (
            <LevelButton
              key={level.level}
              level={level.level}
              name={level.name}
              unlocked={level.unlocked}
              stars={level.stars}
              onClick={() => handleLevelSelect(level.level)}
            />
          ))}
        </div>

        {showVideoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <video
                width="100%"
                controls
                autoPlay
                onEnded={handleVideoEnded}
                src={`/videos/video${selectedLevel.level}.mp4`}
              />
            </div>
          </div>
        )}

        {/* Botón para ver los Ratings en otra página */}
        <div className="flex items-center justify-center mt-6">
          <Button variant="default" onClick={() => navigate("/ratings")}>
            Ver Ratings
          </Button>
        </div>
      </div>
    </div>
  );
}