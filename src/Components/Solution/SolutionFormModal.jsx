import React, { useState } from 'react';

const SaveSolutionModal = ({ isOpen, onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!description || description.trim() === '') {
      setError('Necesitas añadir una descripción');
      return;
    }

    try {
      await onSave(description.trim());
      setSuccess('¡Solución guardada!');
      setDescription('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError('Error al guardar la solución');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Guardar Solución</h2>
        <textarea
          className="w-full p-2 border rounded-md resize-none"
          rows="4"
          placeholder="Añade una breve descripción de tu solución"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError('');
          }}
        />
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            onClick={() => {
              setDescription('');
              setError('');
              setSuccess('');
              onClose();
            }}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            onClick={handleSubmit}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSolutionModal;