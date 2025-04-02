import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import VITE_API_URL from "../../config";

const LevelVideoPage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [videoEnded, setVideoEnded] = useState(false);
  const [levelData, setLevelData] = useState(null);
  

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      {levelId === "1" ? (
        <>
          <video
            autoPlay
            controls
            onEnded={handleVideoEnd}
            className="w-3/4 rounded-xl shadow-xl"
          >
            <source src="\videos\video1.mp4" type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>
  
          {videoEnded && (
            <Button className="mt-8" variant="default" onClick={goToLevel}>
              Ir al Nivel {levelId}
            </Button>
          )}
        </>
      ) : levelId === "2" ? (
        <>
          <video
            autoPlay
            controls
            onEnded={handleVideoEnd}
            className="w-3/4 rounded-xl shadow-xl"
          >
            <source src="\videos\video2.mp4" type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>
  
          {videoEnded && (
            <Button className="mt-8" variant="default" onClick={goToLevel}>
              Ir al Nivel {levelId}
            </Button>
          )}
        </>
      ) : levelId === "3" ? (
        <>
          <video
            autoPlay
            controls
            onEnded={handleVideoEnd}
            className="w-3/4 rounded-xl shadow-xl"
          >
            <source src="\videos\video3.mp4" type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>
  
          {videoEnded && (
            <Button className="mt-8" variant="default" onClick={goToLevel}>
              Ir al Nivel {levelId}
            </Button>
          )}
        </>
      ) : levelId === "4" ? (
        <>
          <video
            autoPlay
            controls
            onEnded={handleVideoEnd}
            className="w-3/4 rounded-xl shadow-xl"
          >
            <source src="\videos\video4.mp4" type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>
  
          {videoEnded && (
            <Button className="mt-8" variant="default" onClick={goToLevel}>
              Ir al Nivel {levelId}
            </Button>
          )}
        </>
      ) : (
        <div>No se ha seleccionado un nivel válido.</div>
      )}
    </div>
  );
  
};

export default LevelVideoPage;
