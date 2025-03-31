import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const formatRating = (rating) => {
  const numRating = parseFloat(rating);
  return isNaN(numRating) ? "0.0" : numRating.toFixed(1);
};

const fetchUser = async () => {
  try {
    const response = await fetch("http://localhost:3001/api/me", {
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
      return { svgPath: "M 0 0 L 140 0 L 70 70 Z", fillColor: "#FFA500", width: 140, height: 140, centerPoint: "70,23.33"};
    case 'large-triangle2':
      return { svgPath: "M 0 0 L 140 0 L 70 70 Z", fillColor: "#7FFFD4", width: 140, height: 140, centerPoint: "70,23.33"};
    case 'medium-triangle':
      return { svgPath: "M 0 0 L 100 0 L 50 50 Z", fillColor: "#FFD700", width: 100, height: 100, centerPoint: "50,16.67"};
    case 'small-triangle':
      return { svgPath: "M 0 0 L 70 0 L 35 35 Z", fillColor: id === 4 ? "#00BFFF" : "#32CD32", width: 70, height: 70, centerPoint: "35,11.67"};
    case 'diamond':
      return { svgPath: "M 0 35 L 35 0 L 70 35 L 35 70 Z", fillColor: "#FF0000", width: 70, height: 70, centerPoint: "35,35"};
    case 'parallelogram':
      return { svgPath: "M 90 25 H 25 L 0 50 L 65 50 Z", fillColor: "#0000FF", width: 90, height: 50, centerPoint: "45,37.5"};
    default:
      return { svgPath: "", fillColor: "gray", width: 50, height: 50, centerPoint: "25,25"};
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
      const response = await fetch(`http://localhost:3001/api/check-rating/${solutionId}/${currentUser.id}`, {
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
      const response = await fetch(`http://localhost:3001/api/solutions/${levelId}?userId=${currentUser.id}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSolutions(data.solutions.length > 0 ? data.solutions : []);
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
    
        const response = await fetch(`http://localhost:3001/api/assigned-solutions/${levelId}/${user.id}`, {
          method: "GET",
          credentials: "include",
        });
    
        if (!response.ok) {
          setSolutions([]);
          return;
        }
    
        const data = await response.json();
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
      const response = await fetch("http://localhost:3001/api/rate-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          solutionId: selectedSolution.id,
          userId: currentUser.id,
          rating: selectedRating,
          comment: comment.trim(),
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

  return (
    <div className="game-interface bg-yellow-100 min-h-screen flex flex-col">
      <div className="top-bar bg-green-500 p-2 flex justify-between items-center">
        <h2 className="font-bold">Visualización de Soluciones</h2>
        <button
          onClick={() => navigate("/levels")}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          ← Volver
        </button>
      </div>
  
      <div className="flex-grow flex">
        {!selectedSolution && (
          <div className="w-1/4 p-4 flex flex-col">
            <h3 className="font-bold mb-2">Lista de Soluciones</h3>
            <div
              className="bg-white rounded-lg p-4 shadow overflow-y-auto"
              style={{ maxHeight: "500px" }}
            >
              {solutions.length > 0 ? (
                solutions.map((solution, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSolution(solution)}
                    className="w-full text-left p-2 mb-2 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    {solution.nombre} -{" "}
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
  
        <div className={selectedSolution ? "w-full p-4 flex flex-col items-center" : "w-3/4 p-4 flex flex-col items-center"}>
          {selectedSolution && (
            <div className="w-full bg-gray-100 p-4 rounded-lg mb-4 shadow-lg flex justify-between items-center">
              <div>
                <p className="mb-2 font-semibold">{selectedSolution.description}</p>
                <p className="text-sm text-gray-600">
                  Calificación promedio:{" "}
                  {formatRating(selectedSolution.average_rating)} (
                  {selectedSolution.total_ratings || 0} calificaciones)
                </p>
              </div>
              <button
                onClick={() => setSelectedSolution(null)}
                className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded-lg"
              >
                Volver a la lista
              </button>
            </div>
          )}
  
          <div
          className="flex-grow bg-white rounded-lg shadow-lg overflow-hidden relative"
          style={{ height: "550px", width: "1400px" }}
        >
          {selectedSolution ? (
            <>
              <p className="text-lg font-bold mb-4">{selectedSolution.nombre} Solución</p>
              {(() => {
                const rawPieces = selectedSolution.solution_data;

                // 🔹 Filtrar piezas válidas
                const validPieces = rawPieces.filter(
                  (p) => p && p.shape && Array.isArray(p.coordenadas) && p.coordenadas[0]
                );

                // 🔹 Calcular bounding box
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

                // 🔹 Renderizar piezas válidas
                return validPieces.map((piece, index) => {
                  console.log("📌 Pieza:", piece.shape, piece.coordenadas[0]);

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
            <p className="text-center text-gray-500">Selecciona una solución para visualizar</p>
          )}
        </div>

        </div>
      </div>
      {selectedSolution && currentUser && currentUser.id !== selectedSolution.user_id && !hasRated && (
            <div className="w-1/3 bg-gray-50 p-4 rounded">
              <p className="font-bold mb-2">Calificación:</p>
              {[1, 2, 3, 4, 5, 6, 7].map((star) => (
                <button key={star} onClick={() => setSelectedRating(star)} className={`text-2xl ${star <= selectedRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </button>
              ))}
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2 border rounded" rows="3" />
              <button onClick={handleSubmitRating} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Enviar Calificación</button>
            </div>
          )}
    </div>
  );
  
};

export default SolutionsPage;
