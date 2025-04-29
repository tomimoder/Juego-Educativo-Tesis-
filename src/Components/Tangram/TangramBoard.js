import React, { useState, useEffect, useRef } from 'react';
import TangramPiece from './TangramPiece';

const TangramBoard = ({ updateSolution, onPieceMoved, socket, piezasBloqueadas = [], nivelActual, solucionInicial = [], piezasPermitidas = [] }) => {
  const initialPieces = [
    { id: 1, shape: 'large-triangle', initialPosition: { x: 88, y: 56 }, rotation: 0 },
    { id: 2, shape: 'large-triangle', initialPosition: { x: 262, y: 56 }, rotation: 0 },
    { id: 3, shape: 'medium-triangle', initialPosition: { x: 457, y: 56 }, rotation: 0 },
    { id: 4, shape: 'small-triangle', initialPosition: { x: 647, y: 56 }, rotation: 0 },
    { id: 5, shape: 'small-triangle', initialPosition: { x: 823, y: 56 }, rotation: 0 },
    { id: 6, shape: 'parallelogram', initialPosition: { x: 978, y: 30 }, rotation: 0 },
    { id: 7, shape: 'diamond', initialPosition: { x: 1175, y: 56 }, rotation: 0 }
  ];

  const boardRef = useRef(null);
  const hasAppliedSolution = useRef(false);

  const [pieces, setPieces] = useState(() => {
    console.log("📌 Inicializando piezas con piezasBloqueadas:", piezasBloqueadas);
    return initialPieces.map(piece => {
      const bloqueada = piezasBloqueadas.find(p => p.id === piece.id);
      return bloqueada
        ? {
            ...piece,
            initialPosition: { x: bloqueada.x, y: bloqueada.y },
            rotation: bloqueada.rotation || 0,
            position: { x: bloqueada.x, y: bloqueada.y }
          }
        : { ...piece, position: piece.initialPosition };
    });
  });

  useEffect(() => {
    console.log("📥 Valor de solucionInicial:", solucionInicial);
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

  const handleDragStop = (id, newPosition) => {
    if (nivelActual === 3 && piezasBloqueadas.some(p => p.id === id)) return;

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

      if (nivelActual === 2 || nivelActual === 4) {
        console.log(`📤 Emitiendo movimiento: Pieza ${id} a x:${newPosition.x}, y:${newPosition.y}, rotación: ${pieceRotation}`);
        onPieceMoved(id, { x: newPosition.x, y: newPosition.y }, pieceRotation);
      }

      const updatedSolution = updatedPieces.map(piece => ({
        shape: piece.shape,
        coordenadas: [piece.position],
        orientacion: piece.rotation || 0
      }));

      updateSolution(updatedSolution);

      return updatedPieces;
    });
  };

  const handleRotatePiece = (id, angle) => {
    if (nivelActual === 3 && piezasBloqueadas.some(p => p.id === id)) return;

    setPieces(prevPieces => {
      const updatedPieces = prevPieces.map(piece =>
        piece.id === id
          ? { ...piece, rotation: (piece.rotation + angle) % 360 }
          : piece
      );

      const rotatedPiece = updatedPieces.find(piece => piece.id === id);
      const newRotation = rotatedPiece ? rotatedPiece.rotation : 0;
      const piecePosition = rotatedPiece ? rotatedPiece.position : { x: 0, y: 0 };

      if (nivelActual === 2 || nivelActual === 4) {
        console.log(`📤 Emitiendo rotación: Pieza ${id} a rotación ${newRotation}`);
        onPieceMoved(id, piecePosition, newRotation);
      }

      return updatedPieces;
    });
  };

  return (
    <div ref={boardRef} className="tangram-board bg-white rounded-lg shadow-lg" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      minHeight: '163px'
    }}>
      <div className="solution-area" style={{
        width: '100%',
        height: 'calc(100% - 30px)',
        position: 'relative'
      }}>
        {pieces.map(piece => (
          <TangramPiece
            key={`${piece.id}-${piece.position.x}-${piece.position.y}-${piece.rotation}`}
            id={piece.id}
            shape={piece.shape}
            initialPosition={piece.position || piece.initialPosition}
            rotation={piece.rotation}
            onDragStop={handleDragStop}
            bloqueada={piezasBloqueadas.some(p => p.id === piece.id)}
            draggable={
              nivelActual === 3
                ? !piezasBloqueadas.some(p => p.id === piece.id)
                : nivelActual === 1
                  ? true
                  : (nivelActual === 2 || nivelActual === 4) && piezasPermitidas.includes(piece.id)
            }
            assignedToMe={(nivelActual === 2 || nivelActual === 4) && piezasPermitidas.includes(piece.id)}
            playerName={(nivelActual === 2 || nivelActual === 4) ? (piezasPermitidas.includes(piece.id) ? 'Tú' : 'Compañero') : ''}
            nivelActual={nivelActual}
            boardRef={boardRef}
          />
        ))}
      </div>

      <div style={{
        width: '100%',
        height: '50px',
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        position: 'absolute',
        bottom: 0,
        left: 0,
        padding: '10px',
        boxShadow: '0 -2px 5px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '90%',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {pieces.map(piece => (
            <div key={piece.id} style={{ textAlign: 'center' }}>
              <button onClick={() => handleRotatePiece(piece.id, -15)}>⟲</button>
              <button onClick={() => handleRotatePiece(piece.id, 15)}>⟳</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TangramBoard;