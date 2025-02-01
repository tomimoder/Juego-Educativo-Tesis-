import React, { useState, useEffect, useRef } from 'react';
import TangramPiece from './TangramPiece';

const TangramBoard = ({ updateSolution, onPieceMoved, socket, piezasBloqueadas = [], nivelActual }) => {
    const initialPieces = [ // se ajusta para el posicionamiento de las piezas 
        { id: 1, shape: 'large-triangle', initialPosition: { x: 10, y: 10 }, rotation: 0 },
        { id: 2, shape: 'large-triangle', initialPosition: { x: 150, y: 10 }, rotation: 0 },
        { id: 3, shape: 'medium-triangle', initialPosition: { x: 320, y: 10 }, rotation: 0 },
        { id: 4, shape: 'small-triangle', initialPosition: { x: 470, y: 10 }, rotation: 0 },
        { id: 5, shape: 'small-triangle', initialPosition: { x: 590, y: 10 }, rotation: 0 },
        { id: 6, shape: 'parallelogram', initialPosition: { x: 700, y: 0 }, rotation: 0 },
        { id: 7, shape: 'diamond', initialPosition: { x: 820, y: 0 }, rotation: 0 }
    ];

    const boardRef = useRef(null);

    const [pieces, setPieces] = useState(() => {
        return initialPieces.map(piece => {
            const bloqueada = piezasBloqueadas.find(p => p.id === piece.id);
            return bloqueada
                ? {
                    ...piece,
                    initialPosition: { x: bloqueada.x, y: bloqueada.y },
                    rotation: bloqueada.rotation,
                    position: { x: bloqueada.x, y: bloqueada.y }
                }
                : piece;
        });
    });
    
    

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

    useEffect(() => {
        setPieces(prevPieces =>
            prevPieces.map(piece => {
                const bloqueada = piezasBloqueadas.find(p => p.id === piece.id);
                return bloqueada
                    ? {
                        ...piece,
                        position: { x: bloqueada.x, y: bloqueada.y },
                        rotation: bloqueada.rotation
                    }
                    : piece;
            })
        );
    }, [piezasBloqueadas]);
    
    

    // Dentro del componente TangramBoard, modifica la función handleDragStop:
    const handleDragStop = (id, newPosition) => {
        if (nivelActual === 3 && piezasBloqueadas.some(p => p.id === id)) return; // Bloquea piezas en nivel 3
    
        setPieces(prevPieces =>
            prevPieces.map(piece =>
                piece.id === id ? { ...piece, position: newPosition } : piece
            )
        );
    
        onPieceMoved(id, newPosition);
    
        const solution = pieces.map(piece => ({
            shape: piece.shape,
            coordenadas: [piece.position || piece.initialPosition],
            orientacion: piece.rotation || 0,
        }));
    
        updateSolution(solution);
    };

// Agrega este useEffect para monitorear todos los cambios:
/*useEffect(() => {
    console.log("Posiciones actualizadas de todas las piezas:", 
        pieces.map(p => ({
            id: p.id,
            x: p.position?.x || p.initialPosition.x,
            y: p.position?.y || p.initialPosition.y,
            rotación: p.rotation
        }))
    );
}, [pieces]);*/ // Se ejecutará cada vez que pieces cambie

    const handleRotatePiece = (id, angle) => {
        if (nivelActual === 3 && piezasBloqueadas.some(p => p.id === id)) return;
        setPieces(prevPieces =>
            prevPieces.map(piece =>
                piece.id === id
                    ? { ...piece, rotation: (piece.rotation + angle) % 360 }
                    : piece
            )
        );
    };
    

    return (
        <div ref={boardRef} className="tangram-board bg-white rounded-lg shadow-lg" style={{ 
            width: '100%',
            height: '100%',
            position: 'relative',
            minHeight: '163px'  
        }}>
            {/* Área principal del juego */}
            <div style={{
                width: '100%',
                height: 'calc(100% - 30px)', // Reducido el espacio reservado para el board inferior
                position: 'relative'
            }}>
                {pieces.map(piece => (
                    <TangramPiece
                        key={piece.id}
                        id={piece.id}
                        shape={piece.shape}
                        initialPosition={piece.position || piece.initialPosition}
                        rotation={piece.rotation}
                        onDragStop={handleDragStop}
                    />
                ))}
            </div>

            {/* Board inferior con las piezas */}
            <div style={{ 
                width: '100%',
                height: '50px', 
                backgroundColor: 'white',
                borderTop: '1px solid #e5e7eb',
                position: 'absolute',
                bottom: 0,
                left: 0,
                padding: '10px', // Reducido el padding
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