import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { 
  Users, UserPlus, School, BookOpen, MessageSquare, RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const [chatGroups, setChatGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [csvData, setCsvData] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchools: 0,
    totalChatGroups: 0
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchChatGroups(),
        fetchUsers(),
        fetchSchools(),
      ]);
      updateStats();
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatGroups = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/admin/chat-groups');
      setChatGroups(response.data);
    } catch (error) {
      console.error('Error fetching chat groups:', error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/schools');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      throw error;
    }
  };

  const updateStats = () => {
    setStats({
      totalUsers: users.length,
      totalSchools: schools.length,
      totalChatGroups: chatGroups.length
    });
  };

  const createChatGroup = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/admin/chat-groups', { name: newGroupName });
      setNewGroupName('');
      await fetchChatGroups();
      updateStats();
    } catch (error) {
      console.error('Error creating chat group:', error);
      setError('Failed to create chat group. Please try again.');
    }
  };

  const createSchool = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/admin/schools', { name: newSchoolName });
      setNewSchoolName('');
      await fetchSchools();
      updateStats();
    } catch (error) {
      console.error('Error creating school:', error);
      setError('Failed to create school. Please try again.');
    }
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    Papa.parse(file, {
      complete: (result) => {
        setCsvData(result.data);
      },
      header: true,
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const uploadStudents = async () => {
    if (!csvData) return;

    try {
      const response = await axios.post('http://localhost:3001/api/admin/upload-students', { students: csvData });
      alert('Students uploaded successfully');
      await fetchUsers();
      updateStats();
    } catch (error) {
      console.error('Error uploading students:', error);
      setError('Failed to upload students. Please try again.');
    }
  };

  const resetGame = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/admin/reset-game');
      alert('Game reset successfully');
      await fetchData();
    } catch (error) {
      console.error('Error resetting game:', error);
      setError('Failed to reset game. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-2xl font-bold text-gray-800">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">AdminKit</h1>
        </div>
        <nav className="mt-4">
          <a href="#" className="block py-2 px-4 text-gray-700 hover:bg-gray-200">Dashboard</a>
          <a href="#" className="block py-2 px-4 text-gray-700 hover:bg-gray-200">Users</a>
          <a href="#" className="block py-2 px-4 text-gray-700 hover:bg-gray-200">Schools</a>
          <a href="#" className="block py-2 px-4 text-gray-700 hover:bg-gray-200">Chat Groups</a>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={fetchData}
              className="absolute top-0 right-0 mt-2 mr-2 text-red-700 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-blue-500 mr-4" />
              <div>
                <p className="text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <School className="h-10 w-10 text-green-500 mr-4" />
              <div>
                <p className="text-gray-500">Total Schools</p>
                <p className="text-2xl font-bold">{stats.totalSchools}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <MessageSquare className="h-10 w-10 text-yellow-500 mr-4" />
              <div>
                <p className="text-gray-500">Chat Groups</p>
                <p className="text-2xl font-bold">{stats.totalChatGroups}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <BookOpen className="h-10 w-10 text-purple-500 mr-4" />
              <div>
                <p className="text-gray-500">Active Levels</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Create Chat Group</h2>
            <div className="flex">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 border rounded-l px-4 py-2"
                placeholder="New group name"
              />
              <button onClick={createChatGroup} className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600">
                Create
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Create School</h2>
            <div className="flex">
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className="flex-1 border rounded-l px-4 py-2"
                placeholder="New school name"
              />
              <button onClick={createSchool} className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600">
                Create
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Upload Students CSV</h2>
          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-4 mb-4 cursor-pointer">
            <input {...getInputProps()} />
            <p>Drag 'n' drop a CSV file here, or click to select one</p>
          </div>
          {csvData && (
            <button onClick={uploadStudents} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Upload Students
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Chat Groups</h2>
          <ul>
            {chatGroups.map((group) => (
              <li key={group.id} className="mb-2">
                {group.name} - Users: {group.userCount}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Schools</h2>
          <ul>
            {schools.map((school) => (
              <li key={school.id} className="mb-2">
                {school.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <button onClick={resetGame} className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 inline-flex items-center">
            <RefreshCw className="mr-2" />
            Reset Game
          </button>
        </div>
      </main>
    </div>
  );
}