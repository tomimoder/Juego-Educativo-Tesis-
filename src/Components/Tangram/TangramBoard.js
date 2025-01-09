import React, { useState, useEffect, useRef } from 'react';
import TangramPiece from './TangramPiece';

const TangramBoard = ({ updateSolution, onPieceMoved, socket }) => {
    const initialPieces = [
        { id: 1, shape: 'large-triangle', initialPosition: { x: 50, y: 50 }, rotation: 0 },
        { id: 2, shape: 'large-triangle', initialPosition: { x: 200, y: 50 }, rotation: 0 },
        { id: 3, shape: 'medium-triangle', initialPosition: { x: 600, y: 50 }, rotation: 0 },
        { id: 4, shape: 'small-triangle', initialPosition: { x: 350, y: 50 }, rotation: 0 },
        { id: 5, shape: 'small-triangle', initialPosition: { x: 700, y: 50 }, rotation: 0 },
        { id: 6, shape: 'parallelogram', initialPosition: { x: 400, y: 50 }, rotation: 0 },
        { id: 7, shape: 'diamond', initialPosition: { x: 500, y: 50 }, rotation: 0 },
    ];

    const boardRef = useRef(null);
    const [pieces, setPieces] = useState(initialPieces);

    // Listener para los eventos pieceMoved
    useEffect(() => {
        if (socket) {
            socket.on('pieceMoved', ({ pieceId, position }) => {
                setPieces(prevPieces =>
                    prevPieces.map(piece =>
                        piece.id === pieceId ? { ...piece, position } : piece
                    )
                );
            });
        }

        // Cleanup para eliminar el listener
        return () => {
            if (socket) {
                socket.off('pieceMoved');
            }
        };
    }, [socket]);

    const handleDragStop = (id, newPosition) => {
        const updatedPieces = pieces.map(piece =>
            piece.id === id ? { ...piece, position: newPosition } : piece
        );

        setPieces(updatedPieces);

        // Emitir el evento al servidor
        if (onPieceMoved) {
            onPieceMoved(id, newPosition);
        }

        // Actualizar la solución localmente
        const solution = updatedPieces.map(piece => ({
            shape: piece.shape,
            coordenadas: [piece.position || piece.initialPosition],
            orientacion: piece.rotation || 0,
        }));

        updateSolution(solution);
    };

    const handleRotatePiece = (id, angle) => {
        setPieces(prevPieces =>
            prevPieces.map(piece =>
                piece.id === id
                    ? { ...piece, rotation: (piece.rotation + angle) % 360 }
                    : piece
            )
        );
    };

    return (
        <div ref={boardRef} className="tangram-board bg-white rounded-lg shadow-lg" style={{ width: '100%', height: '100%' }}>
            {pieces.map(piece => (
                <TangramPiece
                    key={piece.id}
                    id={piece.id}
                    shape={piece.shape}
                    initialPosition={piece.position || piece.initialPosition}
                    rotation={piece.rotation} // Pasar el ángulo de rotación
                    onDragStop={handleDragStop}
                />
            ))}
            {/* Controles para rotar las piezas */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                {pieces.map(piece => (
                    <div key={piece.id} style={{ textAlign: 'center' }}>
                        <button onClick={() => handleRotatePiece(piece.id, -15)}>⟲</button>
                        <button onClick={() => handleRotatePiece(piece.id, 15)}>⟳</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TangramBoard;
