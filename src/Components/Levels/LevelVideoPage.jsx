import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

const LevelVideoPage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [videoEnded, setVideoEnded] = useState(false);
  const [levelData, setLevelData] = useState(null);
  const VITE_API_URL = "http://192.168.7.203:3001";

  const validLevels = ["1", "2", "3", "4"];

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  useEffect(() => {
    const fetchLevelData = async () => {
      try {
        const response = await fetch(`${VITE_API_URL}/api/levels/${levelId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Error al cargar información del nivel");

        const data = await response.json();
        console.log("Data del nivel:", data);
        setLevelData(data);
      } catch (error) {
        console.error("Error obteniendo datos del nivel:", error);
      }
    };

    fetchLevelData();
  }, [levelId]);

  const goToLevel = () => {
    navigate(`/game/${levelId}`, { state: levelData });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 sm:px-6">
      {validLevels.includes(levelId) ? (
        <>
          <video
            autoPlay
            controls
            onEnded={handleVideoEnd}
            className="w-full sm:w-3/4 max-w-2xl max-h-[80vh] rounded-xl shadow-xl"
          >
            <source src={`/videos/video${levelId}.mp4`} type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>

          {videoEnded && (
            <Button
              className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base"
              variant="default"
              onClick={goToLevel}
            >
              Ir al Nivel {levelId}
            </Button>
          )}
        </>
      ) : (
        <div className="text-base sm:text-lg text-white font-medium text-center">
          No se ha seleccionado un nivel válido.
        </div>
      )}
    </div>
  );
};

export default LevelVideoPage;