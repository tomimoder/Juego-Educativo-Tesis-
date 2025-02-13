import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import io from "socket.io-client"
import TangramBoard from "../Tangram/TangramBoard"
import RandomBackgroundDiv from "../Images/images"
import axios from "axios"
import TimeUpPopup from "../VentanaDesplegable/TimeUpPopup"

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
  const [correctSolutions, setCorrectSolutions] = useState([])
  const [score, setScore] = useState(0)
  const [boardDimensions, setBoardDimensions] = useState({ width: 0, height: 0 })
  const [figuraActual, setFiguraActual] = useState("null")
  const [isTimeUpPopupOpen, setIsTimeUpPopupOpen] = useState(false)

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
        const response = await axios.get(`http://localhost:3001/api/levels/${levelId}`)
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
    const newSocket = io("http://localhost:3001", {
      autoConnect: false,
      transports: ["websocket"],
    })

    newSocket.on("connect", () => {
      console.log("Socket connected")
      if (currentUser) {
        console.log("Emitting joinChat event")
        newSocket.emit("joinChat", { userId: currentUser.id })
      }
    })

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
    const userId = localStorage.getItem("userId")
    const nombre = localStorage.getItem("nombre")
    const apellido = localStorage.getItem("apellido")

    if (!userId || !nombre || !apellido) {
      setError("No se encontró información del usuario")
      navigate("/login")
      return
    }

    const user = { id: userId, nombre, apellido }
    console.log("Usuario recuperado del localStorage:", user)
    setCurrentUser(user)
  }, [navigate])

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
    if (socket && currentUser) {
      console.log("Emitting joinChat event")
      socket.emit("joinChat", { userId: currentUser.id })
    }
  }, [socket, currentUser])

  useEffect(() => {
    if (location.state) {
      setLevelData(location.state)
      setTimeLeft(location.state.timeLimit)
    } else {
      const fetchLevelData = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/levels/${levelId}`)
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

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((time) => {
          if (time - 1 <= 0) {
            clearInterval(timerId)
            setIsTimeUpPopupOpen(true)
            return 0
          }
          return time - 1
        })
      }, 1000)
      return () => clearInterval(timerId)
    }
  }, [timeLeft])

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

  const normalizeUserCoordinates = (piece) => {
    if (boardDimensions.width === 0 || boardDimensions.height === 0) return piece.coordenadas

    return piece.coordenadas.map((coord) => ({
      x: coord.x / boardDimensions.width,
      y: coord.y / boardDimensions.height,
    }))
  }

  const toggleInstructions = () => setIsInstructionsVisible(!isInstructionsVisible)
  const toggleChat = () => setIsChatVisible(!isChatVisible)
  const handleInputChange = (e) => setUserInput(e.target.value)

  const handlePieceMoved = (pieceId, position) => {
    if (!socket || !chatGroupId) {
      console.error("No se puede emitir el evento pieceMoved: faltan socket o chatGroupId")
      return
    }

    //Emitir el evento al servidor con el ID del grupo
    socket.emit("pieceMoved", {
      groupId: chatGroupId,
      pieceId,
      position,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("User input:", userInput)
    setUserInput("")
  }

  const fetchCorrectSolution = async (levelId) => {
    try {
      console.log(levelId)
      const response = await axios.get(`http://localhost:3001/api/solution/${levelId}`)
      setCorrectSolutions(response.data)
    } catch (error) {
      console.log("Error fetching correct solutions:", error)
    }
  }

  useEffect(() => {
    if (levelId) {
      fetchCorrectSolution(levelId)
    }
  }, [levelId])

  const validateSolution = () => {
    if (!boardDimensions.width || !boardDimensions.height) {
      console.warn("Las dimensiones del tablero no están disponibles.")
      return
    }

    const tolerance = 0.05 // Tolerancia para las coordenadas normalizadas
    const orientationTolerance = 10 // Tolerancia en grados para la orientación

    // Normalizar las coordenadas del usuario en función del tamaño del tablero
    const normalizedUserSolution = userSolution.map((piece) => ({
      ...piece,
      coordenadas: piece.coordenadas.map((coord) => ({
        x: coord.x / boardDimensions.width,
        y: coord.y / boardDimensions.height,
      })),
    }))

    let highestScore = 0

    // Comparar con cada solución correcta para encontrar la mejor coincidencia
    correctSolutions.forEach((correctSolution) => {
      let matchingPieces = 0
      const totalPieces = correctSolution.length

      normalizedUserSolution.forEach((userPiece, index) => {
        const correctPiece = correctSolution[index]

        // Verificar coincidencia de posición y orientación con tolerancia
        const positionMatch = userPiece.coordenadas.every((point, i) => {
          if (!correctPiece.coordenadas[i]) return false
          const [userX, userY] = [point.x, point.y]
          const [correctX, correctY] = [correctPiece.coordenadas[i].x, correctPiece.coordenadas[i].y]
          return Math.abs(userX - correctX) <= tolerance && Math.abs(userY - correctY) <= tolerance
        })

        const orientationMatch = Math.abs(userPiece.orientacion - correctPiece.orientacion) <= orientationTolerance

        if (positionMatch && orientationMatch) {
          matchingPieces++
        }
      })

      // Calcular el puntaje para esta solución correcta en función de las piezas coincidentes
      const calculatedScore = (matchingPieces / totalPieces) * 100
      if (calculatedScore > highestScore) {
        highestScore = calculatedScore
      }
    })

    // Actualizar el puntaje en el estado
    setScore(highestScore)
    console.log(`Puntaje calculado: ${highestScore}%`)
  }

  const isPieceMatching = (userPiece, correctPiece) => {
    const positionTolerance = 5
    const orientationTolerance = 10

    // Verificamos que ambas piezas estén definidas y tengan coordenadas
    if (
      !userPiece ||
      !correctPiece ||
      !userPiece.coordenadas ||
      !correctPiece.coordenadas ||
      userPiece.coordenadas.length === 0 ||
      correctPiece.coordenadas.length === 0
    ) {
      return false // No se considera coincidencia si faltan datos
    }

    // Obtenemos la primera coordenada de cada pieza
    const userPosition = userPiece.coordenadas[0]
    const correctPosition = correctPiece.coordenadas[0]

    console.log(userPosition)
    console.log(correctPosition)

    // Verificamos que las coordenadas estén dentro del rango de tolerancia
    const positionMatch =
      Math.abs(userPosition.x - correctPosition.x) <= positionTolerance &&
      Math.abs(userPosition.y - correctPosition.y) <= positionTolerance

    // Verificamos que la orientación esté dentro del rango de tolerancia
    const orientationMatch = Math.abs(userPiece.orientacion - correctPiece.orientacion) <= orientationTolerance

    return positionMatch && orientationMatch
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-bold">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <div className="level font-bold">Nivel {levelData.level}</div>
        <div className="coins flex items-center">
          <span className="font-bold mr-2">{levelData.stars}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>
      </div>

      <div className="flex-grow flex">
        <div className="w-3/4 p-4 flex flex-col">
          {levelData.level === 1 ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
              <div
                className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4"
                style={{ height: "550px", width: "650px" }}
              ></div>
              <RandomBackgroundDiv />
            </div>
          ) : (
            <div
              className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4"
              style={{ height: "550px", width: "1400px" }}
            ></div>
          )}

          <div className="flex-grow bg-white rounded-lg shadow-lg p-4 mb-4">
            {isPiecesViable && (
              <TangramBoard
                updateSolution={updateUserSolution}
                onPieceMoved={handlePieceMoved}
                socket={socket}
                piezasBloqueadas={figuraActual?.piezas || []}
                nivelActual={levelData?.level}
              />
            )}
          </div>
        </div>

        <div className="w-1/4 p-4 flex flex-col">
          <div className={`bg-green-200 rounded-lg p-4 mb-4 ${isInstructionsVisible ? "" : "hidden"}`}>
            <h2 className="font-bold mb-2">Instrucciones</h2>
            <p>{levelData.instructions}</p>
          </div>
          <div className="flex justify-between mb-4">
            <button onClick={toggleInstructions} className="bg-green-500 text-white p-2 rounded-lg">
              {isInstructionsVisible ? "Ocultar Instrucciones" : "Mostrar Instrucciones"}
            </button>
            {levelData.level === 2 || levelData.level === 4 ? (
              <button onClick={toggleChat} className="bg-blue-500 text-white p-2 rounded-lg">
                {isChatVisible ? "Ocultar Chat" : "Mostrar Chat"}
              </button>
            ) : (
              <div className="div"></div>
            )}
            {levelData.level === 1 && (
              <button onClick={togglePiecesViability} className="bg-yellow-500 text-white p-2 rounded-lg">
                {isPiecesViable ? "Ocultar Piezas" : "Mostrar Piezas"}
              </button>
            )}
          </div>
          {levelData.level === 2 || levelData.level === 4 ? (
            <div className={`flex-grow ${isChatVisible ? "" : "hidden"}`}>
              <div className="chat-room bg-white rounded-lg p-4 shadow-lg h-full flex flex-col">
                {error ? (
                  <div className="text-center text-red-600">{error}</div>
                ) : waitingForPartner ? (
                  <div className="text-center text-gray-600">Esperando a otro jugador...</div>
                ) : (
                  <>
                    <div className="messages flex-grow overflow-y-auto mb-4">
                      {messages.map((msg, index) => {
                        const isCurrentUser = currentUser && msg.userId === currentUser.id
                        return (
                          <div
                            key={index}
                            className={`message p-2 mb-2 rounded ${
                              isCurrentUser ? "bg-blue-100 ml-auto" : "bg-gray-100"
                            }`}
                            style={{ maxWidth: "80%" }}
                          >
                            <div className="text-xs text-gray-600 mb-1">
                              {isCurrentUser ? "Tú" : `${msg.nombre} ${msg.apellido}`}
                            </div>
                            <div>{msg.content}</div>
                          </div>
                        )
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
          ) : (
            <div className="div"></div>
          )}
        </div>
      </div>
      <TimeUpPopup isOpen={isTimeUpPopupOpen} onClose={handleCloseTimeUpPopup} />
    </div>
  )
}

export default GameInterface

