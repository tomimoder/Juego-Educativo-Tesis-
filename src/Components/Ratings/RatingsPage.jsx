import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RatingsPage() {
  const [ratings, setRatings] = useState([]); // Estado para almacenar los ratings
  const [currentUserId, setCurrentUserId] = useState(null); // Estado para el ID del usuario actual
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const VITE_API_URL = "http://192.168.7.203:3001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual
        const userResponse = await fetch(`${VITE_API_URL}/api/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!userResponse.ok) {
          throw new Error(`Error ${userResponse.status}: No se pudo obtener el usuario actual`);
        }

        const userData = await userResponse.json();
        setCurrentUserId(userData.id); // Usamos 'id' como devuelve /api/me

        // Obtener los ratings
        const ratingsResponse = await fetch(`${VITE_API_URL}/api/average-ratings`, {
          credentials: "include",
        });

        if (!ratingsResponse.ok) {
          throw new Error(`Error ${ratingsResponse.status}: No se pudieron obtener los ratings`);
        }

        const ratingsData = await ratingsResponse.json();
        console.log("📌 Ratings obtenidos:", ratingsData);
        if (Array.isArray(ratingsData.ratings)) {
          // Ordenamos por average_rating de mayor a menor
          const sortedRatings = ratingsData.ratings.sort(
            (a, b) => parseFloat(b.average_rating) - parseFloat(a.average_rating)
          );
          setRatings(sortedRatings);
        } else {
          console.error("Error: La API no devolvió un array en la propiedad 'ratings'", ratingsData);
          setRatings([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setRatings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Encontrar el índice del usuario actual y los usuarios cercanos
  const currentUserIndex = currentUserId
    ? ratings.findIndex((rating) => rating.user_id === currentUserId) // Usamos 'user_id' como en ratings
    : -1;
  const displayRatings = [];

  if (currentUserIndex >= 0) {
    // Añadir usuario de arriba (si no es el primero)
    if (currentUserIndex > 0) {
      displayRatings.push({ ...ratings[currentUserIndex - 1], position: currentUserIndex });
    }
    // Añadir usuario actual
    displayRatings.push({ ...ratings[currentUserIndex], position: currentUserIndex + 1 });
    // Añadir usuario de abajo (si no es el último)
    if (currentUserIndex < ratings.length - 1) {
      displayRatings.push({ ...ratings[currentUserIndex + 1], position: currentUserIndex + 2 });
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu Posición en el Ranking</h1>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Volver
      </button>

      {loading ? (
        <div className="text-xl text-gray-600">Cargando datos...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : !currentUserId ? (
        <div className="text-red-500">No se pudo identificar al usuario actual</div>
      ) : currentUserIndex < 0 ? (
        <div className="text-red-500">No se encontró el usuario en el ranking</div>
      ) : (
        <div className="overflow-auto max-h-96 w-full max-w-lg">
          <table className="w-full border-collapse border border-gray-300 bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Posición</th>
                <th className="border border-gray-300 px-4 py-2">Usuario</th>
                <th className="border border-gray-300 px-4 py-2">Rating Promedio</th>
                <th className="border border-gray-300 px-4 py-2">Total Calificaciones</th>
              </tr>
            </thead>
            <tbody>
              {displayRatings.length > 0 ? (
                displayRatings.map((rating) => (
                  <tr
                    key={rating.user_id} // Usamos 'user_id' como clave
                    className={`text-center ${rating.user_id === currentUserId ? "bg-yellow-100" : ""}`} // Usamos 'user_id' para resaltar
                  >
                    <td className="border border-gray-300 px-4 py-2">{rating.position}</td>
                    <td className="border border-gray-300 px-4 py-2">{`${rating.nombre || "Desconocido"} ${
                      rating.apellido || ""
                    }`}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {isNaN(parseFloat(rating.average_rating))
                        ? "0.00"
                        : parseFloat(rating.average_rating).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{rating.total_ratings || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border border-gray-300 px-4 py-2 text-center">
                    No hay calificaciones disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}