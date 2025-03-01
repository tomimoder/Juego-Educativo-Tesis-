import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';


export default function Login({ onLogin }) {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


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
      const response = await axios.get('http://localhost:3001/api/schools');
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
      const response = await axios.get(`http://localhost:3001/api/schools/${schoolId}/students`);
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
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 Asegurar que las cookies se envíen
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
  
      // 🔥 Guardar en cookies con opciones seguras
      Cookies.set("userSession", JSON.stringify(data.user), { 
        expires: 1, 
        sameSite: "Lax",
        secure: false, // 🔥 Cambia a `true` en producción con HTTPS
      });
  
      console.log("✅ Login exitoso");
      navigate("/levels");
    } catch (error) {
      console.error("❌ Login fallido:", error);
      setError("Error de conexión, intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Log in to your account
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
                School
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
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                Student
              </label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select a student</option>
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
              Log in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
