import React, { useState, useEffect } from "react";
import Cookies from "js-cookie"; 
import SolutionView from "./SolutionView";

const SolutionsList = ({ levelId }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [latestSolutions, setLatestSolutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 5;

    const VITE_API_URL= " https://3143-152-230-102-21.ngrok-free.app";

    const fetchUser = async () => {
        try {
          const response = await fetch(`${VITE_API_URL}/api/me`, {
            method: "GET",
            credentials: "include", // 🔥 Asegurar que la cookie se envíe
          });
      
          if (!response.ok) throw new Error("Usuario no autenticado");
      
          const user = await response.json();
          console.log("✅ Usuario obtenido desde el backend:", user);
          return user;
        } catch (err) {
          console.error("❌ Error obteniendo usuario:", err);
          return null;
        }
      };

      const fetchLatestSolutions = async (page) => {
        try {
            setIsLoading(true);
    
            const user = await fetchUser();
            if (!user) {
                setIsLoading(false);
                return;
            }
    
            console.log(`📤 Enviando petición a /api/solutions/${levelId} con userId=${user.id}`);
    
            const response = await fetch(
                `${VITE_API_URL}/api/solutions/${levelId}?page=${page}&limit=${itemsPerPage}&userId=${user.id}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ Error obteniendo soluciones:", errorData.message || response.statusText);
                setLatestSolutions([]);
                setTotalPages(1);
                return;
            }
    
            const data = await response.json();
            console.log("📌 Respuesta del backend:", data);
    
            if (data && data.solutions.length > 0) {
                setLatestSolutions(data.solutions);
                setTotalPages(Math.ceil(data.total / itemsPerPage));
            } else {
                console.warn("⚠ No se encontraron soluciones para este nivel.");
                setLatestSolutions([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("❌ Error al obtener soluciones:", error);
            setLatestSolutions([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    };
    
    

    useEffect(() => {
        if (levelId) {
            fetchLatestSolutions(currentPage);
        }
    }, [currentPage, levelId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="text-lg text-gray-600">Cargando soluciones...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-auto overflow-y-auto space-y-4 pr-2">
                {latestSolutions.length > 0 ? (
                    latestSolutions.map((solution) => (
                        <SolutionView
                            key={solution.id}
                            solution={solution}
                            onRatingUpdated={() => fetchLatestSolutions(currentPage)}
                            previewWidth={950}
                            previewHeight={550}
                            scaleFactor={1}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 text-lg">
                        No hay soluciones disponibles
                    </div>
                )}
            </div>

            {latestSolutions.length > 0 && totalPages > 1 && (
                <div className="flex-none flex justify-center gap-2 pt-4">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
                    >
                        Anterior
                    </button>

                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`px-4 py-2 rounded transition-colors ${
                                currentPage === index + 1
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 hover:bg-gray-300"
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
};

export default SolutionsList;
