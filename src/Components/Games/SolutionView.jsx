import React, { useState, useEffect } from 'react';
import TangramPreview from './TangramPreview';

const formatRating = (rating) => {
  const numRating = parseFloat(rating);
  return isNaN(numRating) ? "0.0" : numRating.toFixed(1);
};

// Función para obtener el usuario autenticado desde la cookie
const fetchUser = async () => {
  try {
    const response = await fetch("http://localhost:3001/api/me", {
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

const SolutionView = ({
  solution,
  onRatingUpdated,
  previewWidth = 950,   
  previewHeight = 550, 
}) => {
  const [comment, setComment] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Obtener el usuario autenticado al cargar el componente
  useEffect(() => {
    const loadUser = async () => {
      const user = await fetchUser();
      if (user) setCurrentUser(user);
    };
    loadUser();
  }, []);

  // Verificar si el usuario ya calificó la solución
  useEffect(() => {
    const checkUserRating = async () => {
      if (!currentUser || currentUser.id === solution.user_id) return; // No verificar si es su propia solución

      try {
        const response = await fetch(`http://localhost:3001/api/check-rating/${solution.id}/${currentUser.id}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          console.error("❌ Error verificando calificación:", response.statusText);
          return;
        }

        const data = await response.json();
        setHasRated(data.hasRated);
      } catch (error) {
        console.error("❌ Error:", error);
      }
    };

    if (currentUser) {
      checkUserRating();
    }
  }, [solution.id, currentUser]);

  // Enviar la calificación
  const handleSubmitRating = async () => {
    if (selectedRating < 1) {
      alert('Por favor selecciona una calificación');
      return;
    }

    if (!currentUser) {
      alert("Error: Usuario no autenticado");
      return;
    }

    if (currentUser.id === solution.user_id) {
      alert("No puedes calificar tu propia solución.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/rate-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          solutionId: solution.id,
          userId: currentUser.id,
          rating: selectedRating,
          comment: comment.trim(),
        }),
      });

      if (response.ok) {
        alert('¡Calificación guardada!');
        setComment('');
        setSelectedRating(0);
        setHasRated(true);
        if (onRatingUpdated) onRatingUpdated();
      } else {
        alert('Error al guardar la calificación');
      }
    } catch (error) {
      console.error("❌ Error al guardar la calificación:", error);
      alert("Error al guardar la calificación");
    }
  };

  return (
    <div 
      className="border rounded-lg mb-4 p-4"
      style={{ height: '700px' }} 
    >
      <div className="flex h-full gap-4">
        {/* Vista del Tangram y detalles */}
        <div className="flex-1 bg-white p-4 rounded overflow-auto">
          <h3 className="font-bold text-xl mb-2">
            {solution.nombre} {solution.apellido}
          </h3>
          <p className="text-gray-600 mb-2">
            {new Date(solution.created_at).toLocaleString()}
          </p>
          <div 
            className="border rounded mb-4"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
              overflow: 'auto'
            }}
          >
            <TangramPreview 
              solutionData={solution.solution_data}
              panelWidth={previewWidth}
              panelHeight={previewHeight}
            />
          </div>
          <p className="mb-2">{solution.description}</p>
          <p className="text-sm text-gray-600">
            Calificación promedio: {formatRating(solution.average_rating)}
            ({solution.total_ratings || 0} calificaciones)
          </p>
        </div>

        {/* Formulario de calificación */}
        <div className="w-1/3 bg-gray-50 p-4 rounded">
          {currentUser && currentUser.id === solution.user_id ? (
            <div className="text-center p-4 bg-yellow-100 border border-yellow-500 rounded">
              <p className="text-lg text-yellow-700 font-bold">No puedes calificar tu propia solución.</p>
            </div>
          ) : hasRated ? (
            <div className="text-center p-4">
              <p className="text-lg text-gray-600">Ya has calificado esta solución</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="font-bold mb-2">Calificación:</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      className={`text-2xl ${
                        star <= selectedRating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="font-bold mb-2">Comentario:</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>
              <button
                onClick={handleSubmitRating}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Enviar Calificación
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionView;
