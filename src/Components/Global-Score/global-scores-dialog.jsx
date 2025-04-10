import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export default function GlobalScoresDialog({ open, onClose }) {
  const [ratings, setRatings] = useState([]); // Estado para almacenar average_rating
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const VITE_API_URL = "http://192.168.7.203:3001"

  

  useEffect(() => {
    if (open) {
      const fetchRatings = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(`${VITE_API_URL}/api/solutions/average-ratings`, {
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudieron obtener los ratings`);
          }

          const data = await response.json();

          // ✅ Usamos data.ratings porque la API devuelve { ratings: [...] }
          if (Array.isArray(data.solutions)) {
            setRatings(data.solutions);
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
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ratings Promedio</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-center p-4">Cargando datos...</div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : (
          <div className="overflow-auto max-h-96">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Rating Promedio</th>
                </tr>
              </thead>
              <tbody>
                {ratings.length > 0 ? (
                  ratings.map((rating, index) => (
                    <tr key={index} className="text-center">
                      <td className="border border-gray-300 px-4 py-2">{rating.average_rating.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      No hay calificaciones disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
