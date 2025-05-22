import React, { useState, useEffect, useRef } from 'react';
import TangramPiece from './TangramPiece';

const TangramBoard = ({ updateSolution, onPieceMoved, socket, piezasBloqueadas = [], nivelActual, solucionInicial = [], piezasPermitidas = [] }) => {
  const [pieces, setPieces] = useState([]);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [pieceOrder, setPieceOrder] = useState([]);
  const boardRef = useRef(null);
  const initializedRef = useRef(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (boardRef.current && !initializedRef.current) {
      const boardWidth = boardRef.current.offsetWidth;
      const boardHeight = boardRef.current.offsetHeight;
      console.log("📏 Dimensiones del tablero:", { boardWidth, boardHeight, isMobile });
      const basePieces = isMobile
        ? [
            { id: 1, shape: 'large-triangle', initialPosition: { x: boardWidth * 0.05, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 2, shape: 'large-triangle', initialPosition: { x: boardWidth * 0.20, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 3, shape: 'medium-triangle', initialPosition: { x: boardWidth * 0.35, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 4, shape: 'small-triangle', initialPosition: { x: boardWidth * 0.50, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 5, shape: 'small-triangle', initialPosition: { x: boardWidth * 0.65, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 6, shape: 'parallelogram', initialPosition: { x: boardWidth * 0.05, y: boardHeight * 0.5 }, rotation: 0 },
            { id: 7, shape: 'diamond', initialPosition: { x: boardWidth * 0.20, y: boardHeight * 0.5 }, rotation: 0 },
          ]
        : [
            { id: 1, shape: 'large-triangle', initialPosition: { x: boardWidth * 0.02, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 2, shape: 'large-triangle', initialPosition: { x: boardWidth * 0.12, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 3, shape: 'medium-triangle', initialPosition: { x: boardWidth * 0.22, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 4, shape: 'small-triangle', initialPosition: { x: boardWidth * 0.32, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 5, shape: 'small-triangle', initialPosition: { x: boardWidth * 0.42, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 6, shape: 'parallelogram', initialPosition: { x: boardWidth * 0.52, y: boardHeight * 0.3 }, rotation: 0 },
            { id: 7, shape: 'diamond', initialPosition: { x: boardWidth * 0.62, y: boardHeight * 0.3 }, rotation: 0 },
          ];

      const initialPieces = basePieces.map((piece) => {
        const bloqueada = piezasBloqueadas.find((p) => p.id === piece.id);
        const initialPos = bloqueada
          ? { x: bloqueada.x, y: bloqueada.y }
          : piece.initialPosition;

        return {
          ...piece,
          position: initialPos,
          rotation: bloqueada ? bloqueada.rotation || 0 : 0,
        };
      });

      setPieces(initialPieces);
      setPieceOrder(initialPieces.map((piece) => piece.id));
      initializedRef.current = true;
    }
  }, [piezasBloqueadas, isMobile]);

  const hasAppliedSolution = useRef(false);

  useEffect(() => {
    if (nivelActual === 4 && Array.isArray(solucionInicial) && solucionInicial.length > 0 && !hasAppliedSolution.current) {
      console.log("📌 Aplicando solución inicial:", solucionInicial);
      setPieces(prevPieces => {
        let solutionIndex = 0;
        const updatedPieces = prevPieces.map(piece => {
          while (solutionIndex < solucionInicial.length && solucionInicial[solutionIndex].shape !== piece.shape) {
            solutionIndex++;
          }
          if (solutionIndex < solucionInicial.length) {
            const solucionPieza = solucionInicial[solutionIndex];
            if (solucionPieza && Array.isArray(solucionPieza.coordenadas) && solucionPieza.coordenadas.length > 0) {
              const x = Number(solucionPieza.coordenadas[0].x) || 0;
              const y = Number(solucionPieza.coordenadas[0].y) || 0;
              const rotation = Number(solucionPieza.orientacion) || 0;
              console.log(`🔄 Actualizando pieza ${piece.shape} (id: ${piece.id}):`, { x, y, rotation });
              solutionIndex++;
              return {
                ...piece,
                initialPosition: { x, y },
                position: { x, y },
                rotation
              };
            }
          }
          console.warn(`⚠️ No se encontró solución para la pieza ${piece.shape} (id: ${piece.id})`);
          return piece;
        });
        console.log("📌 Piezas actualizadas:", updatedPieces);
        return updatedPieces;
      });
      hasAppliedSolution.current = true;
    }
  }, [solucionInicial, nivelActual]);

  useEffect(() => {
    const handleResize = () => {
      if (initializedRef.current) {
        if (boardRef.current) {
          const newWidth = boardRef.current.offsetWidth;
          const newHeight = boardRef.current.offsetHeight;
          
          setPieces(prevPieces => {
            return prevPieces.map(piece => {
              return piece;
            });
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("pieceMoved", ({ pieceId, position, rotation }) => {
        console.log(`📥 Recibido movimiento de pieza ${pieceId}: x:${position.x}, y:${position.y}, rotation:${rotation}`);
        setPieces(prevPieces => {
          const updatedPieces = prevPieces.map(piece =>
            piece.id === pieceId
              ? { ...piece, position: { x: position.x, y: position.y }, rotation: rotation || 0 }
              : piece
          );
          const updatedSolution = updatedPieces.map(piece => ({
            shape: piece.shape,
            coordenadas: [piece.position],
            orientacion: piece.rotation || 0
          }));
          updateSolution(updatedSolution);
          return updatedPieces;
        });
      });
      return () => socket.off("pieceMoved");
    }
  }, [socket, updateSolution]);

  const updateSolutionFromPieces = (updatedPieces) => {
    const solution = updatedPieces.map(piece => ({
      shape: piece.shape,
      coordenadas: [piece.position],
      orientacion: piece.rotation || 0
    }));
    
    updateSolution(solution);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        boardRef.current &&
        boardRef.current.contains(e.target) &&
        !e.target.closest('select') &&
        !e.target.closest('button') &&
        !e.target.closest('svg') &&
        !e.target.closest('.tangram-piece') &&
        !e.target.closest('.rotate-button')
      ) {
        console.log("🔍 Deseleccionando pieza, selectedPieceId:", selectedPieceId);
        setSelectedPieceId(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const handleDragStop = (id, newPosition) => {
    if (nivelActual === 2 && piezasBloqueadas.some(p => p.id === id)) return;
  
    console.log(`📌 Pieza ${id} movida a`, newPosition);
  
    if (!newPosition || typeof newPosition !== 'object' || newPosition.x === undefined || newPosition.y === undefined) {
      console.error("❌ Error: newPosition no tiene la estructura esperada:", newPosition);
      return;
    }
  
    setPieces(prevPieces => {
      const updatedPieces = prevPieces.map(piece =>
        piece.id === id ? { ...piece, position: newPosition } : piece
      );
  
      const movedPiece = updatedPieces.find(piece => piece.id === id);
      const pieceRotation = movedPiece ? movedPiece.rotation : 0;
  
      if (nivelActual === 5 || nivelActual === 4) {
        console.log(`📤 Emitiendo movimiento: Pieza ${id} a x:${newPosition.x}, y:${newPosition.y}, rotación: ${pieceRotation}`);
        onPieceMoved(id, { x: newPosition.x, y: newPosition.y }, pieceRotation);
      }
  
      updateSolutionFromPieces(updatedPieces);
      return updatedPieces;
    });

    setPieceOrder(prevOrder => [
      id,
      ...prevOrder.filter(pieceId => pieceId !== id),
    ]);
  };

  const handleSelectPiece = (id) => {
    console.log(`🔍 Pieza ${id} seleccionada`);
    setSelectedPieceId(id);
    if (id) {
      setPieceOrder(prevOrder => [
        id,
        ...prevOrder.filter(pieceId => pieceId !== id),
      ]);
    }
  };

  const handleRotatePiece = (id, angle) => {
    if (nivelActual === 2 && piezasBloqueadas.some(p => p.id === id)) return;
  
    const pieceId = id || selectedPieceId;
    if (!pieceId) return;
  
    setPieces(prevPieces => {
      const updatedPieces = prevPieces.map(piece =>
        piece.id === pieceId
          ? { ...piece, rotation: (piece.rotation + angle + 360) % 360 }
          : piece
      );
  
      const rotatedPiece = updatedPieces.find(piece => piece.id === pieceId);
      const newRotation = rotatedPiece ? rotatedPiece.rotation : 0;
      const piecePosition = rotatedPiece ? rotatedPiece.position : { x: 0, y: 0 };
  
      if (nivelActual === 5 || nivelActual === 4) {
        console.log(`📤 Emitiendo rotación: Pieza ${pieceId} a rotación ${newRotation}`);
        onPieceMoved(pieceId, piecePosition, newRotation);
      }
  
      updateSolutionFromPieces(updatedPieces);
      return updatedPieces;
    });
  
    
    setPieceOrder(prevOrder => [
      pieceId,
      ...prevOrder.filter(id => id !== pieceId),
    ]);
  };
  
  

  const isPieceDraggable = (pieceId) => {
  switch (nivelActual) {
    case 1:
      return true;
    case 2:
      return !piezasBloqueadas.some(p => p.id === pieceId);
    case 3:
      return !piezasBloqueadas.some(p => p.id === pieceId);
    case 4:
      return piezasPermitidas.includes(pieceId);
    default:
      return true;
  }
};


  const handleDropdownChange = (e) => {
    const selectedId = e.target.value ? Number(e.target.value) : null;
    console.log("🔍 Seleccionando pieza desde dropdown:", selectedId);
    handleSelectPiece(selectedId);
  };

  return (
    
    <div ref={boardRef} className="tangram-board bg-white rounded-lg shadow-lg" 
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        minHeight: '30vh',
        overflow: 'visible',
        touchAction: 'none'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: isMobile ? '14px' : '12px',
        textAlign: 'center',
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        pointerEvents: 'auto'
      }}>
        <select
          value={selectedPieceId || ''}
          onChange={handleDropdownChange}
          style={{
            width: '100%',
            padding: '5px',
            fontSize: isMobile ? '14px' : '12px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="">Selecciona una pieza</option>
          {pieces.map(piece => (
            <option key={piece.id} value={piece.id}>
              {piece.shape}
            </option>
          ))}
        </select>
      </div>
      

      <div className="solution-area" style={{
        width: '100%',
        height: 'calc(100% - 80px)',
        position: 'relative'
      }}>
        {pieceOrder.map(pieceId => {
          const piece = pieces.find(p => p.id === pieceId);
          if (!piece) return null;
          return (
            <TangramPiece
              key={`piece-${piece.id}`}
              id={piece.id}
              shape={piece.shape}
              position={piece.position}
              rotation={piece.rotation}
              onDragStop={handleDragStop}
              bloqueada={piezasBloqueadas.some(p => p.id === piece.id)}
              draggable={isPieceDraggable(piece.id)}
              assignedToMe={(nivelActual === 5 || nivelActual === 4) && piezasPermitidas.includes(piece.id)}
              playerName={(nivelActual === 5 || nivelActual === 4) ? (piezasPermitidas.includes(piece.id) ? 'Tú' : 'Compañero') : ''}
              nivelActual={nivelActual}
              boardRef={boardRef}
              isSelected={selectedPieceId === piece.id}
              onSelect={handleSelectPiece}
            />
          );
        })}
      </div>

      <div style={{
        width: '100%',
        height: '80px',
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        position: 'absolute',
        bottom: 0,
        left: 0,
        padding: '10px',
        boxShadow: '0 -2px 5px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        zIndex: 1000, 
        pointerEvents: 'auto'

      }}>
        {selectedPieceId ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%'
          }}>
            <button
              className="rotate-button"
              onClick={() => {
                console.log("🖱️ Clic en botón de rotación izquierda, selectedPieceId:", selectedPieceId);
                handleRotatePiece(selectedPieceId, -15);
              }}
              style={{
                padding: isMobile ? '12px 20px' : '8px 15px',
                margin: '0 10px',
                cursor: 'pointer',
                fontSize: isMobile ? '24px' : '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              ⟲
            </button>
            <div style={{
              padding: '8px 15px',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              Rotar
            </div>
            <button
              className="rotate-button"
              onClick={() => {
                console.log("🖱️ Clic en botón de rotación derecha, selectedPieceId:", selectedPieceId);
                handleRotatePiece(selectedPieceId, 15);
              }}
              style={{
                padding: isMobile ? '12px 20px' : '8px 15px',
                margin: '0 10px',
                cursor: 'pointer',
                fontSize: isMobile ? '24px' : '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              ⟳
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: isMobile ? '16px' : '14px'
          }}>
            Selecciona una pieza desde el menú
          </div>
        )}
      </div>
    </div>
  );
};

export default TangramBoard;