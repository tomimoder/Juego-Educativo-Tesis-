import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';


// Componente de formulario de consentimiento
const ConsentForm = ({ onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Términos y Condiciones</h2>
        
        <div className="mb-6 max-h-60 overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50">
          <p className="text-gray-700">
            Al utilizar nuestra aplicación, aceptas nuestros términos y condiciones. 
            Recopilamos información sobre tu uso para mejorar la experiencia educativa y 
            proporcionar servicios personalizados. Tu información está protegida y solo 
            se utiliza para los fines establecidos en nuestra política de privacidad.
            
            Nos comprometemos a proteger la privacidad de los estudiantes y cumplir con 
            todas las leyes y regulaciones aplicables relacionadas con la protección de datos.
          </p>
        </div>
        
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
      </div>
    </div>
  );
};

export default function Login({ onLogin }) {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const VITE_API_URL= "http://192.168.7.126:3001";

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchStudents(selectedSchool);
    } else {
      setStudents([]);
      setSelectedStudent('');
    }
  }, [selectedSchool]);

  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${VITE_API_URL}/api/schools`);
      console.log(response);
      setSchools(response.data);
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError(`Failed to fetch schools. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (schoolId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${VITE_API_URL}/api/schools/${schoolId}/students`);
      console.log(response);
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(`Failed to fetch students. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
  
    const student = students.find(s => s.id.toString() === selectedStudent);
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
          apellido: student.apellido 
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
      
      // Guardar el usuario actual para usarlo después del consentimiento
      setCurrentUser(data.user);
      
      // Mostrar el formulario de consentimiento en lugar de redirigir inmediatamente
      setShowConsent(true);
      
    } catch (error) {
      console.error("❌ Login fallido:", error);
      setError("Error de conexión, intenta de nuevo.");
    }
  };
  
  const handleAcceptConsent = () => {
    // Guardar en cookies el usuario y posiblemente el estado de consentimiento
    Cookies.set("userSession", JSON.stringify(currentUser), { 
      expires: 1, 
      sameSite: "Lax",
      secure: false, // Cambia a `true` en producción con HTTPS
    });
    
    // También puedes guardar el estado del consentimiento
    Cookies.set("userConsent", "accepted", { 
      expires: 30, // El consentimiento puede durar más tiempo
      sameSite: "Lax",
      secure: false,
    });
    
    console.log("✅ Consentimiento aceptado, redirigiendo a niveles");
    navigate("/levels");
  };
  
  const handleRejectConsent = () => {
    // Rechazar consentimiento, limpiar el usuario actual y volver al estado inicial
    console.log("❌ Consentimiento rechazado");
    setCurrentUser(null);
    setShowConsent(false);
    
    // Opcionalmente, puedes limpiar la selección
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
              <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                Selecciona tu nombre
              </label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
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
              disabled={!selectedSchool || !selectedStudent}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Jugar
            </button>
          </form>
        </div>
      </div>
      
      {/* Formulario de consentimiento (se muestra condicionalmente) */}
      {showConsent && (
        <ConsentForm 
          onAccept={handleAcceptConsent}
          onReject={handleRejectConsent}
        />
      )}
    </div>
  );
}