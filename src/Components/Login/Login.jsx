import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

// Componente de formulario de consentimiento
const ConsentForm = ({ onAccept, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div
        className={`bg-white rounded-lg shadow-xl transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-full max-w-4xl h-[90vh] p-6 sm:p-10 overflow-y-auto' : 'w-full max-w-md p-6 sm:p-8'
        }`}
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Términos y Condiciones</h2>
        <div
          className={`border border-gray-300 rounded p-4 bg-gray-50 mb-4 ${
            isExpanded ? 'max-h-[70vh] overflow-y-auto' : 'max-h-48 sm:max-h-60 overflow-y-auto'
          }`}
        >
          <p className="text-gray-700 text-sm sm:text-base whitespace-pre-line">
  {`FORMULARIO DE ASENTIMIENTO PARA ENCUESTA A MENOR DE EDAD

Estimado estudiante:

El propósito de este documento es entregarte toda la información necesaria para que puedas decidir si quieres participar o no en un proyecto de investigación que estamos realizando en tu escuela. El objetivo de este estudio es diseñar, implementar y estudiar actividades digitales que utilizan tecnología para conocer cuáles son tus habilidades de colaboración, comunicación, creatividad y pensamiento crítico, y ayudarte a desarrollarlas.

Antes de tomar esta decisión, es importante que sepas lo siguiente:

1. Tu participación en este estudio ha sido autorizada por tus padres; sin embargo, si tú prefieres no participar, nadie te puede obligar a hacerlo.

2. Tu participación consiste en realizar una serie de actividades digitales, como simulaciones y videojuegos, que registrarán tus respuestas y cómo interactúas con ellas. Estas actividades durarán aproximadamente 1 hora y media y se realizarán en tu escuela. Nadie (ni tus padres, ni tus profesores, ni tus compañeros) conocerá tus respuestas: es decir, tu participación será confidencial, sin que se dé a conocer tu nombre. Tu participación es voluntaria, puedes no contestar ciertas preguntas o retirarte en cualquier momento; el que tú decidas no participar o no contestar todas las preguntas no tendrá ninguna consecuencia para ti; ni tus padres ni tus profesores o compañeros sabrán si tú decidiste participar o no en el estudio.

3. Tus respuestas serán utilizadas únicamente para los fines de esta investigación.

4. Tu participación es voluntaria; puedes decidir no participar en cualquier momento, y si eliges no participar o no contestar todas las preguntas, no tendrá ninguna consecuencia para ti. Ni tus padres, ni tus profesores, ni tus compañeros sabrán si decidiste participar o no en el estudio.

5. Es importante que sepas que no hay beneficios personales para ti al participar en este proyecto, pero tampoco tendrás molestias, más allá de estar ese tiempo realizando las actividades digitales en el computador o tablet.

6. En el caso que tengas más preguntas sobre esta investigación, se las puedes hacer a la persona que está dirigiendo la actividad, o puedes pedirle a tus padres que te ayuden a contactarte con la Investigadora Responsable del estudio, quien con mucho gusto responderá tus dudas.

Declaro que he leído y comprendido esta página y estoy de acuerdo en participar en este estudio.`}
</p>

        </div>
        <div className="mb-4 text-right">
          <button
            onClick={toggleExpand}
            className="text-blue-600 hover:underline text-sm sm:text-base"
          >
            {isExpanded ? 'Ver menos' : 'Ver más'}
          </button>
        </div>
        {!isExpanded && (
          <div className="flex space-x-4 justify-end">
            <button
              onClick={onReject}
              className="bg-red-500 hover:bg-red-600 text-white py-2.5 px-6 sm:px-8 rounded-lg font-medium text-sm sm:text-base transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 text-white py-2.5 px-6 sm:px-8 rounded-lg font-medium text-sm sm:text-base transition-colors"
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

  const VITE_API_URL = "http://172.17.0.1:3001";

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchCourses(selectedSchool);
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

  const fetchCourses = async (schoolId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${VITE_API_URL}/api/schools/${schoolId}/courses`);
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(`No se pudieron cargar los cursos. Intenta de nuevo.`);
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
          nivel_curso: selectedCourse,
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
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md sm:max-w-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-gray-900">
          Inicia sesión para continuar
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 px-4 py-3 rounded-md text-sm sm:text-base">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="school" className="block text-sm sm:text-base font-medium text-gray-700">
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
                className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-gray-900 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="course" className="block text-sm sm:text-base font-medium text-gray-700">
                Selecciona tu curso
              </label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedStudent('');
                }}
                className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-gray-900 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="student" className="block text-sm sm:text-base font-medium text-gray-700">
                Selecciona tu nombre
              </label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-gray-900 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md text-sm sm:text-base hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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