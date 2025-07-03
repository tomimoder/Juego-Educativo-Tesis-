import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function LevelStatistics() {
  const { levelId, userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutos
  const API_URL = "http://192.168.7.243:3001";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/levels/statistics/${levelId}/${userId}`, {
          withCredentials: true,
        });
        setData(res.data);
        setFeedback(res.data.feedback);
        setLoading(false);
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
        setLoading(false);
      }
    };

    if (levelId && userId) {
      fetchStats();
    } else {
      setLoading(false);
      console.error("Faltan parámetros en URL");
    }
  }, [levelId, userId]);

  useEffect(() => {
    if (timer === null) return;
    if (timer <= 0) {
      navigate('/levels');
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, navigate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-200 flex items-center justify-center">
        <div className="text-xl font-bold text-purple-700">Cargando estadísticas...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-yellow-200 flex flex-col items-center justify-center text-center px-4">
        <div className="text-xl font-bold text-red-600 mb-4">No se pudieron cargar las estadísticas</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-200 flex items-center justify-center px-4 py-8">
      <div className="bg-yellow-300 p-6 sm:p-10 rounded-3xl shadow-lg w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-purple-800 text-center">
            📊 Estadísticas del Nivel {levelId}
          </h1>
          <span className="bg-white text-green-700 px-4 py-2 rounded-lg font-bold border border-green-300">
            Tiempo restante: {formatTime(timer)}
          </span>
        </div>

        <div className="space-y-3 text-base text-gray-800">
          <p><strong>📝 Tu descripción:</strong> {data.description}</p>
          <p><strong>🏆 Descripción más votada:</strong> {data.top_alternative} ({data.top_alternative_votes} votos)</p>
          <p><strong>⭐ Calificación promedio:</strong> {data.average_rating.toFixed(2)}</p>
          <p><strong>👍 Total de calificaciones:</strong> {data.total_ratings}</p>
          <p><strong>👣 Total de movimientos:</strong> {data.total_moves}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-purple-700 mb-2">🧠 Feedback generado por IA:</h2>
          {editing ? (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
              rows={6}
            />
          ) : (
            <div className="bg-gray-100 p-4 rounded text-sm">{feedback}</div>
          )}

          <div className="flex justify-end mt-3">
          </div>
        </div>
      </div>
    </div>
  );
}