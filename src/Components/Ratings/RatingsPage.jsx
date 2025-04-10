import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RatingsPage() {
  const [ratings, setRatings] = useState([]); // Estado para almacenar los ratings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const VITE_API_URL = "http://192.168.7.203:3001"


  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${VITE_API_URL}/api/average-ratings`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron obtener los ratings`);
        }

        const data = await response.json();
        console.log("📌 Ratings obtenidos:", data);
        // ✅ Usamos data.ratings porque la API devuelve { ratings: [...] }
        if (Array.isArray(data.ratings)) {
          setRatings(data.ratings);
        } else {
          console.error("Error: La API no devolvió un array en la propiedad 'ratings'", data);
          setRatings([]); // Evita errores en el renderizado
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
        setError(err.message);
        setRatings([]); // Evitar que sea undefined
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Ratings Promedio</h1>
      <button
        onClick={() => navigate(-1)} // Regresa a la página anterior
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Volver
      </button>

      {loading ? (
        <div className="text-xl text-gray-600">Cargando datos...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-auto max-h-96 w-full max-w-lg">
          <table className="w-full border-collapse border border-gray-300 bg-white">
          <thead>
            <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Usuario</th>
                <th className="border border-gray-300 px-4 py-2">Rating Promedio</th>
                <th className="border border-gray-300 px-4 py-2">Total Calificaciones</th>
            </tr>
            </thead>
            <tbody>
                {ratings.length > 0 ? (
                    ratings.map((rating, index) => (
                    <tr key={index} className="text-center">
                        <td className="border border-gray-300 px-4 py-2">{`${rating.nombre || 'Desconocido'} ${rating.apellido || ''}`}</td>
                        <td className="border border-gray-300 px-4 py-2">
                        {isNaN(parseFloat(rating.average_rating)) ? "0.00" : parseFloat(rating.average_rating).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{rating.total_ratings || 0}</td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="3" className="border border-gray-300 px-4 py-2 text-center">
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
