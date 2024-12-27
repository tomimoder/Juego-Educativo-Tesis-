import React, { useState, useEffect, useRef } from 'react';
import TangramPiece from './TangramPiece';

const TangramBoard = ({ updateSolution, onPieceMoved, socket }) => {
    const initialPieces = [
        { id: 1, shape: 'triangle', initialPosition: { x: 50, y: 50 } },
        { id: 2, shape: 'square', initialPosition: { x: 150, y: 50 } },
        { id: 3, shape: 'parallelogram', initialPosition: { x: 100, y: 150 } },
    ];

    const boardRef = useRef(null);
    const [pieces, setPieces] = useState(initialPieces);

    // Listener para los eventos pieceMoved
    useEffect(() => {
        if (socket) {
            socket.on('pieceMoved', ({ pieceId, position }) => {

                // Actualizar la posición de la pieza en tiempo real
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

        // Emitir el evento al servidor a través de la función pasada como prop
        if (onPieceMoved) {
            onPieceMoved(id, newPosition);
        }

        // Actualizar la solución localmente
        const solution = updatedPieces.map(piece => ({
            shape: piece.shape,
            coordenadas: [piece.position || piece.initialPosition],
            orientacion: 0,
        }));

        updateSolution(solution);
    };

    return (
        <div ref={boardRef} className="tangram-board bg-white rounded-lg shadow-lg" style={{ width: '100%', height: '100%' }}>
            {pieces.map(piece => (
                <TangramPiece
                    key={piece.id}
                    id={piece.id}
                    shape={piece.shape}
                    initialPosition={piece.position || piece.initialPosition} // Usar posición actualizada
                    onDragStop={handleDragStop} // Pasar el manejador para actualizar la posición
                />
            ))}
        </div>
    );
};

export default TangramBoard;
