import React, { useState, useEffect } from "react";

const DescriptionModal = ({ isOpen, onClose, onSubmit }) => {
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setDescription("");
      setDetails("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!description.trim()) {
      alert("Necesitas añadir una descripción");
      return;
    }
    if (!details.trim()) {
      alert("Necesitas añadir una descripción de la figura");
      return;
    }

    onSubmit({ description, details });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Describe tu solución</h2>

        <label className="block mb-2">Descripción breve:</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="block mb-2">
          ¿Qué te hace pensar que es "{description}"?
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DescriptionModal;
