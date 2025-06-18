import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import SolutionView from "./SolutionView";

const SolutionsList = ({ levelId }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [latestSolutions, setLatestSolutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unlocked, setUnlocked] = useState(false); // ✅ NUEVO estado
    const itemsPerPage = 5;
    const VITE_API_URL = "http://172.17.0.1:3001";

    const fetchUser = async () => {
        try {
            const response = await fetch(`${VITE_API_URL}/api/me`, {
                method: "GET",
                credentials: "include",
            });
            if (!response.ok) throw new Error("Usuario no autenticado");
            const user = await response.json();
            return user;
        } catch (err) {
            console.error("❌ Error obteniendo usuario:", err);
            return null;
        }
    };

    const tryUnlockNextLevel = async (userId) => {
        try {
            const response = await fetch(`${VITE_API_URL}/api/levels/try-unlock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ userId, levelId }),
            });
            const data = await response.json();
            if (data.success && data.unlocked) {
                setUnlocked(true);
            }
        } catch (error) {
            console.error("❌ Error al intentar desbloquear siguiente nivel:", error);
        }
    };

    const fetchLatestSolutions = async () => {
        try {
            setIsLoading(true);
            const user = await fetchUser();
            if (!user) return;

            let apiUrl;

            if (levelId === "3") {
            apiUrl = `${VITE_API_URL}/api/levels/assigned-solutions-level3/${levelId}/${user.id}`;
            } else {
            apiUrl = `${VITE_API_URL}/api/levels/assigned-solutions/${levelId}/${user.id}`;
            }

            const response = await fetch(apiUrl, {
            method: "GET",
            credentials: "include",
            });

            if (!response.ok) {
            setLatestSolutions([]);
            return;
            }

            const data = await response.json();
            console.log(data);
            setLatestSolutions(data.solutions || []);
            await tryUnlockNextLevel(user.id);
        } catch (error) {
            console.error("❌ Error al obtener soluciones:", error);
            setLatestSolutions([]);
        } finally {
            setIsLoading(false);
        }
        };


        useEffect(() => {
        if (levelId) {
            fetchLatestSolutions();
        }
        }, [levelId]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="text-lg text-gray-600">Cargando soluciones...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {unlocked && (
                <div className="bg-green-200 text-green-800 p-2 mb-4 rounded text-center font-semibold">
                    ✅ ¡Has calificado todas las soluciones! El siguiente nivel ha sido desbloqueado.
                </div>
            )}

            <div className="flex-auto overflow-y-auto space-y-4 pr-2">
                {latestSolutions.length > 0 ? (
                    latestSolutions.map((solution) => (
                        <SolutionView
                            key={solution.id}
                            solution={solution}
                            onRatingUpdated={() => fetchLatestSolutions()} // ✅ se vuelve a verificar
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
