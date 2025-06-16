import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const formatRating = (rating) => {
  const numRating = parseFloat(rating);
  return isNaN(numRating) ? "0.0" : numRating.toFixed(1);
};

const fetchUser = async () => {
  const VITE_API_URL = "http://192.168.56.1:3001"

  try {
    const response = await fetch(`${VITE_API_URL}/api/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Usuario no autenticado");

    const user = await response.json();
    console.log("✅ Usuario obtenido:", user);
    return user;
  } catch (err) {
    console.error("❌ Error obteniendo usuario:", err);
    return null;
  }
};


// Añade esto para obtener atributos claramente definidos
const getPieceAttributesFull = (shape, id) => {
  switch (shape) {
    case 'large-triangle':
      return { svgPath: "M 0 0 L 140 0 L 70 70 Z", fillColor: "#FFA500", width: 140, height: 140, centerPoint: "70,23.33" };
    case 'large-triangle2':
      return { svgPath: "M 0 0 L 140 0 L 70 70 Z", fillColor: "#7FFFD4", width: 140, height: 140, centerPoint: "70,23.33" };
    case 'medium-triangle':
      return { svgPath: "M 0 0 L 100 0 L 50 50 Z", fillColor: "#FFD700", width: 100, height: 100, centerPoint: "50,16.67" };
    case 'small-triangle':
      return { svgPath: "M 0 0 L 70 0 L 35 35 Z", fillColor: id === 4 ? "#00BFFF" : "#32CD32", width: 70, height: 70, centerPoint: "35,11.67" };
    case 'diamond':
      return { svgPath: "M 0 35 L 35 0 L 70 35 L 35 70 Z", fillColor: "#FF0000", width: 70, height: 70, centerPoint: "35,35" };
    case 'parallelogram':
      return { svgPath: "M 90 25 H 25 L 0 50 L 65 50 Z", fillColor: "#0000FF", width: 90, height: 50, centerPoint: "45,37.5" };
    default:
      return { svgPath: "", fillColor: "gray", width: 50, height: 50, centerPoint: "25,25" };
  }
};


const SolutionsPage = ({
  solution,
}) => {
  const { levelId } = useParams();
  const [solutions, setSolutions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [similarWords, setSimilarWords] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos fijos
  const [timerFinished, setTimerFinished] = useState(false); // Saber si terminó el tiempo
  const VITE_API_URL = "http://192.168.7.203:3001"


  useEffect(() => {
    const loadUser = async () => {
      const user = await fetchUser();
      if (user) {
        setCurrentUser(user);
      } else {
        alert("Error: Usuario no autenticado. Inicia sesión nuevamente.");
      }
    };
    loadUser();
  }, []);

  const checkUserRating = async (solutionId) => {
    if (!currentUser || !solutionId) return;

    try {
      const response = await fetch(`${VITE_API_URL}/api/check-rating/${solutionId}/${currentUser.id}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("❌ Error verificando calificación:", response.statusText);
        return;
      }

      const data = await response.json();
      console.log("📌 Estado de calificación:", data);
      setHasRated(data.hasRated);
    } catch (error) {
      console.error("❌ Error al verificar calificación:", error);
    }
  };

  const onRatingUpdated = async () => {
  try {
    const apiUrl = levelId === '3'
      ? `${VITE_API_URL}/api/levels/assigned-solutions-level3/${levelId}/${currentUser.id}`
      : `${VITE_API_URL}/api/assigned-solutions/${levelId}/${currentUser.id}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      setSolutions(data.solutions || []);
    }

    if (selectedSolution) {
      await checkUserRating(selectedSolution.id);
    }
  } catch (error) {
    console.error("❌ Error al actualizar la lista de soluciones:", error);
  }
};



  useEffect(() => {
    const fetchLatestSolutions = async () => {
  try {
    setIsLoading(true);
    const user = await fetchUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const apiUrl = levelId === '3'
      ? `${VITE_API_URL}/api/levels/assigned-solutions-level3/${levelId}/${user.id}`
      : `${VITE_API_URL}/api/assigned-solutions/${levelId}/${user.id}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      setSolutions([]);
      return;
    }

    const data = await response.json();
    console.log("📌 Soluciones obtenidas:", data);
    setSolutions(data.solutions.length > 0 ? data.solutions : []);
  } catch (error) {
    setSolutions([]);
  } finally {
    setIsLoading(false);
  }
};


    if (levelId) {
      fetchLatestSolutions();
    }
  }, [levelId]);

  useEffect(() => {
    if (selectedSolution) {
      checkUserRating(selectedSolution.id);
      fetchSimilarWords(selectedSolution.description);
    }
  }, [selectedSolution, currentUser]);

  const handleSubmitRating = async () => {
    if (!currentUser) {
      alert("Error: Usuario no autenticado");
      return;
    }

    if (!selectedSolution || !selectedSolution.id) {
      alert("Error: No se ha seleccionado una solución válida.");
      return;
    }

    if (selectedRating < 1) {
      alert("Por favor selecciona una calificación");
      return;
    }

    try {
      const response = await fetch(`${VITE_API_URL}/api/rate-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          solutionId: selectedSolution.id,
          userId: currentUser.id,
          rating: selectedRating,
          comment: comment.trim(),
          level: levelId,
        }),
      });

      if (response.ok) {
        alert("¡Calificación guardada!");
        setComment("");
        setSelectedRating(0);
        await onRatingUpdated();
      } else {
        const errorData = await response.json();
        alert("Error al guardar la calificación: " + errorData.message);
      }
    } catch (error) {
      console.error("❌ Error al guardar la calificación:", error);
      alert("Error al guardar la calificación");
    }
  };

  const fetchSimilarWords = async (description) => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/gemini/similar-words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description })
      });


      if (!response.ok) throw new Error("Error al obtener palabras similares");



      const data = await response.json();
      console.log("📌 Palabras similares obtenidas:", data);
      setSimilarWords(data.words);
    } catch (error) {
      console.error("❌ Error obteniendo palabras similares:", error);
      setSimilarWords([]);
    }
  };

  const handleAlternativeClick = async (word) => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/alternative/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          solutionId: selectedSolution.id,
          userId: currentUser.id,
          word,
          level: levelId
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al votar');
      }

      setHasVoted(true); // bloquear más votos

    } catch (error) {
      console.error('❌ Error votando por alternativa:', error);
      alert(error.message);
    }
  };


  const options = selectedSolution?.description
    ? [selectedSolution.description, ...similarWords]
    : similarWords;



  useEffect(() => {
  if (solutions.length > 0) {
    setTimeLeft(300); // o cualquier duración por nivel (en segundos)
  }
}, [solutions]);


  // Temporizador
  useEffect(() => {
    if (timeLeft === null || timerFinished) return;
    if (timeLeft <= 0) {
      setTimerFinished(true);
      // Llamar a /try-unlock para desbloquear el siguiente nivel
      if (currentUser && selectedSolution && selectedSolution.level_id) {
        fetch(`${VITE_API_URL}/api/levels/try-unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: currentUser.id, levelId: selectedSolution.level_id })
        })
        .then(() => {
          // Redirigir automáticamente a la página de estadísticas
          navigate(`/statistics/${selectedSolution.level_id}/${currentUser.id}`);
        })
        .catch(() => {
          // Redirigir aunque falle el unlock
          navigate(`/statistics/${selectedSolution.level_id}/${currentUser.id}`);
        });
      }
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, timerFinished, currentUser, selectedSolution, navigate]);

  // Formato mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };


  return (
    <div className="game-interface bg-yellow-100 min-h-screen flex flex-col">
      <div className="top-bar bg-green-500 p-2 flex justify-between items-center">
        <h2 className="font-bold">Visualización de Soluciones</h2>
        {/* Mostrar el timer */}
        {selectedSolution && timeLeft !== null && (
          <span className="bg-white text-green-700 px-4 py-2 rounded-lg font-bold border border-green-300">
            Tiempo restante: {formatTime(timeLeft)}
          </span>
        )}
        {/* El botón de volver ha sido eliminado, la redirección es automática al terminar el tiempo */}
      </div>

      <div className="flex-grow flex flex-col lg:flex-row">
        {!selectedSolution && (
          <div className="w-full lg:w-1/4 p-4 flex flex-col">
            <h3 className="font-bold mb-2">Lista de Soluciones</h3>
            <div className="bg-white rounded-lg p-4 shadow overflow-y-auto max-h-[500px]">
              {solutions.length > 0 ? (
                solutions.map((solution, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSolution(solution)}
                    className="w-full text-left p-2 mb-2 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    {new Date(solution.created_at).toLocaleString()}
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  No hay soluciones disponibles
                </p>
              )}
            </div>
          </div>
        )}

        <div className={selectedSolution ? "w-full p-4 flex flex-col items-center" : "w-full lg:w-3/4 p-4 flex flex-col items-center"}>
          {selectedSolution && (
            <div className="w-full max-w-[1400px] mx-auto flex flex-col md:flex-row md:justify-between md:items-center mb-4">
              <div className="flex-1 flex items-center justify-center md:justify-start">
                <div className="bg-white shadow-lg rounded-xl px-6 py-4 flex items-center gap-4 border-2 border-yellow-300">
                  <span className="text-4xl text-yellow-400 font-bold flex items-center">
                    ★
                    <span className="ml-2 text-3xl text-gray-800">{formatRating(selectedSolution.average_rating)}</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold text-gray-700">Calificación promedio</span>
                    <span className="text-sm text-gray-500">{selectedSolution.total_ratings || 0} calificaciones</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSolution(null)}
                className="mt-4 md:mt-0 bg-red-400 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-semibold shadow"
              >
                Volver a la lista
              </button>
            </div>
          )}

          <div className="w-full max-w-[1400px] mx-auto">
            {/* Contenedor de Solución */}
            <div className="flex-grow bg-white rounded-lg shadow-lg overflow-hidden relative w-full h-[300px] md:h-[550px]">
              {selectedSolution ? (
                <>
                  <p className="text-lg font-bold mb-4 text-center mt-2">Solución</p>
                  {(() => {
                    const rawPieces = selectedSolution.solution_data;
                    const validPieces = rawPieces.filter(
                      (p) => p && p.shape && Array.isArray(p.coordenadas) && p.coordenadas[0]
                    );
                    const coords = validPieces.map(p => p.coordenadas[0]);
                    const minX = Math.min(...coords.map(c => c.x));
                    const maxX = Math.max(...coords.map(c => c.x));
                    const minY = Math.min(...coords.map(c => c.y));
                    const maxY = Math.max(...coords.map(c => c.y));

                    const boundingWidth = maxX - minX;
                    const boundingHeight = maxY - minY;

                    const containerWidth = 1400;
                    const containerHeight = 550;

                    const offsetX = containerWidth / 2 - (minX + boundingWidth / 2);
                    const offsetY = containerHeight / 2 - (minY + boundingHeight / 2);

                    return validPieces.map((piece, index) => {
                      const { svgPath, fillColor, width, height, centerPoint } = getPieceAttributesFull(piece.shape, index);
                      const [centerX, centerY] = centerPoint.split(',').map(Number);

                      const posX = piece.coordenadas[0].x + offsetX;
                      const posY = piece.coordenadas[0].y + offsetY;

                      return (
                        <svg
                          key={index}
                          width="120"
                          height="120"
                          viewBox="-10 -10 100 100"
                          style={{
                            position: "absolute",
                            left: `${posX}px`,
                            top: `${posY}px`,
                            overflow: 'visible',
                          }}
                        >
                          <g transform={`rotate(${piece.orientacion || 0} ${centerX} ${centerY})`}>
                            <path d={svgPath} fill={fillColor} stroke="black" strokeWidth="2" />
                          </g>
                        </svg>
                      );
                    });
                  })()}
                </>
              ) : (
                <p className="text-center text-gray-500 mt-4">Selecciona una solución para visualizar</p>
              )}
            </div>

            {/* Bloques de alternativas y calificación alineados */}
            <div className="flex flex-col md:flex-row md:justify-start gap-6 mt-6">
              {/* Encuesta de palabras alternativas */}
              {selectedSolution && options.length > 0 && !hasVoted && (
                <div className="w-full md:w-1/2 lg:w-1/3 bg-gray-50 p-4 rounded shadow">
                  <p className="font-bold mb-2 text-center">
                    ¿Cuál palabra describe mejor la solución?
                  </p>
                  <div className="space-y-3">
                    {options.map((word, index) => (
                      <button
                        key={index}
                        onClick={() => handleAlternativeClick(word)}
                        disabled={hasVoted}
                        className="w-full text-left px-4 py-2 border rounded hover:bg-blue-100"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedSolution && hasVoted && currentUser && currentUser.id !== selectedSolution.user_id && !hasRated && (
                <div className="w-full md:w-1/2 lg:w-1/3 bg-gray-50 p-4 rounded shadow">
                  <p className="font-bold mb-2 text-center">Calificación:</p>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((star) => (
                      <button key={star} onClick={() => setSelectedRating(star)} className={`text-2xl ${star <= selectedRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                    rows="3"
                    placeholder="Escribe un comentario (opcional)"
                  />
                  <button
                    onClick={handleSubmitRating}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
                  >
                    Enviar Calificación
                  </button>
                </div>
              )}
            </div>
          </div>
          {selectedSolution && hasVoted && (
            <p className="mt-2 text-green-600 text-center font-semibold w-full max-w-[1400px] mx-auto">
              ¡Gracias por votar!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionsPage;