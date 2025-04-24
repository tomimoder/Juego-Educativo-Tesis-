import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

// Componente de formulario de consentimiento (sin cambios)
const ConsentForm = ({ onAccept, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-white rounded-lg shadow-xl transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-full h-full max-w-4xl p-10 overflow-y-auto' : 'max-w-md w-full p-8'
        }`}
      >
        <h2 className="text-2xl font-bold mb-4">Términos y Condiciones</h2>
        <div
          className={`border border-gray-300 rounded p-4 bg-gray-50 mb-4 ${
            isExpanded ? 'h-[calc(100vh-300px)] overflow-y-auto' : 'max-h-40 overflow-y-auto'
          }`}
        >
          <p className="text-gray-700 whitespace-pre-line">
            Al utilizar nuestra aplicación, aceptas nuestros términos y condiciones...
            {/* Texto sin cambios */}
          </p>
        </div>
        <div className="mb-4 text-right">
          <button
            onClick={toggleExpand}
            className="text-blue-600 hover:underline text-sm"
          >
            {isExpanded ? 'Ver menos' : 'Ver más'}
          </button>
        </div>
        {!isExpanded && (
          <div className="flex space-x-4 justify-end">
            <button
              onClick={onReject}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg font-medium transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-medium transition-colors"
            >
              Aceptar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Login({ onLogin }) {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const VITE_API_URL = "http://192.168.7.203:3001";

  // Lista de cursos posibles (basada en la estructura de la tabla)
  const availableCourses = [
    '1° Basico A', '1° Basico B', '2° Basico A', '2° Basico B', '3° Basico A', '3° Basico B',
    '4° Basico A', '4° Basico B', '5° Basico A', '5° Basico B', '6° Basico A', '6° Basico B',
    '7° Basico A', '7° Basico B', '8° Basico A', '8° Basico B', 'I° Medio A', 'I° Medio B',
    'II° Medio A', 'II° Medio B', 'III° Medio A', 'III° Medio B', 'IV° Medio A', 'IV° Medio B',
  ];

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      // Obtener cursos disponibles para el colegio (puedes ajustar esto según el backend)
      setCourses(availableCourses); // Por ahora, usamos la lista estática
      setSelectedCourse('');
      setStudents([]);
      setSelectedStudent('');
    } else {
      setCourses([]);
      setSelectedCourse('');
      setStudents([]);
      setSelectedStudent('');
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedSchool && selectedCourse) {
      fetchStudents(selectedSchool, selectedCourse);
    } else {
      setStudents([]);
      setSelectedStudent('');
    }
  }, [selectedSchool, selectedCourse]);

  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${VITE_API_URL}/api/schools`);
      setSchools(response.data);
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError(`No se pudieron cargar los colegios. Intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (schoolId, nivelCurso) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${VITE_API_URL}/api/schools/${schoolId}/students`,
        { params: { nivel_curso: nivelCurso } }
      );
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(`No se pudieron cargar los estudiantes. Intenta de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!selectedSchool || !selectedCourse || !selectedStudent) {
      setError("Por favor, selecciona un colegio, curso y estudiante.");
      return;
    }

    const student = students.find((s) => s.id.toString() === selectedStudent);
    if (!student) {
      setError("Por favor, selecciona un estudiante válido.");
      return;
    }

    try {
      const response = await fetch(`${VITE_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          schoolId: selectedSchool,
          nombre: student.nombre,
          apellido: student.apellido,
          nivel_curso: selectedCourse, // Incluimos el curso en el login
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Credenciales inválidas, intenta de nuevo.");
        return;
      }

      const data = await response.json();
      console.log("🔍 Respuesta del backend:", data);

      if (!data.user) {
        setError("Error: No se recibió información del usuario.");
        return;
      }

      setCurrentUser(data.user);
      setShowConsent(true);
    } catch (error) {
      console.error("❌ Login fallido:", error);
      setError("Error de conexión, intenta de nuevo.");
    }
  };

  const handleAcceptConsent = () => {
    Cookies.set("userSession", JSON.stringify(currentUser), {
      expires: 1,
      sameSite: "Lax",
      secure: false,
    });
    Cookies.set("userConsent", "accepted", {
      expires: 30,
      sameSite: "Lax",
      secure: false,
    });
    console.log("✅ Consentimiento aceptado, redirigiendo a niveles");
    navigate("/levels");
  };

  const handleRejectConsent = () => {
    console.log("❌ Consentimiento rechazado");
    setCurrentUser(null);
    setShowConsent(false);
    setSelectedStudent('');
    setError("Debes aceptar los términos y condiciones para continuar.");
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Inicia sesión para continuar
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="school" className="block text-sm font-medium text-gray-700">
                Selecciona tu colegio
              </label>
              <select
                id="school"
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setSelectedCourse('');
                  setSelectedStudent('');
                }}
                className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Escoger colegio</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                Selecciona tu curso
              </label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedStudent('');
                }}
                className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={!selectedSchool}
              >
                <option value="">Escoger curso</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                Selecciona tu nombre
              </label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={!selectedCourse}
              >
                <option value="">Nombre de estudiante</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nombre} {student.apellido}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedSchool || !selectedCourse || !selectedStudent}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Jugar
            </button>
          </form>
        </div>
      </div>

      {showConsent && (
        <ConsentForm onAccept={handleAcceptConsent} onReject={handleRejectConsent} />
      )}
    </div>
  );
}