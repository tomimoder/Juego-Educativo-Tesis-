import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import io from "socket.io-client"
import TangramBoard from "../Tangram/TangramBoard"
import RandomBackgroundDiv from "../Images/images"
import axios from "axios"
import TimeUpPopup from "../VentanaDesplegable/TimeUpPopup"
import Cookies from "js-cookie"
import SolutionsList from './SolutionsList';


function GameInterface() {
  const [socket, setSocket] = useState(null)
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(true)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [userInput, setUserInput] = useState("")
  const [levelData, setLevelData] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [chatGroupId, setChatGroupId] = useState(null)
  const [waitingForPartner, setWaitingForPartner] = useState(false)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const { levelId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const [isPiecesViable, setIsPiecesViable] = useState(true)
  const [userSolution, setUserSolution] = useState([])
  const [figuraActual, setFiguraActual] = useState("null")
  const [isTimeUpPopupOpen, setIsTimeUpPopupOpen] = useState(false)
  const [hasSavedSolution, setHasSavedSolution] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [latestSolutions, setLatestSolutions] = useState([]);
  const [assignedPieces, setAssignedPieces] = useState([]);

  const VITE_API_URL = "http://192.168.7.31:3001"



  const togglePiecesViability = () => setIsPiecesViable(!isPiecesViable)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const FIGURAS_NIVEL3 = {
    gato: {
      piezas: [
        { id: 3, x: 571, y: -403, rotation: 90 },
        { id: 4, x: 604, y: -508, rotation: 90 },
        { id: 5, x: 548, y: -508, rotation: -90 },
        { id: 7, x: 575, y: -494, rotation: 0 },
      ],
    },
    tortuga: {
      piezas: [
        { id: 1, x: 401, y: -326, rotation: -45 },
        { id: 2, x: 362, y: -365, rotation: 135 },
        { id: 3, x: 326, y: -338, rotation: 90 },
        { id: 4, x: 352, y: -256, rotation: 180 },
      ],
    },
    casa: {
      piezas: [
        { id: 2, x: 443, y: -300, rotation: 0 },
        { id: 3, x: 411, y: -263, rotation: 45 },
        { id: 4, x: 526, y: -243, rotation: 180 },
        { id: 5, x: 554, y: -271, rotation: 90 },
      ],
    },
  }

  useEffect(scrollToBottom, [messages])

  const [isFiguraSeleccionada, setIsFiguraSeleccionada] = useState(false)



  useEffect(() => {
    if (levelData?.level === 3 && !isFiguraSeleccionada) {
      const figuras = Object.keys(FIGURAS_NIVEL3)

      const figuraAleatoria = figuras[Math.floor(Math.random() * figuras.length)]

      setFiguraActual(FIGURAS_NIVEL3[figuraAleatoria])
      setIsFiguraSeleccionada(true) // Marca como seleccionada
    }
  }, [levelData, isFiguraSeleccionada])

  useEffect(() => {
    const fetchLevelData = async () => {
      try {
        const response = await axios.get(`${VITE_API_URL}/api/levels/${levelId}`)
        console.log(levelData.level);
        if (response.data) {
          setLevelData(response.data)
          if (response.data.time_limit) {
            setTimeLeft(response.data.time_limit)
            console.log(response.data.time_limit)
          }
        }
      } catch (err) {
        console.error("Error fetching level data:", err)
        setError("No se pudo obtener la información del nivel.")
      }
    }

    fetchLevelData()
  }, [levelId])

  const initializeSocket = useCallback(() => {
    const newSocket = io(`${VITE_API_URL}`, {
      autoConnect: false,
      transports: ["websocket"],
    })

    newSocket.on("connect", () => {
      console.log("Socket connected")
      if (currentUser) {
        console.log("Emitting joinChat event")
        newSocket.emit("joinChat")
      }
    })

    newSocket.on("piecesAssignment", ({ pieces }) => {
      setAssignedPieces(pieces);
      console.log("Piezas asignadas a ti:", pieces);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message)
      setError(`Connection error: ${err.message}`)
    })

    newSocket.on("newMessage", (message) => {
      console.log("Mensaje recibido:", message)
      setMessages((prevMessages) => [...prevMessages, message])
    })

    newSocket.on("chatGroupJoined", ({ chatGroupId }) => {
      console.log("Unido al grupo de chat:", chatGroupId)
      setChatGroupId(chatGroupId)
      setWaitingForPartner(false)
      setError(null)
    })

    newSocket.on("waiting", (message) => {
      console.log("Esperando pareja:", message)
      setWaitingForPartner(true)
      setError(null)
    })

    newSocket.on("error", (error) => {
      console.error("Error de socket:", error)
      setError(error.message)
      setWaitingForPartner(false)
    })

    newSocket.connect()

    return newSocket
  }, [currentUser])

  

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${VITE_API_URL}/api/me`, {
          method: "GET",
          credentials: "include",
        });
    
        if (!response.ok) throw new Error("Usuario no autenticado");
    
        const data = await response.json();
        if (!data.id) throw new Error("Usuario inválido en la cookie");
    
        console.log("✅ Usuario obtenido desde el backend:", data);
        setCurrentUser(data);
      } catch (err) {
        console.error("❌ Error obteniendo usuario:", err);
        navigate("/");
      }
    };    

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      const newSocket = initializeSocket()
      setSocket(newSocket)

      return () => {
        if (newSocket) {
          console.log("Disconnecting socket")
          newSocket.disconnect()
        }
      }
    }
  }, [currentUser, initializeSocket])

  useEffect(() => {
    if (socket && currentUser && !chatGroupId) {
      console.log("Emitting joinChat event")
      socket.emit("joinChat")
    }
  }, [socket, currentUser, chatGroupId])

  useEffect(() => {
    if (location.state) {
      setLevelData(location.state)
      setTimeLeft(location.state.timeLimit)
    } else {
      const fetchLevelData = async () => {
        try {
          const response = await fetch(`${VITE_API_URL}/api/levels/${levelId}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          setLevelData(data)
          setTimeLeft(data.timeLimit)
        } catch (error) {
          console.error("Error fetching level data:", error)
          setError("Failed to load level data. Please try again.")
        }
      }
      fetchLevelData()
    }
  }, [levelId, location.state])

  const fetchUser = async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/me`, {
        method: "GET",
        credentials: "include", // 🔥 Asegurar que la cookie se envíe con la petición
      });
  
      if (!response.ok) throw new Error("Usuario no autenticado");
  
      const user = await response.json();
      console.log("✅ Usuario obtenido desde la cookie:", user);
      return user;
    } catch (err) {
      console.error("❌ Error obteniendo usuario:", err);
      alert("Error: Usuario no autenticado. Inicia sesión nuevamente.");
      return null;
    }
  };


  const handleSaveSolution = async () => {
    try {
      const user = await fetchUser();
      if (!user) {
        alert("Usuario no autenticado");
        return;
      }
  
      const description = prompt("Por favor, añade una breve descripción de tu solución:");
      if (!description || description.trim() === "") {
        alert("Necesitas añadir una descripción");
        return;
      }
  
      // Guardamos todas las piezas de userSolution
      const allPieces = userSolution.map((piece) => ({
        shape: piece.shape,
        coordenadas: piece.coordenadas,
        orientacion: piece.orientacion,
        initialPosition: piece.initialPosition,
      }));
  
      const response = await fetch(`${VITE_API_URL}/api/user-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 Asegurar que la cookie de sesión se envíe
        body: JSON.stringify({
          userId: user.id, // Ahora se usa el `id` obtenido de la cookie
          levelId,
          solutionData: allPieces,
          description: description.trim(),
        }),
      });
  
      if (response.ok) {
        alert("¡Solución guardada!");
        setHasSavedSolution(true);
        await fetchLatestSolutions();
      } else {
        alert("Error al guardar la solución");
      }
    } catch (error) {
      console.error("❌ Error al guardar la solución:", error);
      alert("Error al guardar la solución");
    }
  };


  const handleViewSolutions = () =>{
    navigate(`/solutions/${levelId}`);
  }


  const fetchLatestSolutions = async () => {
    try {
      // 🔹 Obtener y decodificar la cookie
      const userCookie = Cookies.get("userSession");
      console.log(userCookie);
      if (!userCookie) {
        console.error("❌ Usuario no autenticado");
        return;
      }
  
      const user = JSON.parse(userCookie); // ✅ Parsear la cookie sin decodeURIComponent
      if (!user.id) {
        console.error("❌ Usuario inválido en la cookie");
        return;
      }
  
      console.log("✅ Usuario obtenido desde cookie:", user);
  
      // 🔥 Hacer la petición al backend
      const response = await fetch(`${VITE_API_URL}/api/solutions/${levelId}?userId=${user.id}`, {
        method: "GET",
        credentials: "include", // 🔥 Asegurar que la cookie se envíe
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error obteniendo soluciones:", errorData.message || response.statusText);
        return;
      }
  
      const data = await response.json();
      console.log("📌 Soluciones obtenidas:", data);
  
      setLatestSolutions(data);
      setShowSolutions(true);
    } catch (error) {
      console.error("❌ Error al obtener las soluciones:", error);
    }
  };
  

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((time) => {
          if (time - 1 <= 0) {
            clearInterval(timerId)
            setIsTimeUpPopupOpen(true)
            handleSaveSolution();
            return 0
          }
          return time - 1
        })
      }, 1000)
      return () => clearInterval(timerId)
    }
  }, [timeLeft])


  useEffect(() => {
    if (levelData?.level === 4 && socket && chatGroupId) {
      console.log(`📤 Solicitando solución destacada para el grupo ${chatGroupId}, nivel: ${levelId}`);
      socket.emit("requestRandomSolution", { groupId: chatGroupId, levelId });
    }
  }, [levelData, socket, chatGroupId, levelId]);
  

  useEffect(() => {
    if (socket) {
        socket.on("randomSolutionAssigned", (solutionData) => {
            console.log("📥 Solución aleatoria recibida:", solutionData);
            setUserSolution(solutionData);
            setIsFiguraSeleccionada(true);  
        });

        return () => {
            socket.off("randomSolutionAssigned");
        };
    }
}, [socket]);


  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!socket || !newMessage.trim() || !chatGroupId || !currentUser) {
      console.error("No se puede enviar el mensaje:", {
        socketExists: !!socket,
        messageExists: !!newMessage.trim(),
        chatGroupExists: !!chatGroupId,
        userExists: !!currentUser,
      })
      return
    }

    socket.emit("sendMessage", {
      chatGroupId: chatGroupId,
      content: newMessage,
      userId: currentUser.id,
      nombre: currentUser.nombre,
      apellido: currentUser.apellido,
    })

    setNewMessage("")
  }


  const toggleInstructions = () => setIsInstructionsVisible(!isInstructionsVisible)
  const toggleChat = () => setIsChatVisible(!isChatVisible)
  const handleInputChange = (e) => setUserInput(e.target.value)

  const handlePieceMoved = (pieceId, position, rotation) => {
    if (!socket || !chatGroupId) {
        console.error("❌ No se puede emitir el evento pieceMoved: faltan socket o chatGroupId");
        return;
    }

    // Asegurar que rotation no sea undefined o NaN
    const validRotation = isNaN(rotation) || rotation === undefined ? 0 : rotation;

    console.log(`📤 Emitiendo movimiento: Pieza ${pieceId} a x:${position.x}, y:${position.y}, rotación: ${validRotation} en grupo ${chatGroupId}`);

    socket.emit("pieceMoved", {
        groupId: chatGroupId,
        pieceId,
        position: { x: position.x, y: position.y },
        rotation: validRotation // 🔥 Ahora siempre será un número válido
    });
};



useEffect(() => {
  if (socket) {
    socket.on("pieceMoved", ({ pieceId, position }) => {
      console.log(`🔄 Recibiendo movimiento de pieza ${pieceId} a x:${position.x}, y:${position.y}`);

      setUserSolution(prevSolution =>
        prevSolution.map(piece =>
          piece.shape === pieceId ? { ...piece, coordenadas: [{ x: position.x, y: position.y }] } : piece
        )
      );
    });

    return () => {
      socket.off("pieceMoved");
    };
  }
}, [socket]);



  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("User input:", userInput)
    setUserInput("")
  }




  const updateUserSolution = (solution) => {
    setUserSolution(solution)
  }

  const handleCloseTimeUpPopup = () => {
    setIsTimeUpPopupOpen(false)
  }

  if (!levelData || !currentUser) {
    return <div>Cargando...</div>
  }

  return (
    <div className="game-interface bg-yellow-100 min-h-screen flex flex-col">
      <div className="top-bar bg-green-500 p-2 flex justify-between items-center">
        <div className="timer flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <div className="level font-bold">Nivel {levelData.level}</div>
        <div className="coins flex items-center">
          <span className="font-bold mr-2">{levelData.stars}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
      </div>
  
      <div className="flex-grow flex">
        <div className="w-3/4 p-4 flex flex-col">
          {levelData.level === 1 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
              <div className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4" style={{ height: '550px', width: '650px' }}></div>
              <RandomBackgroundDiv />
            </div>
          ) : (
            <div className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4" style={{ height: '550px', width: '1400px' }}></div>
          )}
  
          <div className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4">
            {isPiecesViable && (
              <TangramBoard
              updateSolution={updateUserSolution}
              onPieceMoved={handlePieceMoved}
              socket={socket}
              piezasBloqueadas={figuraActual?.piezas || []}
              nivelActual={levelData?.level}
              solucionInicial={levelData?.level === 4 ? userSolution : []}
              piezasPermitidas={assignedPieces}
            />            
            )}
          </div>
        </div>
  
        <div className="w-1/4 p-4 flex flex-col">
          <div className={`bg-green-200 rounded-lg p-4 mb-4 ${isInstructionsVisible ? '' : 'hidden'}`}>
            <h2 className="font-bold mb-2">Instrucciones</h2>
            <p>{levelData.instructions}</p>
          </div>
          <div className="flex justify-between mb-4">
            <button onClick={toggleInstructions} className="bg-green-500 text-white p-2 rounded-lg">
              {isInstructionsVisible ? 'Ocultar Instrucciones' : 'Mostrar Instrucciones'}
            </button>
            {levelData.level === 1 && (
              <button onClick={togglePiecesViability} className="bg-yellow-500 text-white p-2 rounded-lg">
                {isPiecesViable ? 'Ocultar Piezas' : 'Mostrar Piezas'}
              </button>
            )}
            {!hasSavedSolution ? (
              <button
                onClick={handleSaveSolution}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Guardar Solución
              </button>
            ) : (
              <button
                onClick={handleViewSolutions}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Ver Soluciones
              </button>
            )}
          </div>
  
          {(levelData.level === 2 || levelData.level === 4) && (
  <div className={`flex-grow ${isChatVisible ? '' : 'hidden'}`}>
    <div className="chat-room bg-white rounded-lg p-4 shadow-lg h-full flex flex-col">
      {error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : waitingForPartner ? (
        <div className="text-center text-gray-600">Esperando a otro jugador...</div>
      ) : (
        <>
          <div className="messages flex-grow overflow-y-auto mb-4">
            {messages.map((msg, index) => {
              const isCurrentUser = currentUser && msg.userId === currentUser.id;
              return (
                <div
                  key={index}
                  className={`message p-2 mb-2 rounded ${
                    isCurrentUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                  }`}
                  style={{ maxWidth: '80%' }}
                >
                  <div className="text-xs text-gray-600 mb-1">
                    {isCurrentUser ? 'Tú' : `${msg.nombre} ${msg.apellido}`}
                  </div>
                  <div>{msg.content}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full p-3 pr-12 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transform rotate-90"
              >
                <path
                  d="M12 2L2 22L22 12L12 2ZM12 2L10 22L22 12L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  </div>
)}
        </div>
      </div>
  
      {showSolutions && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white w-[100vw] h-[100vh] p-6 rounded-lg shadow-lg overflow-y-auto flex flex-col">
      <h3 className="text-xl font-bold mb-4">Últimas Soluciones</h3>

      <SolutionsList levelId={levelId} />

      <button
        onClick={() => navigate('/levels')}
        className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Cerrar
      </button>
    </div>
  </div>
)}
  
      <TimeUpPopup isOpen={isTimeUpPopupOpen} onClose={handleCloseTimeUpPopup} />
    </div>
  );
  

}

export default GameInterface

