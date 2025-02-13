import { useNavigate } from "react-router-dom"

const TimeUpPopup = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if(!isOpen) return null;

    const handleExit = () => {
        onClose()
        navigate("/levels")
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">El tiempo ha terminado</h2>
        <button
          onClick={handleExit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Salir
        </button>
      </div>
    </div>
    )
}

export default TimeUpPopup