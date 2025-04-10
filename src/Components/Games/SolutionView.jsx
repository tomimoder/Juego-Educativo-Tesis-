import React, { useState, useEffect } from 'react';

const formatRating = (rating) => {
  const numRating = parseFloat(rating);
  return isNaN(numRating) ? "0.0" : numRating.toFixed(1);
};

const fetchUser = async () => {
  const VITE_API_URL = "http://192.168.7.203:3001"

  try {
    const response = await fetch(`${VITE_API_URL}/api/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Usuario no autenticado");

    const user = await response.json();
    console.log("✅ Usuario obtenido desde la cookie:", user);
    return user;
  } catch (err) {
    console.error("❌ Error obteniendo usuario:", err);
    alert("Error: Usuario no autenticado. Inicia sesión nuevamente.");
    return null;
  }
};

const getPieceShape = (shape) => {
  switch (shape) {
    case 'large-triangle':
      return 'polygon(0 0, 100% 0, 50% 100%)';
    case 'medium-triangle':
      return 'polygon(0 0, 75% 0, 37.5% 75%)';
    case 'small-triangle':
      return 'polygon(0 0, 50% 0, 25% 50%)';
    case 'diamond':
      return 'polygon(50% 0, 100% 50%, 50% 100%, 0% 50%)';
    case 'parallelogram':
      return 'polygon(0 0, 80% 0, 100% 50%, 20% 50%)';
    default:
      return '';
  }
};

const getPieceColor = (shape) => {
  const colors = {
    'large-triangle': 'red',
    'medium-triangle': 'green',
    'small-triangle': 'purple',
    'diamond': 'gray',
    'parallelogram': 'blue'
  };
  return colors[shape] || 'gray';
};

const getBaseSize = (shape) => {
  const base = {
    'large-triangle': { w: 200, h: 200 },
    'medium-triangle': { w: 150, h: 150 },
    'small-triangle': { w: 100, h: 100 },
    'diamond': { w: 100, h: 100 },
    'parallelogram': { w: 150, h: 100 }
  };
  return base[shape] || { w: 50, h: 50 };
};

const SolutionView = ({
  solution,
  onRatingUpdated,
}) => {
  const [comment, setComment] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await fetchUser();
      if (user) setCurrentUser(user);
    };
    loadUser();
  }, []);

  return (
    <div className="game-interface bg-yellow-100 min-h-screen flex flex-col">
      <div className="top-bar bg-green-500 p-2 flex justify-between items-center">
        <h2 className="font-bold">Solución Guardada</h2>
      </div>
      
      <div className="flex-grow flex">
        <div className="w-3/4 p-4 flex flex-col">
          <div className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4" style={{ height: '550px', width: '1400px', position: 'relative' }}>
            {solution.solution_data.map((piece, index) => {
              if (!piece.coordenadas?.[0]) return null;
              const { x, y } = piece.coordenadas[0];
              const { w, h } = getBaseSize(piece.shape);

              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${w}px`,
                    height: `${h}px`,
                    backgroundColor: getPieceColor(piece.shape),
                    transform: `rotate(${piece.orientacion || 0}deg)`,
                    transformOrigin: '50% 50%',
                    clipPath: getPieceShape(piece.shape),
                    pointerEvents: 'none'
                  }}
                />
              );
            })}
          </div>
        </div>
        
        <div className="w-1/4 p-4 flex flex-col">
          <div className="bg-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold">{solution.nombre} {solution.apellido}</h3>
            <p className="text-gray-600">{new Date(solution.created_at).toLocaleString()}</p>
            <p>{solution.description}</p>
            <p className="text-sm text-gray-600">
              Calificación promedio: {formatRating(solution.average_rating)} ({solution.total_ratings || 0} calificaciones)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionView;
